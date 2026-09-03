import { Router, type IRouter } from "express";
import { desc, eq } from "drizzle-orm";
import { db, cbnMarketDataTable, cbnPolicyRatesTable, cbnExchangeRatesTable } from "@workspace/db";
import { requireAuth, requireAdmin } from "../middlewares/auth";
import { syncCbnData, syncPolicyRates, syncExchangeRates } from "../lib/cbn-scraper";

const router: IRouter = Router();

const hydrationTasks = new Map<string, Promise<void>>();
const hydrationAttempts = new Map<string, number>();
const HYDRATION_COOLDOWN_MS = 15 * 60 * 1000;

async function hydrateIfEmpty(key: string, sync: () => Promise<unknown>): Promise<void> {
  const lastAttempt = hydrationAttempts.get(key) ?? 0;
  if (Date.now() - lastAttempt < HYDRATION_COOLDOWN_MS) return;

  let task = hydrationTasks.get(key);
  if (!task) {
    hydrationAttempts.set(key, Date.now());
    task = sync().then(() => undefined).finally(() => {
      hydrationTasks.delete(key);
    });
    hydrationTasks.set(key, task);
  }
  await task;
}

function freshness(observedAt: Date | null) {
  if (!observedAt) return { status: "unknown" as const, ageDays: null };
  const ageDays = Math.max(0, Math.floor((Date.now() - observedAt.getTime()) / 86_400_000));
  const status = ageDays <= 14 ? "current" : ageDays <= 45 ? "aging" : "stale";
  return { status, ageDays };
}

router.get("/cbn/market-data", async (_req, res): Promise<void> => {
  let [ntb, bonds, omo] = await Promise.all([
    db.select().from(cbnMarketDataTable).where(eq(cbnMarketDataTable.securityType, "NTB")).orderBy(desc(cbnMarketDataTable.auctionDate)).limit(12),
    db.select().from(cbnMarketDataTable).where(eq(cbnMarketDataTable.securityType, "BOND")).orderBy(desc(cbnMarketDataTable.auctionDate)).limit(12),
    db.select().from(cbnMarketDataTable).where(eq(cbnMarketDataTable.securityType, "OMO")).orderBy(desc(cbnMarketDataTable.auctionDate)).limit(12),
  ]);
  if (ntb.length === 0 && bonds.length === 0 && omo.length === 0) {
    await hydrateIfEmpty("market", syncCbnData);
    [ntb, bonds, omo] = await Promise.all([
      db.select().from(cbnMarketDataTable).where(eq(cbnMarketDataTable.securityType, "NTB")).orderBy(desc(cbnMarketDataTable.auctionDate)).limit(12),
      db.select().from(cbnMarketDataTable).where(eq(cbnMarketDataTable.securityType, "BOND")).orderBy(desc(cbnMarketDataTable.auctionDate)).limit(12),
      db.select().from(cbnMarketDataTable).where(eq(cbnMarketDataTable.securityType, "OMO")).orderBy(desc(cbnMarketDataTable.auctionDate)).limit(12),
    ]);
  }
  res.json({ ntb, bonds, omo });
});

router.get("/cbn/fixed-income-snapshot", async (_req, res): Promise<void> => {
  let rows = await db
    .select()
    .from(cbnMarketDataTable)
    .orderBy(desc(cbnMarketDataTable.auctionDate), desc(cbnMarketDataTable.fetchedAt))
    .limit(90);

  if (rows.length === 0) {
    await hydrateIfEmpty("market", syncCbnData);
    rows = await db
      .select()
      .from(cbnMarketDataTable)
      .orderBy(desc(cbnMarketDataTable.auctionDate), desc(cbnMarketDataTable.fetchedAt))
      .limit(90);
  }

  const latestByInstrument = new Map<string, typeof rows[number]>();
  for (const row of rows) {
    const key = `${row.securityType}:${row.tenor}`;
    if (!latestByInstrument.has(key)) latestByInstrument.set(key, row);
  }

  const instruments = [...latestByInstrument.values()].map((row) => {
    const observedAt = row.auctionDate ?? row.fetchedAt;
    const rawSubscriptionCoverage =
      row.amountOffered && row.totalSubscription != null
        ? row.totalSubscription / row.amountOffered
        : null;
    const subscriptionCoverage =
      rawSubscriptionCoverage != null && rawSubscriptionCoverage > 0 && rawSubscriptionCoverage <= 100
        ? rawSubscriptionCoverage
        : null;
    return {
      securityType: row.securityType,
      tenor: row.tenor,
      auctionDate: row.auctionDate?.toISOString() ?? null,
      maturityDate: row.maturityDate?.toISOString() ?? null,
      marginalRate: row.marginalRate,
      trueYield: row.trueYield != null && row.trueYield > 0 ? row.trueYield : null,
      amountOffered: row.amountOffered,
      totalSubscription: row.totalSubscription,
      totalSuccessful: row.totalSuccessful,
      subscriptionCoverage,
      successfulCoverage:
        row.amountOffered && row.totalSuccessful != null
          ? row.totalSuccessful / row.amountOffered
          : null,
      observedAt: observedAt.toISOString(),
      freshness: freshness(observedAt),
      source: row.source,
      classification: {
        marketValues: "observed",
        coverageRatios: "calculated",
      },
    };
  });

  const groups = {
    ntb: instruments.filter((item) => item.securityType === "NTB"),
    bonds: instruments.filter((item) => item.securityType === "BOND"),
    omo: instruments.filter((item) => item.securityType === "OMO"),
  };

  res.json({
    market: "NG",
    currency: "NGN",
    generatedAt: new Date().toISOString(),
    provenance: {
      publisher: "Central Bank of Nigeria",
      sourceUrl: "https://www.cbn.gov.ng/rates/GovtSecurities.html",
      methodology: "Latest stored observation for each security type and tenor. No missing value is estimated.",
    },
    groups,
  });
});

router.get("/cbn/rates-summary", async (_req, res): Promise<void> => {
  const [latestNtb, latestBond, latestOmo] = await Promise.all([
    db.select().from(cbnMarketDataTable).where(eq(cbnMarketDataTable.securityType, "NTB")).orderBy(desc(cbnMarketDataTable.auctionDate)).limit(30),
    db.select().from(cbnMarketDataTable).where(eq(cbnMarketDataTable.securityType, "BOND")).orderBy(desc(cbnMarketDataTable.auctionDate)).limit(30),
    db.select().from(cbnMarketDataTable).where(eq(cbnMarketDataTable.securityType, "OMO")).orderBy(desc(cbnMarketDataTable.auctionDate)).limit(30),
  ]);

  const byTenor = (records: typeof latestNtb) => {
    const result: Record<string, { rate: number; date: string }> = {};
    for (const row of records) {
      if (row.marginalRate != null && !result[row.tenor]) {
        result[row.tenor] = { rate: row.marginalRate, date: row.auctionDate?.toISOString() ?? "" };
      }
    }
    return result;
  };

  res.json({
    ntb: byTenor(latestNtb),
    bonds: byTenor(latestBond),
    omo: byTenor(latestOmo),
    lastUpdated: latestNtb[0]?.fetchedAt?.toISOString() ?? null,
  });
});

router.post("/cbn/sync", requireAuth, requireAdmin, async (_req, res): Promise<void> => {
  try {
    const result = await syncCbnData();
    res.json({ success: true, ...result });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

router.get("/cbn/policy-rates", async (_req, res): Promise<void> => {
  let rates = await db.select().from(cbnPolicyRatesTable).orderBy(desc(cbnPolicyRatesTable.year), desc(cbnPolicyRatesTable.month)).limit(24);
  if (rates.length === 0) {
    await hydrateIfEmpty("policy", syncPolicyRates);
    rates = await db.select().from(cbnPolicyRatesTable).orderBy(desc(cbnPolicyRatesTable.year), desc(cbnPolicyRatesTable.month)).limit(24);
  }
  res.json(rates);
});

router.get("/cbn/exchange-rates", async (_req, res): Promise<void> => {
  let rates = await db.select().from(cbnExchangeRatesTable).orderBy(desc(cbnExchangeRatesTable.rateDate)).limit(50);
  if (rates.length === 0) {
    await hydrateIfEmpty("fx", syncExchangeRates);
    rates = await db.select().from(cbnExchangeRatesTable).orderBy(desc(cbnExchangeRatesTable.rateDate)).limit(50);
  }
  const grouped: Record<string, typeof rates> = {};
  for (const row of rates) {
    if (!grouped[row.currency]) grouped[row.currency] = [];
    grouped[row.currency].push(row);
  }
  const latest = Object.values(grouped).map((items) => items[0]).filter(Boolean);
  res.json({ rates: grouped, latest });
});

router.post("/cbn/sync-all", requireAuth, requireAdmin, async (_req, res): Promise<void> => {
  try {
    const [market, policy, fx] = await Promise.all([syncCbnData(), syncPolicyRates(), syncExchangeRates()]);
    res.json({ success: true, market, policy, fx });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

export default router;

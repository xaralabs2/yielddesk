import { Router, type IRouter } from "express";
import { desc, eq } from "drizzle-orm";
import { db, cbnMarketDataTable, cbnPolicyRatesTable, cbnExchangeRatesTable } from "@workspace/db";
import { requireAuth } from "../middlewares/auth";
import { syncCbnData, syncPolicyRates, syncExchangeRates } from "../lib/cbn-scraper";

const router: IRouter = Router();

router.get("/cbn/market-data", requireAuth, async (_req, res): Promise<void> => {
  const ntb = await db
    .select()
    .from(cbnMarketDataTable)
    .where(eq(cbnMarketDataTable.securityType, "NTB"))
    .orderBy(desc(cbnMarketDataTable.auctionDate))
    .limit(12);

  const bonds = await db
    .select()
    .from(cbnMarketDataTable)
    .where(eq(cbnMarketDataTable.securityType, "BOND"))
    .orderBy(desc(cbnMarketDataTable.auctionDate))
    .limit(12);

  const omo = await db
    .select()
    .from(cbnMarketDataTable)
    .where(eq(cbnMarketDataTable.securityType, "OMO"))
    .orderBy(desc(cbnMarketDataTable.auctionDate))
    .limit(12);

  res.json({ ntb, bonds, omo });
});

router.get("/cbn/rates-summary", requireAuth, async (_req, res): Promise<void> => {
  const latestNtb91 = await db
    .select()
    .from(cbnMarketDataTable)
    .where(eq(cbnMarketDataTable.securityType, "NTB"))
    .orderBy(desc(cbnMarketDataTable.auctionDate))
    .limit(4);

  const latestBond = await db
    .select()
    .from(cbnMarketDataTable)
    .where(eq(cbnMarketDataTable.securityType, "BOND"))
    .orderBy(desc(cbnMarketDataTable.auctionDate))
    .limit(4);

  const latestOmo = await db
    .select()
    .from(cbnMarketDataTable)
    .where(eq(cbnMarketDataTable.securityType, "OMO"))
    .orderBy(desc(cbnMarketDataTable.auctionDate))
    .limit(4);

  const ntbByTenor: Record<string, { rate: number; date: string }> = {};
  for (const r of latestNtb91) {
    if (r.marginalRate && !ntbByTenor[r.tenor]) {
      ntbByTenor[r.tenor] = {
        rate: r.marginalRate,
        date: r.auctionDate?.toISOString() ?? "",
      };
    }
  }

  const bondByTenor: Record<string, { rate: number; date: string }> = {};
  for (const r of latestBond) {
    if (r.marginalRate && !bondByTenor[r.tenor]) {
      bondByTenor[r.tenor] = {
        rate: r.marginalRate,
        date: r.auctionDate?.toISOString() ?? "",
      };
    }
  }

  const omoByTenor: Record<string, { rate: number; date: string }> = {};
  for (const r of latestOmo) {
    if (r.marginalRate && !omoByTenor[r.tenor]) {
      omoByTenor[r.tenor] = {
        rate: r.marginalRate,
        date: r.auctionDate?.toISOString() ?? "",
      };
    }
  }

  res.json({
    ntb: ntbByTenor,
    bonds: bondByTenor,
    omo: omoByTenor,
    lastUpdated: latestNtb91[0]?.fetchedAt?.toISOString() ?? null,
  });
});

router.post("/cbn/sync", requireAuth, async (_req, res): Promise<void> => {
  try {
    const result = await syncCbnData();
    res.json({
      success: true,
      ...result,
    });
  } catch (err: any) {
    res.status(500).json({
      success: false,
      error: err.message,
    });
  }
});

router.get("/cbn/policy-rates", requireAuth, async (_req, res): Promise<void> => {
  const rates = await db
    .select()
    .from(cbnPolicyRatesTable)
    .orderBy(desc(cbnPolicyRatesTable.year), desc(cbnPolicyRatesTable.month))
    .limit(24);
  res.json(rates);
});

router.get("/cbn/exchange-rates", requireAuth, async (_req, res): Promise<void> => {
  const rates = await db
    .select()
    .from(cbnExchangeRatesTable)
    .orderBy(desc(cbnExchangeRatesTable.rateDate))
    .limit(50);

  const grouped: Record<string, typeof rates> = {};
  for (const r of rates) {
    if (!grouped[r.currency]) grouped[r.currency] = [];
    grouped[r.currency].push(r);
  }
  res.json({ rates: grouped, latest: rates.slice(0, 6) });
});

router.post("/cbn/sync-all", requireAuth, async (_req, res): Promise<void> => {
  try {
    const [market, policy, fx] = await Promise.all([
      syncCbnData(),
      syncPolicyRates(),
      syncExchangeRates(),
    ]);
    res.json({ success: true, market, policy, fx });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

export default router;

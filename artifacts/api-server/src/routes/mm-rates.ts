import { Router, type IRouter } from "express";
import { desc, eq, and, gte } from "drizzle-orm";
import { db, mmRatesTable, cbnMarketDataTable } from "@workspace/db";
import { requireAuth } from "../middlewares/auth";
import { syncFmdqRates } from "../lib/fmdq-scraper";
import { fetchGeCpTokens, fetchAllDeals, isGetEquityConfigured } from "../lib/getequity-client";

const router: IRouter = Router();

router.get("/mm/rates", requireAuth, async (_req, res): Promise<void> => {
  const fmdqRates = await db.select().from(mmRatesTable).where(eq(mmRatesTable.source, "FMDQ")).orderBy(desc(mmRatesTable.date)).limit(30);
  const manualRates = await db.select().from(mmRatesTable).where(eq(mmRatesTable.source, "MANUAL")).orderBy(desc(mmRatesTable.date)).limit(30);
  const ntbProxy = await db.select().from(cbnMarketDataTable).where(eq(cbnMarketDataTable.securityType, "NTB")).orderBy(desc(cbnMarketDataTable.auctionDate)).limit(6);
  const omoProxy = await db.select().from(cbnMarketDataTable).where(eq(cbnMarketDataTable.securityType, "OMO")).orderBy(desc(cbnMarketDataTable.auctionDate)).limit(6);

  const proxyRates = [...ntbProxy, ...omoProxy].map((r) => ({
    id: r.id,
    source: "CBN_PROXY" as const,
    rateType: r.securityType === "NTB" ? "NTB" : "OMO",
    tenor: r.tenor,
    rate: r.marginalRate,
    date: r.auctionDate?.toISOString() ?? r.fetchedAt.toISOString(),
    notes: `${r.securityType} marginal rate (proxy for MM)`,
    createdAt: r.fetchedAt.toISOString(),
  }));

  res.json({ fmdq: fmdqRates, manual: manualRates, proxy: proxyRates });
});

router.get("/mm/summary", requireAuth, async (_req, res): Promise<void> => {
  const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
  const recentFmdq = await db.select().from(mmRatesTable).where(and(eq(mmRatesTable.source, "FMDQ"), gte(mmRatesTable.date, sevenDaysAgo))).orderBy(desc(mmRatesTable.date)).limit(20);
  const recentManual = await db.select().from(mmRatesTable).where(and(eq(mmRatesTable.source, "MANUAL"), gte(mmRatesTable.date, sevenDaysAgo))).orderBy(desc(mmRatesTable.date)).limit(10);
  const latestNtb91 = await db.select().from(cbnMarketDataTable).where(eq(cbnMarketDataTable.securityType, "NTB")).orderBy(desc(cbnMarketDataTable.auctionDate)).limit(3);

  const ntb91 = latestNtb91.find((r) => r.tenor?.includes("91"));
  const ntb182 = latestNtb91.find((r) => r.tenor?.includes("182"));
  const ntb364 = latestNtb91.find((r) => r.tenor?.includes("364"));
  const fmdqByType: Record<string, { rate: number; date: string; tenor: string }> = {};
  for (const r of recentFmdq) {
    const key = `${r.rateType}_${r.tenor}`;
    if (!fmdqByType[key]) fmdqByType[key] = { rate: r.rate, date: r.date.toISOString(), tenor: r.tenor };
  }

  res.json({
    proxy: {
      ntb91: ntb91 ? { rate: ntb91.marginalRate, date: ntb91.auctionDate?.toISOString() } : null,
      ntb182: ntb182 ? { rate: ntb182.marginalRate, date: ntb182.auctionDate?.toISOString() } : null,
      ntb364: ntb364 ? { rate: ntb364.marginalRate, date: ntb364.auctionDate?.toISOString() } : null,
    },
    fmdq: fmdqByType,
    manual: recentManual,
    lastFmdqSync: recentFmdq[0]?.createdAt?.toISOString() ?? null,
  });
});

router.post("/mm/rates", requireAuth, async (req, res): Promise<void> => {
  const { rateType, tenor, rate, date, notes } = req.body;
  if (!rateType || !tenor || rate == null || !date) {
    res.status(400).json({ error: "rateType, tenor, rate, and date are required" });
    return;
  }

  const parsedRate = parseFloat(rate);
  if (isNaN(parsedRate) || parsedRate <= 0 || parsedRate > 100) {
    res.status(400).json({ error: "Rate must be between 0 and 100" });
    return;
  }

  const [inserted] = await db.insert(mmRatesTable).values({
    source: "MANUAL",
    rateType: String(rateType).toUpperCase(),
    tenor: String(tenor),
    rate: parsedRate,
    date: new Date(date),
    notes: notes || null,
  }).returning();
  res.status(201).json(inserted);
});

router.delete("/mm/rates/:id", requireAuth, async (req, res): Promise<void> => {
  const id = Number.parseInt(String(req.params.id), 10);
  if (isNaN(id)) {
    res.status(400).json({ error: "Invalid ID" });
    return;
  }

  const [existing] = await db.select().from(mmRatesTable).where(and(eq(mmRatesTable.id, id), eq(mmRatesTable.source, "MANUAL")));
  if (!existing) {
    res.status(404).json({ error: "Manual rate entry not found" });
    return;
  }

  await db.delete(mmRatesTable).where(eq(mmRatesTable.id, id));
  res.status(204).send();
});

router.post("/mm/sync-fmdq", requireAuth, async (_req, res): Promise<void> => {
  try {
    const result = await syncFmdqRates();
    res.json({ success: true, ...result });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

router.get("/mm/getequity-cp", requireAuth, async (_req, res): Promise<void> => {
  if (!isGetEquityConfigured()) {
    res.json({ configured: false, tokens: [] });
    return;
  }
  try {
    const tokens = await fetchGeCpTokens();
    res.json({ configured: true, tokens });
  } catch (err: any) {
    res.status(500).json({ configured: true, tokens: [], error: err.message });
  }
});

router.get("/mm/getequity-deals", requireAuth, async (_req, res): Promise<void> => {
  if (!isGetEquityConfigured()) {
    res.json({ configured: false, deals: [] });
    return;
  }
  try {
    const deals = await fetchAllDeals();
    res.json({ configured: true, deals });
  } catch (err: any) {
    res.status(500).json({ configured: true, deals: [], error: err.message });
  }
});

export default router;

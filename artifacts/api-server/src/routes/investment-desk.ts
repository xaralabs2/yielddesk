import { Router, type IRouter } from "express";
import { desc, eq } from "drizzle-orm";
import { db, holdingsTable, mmRatesTable, cbnMarketDataTable } from "@workspace/db";
import { requireAuth } from "../middlewares/auth";
import { fetchNgnCompanies, fetchNgnCompany, isNgnMarketConfigured } from "../lib/ngn-market-client";

const router: IRouter = Router();
const TARGET_TOTAL = 60_000_000;

const targetPolicy = [
  { key: "gtco", name: "GTCO", ticker: "GTCO", bucket: "Equities", targetAmount: 5_000_000 },
  { key: "zenith", name: "Zenith Bank", ticker: "ZENITHBANK", bucket: "Equities", targetAmount: 4_000_000 },
  { key: "uba", name: "UBA", ticker: "UBA", bucket: "Equities", targetAmount: 2_000_000 },
  { key: "mtn", name: "MTN Nigeria", ticker: "MTNN", bucket: "Equities", targetAmount: 6_000_000 },
  { key: "airtel", name: "Airtel Africa", ticker: "AIRTELAFRI", bucket: "Equities", targetAmount: 2_000_000 },
  { key: "dangote", name: "Dangote Cement", ticker: "DANGCEM", bucket: "Equities", targetAmount: 4_000_000 },
  { key: "bua-foods", name: "BUA Foods", ticker: "BUAFOODS", bucket: "Equities", targetAmount: 3_000_000 },
  { key: "nestle", name: "Nestlé Nigeria", ticker: "NESTLE", bucket: "Equities", targetAmount: 2_000_000 },
  { key: "seplat", name: "Seplat Energy", ticker: "SEPLAT", bucket: "Equities", targetAmount: 3_000_000 },
  { key: "equity-reserve", name: "Equity Opportunity Reserve", ticker: null, bucket: "Equities", targetAmount: 4_000_000 },
  { key: "tbills", name: "Treasury Bills", ticker: null, bucket: "Fixed Income", targetAmount: 12_000_000 },
  { key: "mmf", name: "Money Market Fund", ticker: null, bucket: "Fixed Income", targetAmount: 5_000_000 },
  { key: "fgn-bonds", name: "FGN Bonds", ticker: null, bucket: "Fixed Income", targetAmount: 3_000_000 },
  { key: "startup", name: "Startup / Private", ticker: null, bucket: "Private", targetAmount: 5_000_000 },
];

function normalize(value: string) { return value.toLowerCase().replace(/[^a-z0-9]/g, ""); }
function matchesPolicy(policyKey: string, policyName: string, holding: typeof holdingsTable.$inferSelect) {
  const haystack = normalize(`${holding.issuer} ${holding.type}`);
  const aliases: Record<string, string[]> = {
    gtco: ["gtco", "guarantytrust", "guarantytrustholding"], zenith: ["zenith", "zenithbank"], uba: ["uba", "unitedbankforafrica"],
    mtn: ["mtn", "mtnnigeria", "mtnn"], airtel: ["airtel", "airtelafrica"], dangote: ["dangote", "dangotecement", "dangcem"],
    "bua-foods": ["buafoods", "buafood"], nestle: ["nestle", "nestlenigeria"], seplat: ["seplat", "seplatenergy"],
    "equity-reserve": ["equityreserve", "opportunityreserve", "cashreserve"], tbills: ["treasurybill", "tbill", "ntb"],
    mmf: ["moneymarket", "mmmf", "mmf"], "fgn-bonds": ["fgnbond", "federalgovernmentbond"], startup: ["startup", "privateequity", "privateinvestment", "venture"],
  };
  return (aliases[policyKey] || [normalize(policyName)]).some((alias) => haystack.includes(normalize(alias)));
}
function actionFor(target: number, actual: number) {
  if (target === 0) return actual > 0 ? "TRIM" : "HOLD";
  const ratio = actual / target;
  if (ratio < 0.75) return "ADD";
  if (ratio > 1.25) return "TRIM";
  if (ratio < 0.9 || ratio > 1.1) return "WATCH";
  return "HOLD";
}

async function buildDesk(userId: number) {
  const holdings = await db.select().from(holdingsTable).where(eq(holdingsTable.userId, userId));
  const activeHoldings = holdings.filter((holding) => holding.status === "ACTIVE");
  const rows = targetPolicy.map((policy) => {
    const actualAmount = activeHoldings.filter((h) => matchesPolicy(policy.key, policy.name, h)).reduce((sum, h) => sum + h.amount, 0);
    const driftAmount = actualAmount - policy.targetAmount;
    const driftPct = policy.targetAmount > 0 ? (driftAmount / policy.targetAmount) * 100 : 0;
    return { ...policy, actualAmount, targetPct: (policy.targetAmount / TARGET_TOTAL) * 100, actualPct: (actualAmount / TARGET_TOTAL) * 100, driftAmount, driftPct, action: actionFor(policy.targetAmount, actualAmount) };
  });
  const actualTracked = rows.reduce((sum, row) => sum + row.actualAmount, 0);
  const byBucket = rows.reduce<Record<string, { targetAmount: number; actualAmount: number }>>((acc, row) => {
    acc[row.bucket] ||= { targetAmount: 0, actualAmount: 0 }; acc[row.bucket].targetAmount += row.targetAmount; acc[row.bucket].actualAmount += row.actualAmount; return acc;
  }, {});
  return { generatedAt: new Date().toISOString(), targetTotal: TARGET_TOTAL, actualTracked, unallocatedToTarget: TARGET_TOTAL - actualTracked, policyStatus: actualTracked === 0 ? "NOT_STARTED" : actualTracked < TARGET_TOTAL ? "BUILDING" : "FUNDED", buckets: Object.entries(byBucket).map(([name, value]) => ({ name, ...value })), positions: rows };
}

async function getEquityMarketData() {
  if (!isNgnMarketConfigured()) return { configured: false, provider: "NGN Market", quotes: [], error: null };
  try {
    const { data: companies, meta } = await fetchNgnCompanies();
    const wanted = new Set(targetPolicy.flatMap((p) => p.ticker ? [p.ticker] : []));
    const baseQuotes = companies.filter((c) => wanted.has(c.symbol));
    const enableProfiles = process.env.NGN_MARKET_ENABLE_PROFILES === "true";
    const profiles = enableProfiles ? await Promise.all(baseQuotes.map(async (quote) => {
      try { return (await fetchNgnCompany(quote.symbol)).data; } catch { return quote; }
    })) : baseQuotes;
    return {
      configured: true,
      provider: "NGN Market",
      profileMode: enableProfiles,
      fetchedAt: new Date().toISOString(),
      meta,
      quotes: profiles.map((q) => ({ symbol: q.symbol, name: q.name, price: q.current_price ?? null, changePct: q.price_change_percent ?? null, marketCap: q.market_cap ?? null, eps: q.eps ?? null, pe: q.pe_ratio ?? null, dividendYield: q.dividend_yield ?? null, sourceUpdatedAt: q.updated_at ?? q.date ?? null })),
      error: null,
    };
  } catch (error: any) {
    return { configured: true, provider: "NGN Market", quotes: [], error: error.message || "Failed to fetch NGX market data" };
  }
}

router.get("/investment-desk", requireAuth, async (req, res): Promise<void> => { res.json(await buildDesk(req.user!.userId)); });
router.get("/investment-desk/recheck", requireAuth, async (req, res): Promise<void> => {
  const [desk, equityMarket] = await Promise.all([buildDesk(req.user!.userId), getEquityMarketData()]);
  const [latestNtb] = await db.select().from(cbnMarketDataTable).where(eq(cbnMarketDataTable.securityType, "NTB")).orderBy(desc(cbnMarketDataTable.auctionDate)).limit(1);
  const [latestFmdq] = await db.select().from(mmRatesTable).where(eq(mmRatesTable.source, "FMDQ")).orderBy(desc(mmRatesTable.date)).limit(1);
  const quoteMap = new Map(equityMarket.quotes.map((q: any) => [q.symbol, q]));
  const positions = desk.positions.map((p) => ({ ...p, market: p.ticker ? quoteMap.get(p.ticker) || null : null }));
  const attention = positions.filter((p) => p.action !== "HOLD").sort((a, b) => Math.abs(b.driftPct) - Math.abs(a.driftPct));
  const valuationCoverage = positions.filter((p) => p.ticker).filter((p) => p.market?.price != null).length;
  res.json({
    generatedAt: new Date().toISOString(), policy: { ...desk, positions },
    marketContext: { ntb: latestNtb ? { tenor: latestNtb.tenor, stopRate: latestNtb.stopRate, date: latestNtb.auctionDate } : null, moneyMarket: latestFmdq ? { type: latestFmdq.rateType, tenor: latestFmdq.tenor, rate: latestFmdq.rate, date: latestFmdq.date } : null, equities: equityMarket },
    review: { attentionCount: attention.length, valuationCoverage, valuationReady: valuationCoverage === 9 && equityMarket.quotes.some((q: any) => q.pe != null), highestPriority: attention.slice(0, 5).map((p) => ({ key: p.key, name: p.name, ticker: p.ticker, action: p.action, driftAmount: p.driftAmount, driftPct: p.driftPct, market: p.market })), note: valuationCoverage ? "Live NGX quotes are attached. Valuation-aware signals remain gated until fundamentals coverage is present and fresh." : "Allocation actions remain deterministic drift signals until live NGX data is configured." },
  });
});

export default router;

import { Router, type IRouter } from "express";
import { desc, eq } from "drizzle-orm";
import {
  db,
  marketDataSourcesTable,
  ngxCompaniesTable,
  ngxDailyPricesTable,
  ngxDerivedMetricsTable,
  ngxSecuritiesTable,
} from "@workspace/db";
import { requireAdmin, requireAuth } from "../middlewares/auth";
import { syncNgxEquitySnapshot } from "../lib/ngx-market-data";

const router: IRouter = Router();

let ngxHydrationPromise: Promise<void> | null = null;
let lastNgxHydrationAttempt = 0;
const NGX_HYDRATION_COOLDOWN_MS = 15 * 60 * 1000;

async function hydrateNgxIfEmpty(): Promise<void> {
  if (Date.now() - lastNgxHydrationAttempt < NGX_HYDRATION_COOLDOWN_MS) return;
  if (!ngxHydrationPromise) {
    lastNgxHydrationAttempt = Date.now();
    ngxHydrationPromise = syncNgxEquitySnapshot()
      .then(() => undefined)
      .finally(() => {
        ngxHydrationPromise = null;
      });
  }
  await ngxHydrationPromise;
}

async function listCompanies() {
  return db
    .select({
      companyId: ngxCompaniesTable.id,
      name: ngxCompaniesTable.displayName,
      sector: ngxCompaniesTable.sector,
      industry: ngxCompaniesTable.industry,
      symbol: ngxSecuritiesTable.symbol,
      currency: ngxSecuritiesTable.currency,
      isListed: ngxSecuritiesTable.isListed,
    })
    .from(ngxSecuritiesTable)
    .innerJoin(ngxCompaniesTable, eq(ngxSecuritiesTable.companyId, ngxCompaniesTable.id))
    .orderBy(ngxSecuritiesTable.symbol);
}

router.get("/ngx/companies", async (_req, res): Promise<void> => {
  let companies = await listCompanies();
  if (companies.length === 0) {
    try {
      await hydrateNgxIfEmpty();
      companies = await listCompanies();
    } catch (error: any) {
      res.status(503).json({
        companies: [],
        count: 0,
        sourceStatus: "unavailable",
        error: error?.message ?? "NGX source unavailable",
      });
      return;
    }
  }

  res.json({
    companies,
    count: companies.length,
    sourceStatus: companies.length > 0 ? "available" : "empty",
  });
});

router.get("/ngx/companies/:symbol", async (req, res): Promise<void> => {
  const symbol = String(req.params.symbol).toUpperCase().trim();

  const [company] = await db
    .select({
      companyId: ngxCompaniesTable.id,
      legalName: ngxCompaniesTable.legalName,
      displayName: ngxCompaniesTable.displayName,
      sector: ngxCompaniesTable.sector,
      industry: ngxCompaniesTable.industry,
      country: ngxCompaniesTable.country,
      website: ngxCompaniesTable.website,
      securityId: ngxSecuritiesTable.id,
      symbol: ngxSecuritiesTable.symbol,
      isin: ngxSecuritiesTable.isin,
      exchange: ngxSecuritiesTable.exchange,
      currency: ngxSecuritiesTable.currency,
      sharesOutstanding: ngxSecuritiesTable.sharesOutstanding,
      freeFloatPct: ngxSecuritiesTable.freeFloatPct,
      isListed: ngxSecuritiesTable.isListed,
    })
    .from(ngxSecuritiesTable)
    .innerJoin(ngxCompaniesTable, eq(ngxSecuritiesTable.companyId, ngxCompaniesTable.id))
    .where(eq(ngxSecuritiesTable.symbol, symbol))
    .limit(1);

  if (!company) {
    res.status(404).json({ error: "NGX security not found" });
    return;
  }

  const [latestPrice] = await db
    .select({
      tradeDate: ngxDailyPricesTable.tradeDate,
      close: ngxDailyPricesTable.close,
      previousClose: ngxDailyPricesTable.previousClose,
      priceChange: ngxDailyPricesTable.priceChange,
      percentChange: ngxDailyPricesTable.percentChange,
      volume: ngxDailyPricesTable.volume,
      trades: ngxDailyPricesTable.trades,
      fetchedAt: ngxDailyPricesTable.fetchedAt,
      sourceCode: marketDataSourcesTable.code,
      sourceName: marketDataSourcesTable.name,
    })
    .from(ngxDailyPricesTable)
    .innerJoin(marketDataSourcesTable, eq(ngxDailyPricesTable.sourceId, marketDataSourcesTable.id))
    .where(eq(ngxDailyPricesTable.securityId, company.securityId))
    .orderBy(desc(ngxDailyPricesTable.tradeDate))
    .limit(1);

  const metrics = await db
    .select({
      asOfDate: ngxDerivedMetricsTable.asOfDate,
      metricCode: ngxDerivedMetricsTable.metricCode,
      value: ngxDerivedMetricsTable.value,
      methodVersion: ngxDerivedMetricsTable.methodVersion,
      calculatedAt: ngxDerivedMetricsTable.calculatedAt,
    })
    .from(ngxDerivedMetricsTable)
    .where(eq(ngxDerivedMetricsTable.securityId, company.securityId))
    .orderBy(desc(ngxDerivedMetricsTable.asOfDate));

  res.json({ company, latestPrice: latestPrice ?? null, metrics });
});

router.get("/ngx/prices/:symbol", async (req, res): Promise<void> => {
  const symbol = String(req.params.symbol).toUpperCase().trim();
  const requestedLimit = Number.parseInt(String(req.query.limit ?? "90"), 10);
  const limit = Number.isFinite(requestedLimit) ? Math.min(Math.max(requestedLimit, 1), 1000) : 90;

  const [security] = await db
    .select({ id: ngxSecuritiesTable.id })
    .from(ngxSecuritiesTable)
    .where(eq(ngxSecuritiesTable.symbol, symbol))
    .limit(1);

  if (!security) {
    res.status(404).json({ error: "NGX security not found" });
    return;
  }

  const prices = await db
    .select({
      tradeDate: ngxDailyPricesTable.tradeDate,
      open: ngxDailyPricesTable.open,
      high: ngxDailyPricesTable.high,
      low: ngxDailyPricesTable.low,
      close: ngxDailyPricesTable.close,
      previousClose: ngxDailyPricesTable.previousClose,
      percentChange: ngxDailyPricesTable.percentChange,
      volume: ngxDailyPricesTable.volume,
      trades: ngxDailyPricesTable.trades,
      valueTraded: ngxDailyPricesTable.valueTraded,
      fetchedAt: ngxDailyPricesTable.fetchedAt,
      sourceCode: marketDataSourcesTable.code,
    })
    .from(ngxDailyPricesTable)
    .innerJoin(marketDataSourcesTable, eq(ngxDailyPricesTable.sourceId, marketDataSourcesTable.id))
    .where(eq(ngxDailyPricesTable.securityId, security.id))
    .orderBy(desc(ngxDailyPricesTable.tradeDate))
    .limit(limit);

  res.json({ symbol, prices, count: prices.length });
});

router.post("/ngx/sync/equities", requireAuth, requireAdmin, async (_req, res): Promise<void> => {
  try {
    const result = await syncNgxEquitySnapshot();
    res.json({ success: true, ...result });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      error: error?.message ?? "NGX sync failed",
    });
  }
});

export default router;

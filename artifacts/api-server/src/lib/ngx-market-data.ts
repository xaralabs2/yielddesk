interface FetchResponseLike {
  ok: boolean;
  status: number;
  text(): Promise<string>;
  json(): Promise<unknown>;
}

import { eq } from "drizzle-orm";
import {
  db,
  marketDataSourcesTable,
  ngxCompaniesTable,
  ngxDailyPricesTable,
  ngxSecuritiesTable,
} from "@workspace/db";

const NGX_EQUITIES_URL =
  "https://doclib.ngxgroup.com/REST/api/statistics/equities/?market=&sector=&orderby=&pageSize=300&pageNo=0";

interface NgxEquitySnapshot {
  Symbol: string;
  Name?: string;
  Sector?: string;
  Industry?: string;
  ClosePrice: number | null;
  PrevClosingPrice: number | null;
  OpeningPrice: number | null;
  HighPrice?: number | null;
  LowPrice?: number | null;
  Change: number | null;
  PercChange: number | null;
  Volume: number | null;
  Trades: number | null;
  Value?: number | null;
  TradeDate: string | null;
}

function decimal(value: number | null | undefined): string | null {
  return typeof value === "number" && Number.isFinite(value) ? String(value) : null;
}

function normalizeDate(value: string | null | undefined): string | null {
  if (!value) return null;
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return null;
  return parsed.toISOString().slice(0, 10);
}

async function fetchNgxEquities(): Promise<NgxEquitySnapshot[]> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 15_000);

  try {
    const response = await fetch(NGX_EQUITIES_URL, {
      signal: controller.signal,
      headers: {
        "User-Agent": "YieldDesk/1.0 (Nigerian Investment Intelligence Platform)",
        Accept: "application/json",
      },
    });

    if (!(response as unknown as FetchResponseLike).ok) {
      throw new Error(`NGX equities request failed with HTTP ${(response as unknown as FetchResponseLike).status}`);
    }

    const payload = (await (response as unknown as FetchResponseLike).json()) as unknown;
    if (!Array.isArray(payload)) {
      throw new Error("NGX equities response was not an array");
    }

    return payload as NgxEquitySnapshot[];
  } finally {
    clearTimeout(timeout);
  }
}

async function ensureNgxSource(): Promise<number> {
  await db
    .insert(marketDataSourcesTable)
    .values({
      code: "NGX_PUBLIC_EQUITIES",
      name: "Nigerian Exchange Group public equities statistics",
      sourceType: "EXCHANGE",
      baseUrl: "https://doclib.ngxgroup.com",
      licenseStatus: "PUBLIC_SOURCE_REVIEW_REQUIRED",
      redistributionAllowed: false,
      isActive: true,
      updatedAt: new Date(),
    })
    .onConflictDoUpdate({
      target: marketDataSourcesTable.code,
      set: {
        name: "Nigerian Exchange Group public equities statistics",
        baseUrl: "https://doclib.ngxgroup.com",
        licenseStatus: "PUBLIC_SOURCE_REVIEW_REQUIRED",
        redistributionAllowed: false,
        isActive: true,
        updatedAt: new Date(),
      },
    });

  const [source] = await db
    .select({ id: marketDataSourcesTable.id })
    .from(marketDataSourcesTable)
    .where(eq(marketDataSourcesTable.code, "NGX_PUBLIC_EQUITIES"))
    .limit(1);

  if (!source) throw new Error("Unable to resolve NGX market data source");
  return source.id;
}

export interface NgxSyncResult {
  fetched: number;
  companiesCreated: number;
  securitiesCreated: number;
  securitiesUpdated: number;
  pricesUpserted: number;
  pricesSkippedNoDate: number;
  pricesSkippedNoClose: number;
  source: string;
  fetchedAt: string;
}

export async function syncNgxEquitySnapshot(): Promise<NgxSyncResult> {
  const rows = await fetchNgxEquities();
  const sourceId = await ensureNgxSource();

  let companiesCreated = 0;
  let securitiesCreated = 0;
  let securitiesUpdated = 0;
  let pricesUpserted = 0;
  let pricesSkippedNoDate = 0;
  let pricesSkippedNoClose = 0;

  for (const row of rows) {
    const symbol = row.Symbol?.trim().toUpperCase();
    if (!symbol) continue;

    const displayName = row.Name?.trim() || symbol;
    const [existingSecurity] = await db
      .select({
        id: ngxSecuritiesTable.id,
        companyId: ngxSecuritiesTable.companyId,
      })
      .from(ngxSecuritiesTable)
      .where(eq(ngxSecuritiesTable.symbol, symbol))
      .limit(1);

    let securityId: number;

    if (existingSecurity) {
      securityId = existingSecurity.id;
      await db
        .update(ngxCompaniesTable)
        .set({
          legalName: displayName,
          displayName,
          sector: row.Sector?.trim() || null,
          industry: row.Industry?.trim() || null,
          isActive: true,
          updatedAt: new Date(),
        })
        .where(eq(ngxCompaniesTable.id, existingSecurity.companyId));

      await db
        .update(ngxSecuritiesTable)
        .set({ isListed: true, updatedAt: new Date() })
        .where(eq(ngxSecuritiesTable.id, existingSecurity.id));
      securitiesUpdated += 1;
    } else {
      const [company] = await db
        .insert(ngxCompaniesTable)
        .values({
          legalName: displayName,
          displayName,
          sector: row.Sector?.trim() || null,
          industry: row.Industry?.trim() || null,
          country: "Nigeria",
          isActive: true,
        })
        .returning({ id: ngxCompaniesTable.id });

      if (!company) throw new Error(`Failed to create company for ${symbol}`);
      companiesCreated += 1;

      const [security] = await db
        .insert(ngxSecuritiesTable)
        .values({
          companyId: company.id,
          symbol,
          exchange: "NGX",
          currency: "NGN",
          securityType: "EQUITY",
          isListed: true,
        })
        .returning({ id: ngxSecuritiesTable.id });

      if (!security) throw new Error(`Failed to create security ${symbol}`);
      securityId = security.id;
      securitiesCreated += 1;
    }

    const tradeDate = normalizeDate(row.TradeDate);
    if (!tradeDate) {
      pricesSkippedNoDate += 1;
      continue;
    }

    const close = row.ClosePrice ?? row.PrevClosingPrice;
    if (typeof close !== "number" || !Number.isFinite(close) || close <= 0) {
      pricesSkippedNoClose += 1;
      continue;
    }

    await db
      .insert(ngxDailyPricesTable)
      .values({
        securityId,
        sourceId,
        tradeDate,
        open: decimal(row.OpeningPrice),
        high: decimal(row.HighPrice),
        low: decimal(row.LowPrice),
        close: String(close),
        previousClose: decimal(row.PrevClosingPrice),
        priceChange: decimal(row.Change),
        percentChange: row.PercChange ?? null,
        volume: decimal(row.Volume),
        trades: row.Trades ?? null,
        valueTraded: decimal(row.Value),
        rawPayload: row,
        fetchedAt: new Date(),
      })
      .onConflictDoUpdate({
        target: [
          ngxDailyPricesTable.securityId,
          ngxDailyPricesTable.tradeDate,
          ngxDailyPricesTable.sourceId,
        ],
        set: {
          open: decimal(row.OpeningPrice),
          high: decimal(row.HighPrice),
          low: decimal(row.LowPrice),
          close: String(close),
          previousClose: decimal(row.PrevClosingPrice),
          priceChange: decimal(row.Change),
          percentChange: row.PercChange ?? null,
          volume: decimal(row.Volume),
          trades: row.Trades ?? null,
          valueTraded: decimal(row.Value),
          rawPayload: row,
          fetchedAt: new Date(),
        },
      });

    pricesUpserted += 1;
  }

  return {
    fetched: rows.length,
    companiesCreated,
    securitiesCreated,
    securitiesUpdated,
    pricesUpserted,
    pricesSkippedNoDate,
    pricesSkippedNoClose,
    source: "NGX_PUBLIC_EQUITIES",
    fetchedAt: new Date().toISOString(),
  };
}

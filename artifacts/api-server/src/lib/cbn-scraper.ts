import { db, signalsTable, cbnMarketDataTable, cbnPolicyRatesTable, cbnExchangeRatesTable } from "@workspace/db";
import { desc, eq, and, gte } from "drizzle-orm";
import { logger } from "./logger";

const CBN_BASE = "https://www.cbn.gov.ng/api";
const ENDPOINTS = {
  NTB: `${CBN_BASE}/GetAllSecuritiesNTB`,
  BOND: `${CBN_BASE}/GetAllSecuritiesFGNBond`,
  OMO: `${CBN_BASE}/GetAllSecuritiesOMO`,
  MONEY_MARKET: `${CBN_BASE}/GetAllMoneyMarketIndicators`,
  EXCHANGE_RATES: `${CBN_BASE}/GetAllExchangeRates`,
};

interface FetchResponseLike {
  ok: boolean;
  status: number;
  json(): Promise<unknown>;
}

interface CbnApiRecord {
  id: number;
  auctionDate: string;
  securityType: string;
  tenor: string;
  maturityDate: string;
  totalSubscription: string;
  totalSuccessful: string;
  rangeBid: string;
  successfulBidRates: string;
  rate: string;
  trueYield: string;
  amtOffered: string;
  netValue: string;
}

function parseCbnDate(dateStr: string): Date | null {
  if (!dateStr) return null;
  const parts = dateStr.trim().split("/");
  if (parts.length !== 3) return null;
  const [month, day, year] = parts;
  const d = new Date(`${year}-${month}-${day}T00:00:00Z`);
  return isNaN(d.getTime()) ? null : d;
}

function parseNum(str: string): number | null {
  if (!str || str.trim() === "" || str.trim() === "-") return null;
  const n = parseFloat(str.replace(/,/g, ""));
  return isNaN(n) ? null : n;
}

async function fetchEndpoint<T = CbnApiRecord>(url: string): Promise<T[]> {
  const response = (await fetch(url, {
    headers: {
      "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
      Accept: "application/json",
      Referer: "https://www.cbn.gov.ng/rates/GovtSecurities.html",
    },
    signal: AbortSignal.timeout(30000),
  })) as unknown as FetchResponseLike;

  if (!response.ok) {
    throw new Error(`CBN API ${url} failed: ${response.status}`);
  }

  return (await response.json()) as T[];
}

export async function fetchCbnData() {
  const [ntbRaw, bondRaw, omoRaw] = await Promise.all([
    fetchEndpoint(ENDPOINTS.NTB).catch((e) => {
      logger.error({ err: e }, "Failed to fetch NTB data");
      return [] as CbnApiRecord[];
    }),
    fetchEndpoint(ENDPOINTS.BOND).catch((e) => {
      logger.error({ err: e }, "Failed to fetch Bond data");
      return [] as CbnApiRecord[];
    }),
    fetchEndpoint(ENDPOINTS.OMO).catch((e) => {
      logger.error({ err: e }, "Failed to fetch OMO data");
      return [] as CbnApiRecord[];
    }),
  ]);

  const recentNtb = ntbRaw.slice(0, 20);
  const recentBonds = bondRaw.slice(0, 20);
  const recentOmo = omoRaw.slice(0, 20);

  const ntb364 = recentNtb.find((r) => r.tenor?.includes("364"));
  const ntb182 = recentNtb.find((r) => r.tenor?.includes("182"));
  const ntb91 = recentNtb.find((r) => r.tenor?.includes("91"));

  const cpRate = parseNum(ntb364?.rate ?? "") ??
    parseNum(ntb182?.rate ?? "") ??
    parseNum(ntb91?.rate ?? "");

  const latestBond = recentBonds[0];
  const bondYield = parseNum(latestBond?.rate ?? "");

  logger.info(
    {
      ntbTotal: ntbRaw.length,
      bondTotal: bondRaw.length,
      omoTotal: omoRaw.length,
      cpRate,
      bondYield,
      ntb364Rate: ntb364?.rate,
      ntb182Rate: ntb182?.rate,
      latestBondRate: latestBond?.rate,
    },
    "CBN data fetched from JSON API"
  );

  return {
    ntb: recentNtb,
    bonds: recentBonds,
    omo: recentOmo,
    cpRate,
    bondYield,
    allNtb: ntbRaw,
    allBonds: bondRaw,
    allOmo: omoRaw,
  };
}

export async function syncCbnData(): Promise<{
  recordsInserted: number;
  signalCreated: boolean;
  cpRate: number | null;
  bondYield: number | null;
}> {
  const data = await fetchCbnData();
  let recordsInserted = 0;

  const allRecords = [
    ...data.ntb.map((r) => ({ ...r, source: "CBN" })),
    ...data.bonds.map((r) => ({ ...r, source: "CBN" })),
    ...data.omo.map((r) => ({ ...r, source: "CBN" })),
  ];

  for (const rec of allRecords) {
    const marginalRate = parseNum(rec.rate);
    if (!marginalRate) continue;

    const auctionDate = parseCbnDate(rec.auctionDate);

    const existing = await db
      .select()
      .from(cbnMarketDataTable)
      .where(
        and(
          eq(cbnMarketDataTable.securityType, rec.securityType),
          eq(cbnMarketDataTable.tenor, rec.tenor),
          auctionDate
            ? eq(cbnMarketDataTable.auctionDate, auctionDate)
            : undefined
        )
      )
      .limit(1);

    if (existing.length === 0) {
      await db.insert(cbnMarketDataTable).values({
        source: rec.source,
        securityType: rec.securityType,
        tenor: rec.tenor,
        auctionDate,
        maturityDate: parseCbnDate(rec.maturityDate),
        marginalRate,
        trueYield: parseNum(rec.trueYield),
        totalSubscription: parseNum(rec.totalSubscription),
        totalSuccessful: parseNum(rec.totalSuccessful),
        amountOffered: parseNum(rec.amtOffered),
      });
      recordsInserted++;
    }
  }

  let signalCreated = false;
  if (data.cpRate !== null || data.bondYield !== null) {
    const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);
    const recentSignals = await db
      .select()
      .from(signalsTable)
      .where(gte(signalsTable.createdAt, oneHourAgo))
      .orderBy(desc(signalsTable.createdAt))
      .limit(1);

    const lastSignal = recentSignals[0];
    const shouldCreate =
      !lastSignal ||
      (data.cpRate !== null && Math.abs(lastSignal.cpRate - data.cpRate) > 0.1) ||
      (data.bondYield !== null && Math.abs(lastSignal.bondYield - data.bondYield) > 0.1);

    if (shouldCreate) {
      const fallback = await db
        .select()
        .from(signalsTable)
        .orderBy(desc(signalsTable.createdAt))
        .limit(1);

      await db.insert(signalsTable).values({
        cpRate: data.cpRate ?? fallback[0]?.cpRate ?? 15,
        bondYield: data.bondYield ?? fallback[0]?.bondYield ?? 14,
      });
      signalCreated = true;
    }
  }

  logger.info(
    { recordsInserted, signalCreated, cpRate: data.cpRate, bondYield: data.bondYield },
    "CBN data sync complete"
  );

  return { recordsInserted, signalCreated, cpRate: data.cpRate, bondYield: data.bondYield };
}

let syncInterval: ReturnType<typeof setInterval> | null = null;

export function startCbnSync(intervalMs: number = 60 * 60 * 1000) {
  syncCbnData().catch((err) => {
    logger.error({ err }, "Initial CBN sync failed");
  });
  syncPolicyRates().catch((err) => {
    logger.error({ err }, "Initial policy rates sync failed");
  });
  syncExchangeRates().catch((err) => {
    logger.error({ err }, "Initial exchange rates sync failed");
  });

  syncInterval = setInterval(() => {
    syncCbnData().catch((err) => {
      logger.error({ err }, "Scheduled CBN sync failed");
    });
    syncPolicyRates().catch((err) => {
      logger.error({ err }, "Scheduled policy rates sync failed");
    });
    syncExchangeRates().catch((err) => {
      logger.error({ err }, "Scheduled exchange rates sync failed");
    });
  }, intervalMs);

  logger.info({ intervalMs }, "CBN data sync scheduler started");
}

export function stopCbnSync() {
  if (syncInterval) {
    clearInterval(syncInterval);
    syncInterval = null;
  }
}

interface MoneyMarketRecord {
  id: number;
  tyear: number;
  tmonth: number;
  period: string;
  interBankCallRate: string;
  mrr: string;
  mpr: string;
  treasuryBill: string;
  savingsDeposit: string;
  oneMonthDeposit: string;
  threeMonthsDeposit: string;
  sixMonthsDeposit: string;
  twelveMonthsDeposit: string;
  primeLending: string;
  maxLending: string;
}

interface ExchangeRateRecord {
  id: number;
  currency: string;
  ratedate: string;
  buyingrate: string;
  centralrate: string;
  sellingrate: string;
}

export async function syncPolicyRates(): Promise<{ recordsInserted: number }> {
  const raw: MoneyMarketRecord[] = await fetchEndpoint<MoneyMarketRecord>(ENDPOINTS.MONEY_MARKET).catch((e) => {
    logger.error({ err: e }, "Failed to fetch money market indicators");
    return [];
  });

  let recordsInserted = 0;
  const recent = raw.slice(0, 24);

  for (const rec of recent) {
    const existing = await db
      .select()
      .from(cbnPolicyRatesTable)
      .where(
        and(
          eq(cbnPolicyRatesTable.year, rec.tyear),
          eq(cbnPolicyRatesTable.month, rec.tmonth)
        )
      )
      .limit(1);

    if (existing.length === 0) {
      await db.insert(cbnPolicyRatesTable).values({
        period: rec.period,
        year: rec.tyear,
        month: rec.tmonth,
        mpr: parseNum(rec.mpr),
        interBankCallRate: parseNum(rec.interBankCallRate),
        treasuryBill: parseNum(rec.treasuryBill),
        savingsDeposit: parseNum(rec.savingsDeposit),
        oneMonthDeposit: parseNum(rec.oneMonthDeposit),
        threeMonthsDeposit: parseNum(rec.threeMonthsDeposit),
        sixMonthsDeposit: parseNum(rec.sixMonthsDeposit),
        twelveMonthsDeposit: parseNum(rec.twelveMonthsDeposit),
        primeLending: parseNum(rec.primeLending),
        maxLending: parseNum(rec.maxLending),
      });
      recordsInserted++;
    }
  }

  logger.info({ recordsInserted, totalFetched: raw.length }, "CBN policy rates sync complete");
  return { recordsInserted };
}

const KEY_CURRENCIES = ["US DOLLAR", "POUNDS STERLING", "EURO", "SWISS FRANC", "CHINESE YUAN", "SOUTH AFRICAN RAND"];

export async function syncExchangeRates(): Promise<{ recordsInserted: number }> {
  const raw: ExchangeRateRecord[] = await fetchEndpoint<ExchangeRateRecord>(ENDPOINTS.EXCHANGE_RATES).catch((e) => {
    logger.error({ err: e }, "Failed to fetch exchange rates");
    return [];
  });

  let recordsInserted = 0;
  const filtered = raw.filter((r) => KEY_CURRENCIES.includes(r.currency));

  for (const rec of filtered) {
    const rateDate = new Date(rec.ratedate);
    if (isNaN(rateDate.getTime())) continue;

    const existing = await db
      .select()
      .from(cbnExchangeRatesTable)
      .where(
        and(
          eq(cbnExchangeRatesTable.currency, rec.currency),
          eq(cbnExchangeRatesTable.rateDate, rateDate)
        )
      )
      .limit(1);

    if (existing.length === 0) {
      await db.insert(cbnExchangeRatesTable).values({
        currency: rec.currency,
        rateDate,
        buyingRate: parseNum(rec.buyingrate),
        centralRate: parseNum(rec.centralrate),
        sellingRate: parseNum(rec.sellingrate),
      });
      recordsInserted++;
    }
  }

  logger.info({ recordsInserted, totalFetched: raw.length }, "CBN exchange rates sync complete");
  return { recordsInserted };
}

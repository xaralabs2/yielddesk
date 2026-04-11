import { db, mmRatesTable } from "@workspace/db";
import { desc, eq, and, gte } from "drizzle-orm";
import { logger } from "./logger";

const FMDQ_URLS = {
  mainPage: "https://fmdqgroup.com/market-data/money-market/",
  niborApi: "https://fmdqgroup.com/wp-json/fmdq/v1/nibor",
  repoApi: "https://fmdqgroup.com/wp-json/fmdq/v1/repo-obb",
};

interface FmdqRateRecord {
  rateType: string;
  tenor: string;
  rate: number;
  date: Date;
}

async function tryFetchJson(url: string): Promise<any | null> {
  try {
    const response = await fetch(url, {
      headers: {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
        Accept: "application/json, text/html",
        Referer: "https://fmdqgroup.com/",
      },
      signal: AbortSignal.timeout(15000),
    });
    if (!response.ok) return null;
    const text = await response.text();
    try {
      return JSON.parse(text);
    } catch {
      return text;
    }
  } catch (err) {
    logger.warn({ err, url }, "FMDQ endpoint fetch failed");
    return null;
  }
}

async function scrapeFmdqPage(): Promise<FmdqRateRecord[]> {
  const records: FmdqRateRecord[] = [];

  try {
    const response = await fetch(FMDQ_URLS.mainPage, {
      headers: {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
        Accept: "text/html",
      },
      signal: AbortSignal.timeout(15000),
    });

    if (!response.ok) {
      logger.warn({ status: response.status }, "FMDQ page fetch failed");
      return records;
    }

    const html = await response.text();

    const niborPattern = /NIBOR[^<]*<[^>]*>[\s\S]*?(\d+[\.\d]*)\s*%/gi;
    const obbPattern = /OBB[^<]*<[^>]*>[\s\S]*?(\d+[\.\d]*)\s*%/gi;
    const repoPattern = /Repo[^<]*<[^>]*>[\s\S]*?(\d+[\.\d]*)\s*%/gi;

    const tablePattern = /<table[^>]*>[\s\S]*?<\/table>/gi;
    const tables = html.match(tablePattern) || [];

    for (const table of tables) {
      const rowPattern = /<tr[^>]*>([\s\S]*?)<\/tr>/gi;
      let row;
      while ((row = rowPattern.exec(table)) !== null) {
        const cellPattern = /<t[dh][^>]*>([\s\S]*?)<\/t[dh]>/gi;
        const cells: string[] = [];
        let cell;
        while ((cell = cellPattern.exec(row[1])) !== null) {
          cells.push(cell[1].replace(/<[^>]+>/g, "").trim());
        }

        if (cells.length >= 2) {
          const label = cells[0].toUpperCase();
          const rateStr = cells[cells.length - 1].replace(/[%,]/g, "");
          const rate = parseFloat(rateStr);

          if (!isNaN(rate) && rate > 0 && rate < 100) {
            if (label.includes("NIBOR") || label.includes("OBB") || label.includes("REPO") || label.includes("CALL")) {
              let rateType = "NIBOR";
              if (label.includes("OBB")) rateType = "OBB";
              else if (label.includes("REPO")) rateType = "REPO";
              else if (label.includes("CALL")) rateType = "CALL";

              let tenor = "O/N";
              if (label.includes("30") || label.includes("1M")) tenor = "30DAY";
              else if (label.includes("60") || label.includes("2M")) tenor = "60DAY";
              else if (label.includes("90") || label.includes("3M")) tenor = "90DAY";
              else if (label.includes("180") || label.includes("6M")) tenor = "180DAY";
              else if (label.includes("1W") || label.includes("7")) tenor = "7DAY";

              records.push({
                rateType,
                tenor,
                rate,
                date: new Date(),
              });
            }
          }
        }
      }
    }

    const rateRegex = /(\d+[\.\d]*)\s*%/g;
    const niborSection = html.match(/NIBOR[\s\S]{0,500}/i);
    if (niborSection && records.filter(r => r.rateType === "NIBOR").length === 0) {
      const match = rateRegex.exec(niborSection[0]);
      if (match) {
        records.push({
          rateType: "NIBOR",
          tenor: "O/N",
          rate: parseFloat(match[1]),
          date: new Date(),
        });
      }
    }

    const obbSection = html.match(/OBB[\s\S]{0,500}/i);
    if (obbSection && records.filter(r => r.rateType === "OBB").length === 0) {
      const match = rateRegex.exec(obbSection[0]);
      if (match) {
        records.push({
          rateType: "OBB",
          tenor: "O/N",
          rate: parseFloat(match[1]),
          date: new Date(),
        });
      }
    }
  } catch (err) {
    logger.error({ err }, "FMDQ page scraping failed");
  }

  return records;
}

export async function fetchFmdqRates(): Promise<FmdqRateRecord[]> {
  const records: FmdqRateRecord[] = [];

  const niborData = await tryFetchJson(FMDQ_URLS.niborApi);
  if (niborData && Array.isArray(niborData)) {
    for (const item of niborData) {
      const rate = parseFloat(item.rate || item.value || "0");
      if (rate > 0) {
        records.push({
          rateType: "NIBOR",
          tenor: item.tenor || item.maturity || "O/N",
          rate,
          date: item.date ? new Date(item.date) : new Date(),
        });
      }
    }
  }

  const repoData = await tryFetchJson(FMDQ_URLS.repoApi);
  if (repoData && Array.isArray(repoData)) {
    for (const item of repoData) {
      const rate = parseFloat(item.rate || item.value || "0");
      if (rate > 0) {
        const rateType = (item.type || "").toUpperCase().includes("OBB") ? "OBB" : "REPO";
        records.push({
          rateType,
          tenor: item.tenor || "O/N",
          rate,
          date: item.date ? new Date(item.date) : new Date(),
        });
      }
    }
  }

  if (records.length === 0) {
    logger.info("FMDQ JSON APIs returned no data, falling back to page scraping");
    const scraped = await scrapeFmdqPage();
    records.push(...scraped);
  }

  logger.info({ recordCount: records.length }, "FMDQ rates fetched");
  return records;
}

export async function syncFmdqRates(): Promise<{
  recordsInserted: number;
  rates: FmdqRateRecord[];
}> {
  const rates = await fetchFmdqRates();
  let recordsInserted = 0;

  for (const r of rates) {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const existing = await db
      .select()
      .from(mmRatesTable)
      .where(
        and(
          eq(mmRatesTable.source, "FMDQ"),
          eq(mmRatesTable.rateType, r.rateType),
          eq(mmRatesTable.tenor, r.tenor),
          gte(mmRatesTable.date, today)
        )
      )
      .limit(1);

    if (existing.length === 0) {
      await db.insert(mmRatesTable).values({
        source: "FMDQ",
        rateType: r.rateType,
        tenor: r.tenor,
        rate: r.rate,
        date: r.date,
      });
      recordsInserted++;
    }
  }

  logger.info({ recordsInserted, totalFetched: rates.length }, "FMDQ rate sync complete");
  return { recordsInserted, rates };
}

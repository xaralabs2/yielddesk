interface FetchResponseLike {
  ok: boolean;
  status: number;
  json(): Promise<unknown>;
}

interface NgxEquity {
  Symbol: string;
  Name?: string;
  ClosePrice: number | null;
  PrevClosingPrice: number | null;
  OpeningPrice: number | null;
  Change: number | null;
  PercChange: number | null;
  Volume: number | null;
  Trades: number | null;
  TradeDate: string | null;
}

let priceCache: Map<string, number> = new Map();
let ngxRegistry: Map<string, { symbol: string; name: string; price: number }> = new Map();
let nameToSymbol: Map<string, string> = new Map();
let lastFetchTime = 0;
const CACHE_TTL_MS = 2 * 60 * 1000;

async function fetchAllNgxData(): Promise<void> {
  try {
    const url = "https://doclib.ngxgroup.com/REST/api/statistics/equities/?market=&sector=&orderby=&pageSize=300&pageNo=0";
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 15000);

    const response = (await fetch(url, {
      signal: controller.signal,
      headers: {
        "User-Agent": "YieldDesk/1.0 (Nigerian Investment Intelligence Platform)",
      },
    })) as unknown as FetchResponseLike;
    clearTimeout(timeout);

    if (!response.ok) throw new Error(`HTTP ${response.status}`);

    const data: NgxEquity[] = await response.json() as any;

    const newPrices = new Map<string, number>();
    const newRegistry = new Map<string, { symbol: string; name: string; price: number }>();
    const newNameToSymbol = new Map<string, string>();

    for (const eq of data) {
      const price = eq.ClosePrice ?? eq.PrevClosingPrice;
      if (eq.Symbol) {
        const sym = eq.Symbol.toUpperCase().trim();
        if (price && price > 0) {
          newPrices.set(sym, price);
        }
        const name = (eq.Name || eq.Symbol).toUpperCase().trim();
        newRegistry.set(sym, { symbol: sym, name, price: price || 0 });
        newNameToSymbol.set(sym, sym);
        newNameToSymbol.set(name, sym);
        const words = name.split(/\s+/);
        if (words.length > 1) {
          newNameToSymbol.set(words.slice(0, -1).join(" "), sym);
        }
        if (name.endsWith(" PLC")) {
          newNameToSymbol.set(name.replace(/ PLC$/, ""), sym);
        }
        if (name.endsWith(" PLC.")) {
          newNameToSymbol.set(name.replace(/ PLC\.$/, ""), sym);
        }
      }
    }

    if (newPrices.size > 0) {
      priceCache = newPrices;
      ngxRegistry = newRegistry;
      nameToSymbol = newNameToSymbol;
      lastFetchTime = Date.now();
    }

    console.log(`[NGX] Registry loaded: ${newRegistry.size} equities, ${newNameToSymbol.size} name mappings`);
  } catch (err: any) {
    console.error(`[NGX] Data fetch failed: ${err.message}`);
  }
}

async function ensureNgxData(): Promise<void> {
  if (Date.now() - lastFetchTime > CACHE_TTL_MS || priceCache.size === 0) {
    await fetchAllNgxData();
  }
}

export const TICKER_ALIASES: Record<string, string> = {
  "ACCESSHOLDINGSPLC": "ACCESSCORP",
  "ACCESS HOLDINGS PLC": "ACCESSCORP",
  "ACCESS HOLDINGS": "ACCESSCORP",
  "ACCESSHOLDINGS": "ACCESSCORP",
  "ACCESS BANK": "ACCESSCORP",
  "ACCESS BANK PLC": "ACCESSCORP",
  "ABORIOGUN": "OKOMUOIL",
};

export async function resolveNgxTicker(input: string): Promise<{ symbol: string; name: string; price: number } | null> {
  await ensureNgxData();
  const upper = input.toUpperCase().trim();

  const aliased = TICKER_ALIASES[upper];
  if (aliased) {
    const entry = ngxRegistry.get(aliased);
    if (entry) return entry;
  }

  const directMatch = ngxRegistry.get(upper);
  if (directMatch) return directMatch;

  const nameMatch = nameToSymbol.get(upper);
  if (nameMatch) {
    const entry = ngxRegistry.get(nameMatch);
    if (entry) return entry;
  }

  const cleaned = upper.replace(/ PLC\.?$/, "").replace(/ LIMITED$/, "").replace(/ LTD\.?$/, "").trim();
  const cleanedMatch = nameToSymbol.get(cleaned);
  if (cleanedMatch) {
    const entry = ngxRegistry.get(cleanedMatch);
    if (entry) return entry;
  }

  const aliasedCleaned = TICKER_ALIASES[cleaned];
  if (aliasedCleaned) {
    const entry = ngxRegistry.get(aliasedCleaned);
    if (entry) return entry;
  }

  for (const [key, sym] of nameToSymbol.entries()) {
    if (key.includes(upper) || upper.includes(key)) {
      const entry = ngxRegistry.get(sym);
      if (entry) return entry;
    }
  }

  return null;
}

export function resolveNgxTickerSync(input: string): string | null {
  const upper = input.toUpperCase().trim();
  const aliased = TICKER_ALIASES[upper];
  if (aliased) return aliased;
  if (ngxRegistry.has(upper)) return upper;
  const sym = nameToSymbol.get(upper);
  if (sym) return sym;
  const cleaned = upper.replace(/ PLC\.?$/, "").replace(/ LIMITED$/, "").replace(/ LTD\.?$/, "").trim();
  const aliasedCleaned = TICKER_ALIASES[cleaned];
  if (aliasedCleaned) return aliasedCleaned;
  const cleanedSym = nameToSymbol.get(cleaned);
  if (cleanedSym) return cleanedSym;
  for (const [key, sym] of nameToSymbol.entries()) {
    if (key.includes(upper) || upper.includes(key)) {
      return sym;
    }
  }
  return null;
}

export async function getNgxRegistrySize(): Promise<number> {
  await ensureNgxData();
  return ngxRegistry.size;
}

export async function fetchStockPrices(tickers: string[]): Promise<Map<string, number>> {
  const result = new Map<string, number>();
  if (tickers.length === 0) return result;

  await ensureNgxData();

  const uniqueTickers = [...new Set(tickers.map((t) => t.toUpperCase()))];

  for (const t of uniqueTickers) {
    const price = priceCache.get(t);
    if (price) {
      result.set(t, price);
    }
  }

  return result;
}

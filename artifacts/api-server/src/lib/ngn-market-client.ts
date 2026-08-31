interface FetchResponseLike {
  ok: boolean;
  status: number;
  text(): Promise<string>;
  json(): Promise<unknown>;
}

const DEFAULT_BASE_URL = "https://api.ngnmarket.com/v1";

export type NgnMarketCompany = {
  symbol: string;
  name?: string;
  current_price?: number;
  price_change?: number;
  price_change_percent?: number;
  market_cap?: number;
  eps?: number;
  pe_ratio?: number;
  dividend_yield?: number;
  updated_at?: string;
  date?: string;
  [key: string]: unknown;
};

export type NgnMarketEnvelope<T> = {
  success?: boolean;
  ok?: boolean;
  data?: T;
  meta?: Record<string, unknown>;
};

export function isNgnMarketConfigured() {
  return !!process.env.NGN_MARKET_API_KEY;
}

function baseUrl() {
  return (process.env.NGN_MARKET_BASE_URL || DEFAULT_BASE_URL).replace(/\/$/, "");
}

async function getJson<T>(path: string): Promise<{ data: T; meta?: Record<string, unknown> }> {
  const apiKey = process.env.NGN_MARKET_API_KEY;
  if (!apiKey) throw new Error("NGN Market API is not configured");

  const response = await fetch(`${baseUrl()}${path}`, {
    headers: {
      Authorization: `Bearer ${apiKey}`,
      Accept: "application/json",
    },
  });

  if (!(response as unknown as FetchResponseLike).ok) {
    const body = await (response as unknown as FetchResponseLike).text().catch(() => "");
    throw new Error(`NGN Market API error ${(response as unknown as FetchResponseLike).status}: ${body}`);
  }

  const json = await (response as unknown as FetchResponseLike).json() as NgnMarketEnvelope<T> | T;
  if (json && typeof json === "object" && "data" in json) {
    const envelope = json as NgnMarketEnvelope<T>;
    if (envelope.data === undefined) throw new Error("NGN Market API returned no data");
    return { data: envelope.data, meta: envelope.meta };
  }
  return { data: json as T };
}

export async function fetchNgnCompany(symbol: string) {
  return getJson<NgnMarketCompany>(`/companies/${encodeURIComponent(symbol)}`);
}

export async function fetchNgnCompanies() {
  return getJson<NgnMarketCompany[]>("/companies");
}

export async function fetchNgnMarketSnapshot() {
  return getJson<Record<string, unknown>>("/market/snapshot");
}

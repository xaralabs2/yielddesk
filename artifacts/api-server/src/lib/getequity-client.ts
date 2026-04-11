import { logger } from "./logger";

const GE_BASE_URL = process.env.GETEQUITY_BASE_URL || "https://ge-exchange-staging-1.herokuapp.com/v1";

interface GeTokenPrice {
  buy: number;
  sell: number;
  exchange: number;
}

interface GeMinMaxTrade {
  buy: number;
  sell: number;
}

export interface GeToken {
  _id: string;
  name: string;
  symbol: string;
  image: string;
  currency: string;
  country: string;
  type: string;
  deal_access: string;
  investment_type: string;
  investment_category?: string;
  payout_frequency?: string;
  interest: number;
  tenor: number;
  maturity: string | null;
  raise_amount: number;
  total_raised: number;
  supply: number;
  total_supply: number;
  price: GeTokenPrice;
  prev_price: GeTokenPrice;
  min_trade: GeMinMaxTrade;
  max_trade: GeMinMaxTrade;
  buy_fee: number;
  sell_fee: number;
  carry: number;
  management_fee: number;
  valuation: number;
  discount: number;
  dividend: number;
  risk: string;
  rating: string;
  custodian: string;
  milestone: number;
  percentage: number;
  completed_raise: boolean;
  closed: boolean;
  secondaries: boolean;
  exited: boolean;
  cancelled: boolean;
  createdAt: string;
  updatedAt: string;
  completed_raise_date?: string;
}

interface GeTokensResponse {
  status: string;
  message: string;
  data: {
    page: number;
    pages: number;
    count: number;
    total: number;
    tokens: GeToken[];
  };
}

function getApiKey(): string | null {
  return process.env.GETEQUITY_API_KEY || null;
}

async function geRequest<T>(path: string): Promise<T | null> {
  const apiKey = getApiKey();
  if (!apiKey) {
    logger.warn("GETEQUITY_API_KEY not configured");
    return null;
  }

  try {
    const response = await fetch(`${GE_BASE_URL}${path}`, {
      headers: {
        Authorization: `Bearer ${apiKey}`,
        Accept: "application/json",
      },
      signal: AbortSignal.timeout(15000),
    });

    if (!response.ok) {
      const body = await response.text();
      logger.warn({ status: response.status, body: body.substring(0, 200) }, "GetEquity API error");
      return null;
    }

    return await response.json() as T;
  } catch (err) {
    logger.error({ err }, "GetEquity API request failed");
    return null;
  }
}

export async function fetchGeTokens(options?: {
  page?: number;
  limit?: number;
}): Promise<GeToken[]> {
  const params = new URLSearchParams({
    page: String(options?.page ?? 1),
    limit: String(options?.limit ?? 100),
  });

  const result = await geRequest<GeTokensResponse>(`/api/tokens?${params}`);
  if (!result || result.status !== "success") return [];
  return result.data.tokens;
}

export async function fetchAllDeals(): Promise<GeToken[]> {
  const allTokens = await fetchGeTokens({ limit: 200 });
  return allTokens.filter((t) => !t.cancelled);
}

const CP_TYPES = new Set(["Debt", "Fixed Interest", "Fund"]);

export async function fetchGeCpTokens(): Promise<GeToken[]> {
  const allTokens = await fetchGeTokens({ limit: 200 });
  return allTokens.filter((t) => CP_TYPES.has(t.investment_type));
}

export function isGetEquityConfigured(): boolean {
  return !!getApiKey();
}

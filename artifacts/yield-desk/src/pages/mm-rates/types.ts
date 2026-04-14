export interface MmRate {
  id: number;
  source: string;
  rateType: string;
  tenor: string;
  rate: number;
  date: string;
  notes: string | null;
  createdAt: string;
}

export interface ProxyRate {
  id: number;
  source: string;
  rateType: string;
  tenor: string;
  rate: number | null;
  date: string;
  notes: string;
  createdAt: string;
}

export interface MmSummary {
  proxy: {
    ntb91: { rate: number; date: string } | null;
    ntb182: { rate: number; date: string } | null;
    ntb364: { rate: number; date: string } | null;
  };
  fmdq: Record<string, { rate: number; date: string; tenor: string }>;
  manual: MmRate[];
  lastFmdqSync: string | null;
}

export interface MmRatesData {
  fmdq: MmRate[];
  manual: MmRate[];
  proxy: ProxyRate[];
}

export interface GeToken {
  _id: string;
  name: string;
  symbol: string;
  image: string;
  currency: string;
  country: string;
  type: string;
  investment_type: string;
  investment_category?: string;
  payout_frequency?: string;
  interest: number;
  tenor: number;
  maturity: string | null;
  raise_amount: number;
  total_raised: number;
  supply: number;
  price: { buy: number; sell: number; exchange: number };
  min_trade: { buy: number; sell: number };
  max_trade: { buy: number; sell: number };
  valuation: number;
  discount: number;
  dividend: number;
  risk: string;
  rating: string;
  custodian: string;
  carry: number;
  management_fee: number;
  milestone: number;
  completed_raise: boolean;
  closed: boolean;
  secondaries: boolean;
  exited: boolean;
  createdAt: string;
}

export interface GeCpData {
  configured: boolean;
  tokens: GeToken[];
}

export function formatDate(dateStr: string | null) {
  if (!dateStr) return "---";
  return new Date(dateStr).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" });
}

export function getAuthHeaders(): Record<string, string> {
  const token = localStorage.getItem("token");
  const headers: Record<string, string> = {};
  if (token) headers["Authorization"] = `Bearer ${token}`;
  return headers;
}

export type InvestmentOption = {
  id: string;
  name: string;
  category: string;
  description: string;
  riskLevel: string;
  liquidity: string;
  volatility: string;
  inflationProtection: string;
  tenors?: { label: string; yieldRange: [number, number]; notes?: string }[];
  nominalReturnRange: [number, number];
  bestFor: string;
  realYieldRange?: [number, number];
};

export type InvestmentLandscapeData = {
  investments: InvestmentOption[];
  currentInflation: number;
  currentMpr: number;
  currentTbillRate: number | null;
  fxRate: number;
};

export type EtfSignal = {
  symbol: string;
  name: string;
  signal: string;
  confidence: number;
  reasoning: string;
  role: string;
  regime: string;
};

export type EtfPrice = {
  symbol: string;
  price: number;
  change1d: number;
};

export type FactorSignal = {
  factorType: string;
  signal: string;
  confidence: number;
  reasoning: string;
  symbol: string;
};

export type EtfAllocationData = {
  regime: {
    name: string;
    code: string;
    color: string;
    confidence: number;
    summary: string;
  };
  etfSignals: EtfSignal[];
  etfPrices: EtfPrice[];
  factorSignals: FactorSignal[];
  lastUpdated: string | null;
};

export interface RateEntry {
  rate: number;
  date: string;
}

export interface RatesSummary {
  ntb: Record<string, RateEntry>;
  bonds: Record<string, RateEntry>;
  omo: Record<string, RateEntry>;
  lastUpdated: string | null;
}

export interface MarketRecord {
  id: number;
  source: string;
  securityType: string;
  tenor: string;
  auctionDate: string | null;
  maturityDate: string | null;
  marginalRate: number | null;
  trueYield: number | null;
  amountOffered: number | null;
  totalSubscription: number | null;
  totalSuccessful: number | null;
  fetchedAt: string;
}

export interface MarketData {
  ntb: MarketRecord[];
  bonds: MarketRecord[];
  omo: MarketRecord[];
}

export interface PolicyRate {
  id: number;
  period: string;
  year: number;
  month: number;
  mpr: number | null;
  interBankCallRate: number | null;
  treasuryBill: number | null;
  savingsDeposit: number | null;
  oneMonthDeposit: number | null;
  threeMonthsDeposit: number | null;
  sixMonthsDeposit: number | null;
  twelveMonthsDeposit: number | null;
  primeLending: number | null;
  maxLending: number | null;
}

export interface ExchangeRateEntry {
  id: number;
  currency: string;
  rateDate: string;
  buyingRate: number | null;
  centralRate: number | null;
  sellingRate: number | null;
}

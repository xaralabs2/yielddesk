export type MarketCode = "US" | "UK" | "NG";
export type CurrencyCode = "USD" | "GBP" | "NGN";

export type AssetClass =
  | "EQUITY"
  | "REIT"
  | "GOVERNMENT_SECURITY"
  | "REGULATED_FUND"
  | "PROPERTY_SPV";

export type IntelligenceDecision =
  | "ACCUMULATE"
  | "WATCH"
  | "AVOID"
  | "INSUFFICIENT_EVIDENCE";

export type DataProvenance = {
  sourceName: string;
  sourceUrl?: string;
  observedAt: string;
  asOfDate: string;
  freshness: "LIVE" | "CURRENT" | "STALE";
  confidence: number;
};

export type MarketInstrument = {
  id: string;
  market: MarketCode;
  nativeCurrency: CurrencyCode;
  assetClass: AssetClass;
  symbol: string;
  name: string;
  venue: string;
  liquidity: "HIGH" | "MEDIUM" | "LOW";
  executionMode: "SIMULATION_ONLY" | "PARTNER_ROUTED";
};

export type EquityValuationInput = {
  instrument: MarketInstrument;
  currentPrice: number;
  normalizedEps: number;
  annualDividend: number;
  conservativeMultiple: number;
  fairMultiple: number;
  optimisticMultiple: number;
  downsideMultiple: number;
  expectedEpsGrowth: number;
  horizonYears: number;
  minimumRequiredReturn: number;
  dataConfidence: number;
  unresolvedDiligence: string[];
  provenance: DataProvenance[];
};

export type EquityValuationResult = {
  instrument: MarketInstrument;
  currentPrice: number;
  trailingOrForwardMultiple: number;
  dividendYield: number;
  downsideValue: number;
  preferredEntryPrice: number;
  fairValue: number;
  optimisticValue: number;
  marginOfSafetyToFairValue: number;
  expectedAnnualizedReturn: number;
  decision: IntelligenceDecision;
  decisionRationale: string[];
  dataConfidence: number;
  unresolvedDiligence: string[];
  humanApprovalRequired: true;
  actionable: false;
};

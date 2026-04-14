export type PortfolioDashboard = {
  totalValue: number;
  baselineValue: number;
  targetValue: number;
  nominalReturn: number;
  realReturn: number;
  currentInflation: number;
  pillars: PillarSummary[];
  alerts: RebalanceAlert[];
  holdings: any[];
  config: {
    stabilityTarget: number;
    inflationTarget: number;
    strategicTarget: number;
    tolerance: number;
  };
  availableCash: number;
  totalCommissions: number;
  totalFees: number;
  totalTaxes: number;
  fxRate: number;
};

export type PillarSummary = {
  pillar: string;
  value: number;
  weight: number;
  target: number;
  drift: number;
  holdings: { asset: string; value: number }[];
};

export type RebalanceAlert = {
  pillar: string;
  drift: number;
  direction: "over" | "under";
  action: string;
};

export type EtfAllocationData = {
  regime: {
    name: string;
    color: "GREEN" | "YELLOW" | "ORANGE" | "RED" | "GREY";
    confidence: number;
    summary: string;
  };
  etfSignals: { symbol: string; name: string; signal: "BUY" | "HOLD" | "SELL"; confidence: number; reasoning: string; role: string; regime: string }[];
  etfPrices: { symbol: string; price: number; change1d: number }[];
  factorSignals: { factorType: string; signal: string; confidence: number; reasoning: string; symbol: string }[];
  lastUpdated: string | null;
};

export interface ParsedTransaction {
  security: string;
  ticker: string;
  quantity: number;
  price: number;
  grossAmount: number;
  totalAmount: number;
  tradeDate: string;
  settlementDate: string;
  type: "BUY" | "SELL";
  broker: string;
  fees: number;
}

export type EditableHolding = {
  id: number;
  asset: string;
  ticker: string | null;
  pillar: string;
  valueNgn: number;
  shares: number;
  entryValueNgn?: number | null;
  annualRentNgn?: number | null;
  corridor?: string | null;
  entryDate?: string | null;
  cumulativeRentNgn?: number | null;
};

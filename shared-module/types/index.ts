export * from "./market-intelligence";

export type PortfolioHolding = {
  id: number;
  userId: string;
  asset: string;
  ticker: string | null;
  pillar: string;
  valueNgn: number;
  shares: number | null;
  entryValueNgn: number | null;
  entryFxRate: number | null;
  annualRentNgn: number | null;
  cumulativeRentNgn: number | null;
  corridor: string | null;
  entryDate: Date | null;
  lastUpdated: Date | null;
};

export type PortfolioConfig = {
  id: number;
  userId: string;
  stabilityTarget: number;
  inflationTarget: number;
  strategicTarget: number;
  tolerance: number;
  baselineValue: number | null;
  targetValue: number | null;
  availableCash: number | null;
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

export type PortfolioDashboard = {
  totalValue: number;
  baselineValue: number;
  targetValue: number;
  nominalReturn: number;
  realReturn: number;
  currentInflation: number;
  pillars: PillarSummary[];
  alerts: RebalanceAlert[];
  holdings: PortfolioHolding[];
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

export type InvestmentOption = {
  id: string;
  name: string;
  category: string;
  description: string;
  riskLevel: "Very Low" | "Low" | "Medium" | "High";
  liquidity: "Very High" | "High" | "Medium" | "Low";
  volatility: "Very Low" | "Low" | "Medium" | "High";
  inflationProtection: "Weak" | "Weak-Moderate" | "Moderate" | "Strong";
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

export type MacroData = {
  inflation: number;
  mpr: number;
  tbillRate?: number | null;
  fxRate: number;
  [key: string]: any;
};

export type ParsedTransaction = {
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
};

export type EtfSignal = {
  symbol: string;
  name: string;
  signal: "BUY" | "HOLD" | "SELL";
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
    color: "GREEN" | "YELLOW" | "ORANGE" | "RED" | "GREY";
    confidence: number;
    summary: string;
  };
  etfSignals: EtfSignal[];
  etfPrices: EtfPrice[];
  factorSignals: FactorSignal[];
  lastUpdated: string | null;
};

export interface IPortfolioStorage {
  getPortfolioHoldings(userId: string): Promise<PortfolioHolding[]>;
  addPortfolioHolding(data: Omit<PortfolioHolding, "id">): Promise<PortfolioHolding>;
  updatePortfolioHolding(id: number, userId: string, data: Partial<PortfolioHolding>): Promise<PortfolioHolding>;
  deletePortfolioHolding(id: number, userId: string): Promise<void>;
  getPortfolioConfig(userId: string): Promise<PortfolioConfig | undefined>;
  upsertPortfolioConfig(data: Omit<PortfolioConfig, "id">): Promise<PortfolioConfig>;
  getLatestMacroData(): Promise<MacroData | undefined>;
}

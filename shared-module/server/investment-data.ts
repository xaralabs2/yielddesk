import type { InvestmentOption, InvestmentLandscapeData, MacroData } from "../types";

const INVESTMENTS: Omit<InvestmentOption, "realYieldRange">[] = [
  {
    id: "ntb",
    name: "Treasury Bills (NTB)",
    category: "Fixed Income",
    description: "Short-term government debt instruments issued by the Debt Management Office (DMO). Considered risk-free as they carry sovereign backing. Actively traded in primary and secondary markets.",
    riskLevel: "Very Low",
    liquidity: "High",
    volatility: "Low",
    inflationProtection: "Weak",
    tenors: [
      { label: "91-Day", yieldRange: [14, 17], notes: "Used for parking funds" },
      { label: "182-Day", yieldRange: [15, 18], notes: "Most actively traded" },
      { label: "364-Day", yieldRange: [16, 19], notes: "Benchmark short-term rate" },
    ],
    nominalReturnRange: [14, 19],
    bestFor: "Capital preservation, short-term positioning. Risk: inflation may exceed returns (negative real yield).",
  },
  {
    id: "fgn-bonds",
    name: "FGN Bonds",
    category: "Fixed Income",
    description: "Long-term government bonds with fixed coupon payments. You lock the rate at purchase, but market price fluctuates with inflation and interest-rate expectations. Can trade before maturity on secondary market.",
    riskLevel: "Low",
    liquidity: "Medium",
    volatility: "Medium",
    inflationProtection: "Weak-Moderate",
    tenors: [
      { label: "3-5 Years", yieldRange: [16, 19] },
      { label: "7-10 Years", yieldRange: [17, 19.5] },
      { label: "15+ Years", yieldRange: [18, 20] },
    ],
    nominalReturnRange: [16, 20],
    bestFor: "Long-term income if inflation stabilizes. Rate is locked but price risk exists.",
  },
  {
    id: "bond-etf",
    name: "Bond ETF (VSPBONDETF)",
    category: "Fixed Income",
    description: "Basket of FGN Bonds traded like a stock on the NGX. Return comes from bond coupons plus price movement. Capital gains only materialize if yields fall. Higher volatility than many investors expect.",
    riskLevel: "Medium",
    liquidity: "High",
    volatility: "High",
    inflationProtection: "Weak",
    tenors: [
      { label: "Yield Income", yieldRange: [14, 18], notes: "From underlying bond coupons" },
      { label: "Capital Gain", yieldRange: [-5, 10], notes: "Only if yields fall" },
    ],
    nominalReturnRange: [10, 20],
    bestFor: "Investors expressing a view on interest rates, not just income. Price-sensitive to MPR changes.",
  },
  {
    id: "mmf",
    name: "Money Market Funds",
    category: "Cash & Near-Cash",
    description: "Managed portfolios of Treasury Bills, bank deposits, and short-dated securities. Offer daily liquidity with stable NAV. Good for idle cash and treasury management.",
    riskLevel: "Very Low",
    liquidity: "Very High",
    volatility: "Very Low",
    inflationProtection: "Weak",
    nominalReturnRange: [13, 16],
    bestFor: "Emergency funds, treasury management. Stable returns with daily access to capital.",
  },
  {
    id: "equities",
    name: "Nigerian Equities (NGX)",
    category: "Equities",
    description: "Return comes from dividends plus price appreciation on the Nigerian Exchange. Historically the best long-term inflation hedge among Nigerian assets. Sector selection matters significantly.",
    riskLevel: "High",
    liquidity: "High",
    volatility: "High",
    inflationProtection: "Strong",
    tenors: [
      { label: "Tier-1 Banks", yieldRange: [8, 12], notes: "Inflation-linked upside" },
      { label: "Cement", yieldRange: [6, 10], notes: "Strong pricing power" },
      { label: "Energy", yieldRange: [7, 11], notes: "USD-linked earnings" },
    ],
    nominalReturnRange: [6, 30],
    bestFor: "Beating inflation over time. Higher volatility but strongest real return potential.",
  },
  {
    id: "real-estate",
    name: "Real Estate (Prime Lagos)",
    category: "Real Assets",
    description: "Direct property investment or RE development. Rental yields in prime Lagos corridors range 5-8% with additional capital appreciation driven by inflation and FX dynamics. Low liquidity but strong store of value.",
    riskLevel: "Medium",
    liquidity: "Low",
    volatility: "Low",
    inflationProtection: "Strong",
    tenors: [
      { label: "Rental Yield", yieldRange: [5, 8], notes: "Prime Lagos corridors" },
      { label: "Capital Appreciation", yieldRange: [8, 15], notes: "Inflation-driven" },
    ],
    nominalReturnRange: [5, 15],
    bestFor: "Long-term store of value. Not for liquidity needs. Combines income with inflation protection.",
  },
  {
    id: "fixed-deposit",
    name: "Fixed Deposits (Banks)",
    category: "Cash & Near-Cash",
    description: "Bank term deposits with fixed tenors. Usually offer lower rates than T-Bills because banks invest your money into those same securities and take a spread. Simplest option but not return-maximizing.",
    riskLevel: "Very Low",
    liquidity: "Medium",
    volatility: "Very Low",
    inflationProtection: "Weak",
    tenors: [
      { label: "90-180 Days", yieldRange: [8, 12] },
      { label: "1 Year", yieldRange: [10, 14] },
    ],
    nominalReturnRange: [8, 14],
    bestFor: "Simplicity, not return maximization. Lower yields than direct T-Bill participation.",
  },
];

export function computeInvestmentLandscape(latest: MacroData): InvestmentLandscapeData {
  const inflation = latest.inflation;

  const investments: InvestmentOption[] = INVESTMENTS.map((inv) => ({
    ...inv,
    realYieldRange: [
      parseFloat((inv.nominalReturnRange[0] - inflation).toFixed(2)),
      parseFloat((inv.nominalReturnRange[1] - inflation).toFixed(2)),
    ] as [number, number],
  }));

  return {
    investments,
    currentInflation: inflation,
    currentMpr: latest.mpr,
    currentTbillRate: latest.tbillRate ?? null,
    fxRate: latest.fxRate,
  };
}

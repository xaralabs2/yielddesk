import type { EtfAllocationData, MacroData } from "../types";

const NGX_ETFS = [
  { symbol: "VETBANK", name: "Vetiva Banking ETF" },
  { symbol: "VETGOODS", name: "Vetiva Consumer Goods ETF" },
  { symbol: "VETINDETF", name: "Vetiva Industrial ETF" },
  { symbol: "VSPBONDETF", name: "Vetiva S&P Bond ETF" },
  { symbol: "GREENWETF", name: "Greenwich Alpha ETF" },
  { symbol: "MERGROWTH", name: "Meristem Growth ETF" },
  { symbol: "MERVALUE", name: "Meristem Value ETF" },
];

type RegimeType = "Tight Liquidity" | "Moderate Liquidity" | "Loose Liquidity" | "Easing Cycle";

function detectRegime(macro: MacroData): { name: RegimeType; color: EtfAllocationData["regime"]["color"]; confidence: number; summary: string } {
  const mpr = macro.mpr ?? 18;
  const inflation = macro.inflation ?? 15;
  const tbill = macro.tbillRate ?? mpr;
  const realRate = mpr - inflation;

  if (mpr >= 20 && realRate > 2) {
    return {
      name: "Tight Liquidity",
      color: "ORANGE",
      confidence: Math.min(0.85, 0.4 + (mpr - 18) * 0.05 + Math.max(realRate - 1, 0) * 0.08),
      summary: `MPR at ${mpr}% with real rate +${realRate.toFixed(1)}%. System liquidity is constrained. Banks benefit from wider NIM, growth stocks face compression.`,
    };
  }
  if (mpr >= 16 && realRate > 0) {
    return {
      name: "Moderate Liquidity",
      color: "YELLOW",
      confidence: Math.min(0.75, 0.35 + Math.abs(realRate) * 0.1),
      summary: `MPR at ${mpr}% is neutral to tight. Inflation at ${inflation}% keeps real rates marginally positive. Mixed signals for equities.`,
    };
  }
  if (realRate < -1) {
    return {
      name: "Loose Liquidity",
      color: "GREEN",
      confidence: Math.min(0.8, 0.4 + Math.abs(realRate) * 0.06),
      summary: `Negative real rates (${realRate.toFixed(1)}%) incentivise risk-taking. Equities and real assets benefit; fixed-income erodes in real terms.`,
    };
  }
  return {
    name: "Easing Cycle",
    color: "GREEN",
    confidence: 0.45,
    summary: `MPR at ${mpr}%. Monetary conditions are accommodative. Growth-oriented ETFs may outperform.`,
  };
}

const REGIME_SIGNALS: Record<RegimeType, Record<string, { signal: "BUY" | "HOLD" | "SELL"; confidence: number; reasoning: string }>> = {
  "Tight Liquidity": {
    VETBANK:    { signal: "BUY",  confidence: 0.85, reasoning: "Banks benefit from higher NIM in tight monetary policy" },
    VETGOODS:   { signal: "HOLD", confidence: 0.65, reasoning: "Consumer spending constrained by high rates" },
    VETINDETF:  { signal: "HOLD", confidence: 0.60, reasoning: "Industrial activity slows with tighter credit" },
    VSPBONDETF: { signal: "BUY",  confidence: 0.80, reasoning: "High yields make bonds attractive for income" },
    GREENWETF:  { signal: "HOLD", confidence: 0.65, reasoning: "Alpha constrained in tight liquidity" },
    MERGROWTH:  { signal: "SELL", confidence: 0.75, reasoning: "Growth stocks suffer from rate compression" },
    MERVALUE:   { signal: "BUY",  confidence: 0.80, reasoning: "Value factor outperforms in tightening cycles" },
  },
  "Moderate Liquidity": {
    VETBANK:    { signal: "HOLD", confidence: 0.60, reasoning: "Bank margins stable but no expansion catalyst" },
    VETGOODS:   { signal: "HOLD", confidence: 0.55, reasoning: "Consumer activity neutral" },
    VETINDETF:  { signal: "HOLD", confidence: 0.55, reasoning: "Industrials track broad economy" },
    VSPBONDETF: { signal: "BUY",  confidence: 0.70, reasoning: "Moderate yields still attractive vs inflation" },
    GREENWETF:  { signal: "HOLD", confidence: 0.55, reasoning: "Alpha generation average in neutral regime" },
    MERGROWTH:  { signal: "HOLD", confidence: 0.55, reasoning: "Growth neutral — no clear tailwind or headwind" },
    MERVALUE:   { signal: "HOLD", confidence: 0.60, reasoning: "Value modestly preferred" },
  },
  "Loose Liquidity": {
    VETBANK:    { signal: "HOLD", confidence: 0.55, reasoning: "Lower NIM in easing environment" },
    VETGOODS:   { signal: "BUY",  confidence: 0.75, reasoning: "Consumer spending recovers with cheaper credit" },
    VETINDETF:  { signal: "BUY",  confidence: 0.70, reasoning: "Industrial activity expands with cheaper financing" },
    VSPBONDETF: { signal: "SELL", confidence: 0.65, reasoning: "Low yields erode returns vs inflation" },
    GREENWETF:  { signal: "BUY",  confidence: 0.70, reasoning: "Alpha opportunities expand in risk-on environment" },
    MERGROWTH:  { signal: "BUY",  confidence: 0.80, reasoning: "Growth stocks benefit from liquidity tailwind" },
    MERVALUE:   { signal: "HOLD", confidence: 0.55, reasoning: "Value underperforms in liquidity-driven rally" },
  },
  "Easing Cycle": {
    VETBANK:    { signal: "HOLD", confidence: 0.50, reasoning: "Banks transition as rates adjust" },
    VETGOODS:   { signal: "BUY",  confidence: 0.65, reasoning: "Consumer confidence improving" },
    VETINDETF:  { signal: "BUY",  confidence: 0.65, reasoning: "Easing supports industrial capex" },
    VSPBONDETF: { signal: "HOLD", confidence: 0.55, reasoning: "Bond prices appreciate on rate cuts" },
    GREENWETF:  { signal: "HOLD", confidence: 0.55, reasoning: "Transitional regime for alpha" },
    MERGROWTH:  { signal: "BUY",  confidence: 0.70, reasoning: "Growth benefits from rate cuts" },
    MERVALUE:   { signal: "HOLD", confidence: 0.50, reasoning: "Value rotation fades" },
  },
};

export function computeEtfAllocation(macro: MacroData): EtfAllocationData {
  const regime = detectRegime(macro);
  const signals = REGIME_SIGNALS[regime.name];

  const etfSignals = NGX_ETFS.map((etf) => {
    const sig = signals[etf.symbol] || { signal: "HOLD" as const, confidence: 0.5, reasoning: "Insufficient data" };
    return {
      symbol: etf.symbol,
      name: etf.name,
      signal: sig.signal,
      confidence: sig.confidence,
      reasoning: sig.reasoning,
    };
  });

  const etfPrices = NGX_ETFS.map((etf) => ({
    symbol: etf.symbol,
    price: 0,
    change: 0,
  }));

  const regimeName = regime.name;
  const factorSignals = regimeName === "Tight Liquidity"
    ? [
        { factor: "Value", direction: "OVERWEIGHT" as const, reasoning: "Value outperforms in high-rate environments" },
        { factor: "Growth", direction: "UNDERWEIGHT" as const, reasoning: "Growth compressed by discount rate expansion" },
        { factor: "Income", direction: "OVERWEIGHT" as const, reasoning: "High yields reward income-seeking capital" },
      ]
    : regimeName === "Loose Liquidity"
    ? [
        { factor: "Value", direction: "UNDERWEIGHT" as const, reasoning: "Value underperforms in liquidity-driven markets" },
        { factor: "Growth", direction: "OVERWEIGHT" as const, reasoning: "Growth benefits from cheap capital and risk appetite" },
        { factor: "Income", direction: "NEUTRAL" as const, reasoning: "Income yields compress but remain relevant" },
      ]
    : [
        { factor: "Value", direction: "NEUTRAL" as const, reasoning: "No clear factor tilt in current regime" },
        { factor: "Growth", direction: "NEUTRAL" as const, reasoning: "Mixed macro signals" },
        { factor: "Income", direction: "NEUTRAL" as const, reasoning: "Moderate yields" },
      ];

  return {
    regime,
    etfSignals,
    etfPrices,
    factorSignals,
  };
}

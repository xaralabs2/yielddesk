import type { EtfAllocationData, MacroData } from "../types";

const NGX_ETFS: { symbol: string; name: string; role: string; price: number }[] = [
  { symbol: "VETBANK", name: "Vetiva Banking ETF", role: "sector", price: 15.50 },
  { symbol: "VETGOODS", name: "Vetiva Consumer Goods ETF", role: "sector", price: 8.75 },
  { symbol: "VETINDETF", name: "Vetiva Industrial ETF", role: "sector", price: 12.30 },
  { symbol: "VSPBONDETF", name: "Vetiva S&P Bond ETF", role: "defensive", price: 105.20 },
  { symbol: "GREENWETF", name: "Greenwich Alpha ETF", role: "alpha", price: 22.40 },
  { symbol: "MERGROWTH", name: "Meristem Growth ETF", role: "factor-growth", price: 18.60 },
  { symbol: "MERVALUE", name: "Meristem Value ETF", role: "factor-value", price: 14.90 },
];

type RegimeType = "Tight Liquidity" | "Moderate Liquidity" | "Loose Liquidity" | "Easing Cycle";

const REGIME_CODES: Record<RegimeType, string> = {
  "Tight Liquidity": "R2_TIGHT_LIQUIDITY",
  "Moderate Liquidity": "R3_MODERATE_LIQUIDITY",
  "Loose Liquidity": "R4_LOOSE_LIQUIDITY",
  "Easing Cycle": "R5_EASING_CYCLE",
};

function detectRegime(macro: MacroData): { name: RegimeType; code: string; color: EtfAllocationData["regime"]["color"]; confidence: number; summary: string } {
  const mpr = macro.mpr ?? 18;
  const inflation = macro.inflation ?? 15;
  const realRate = mpr - inflation;

  if (mpr >= 20 && realRate > 2) {
    const name: RegimeType = "Tight Liquidity";
    return {
      name,
      code: REGIME_CODES[name],
      color: "ORANGE",
      confidence: Math.min(0.85, 0.4 + (mpr - 18) * 0.05 + Math.max(realRate - 1, 0) * 0.08),
      summary: `High rates constraining liquidity. Overweight banks and bonds, underweight growth.`,
    };
  }
  if (mpr >= 16 && realRate > 0) {
    const name: RegimeType = "Moderate Liquidity";
    return {
      name,
      code: REGIME_CODES[name],
      color: "YELLOW",
      confidence: Math.min(0.75, 0.35 + Math.abs(realRate) * 0.1),
      summary: `MPR at ${mpr}% is neutral to tight. Inflation at ${inflation}% keeps real rates marginally positive. Mixed signals for equities.`,
    };
  }
  if (realRate < -1) {
    const name: RegimeType = "Loose Liquidity";
    return {
      name,
      code: REGIME_CODES[name],
      color: "GREEN",
      confidence: Math.min(0.8, 0.4 + Math.abs(realRate) * 0.06),
      summary: `Negative real rates (${realRate.toFixed(1)}%) incentivise risk-taking. Equities and real assets benefit; fixed-income erodes in real terms.`,
    };
  }
  const name: RegimeType = "Easing Cycle";
  return {
    name,
    code: REGIME_CODES[name],
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

const FACTOR_SIGNALS: Record<RegimeType, { growth: { signal: string; confidence: number; reasoning: string }; value: { signal: string; confidence: number; reasoning: string } }> = {
  "Tight Liquidity": {
    growth: { signal: "SELL", confidence: 0.80, reasoning: "Tight policy and high inflation compress growth multiples" },
    value: { signal: "BUY", confidence: 0.80, reasoning: "Value rotation — dividend yield and cash flow focus in tightening" },
  },
  "Moderate Liquidity": {
    growth: { signal: "HOLD", confidence: 0.55, reasoning: "Mixed macro signals for growth factor" },
    value: { signal: "HOLD", confidence: 0.60, reasoning: "Value modestly preferred in neutral regime" },
  },
  "Loose Liquidity": {
    growth: { signal: "BUY", confidence: 0.80, reasoning: "Cheap capital and risk appetite drive growth outperformance" },
    value: { signal: "SELL", confidence: 0.65, reasoning: "Value underperforms in liquidity-driven growth rally" },
  },
  "Easing Cycle": {
    growth: { signal: "BUY", confidence: 0.70, reasoning: "Rate cuts benefit growth multiples" },
    value: { signal: "HOLD", confidence: 0.50, reasoning: "Value rotation fading as rates decline" },
  },
};

export function computeEtfAllocation(macro: MacroData): EtfAllocationData {
  const regime = detectRegime(macro);
  const signals = REGIME_SIGNALS[regime.name];
  const regimeCode = regime.code;

  const etfSignals = NGX_ETFS.map((etf) => {
    const sig = signals[etf.symbol] || { signal: "HOLD" as const, confidence: 0.5, reasoning: "Insufficient data" };
    return {
      symbol: etf.symbol,
      name: etf.name,
      signal: sig.signal,
      confidence: sig.confidence,
      reasoning: sig.reasoning,
      role: etf.role,
      regime: regimeCode,
    };
  });

  const etfPrices = NGX_ETFS.map((etf) => ({
    symbol: etf.symbol,
    price: etf.price,
    change1d: 0,
  }));

  const factorConfig = FACTOR_SIGNALS[regime.name];
  const factorSignals = [
    {
      factorType: "GROWTH",
      signal: factorConfig.growth.signal,
      confidence: factorConfig.growth.confidence,
      reasoning: factorConfig.growth.reasoning,
      symbol: "MERGROWTH",
    },
    {
      factorType: "VALUE",
      signal: factorConfig.value.signal,
      confidence: factorConfig.value.confidence,
      reasoning: factorConfig.value.reasoning,
      symbol: "MERVALUE",
    },
  ];

  return {
    regime,
    etfSignals,
    etfPrices,
    factorSignals,
    lastUpdated: new Date().toISOString(),
  };
}

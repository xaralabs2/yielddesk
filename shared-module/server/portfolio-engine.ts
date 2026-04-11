import type { PortfolioHolding, PortfolioConfig, MacroData, PillarSummary, RebalanceAlert, PortfolioDashboard } from "../types";
import { fetchStockPrices, resolveNgxTickerSync } from "./stock-prices";

const DEFAULT_TARGETS = {
  stabilityTarget: 0.10,
  inflationTarget: 0.15,
  strategicTarget: 0.75,
  tolerance: 0.05,
};

const PILLAR_LABELS: Record<string, string> = {
  STABILITY: "Stability",
  INFLATION: "Inflation Hedge",
  STRATEGIC: "Strategic",
};

const NGX_COST_RATES = {
  brokerage: 0.0135,
  secFee: 0.003,
  nseFee: 0.003,
  cscsFee: 0.003,
  stampDuty: 0.00075,
};

const TOTAL_COMMISSION_RATE = NGX_COST_RATES.brokerage;
const TOTAL_FEE_RATE = NGX_COST_RATES.secFee + NGX_COST_RATES.nseFee + NGX_COST_RATES.cscsFee;
const TOTAL_TAX_RATE = NGX_COST_RATES.stampDuty;

function computeTransactionCosts(holdings: PortfolioHolding[]) {
  let totalCommissions = 0;
  let totalFees = 0;
  let totalTaxes = 0;

  for (const h of holdings) {
    if (h.ticker && h.pillar !== "STRATEGIC") {
      const consideration = h.valueNgn;
      totalCommissions += consideration * TOTAL_COMMISSION_RATE;
      totalFees += consideration * TOTAL_FEE_RATE;
      totalTaxes += consideration * TOTAL_TAX_RATE;
    }
  }

  return {
    totalCommissions: parseFloat(totalCommissions.toFixed(2)),
    totalFees: parseFloat(totalFees.toFixed(2)),
    totalTaxes: parseFloat(totalTaxes.toFixed(2)),
  };
}

const REBALANCE_ACTIONS: Record<string, { over: string; under: string }> = {
  STABILITY: {
    over: "Deploy excess liquidity into productive assets (equities, bonds) or strategic deals",
    under: "Refill cash reserves — sell gains from Inflation or Strategic pillars",
  },
  INFLATION: {
    over: "Harvest gains and rotate into Stability or Strategic positions",
    under: "Increase exposure to inflation-linked assets (banks, cement, energy equities)",
  },
  STRATEGIC: {
    over: "Consider partial exits or rebalance into more liquid positions",
    under: "Allocate to property, SPVs, or private deals when opportunities arise",
  },
};

function computeRealReturn(nominalReturn: number, inflationRate: number): number {
  const real = ((1 + nominalReturn / 100) / (1 + inflationRate / 100) - 1) * 100;
  return parseFloat(real.toFixed(2));
}

function macroAdjustStrategicValue(
  holding: PortfolioHolding,
  currentInflation: number,
  currentFxRate: number
): number {
  const baseValue = holding.valueNgn;
  if (holding.pillar !== "STRATEGIC" || !holding.lastUpdated) return baseValue;

  const now = Date.now();
  const lastUpdated = new Date(holding.lastUpdated).getTime();
  const daysSince = (now - lastUpdated) / (1000 * 60 * 60 * 24);
  if (daysSince < 1) return baseValue;

  const annualInflation = currentInflation / 100;
  const inflationFactor = 1 + annualInflation * (daysSince / 365);

  let fxFactor = 1;
  if (holding.entryFxRate && holding.entryFxRate > 0 && currentFxRate > 0) {
    fxFactor = currentFxRate / holding.entryFxRate;
  }

  const macroAdjusted = baseValue * inflationFactor * fxFactor;

  return parseFloat(macroAdjusted.toFixed(2));
}

export function computeRentalYield(holding: PortfolioHolding): number | null {
  if (!holding.annualRentNgn || holding.annualRentNgn <= 0 || holding.valueNgn <= 0) return null;
  return parseFloat(((holding.annualRentNgn / holding.valueNgn) * 100).toFixed(2));
}

export function computeCumulativeRent(holding: PortfolioHolding): number {
  if (!holding.annualRentNgn || holding.annualRentNgn <= 0 || !holding.entryDate) return holding.cumulativeRentNgn ?? 0;
  const now = Date.now();
  const entryTime = new Date(holding.entryDate).getTime();
  const yearsSince = (now - entryTime) / (1000 * 60 * 60 * 24 * 365);
  if (yearsSince <= 0) return 0;
  return parseFloat((holding.annualRentNgn * yearsSince).toFixed(2));
}

export function computeStrategicIRR(holding: PortfolioHolding, currentValue: number): number | null {
  if (!holding.entryDate) return null;
  const entryValue = holding.entryValueNgn ?? holding.valueNgn;
  if (entryValue <= 0) return null;
  const cumulativeRent = computeCumulativeRent(holding);
  const totalReturn = currentValue + cumulativeRent;
  const now = Date.now();
  const entryTime = new Date(holding.entryDate).getTime();
  const years = (now - entryTime) / (1000 * 60 * 60 * 24 * 365);
  if (years < 0.01) return null;
  const irr = (Math.pow(totalReturn / entryValue, 1 / years) - 1) * 100;
  return parseFloat(irr.toFixed(2));
}

export async function computePortfolioDashboard(
  holdings: PortfolioHolding[],
  config: PortfolioConfig | undefined,
  latestMacro: MacroData | undefined
): Promise<PortfolioDashboard> {
  const targets = config
    ? {
        stabilityTarget: config.stabilityTarget,
        inflationTarget: config.inflationTarget,
        strategicTarget: config.strategicTarget,
        tolerance: config.tolerance,
      }
    : DEFAULT_TARGETS;

  const baselineValue = config?.baselineValue ?? 0;
  const inflation = latestMacro?.inflation ?? 0;
  const fxRate = latestMacro?.fxRate ?? 0;

  const pillarTargetMap: Record<string, number> = {
    STABILITY: targets.stabilityTarget,
    INFLATION: targets.inflationTarget,
    STRATEGIC: targets.strategicTarget,
  };

  const tickerMap = new Map<string, string>();
  const tickersToFetch: string[] = [];
  for (const h of holdings) {
    if (h.ticker && h.shares && h.shares > 0 && h.pillar !== "STRATEGIC") {
      const resolved = resolveNgxTickerSync(h.ticker) || h.ticker.toUpperCase();
      tickerMap.set(h.ticker.toUpperCase(), resolved);
      tickersToFetch.push(resolved);
    }
  }

  let livePrices = new Map<string, number>();
  try {
    livePrices = await fetchStockPrices([...new Set(tickersToFetch)]);
  } catch (err) {
  }

  const adjustedHoldings = holdings.map((h) => {
    if (h.pillar === "STRATEGIC") {
      const adjustedValue = macroAdjustStrategicValue(h, inflation, fxRate);
      const cumulativeRent = computeCumulativeRent(h);
      const irr = computeStrategicIRR(h, adjustedValue);
      return { ...h, valueNgn: adjustedValue, cumulativeRentNgn: cumulativeRent, strategicIrr: irr };
    }

    if (h.ticker && h.shares && h.shares > 0) {
      const resolvedSym = tickerMap.get(h.ticker.toUpperCase()) || h.ticker.toUpperCase();
      const livePrice = livePrices.get(resolvedSym);
      if (livePrice) {
        const liveValue = parseFloat((h.shares * livePrice).toFixed(2));
        const costBasis = h.entryValueNgn ?? h.valueNgn;
        const gainLossPct = costBasis > 0 ? parseFloat(((liveValue - costBasis) / costBasis * 100).toFixed(2)) : null;
        return { ...h, valueNgn: liveValue, gainLossPct, ticker: resolvedSym, asset: resolvedSym, livePrice };
      }
      return { ...h, gainLossPct: null as number | null, ticker: resolvedSym, asset: resolvedSym, livePrice: null as number | null };
    }

    return { ...h, gainLossPct: null as number | null };
  });

  const totalValue = adjustedHoldings.reduce((sum, h) => sum + h.valueNgn, 0);

  const pillarGroups: Record<string, PortfolioHolding[]> = {};
  for (const h of adjustedHoldings) {
    if (!pillarGroups[h.pillar]) pillarGroups[h.pillar] = [];
    pillarGroups[h.pillar].push(h);
  }

  const pillars: PillarSummary[] = ["STABILITY", "INFLATION", "STRATEGIC"].map((pillar) => {
    const group = pillarGroups[pillar] || [];
    const value = group.reduce((sum, h) => sum + h.valueNgn, 0);
    const weight = totalValue > 0 ? value / totalValue : 0;
    const target = pillarTargetMap[pillar] ?? 0;
    const drift = weight - target;

    return {
      pillar: PILLAR_LABELS[pillar] || pillar,
      value,
      weight,
      target,
      drift,
      holdings: group.map((h) => ({ asset: h.asset, value: h.valueNgn })),
    };
  });

  const alerts: RebalanceAlert[] = [];
  for (const ps of pillars) {
    if (Math.abs(ps.drift) > targets.tolerance) {
      const pillarKey = Object.keys(PILLAR_LABELS).find((k) => PILLAR_LABELS[k] === ps.pillar) || ps.pillar;
      const direction = ps.drift > 0 ? "over" : "under";
      const actions = REBALANCE_ACTIONS[pillarKey];
      alerts.push({
        pillar: ps.pillar,
        drift: ps.drift,
        direction,
        action: actions ? actions[direction] : `Rebalance ${ps.pillar}`,
      });
    }
  }

  const nominalReturn = baselineValue > 0
    ? ((totalValue - baselineValue) / baselineValue) * 100
    : 0;

  const realReturn = baselineValue > 0
    ? computeRealReturn(nominalReturn, inflation)
    : 0;

  const costs = computeTransactionCosts(adjustedHoldings);

  return {
    totalValue,
    baselineValue,
    targetValue: config?.targetValue ?? 0,
    nominalReturn: parseFloat(nominalReturn.toFixed(2)),
    realReturn,
    currentInflation: inflation,
    pillars,
    alerts,
    holdings: adjustedHoldings,
    config: targets,
    availableCash: config?.availableCash ?? 0,
    totalCommissions: costs.totalCommissions,
    totalFees: costs.totalFees,
    totalTaxes: costs.totalTaxes,
    fxRate,
  };
}

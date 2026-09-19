export type WealthStrategy = "PRESERVE" | "BALANCED" | "GROWTH" | "INCOME";
export type WealthHorizon = "SHORT" | "MEDIUM" | "LONG";

export type WealthBuilderInput = {
  goal: string;
  totalSpendNgn: number;
  horizon: WealthHorizon;
  strategy: WealthStrategy;
};

export type WealthAllocation = {
  key: string;
  label: string;
  percentage: number;
  amountNgn: number;
  purpose: string;
};

type AllocationTemplate = Omit<WealthAllocation, "amountNgn">;

const LIMITATION =
  "This is a user-selected hypothetical model for education and simulation. It is not a personal investment recommendation, suitability determination, brokerage instruction, or promise of return.";

export const WEALTH_MODELS: Record<WealthStrategy, {
  name: string;
  summary: string;
  allocations: AllocationTemplate[];
}> = {
  PRESERVE: {
    name: "Capital preservation model",
    summary: "Emphasizes liquidity and lower-volatility Nigerian fixed-income instruments.",
    allocations: [
      { key: "MMF", label: "Regulated money market funds", percentage: 35, purpose: "Liquidity and short-duration income" },
      { key: "TBILLS", label: "Nigerian Treasury Bills", percentage: 30, purpose: "Sovereign short-term income" },
      { key: "FGN_BONDS", label: "FGN bonds", percentage: 25, purpose: "Longer-duration sovereign income" },
      { key: "NGX_EQUITIES", label: "Diversified NGX equities", percentage: 5, purpose: "Limited long-term growth exposure" },
      { key: "CASH", label: "Cash reserve", percentage: 5, purpose: "Fees, near-term needs and flexibility" },
    ],
  },
  BALANCED: {
    name: "Balanced wealth model",
    summary: "Combines Nigerian growth assets, sovereign income and liquidity.",
    allocations: [
      { key: "NGX_EQUITIES", label: "Diversified NGX equities", percentage: 30, purpose: "Capital growth and dividend potential" },
      { key: "FGN_BONDS", label: "FGN bonds", percentage: 20, purpose: "Longer-duration income" },
      { key: "TBILLS", label: "Nigerian Treasury Bills", percentage: 20, purpose: "Short-term sovereign income" },
      { key: "MMF", label: "Regulated money market funds", percentage: 20, purpose: "Liquidity and income" },
      { key: "REAL_ASSETS", label: "Strategic real assets", percentage: 5, purpose: "Long-duration inflation sensitivity" },
      { key: "CASH", label: "Cash reserve", percentage: 5, purpose: "Fees, near-term needs and flexibility" },
    ],
  },
  GROWTH: {
    name: "Growth-first model",
    summary: "Places more of the user-selected budget in Nigerian growth assets while retaining stabilizers.",
    allocations: [
      { key: "NGX_EQUITIES", label: "Diversified NGX equities", percentage: 50, purpose: "Primary long-term growth exposure" },
      { key: "REAL_ASSETS", label: "Strategic real assets", percentage: 15, purpose: "Long-duration growth and inflation sensitivity" },
      { key: "FGN_BONDS", label: "FGN bonds", percentage: 10, purpose: "Portfolio income and stability" },
      { key: "TBILLS", label: "Nigerian Treasury Bills", percentage: 10, purpose: "Short-term sovereign income" },
      { key: "MMF", label: "Regulated money market funds", percentage: 10, purpose: "Liquidity and income" },
      { key: "CASH", label: "Cash reserve", percentage: 5, purpose: "Fees, near-term needs and flexibility" },
    ],
  },
  INCOME: {
    name: "Income-first model",
    summary: "Emphasizes sovereign income, liquidity and dividend-oriented equity exposure.",
    allocations: [
      { key: "FGN_BONDS", label: "FGN bonds", percentage: 30, purpose: "Core longer-duration income" },
      { key: "TBILLS", label: "Nigerian Treasury Bills", percentage: 25, purpose: "Short-term sovereign income" },
      { key: "MMF", label: "Regulated money market funds", percentage: 20, purpose: "Liquidity and income" },
      { key: "DIVIDEND_EQUITIES", label: "Diversified dividend-oriented NGX equities", percentage: 20, purpose: "Dividend and capital-growth potential" },
      { key: "CASH", label: "Cash reserve", percentage: 5, purpose: "Fees, near-term needs and flexibility" },
    ],
  },
};

export function buildWealthPlan(input: WealthBuilderInput) {
  const model = WEALTH_MODELS[input.strategy];
  let assigned = 0;
  const allocations: WealthAllocation[] = model.allocations.map((allocation, index) => {
    const isLast = index === model.allocations.length - 1;
    const amountNgn = isLast
      ? Math.round(input.totalSpendNgn - assigned)
      : Math.round((input.totalSpendNgn * allocation.percentage) / 100);
    assigned += amountNgn;
    return { ...allocation, amountNgn };
  });

  const horizonNote: Record<WealthHorizon, string> = {
    SHORT: "A short horizon can make growth assets more volatile relative to the time available.",
    MEDIUM: "A medium horizon may allow a mixture of growth, income and liquidity.",
    LONG: "A long horizon provides more time for compounding but does not remove market risk.",
  };

  return {
    goal: input.goal.trim(),
    totalSpendNgn: input.totalSpendNgn,
    horizon: input.horizon,
    strategy: input.strategy,
    modelName: model.name,
    modelSummary: model.summary,
    methodologyVersion: "ng-v1",
    allocations,
    assumptions: [
      "Nigeria-first model using broad asset categories rather than individual securities.",
      "Amounts are rounded to the nearest naira and always reconcile to the entered budget.",
      "Fees, taxes, inflation, FX movements and product minimums are not yet deducted.",
      horizonNote[input.horizon],
    ],
    limitation: LIMITATION,
    simulated: true as const,
  };
}

export { LIMITATION as WEALTH_BUILDER_LIMITATION };

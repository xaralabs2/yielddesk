interface DecisionInput {
  cpRate: number;
  bondYield: number;
  totalCapital: number;
}

interface DecisionOutput {
  action: "INVEST_CP" | "LOCK_BONDS" | "HOLD_MMMF";
  amount: number;
  reason: string;
  confidence: "HIGH" | "MEDIUM" | "LOW";
  currentCpRate: number;
  currentBondYield: number;
  timestamp: Date;
}

export function evaluateDecision(input: DecisionInput): DecisionOutput {
  const { cpRate, bondYield, totalCapital } = input;

  if (cpRate >= 18) {
    return {
      action: "INVEST_CP",
      amount: Math.round(totalCapital * 0.6),
      reason: `CP rate at ${cpRate}% exceeds 18% threshold — strong commercial paper opportunity`,
      confidence: cpRate >= 22 ? "HIGH" : cpRate >= 20 ? "MEDIUM" : "LOW",
      currentCpRate: cpRate,
      currentBondYield: bondYield,
      timestamp: new Date(),
    };
  }

  if (bondYield >= 17) {
    return {
      action: "LOCK_BONDS",
      amount: Math.round(totalCapital * 0.5),
      reason: `Bond yield at ${bondYield}% exceeds 17% threshold — favorable lock-in opportunity`,
      confidence: bondYield >= 20 ? "HIGH" : bondYield >= 18 ? "MEDIUM" : "LOW",
      currentCpRate: cpRate,
      currentBondYield: bondYield,
      timestamp: new Date(),
    };
  }

  return {
    action: "HOLD_MMMF",
    amount: totalCapital,
    reason: `CP rate (${cpRate}%) and bond yield (${bondYield}%) below thresholds — hold in money market`,
    confidence: "HIGH",
    currentCpRate: cpRate,
    currentBondYield: bondYield,
    timestamp: new Date(),
  };
}

interface DealInfo {
  issuer: string;
  rate: number;
  tenorDays: number;
  riskLevel: string;
}

interface DecisionInput {
  cpRate: number;
  bondYield: number;
  totalCapital: number;
  availableDeals?: DealInfo[];
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
  const { cpRate, bondYield, totalCapital, availableDeals = [] } = input;

  const cpDeals = availableDeals
    .filter((d) => d.rate >= 18)
    .sort((a, b) => b.rate - a.rate);
  const bestCpDeal = cpDeals[0];

  const effectiveCpRate = bestCpDeal ? Math.max(cpRate, bestCpDeal.rate) : cpRate;

  if (effectiveCpRate >= 18) {
    const fromDeal = bestCpDeal && bestCpDeal.rate > cpRate;
    const rateSource = fromDeal
      ? `${bestCpDeal.issuer} deal at ${bestCpDeal.rate}% (${bestCpDeal.tenorDays}d, ${bestCpDeal.riskLevel} risk)`
      : `market CP rate at ${cpRate}%`;

    const dealCount = cpDeals.length;
    const dealNote = dealCount > 1
      ? ` — ${dealCount} deals above threshold`
      : "";

    return {
      action: "INVEST_CP",
      amount: Math.round(totalCapital * 0.6),
      reason: `${rateSource} exceeds 18% threshold — strong commercial paper opportunity${dealNote}`,
      confidence: effectiveCpRate >= 22 ? "HIGH" : effectiveCpRate >= 20 ? "MEDIUM" : "LOW",
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

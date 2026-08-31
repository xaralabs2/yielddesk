import type {
  EquityValuationInput,
  EquityValuationResult,
  IntelligenceDecision,
} from "../types/market-intelligence";

function assertFinitePositive(value: number, name: string): void {
  if (!Number.isFinite(value) || value <= 0) {
    throw new Error(`${name} must be a finite number greater than zero`);
  }
}

function round(value: number, decimals = 2): number {
  const factor = 10 ** decimals;
  return Math.round(value * factor) / factor;
}

export function evaluateEquityValuation(
  input: EquityValuationInput,
): EquityValuationResult {
  assertFinitePositive(input.currentPrice, "currentPrice");
  assertFinitePositive(input.normalizedEps, "normalizedEps");
  assertFinitePositive(input.conservativeMultiple, "conservativeMultiple");
  assertFinitePositive(input.fairMultiple, "fairMultiple");
  assertFinitePositive(input.optimisticMultiple, "optimisticMultiple");
  assertFinitePositive(input.downsideMultiple, "downsideMultiple");
  assertFinitePositive(input.horizonYears, "horizonYears");

  if (input.dataConfidence < 0 || input.dataConfidence > 100) {
    throw new Error("dataConfidence must be between 0 and 100");
  }

  const downsideValue = input.normalizedEps * input.downsideMultiple;
  const preferredEntryPrice = input.normalizedEps * input.conservativeMultiple;
  const fairValue = input.normalizedEps * input.fairMultiple;
  const optimisticValue = input.normalizedEps * input.optimisticMultiple;
  const projectedEps =
    input.normalizedEps * (1 + input.expectedEpsGrowth) ** input.horizonYears;
  const projectedExitPrice = projectedEps * input.fairMultiple;
  const projectedDividends = input.annualDividend * input.horizonYears;
  const projectedEndingValue = projectedExitPrice + projectedDividends;
  const expectedAnnualizedReturn =
    (projectedEndingValue / input.currentPrice) ** (1 / input.horizonYears) - 1;

  let decision: IntelligenceDecision;
  const decisionRationale: string[] = [];

  if (input.dataConfidence < 70 || input.provenance.length === 0) {
    decision = "INSUFFICIENT_EVIDENCE";
    decisionRationale.push(
      "Evidence confidence is below the decision threshold or provenance is missing.",
    );
  } else if (input.currentPrice <= preferredEntryPrice) {
    decision = "ACCUMULATE";
    decisionRationale.push(
      "Market price is at or below the conservative preferred entry price.",
    );
  } else if (
    input.currentPrice <= fairValue &&
    expectedAnnualizedReturn >= input.minimumRequiredReturn
  ) {
    decision = "ACCUMULATE";
    decisionRationale.push(
      "Price is below fair value and modeled return meets the required return.",
    );
  } else if (input.currentPrice <= optimisticValue) {
    decision = "WATCH";
    decisionRationale.push(
      "The asset is credible, but the current price does not provide enough margin of safety.",
    );
  } else {
    decision = "AVOID";
    decisionRationale.push(
      "Current price exceeds the optimistic valuation boundary.",
    );
  }

  if (expectedAnnualizedReturn < input.minimumRequiredReturn) {
    decisionRationale.push(
      "Modeled annualized return is below the investor's required return.",
    );
  }

  if (input.unresolvedDiligence.length > 0) {
    decisionRationale.push(
      "Unresolved diligence prevents the output from becoming actionable.",
    );
  }

  return {
    instrument: input.instrument,
    currentPrice: round(input.currentPrice),
    trailingOrForwardMultiple: round(
      input.currentPrice / input.normalizedEps,
    ),
    dividendYield: round(input.annualDividend / input.currentPrice, 4),
    downsideValue: round(downsideValue),
    preferredEntryPrice: round(preferredEntryPrice),
    fairValue: round(fairValue),
    optimisticValue: round(optimisticValue),
    marginOfSafetyToFairValue: round(
      (fairValue - input.currentPrice) / fairValue,
      4,
    ),
    expectedAnnualizedReturn: round(expectedAnnualizedReturn, 4),
    decision,
    decisionRationale,
    dataConfidence: input.dataConfidence,
    unresolvedDiligence: input.unresolvedDiligence,
    humanApprovalRequired: true,
    actionable: false,
  };
}

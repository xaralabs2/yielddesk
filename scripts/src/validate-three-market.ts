import { evaluateEquityValuation } from "../../shared-module/server/equity-valuation-engine";
import { homeDepotQ2Fiscal2026Fixture } from "../../shared-module/server/fixtures/home-depot-q2-2026";

const result = evaluateEquityValuation(homeDepotQ2Fiscal2026Fixture);

if (result.decision !== "WATCH") {
  throw new Error(`Expected WATCH decision, received ${result.decision}`);
}

if (result.preferredEntryPrice !== 300) {
  throw new Error(
    `Expected preferred entry price of 300, received ${result.preferredEntryPrice}`,
  );
}

if (result.fairValue !== 330) {
  throw new Error(`Expected fair value of 330, received ${result.fairValue}`);
}

if (result.actionable !== false || result.humanApprovalRequired !== true) {
  throw new Error("Investment output must remain non-actionable and human-approved");
}

console.log(
  JSON.stringify(
    {
      market: result.instrument.market,
      symbol: result.instrument.symbol,
      decision: result.decision,
      preferredEntryPrice: result.preferredEntryPrice,
      fairValue: result.fairValue,
      expectedAnnualizedReturn: result.expectedAnnualizedReturn,
      actionable: result.actionable,
    },
    null,
    2,
  ),
);

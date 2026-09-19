import assert from "node:assert/strict";
import test from "node:test";
import { buildWealthPlan, WEALTH_MODELS, type WealthStrategy } from "./wealth-builder-engine";

test("every wealth model totals 100 percent", () => {
  for (const model of Object.values(WEALTH_MODELS)) {
    assert.equal(
      model.allocations.reduce((sum, allocation) => sum + allocation.percentage, 0),
      100,
    );
  }
});

test("fractional-naira budgets are rejected", () => {
  assert.throws(
    () =>
      buildWealthPlan({
        goal: "Build long-term wealth",
        totalSpendNgn: 10_000.5,
        horizon: "LONG",
        strategy: "GROWTH",
      }),
    /whole-naira/i,
  );
});

test("allocation amounts reconcile exactly to the user-entered budget", () => {
  for (const strategy of Object.keys(WEALTH_MODELS) as WealthStrategy[]) {
    const plan = buildWealthPlan({
      goal: "Build long-term wealth",
      totalSpendNgn: 1_234_567,
      horizon: "LONG",
      strategy,
    });

    assert.equal(
      plan.allocations.reduce((sum, allocation) => sum + allocation.amountNgn, 0),
      1_234_567,
    );
    assert.equal(plan.simulated, true);
    assert.match(plan.limitation, /not a personal investment recommendation/i);
  }
});

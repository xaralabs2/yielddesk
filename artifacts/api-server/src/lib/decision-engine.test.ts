import { describe, it, expect } from "vitest";
import { evaluateDecision } from "./decision-engine";

describe("evaluateDecision", () => {
  const base = { cpRate: 10, bondYield: 10, totalCapital: 100_000_000 };

  describe("INVEST_CP action", () => {
    it("triggers when CP rate >= 18%", () => {
      const result = evaluateDecision({ ...base, cpRate: 18 });
      expect(result.action).toBe("INVEST_CP");
      expect(result.amount).toBe(60_000_000);
    });

    it("triggers when a deal rate exceeds threshold even if market rate is below", () => {
      const result = evaluateDecision({
        ...base,
        cpRate: 15,
        availableDeals: [{ issuer: "Test Corp", rate: 20, tenorDays: 90, riskLevel: "Low" }],
      });
      expect(result.action).toBe("INVEST_CP");
      expect(result.reason).toContain("Test Corp");
    });

    it("returns HIGH confidence when effective rate >= 22%", () => {
      const result = evaluateDecision({ ...base, cpRate: 22 });
      expect(result.confidence).toBe("HIGH");
    });

    it("returns MEDIUM confidence when effective rate >= 20% but < 22%", () => {
      const result = evaluateDecision({ ...base, cpRate: 20 });
      expect(result.confidence).toBe("MEDIUM");
    });

    it("returns LOW confidence when effective rate >= 18% but < 20%", () => {
      const result = evaluateDecision({ ...base, cpRate: 18 });
      expect(result.confidence).toBe("LOW");
    });

    it("allocates 60% of capital", () => {
      const result = evaluateDecision({ ...base, cpRate: 20, totalCapital: 50_000_000 });
      expect(result.amount).toBe(30_000_000);
    });

    it("mentions deal count when multiple deals exceed threshold", () => {
      const result = evaluateDecision({
        ...base,
        cpRate: 15,
        availableDeals: [
          { issuer: "A", rate: 20, tenorDays: 90, riskLevel: "Low" },
          { issuer: "B", rate: 19, tenorDays: 60, riskLevel: "Medium" },
        ],
      });
      expect(result.reason).toContain("2 deals");
    });
  });

  describe("LOCK_BONDS action", () => {
    it("triggers when bond yield >= 17% and CP rate < 18%", () => {
      const result = evaluateDecision({ ...base, cpRate: 15, bondYield: 17 });
      expect(result.action).toBe("LOCK_BONDS");
      expect(result.amount).toBe(50_000_000);
    });

    it("returns HIGH confidence when bond yield >= 20%", () => {
      const result = evaluateDecision({ ...base, cpRate: 15, bondYield: 20 });
      expect(result.confidence).toBe("HIGH");
    });

    it("returns MEDIUM confidence when bond yield >= 18% but < 20%", () => {
      const result = evaluateDecision({ ...base, cpRate: 15, bondYield: 18 });
      expect(result.confidence).toBe("MEDIUM");
    });

    it("returns LOW confidence when bond yield >= 17% but < 18%", () => {
      const result = evaluateDecision({ ...base, cpRate: 15, bondYield: 17 });
      expect(result.confidence).toBe("LOW");
    });

    it("allocates 50% of capital", () => {
      const result = evaluateDecision({ ...base, cpRate: 15, bondYield: 17, totalCapital: 80_000_000 });
      expect(result.amount).toBe(40_000_000);
    });
  });

  describe("HOLD_MMMF action", () => {
    it("triggers when both rates are below thresholds", () => {
      const result = evaluateDecision({ ...base, cpRate: 15, bondYield: 15 });
      expect(result.action).toBe("HOLD_MMMF");
      expect(result.amount).toBe(100_000_000);
    });

    it("always returns HIGH confidence", () => {
      const result = evaluateDecision({ ...base, cpRate: 10, bondYield: 10 });
      expect(result.confidence).toBe("HIGH");
    });

    it("returns the full capital amount", () => {
      const result = evaluateDecision({ cpRate: 5, bondYield: 5, totalCapital: 200_000_000 });
      expect(result.amount).toBe(200_000_000);
    });
  });

  describe("CP takes priority over bonds", () => {
    it("favors INVEST_CP when both thresholds are met", () => {
      const result = evaluateDecision({ ...base, cpRate: 20, bondYield: 19 });
      expect(result.action).toBe("INVEST_CP");
    });
  });

  describe("output structure", () => {
    it("includes all required fields", () => {
      const result = evaluateDecision(base);
      expect(result).toHaveProperty("action");
      expect(result).toHaveProperty("amount");
      expect(result).toHaveProperty("reason");
      expect(result).toHaveProperty("confidence");
      expect(result).toHaveProperty("currentCpRate");
      expect(result).toHaveProperty("currentBondYield");
      expect(result).toHaveProperty("timestamp");
      expect(result.timestamp).toBeInstanceOf(Date);
    });

    it("passes through input rates", () => {
      const result = evaluateDecision({ cpRate: 12, bondYield: 14, totalCapital: 50_000_000 });
      expect(result.currentCpRate).toBe(12);
      expect(result.currentBondYield).toBe(14);
    });
  });
});

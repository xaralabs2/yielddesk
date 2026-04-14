import { describe, it, expect } from "vitest";
import { computeEtfAllocation } from "./etf-engine";

describe("computeEtfAllocation", () => {
  describe("regime detection", () => {
    it("detects Tight Liquidity when MPR >= 20 and real rate > 2", () => {
      const result = computeEtfAllocation({ mpr: 22, inflation: 15 });
      expect(result.regime.name).toBe("Tight Liquidity");
      expect(result.regime.color).toBe("ORANGE");
    });

    it("detects Moderate Liquidity when MPR >= 16 and real rate > 0", () => {
      const result = computeEtfAllocation({ mpr: 18, inflation: 16 });
      expect(result.regime.name).toBe("Moderate Liquidity");
      expect(result.regime.color).toBe("YELLOW");
    });

    it("detects Loose Liquidity when real rate < -1", () => {
      const result = computeEtfAllocation({ mpr: 12, inflation: 20 });
      expect(result.regime.name).toBe("Loose Liquidity");
      expect(result.regime.color).toBe("GREEN");
    });

    it("detects Easing Cycle as default", () => {
      const result = computeEtfAllocation({ mpr: 14, inflation: 14.5 });
      expect(result.regime.name).toBe("Easing Cycle");
      expect(result.regime.color).toBe("GREEN");
    });

    it("uses default values when macro data is partially missing", () => {
      const result = computeEtfAllocation({});
      expect(result.regime.name).toBeDefined();
      expect(result.regime.confidence).toBeGreaterThan(0);
    });
  });

  describe("ETF signals", () => {
    it("returns signals for all 7 NGX ETFs", () => {
      const result = computeEtfAllocation({ mpr: 22, inflation: 15 });
      expect(result.etfSignals).toHaveLength(7);
    });

    it("assigns BUY to VETBANK in Tight Liquidity", () => {
      const result = computeEtfAllocation({ mpr: 22, inflation: 15 });
      const vetbank = result.etfSignals.find(s => s.symbol === "VETBANK");
      expect(vetbank?.signal).toBe("BUY");
    });

    it("assigns SELL to MERGROWTH in Tight Liquidity", () => {
      const result = computeEtfAllocation({ mpr: 22, inflation: 15 });
      const mergrowth = result.etfSignals.find(s => s.symbol === "MERGROWTH");
      expect(mergrowth?.signal).toBe("SELL");
    });

    it("assigns BUY to VETGOODS in Loose Liquidity", () => {
      const result = computeEtfAllocation({ mpr: 12, inflation: 20 });
      const vetgoods = result.etfSignals.find(s => s.symbol === "VETGOODS");
      expect(vetgoods?.signal).toBe("BUY");
    });

    it("assigns SELL to VSPBONDETF in Loose Liquidity", () => {
      const result = computeEtfAllocation({ mpr: 12, inflation: 20 });
      const bond = result.etfSignals.find(s => s.symbol === "VSPBONDETF");
      expect(bond?.signal).toBe("SELL");
    });

    it("each signal has confidence between 0 and 1", () => {
      const result = computeEtfAllocation({ mpr: 18, inflation: 16 });
      result.etfSignals.forEach(sig => {
        expect(sig.confidence).toBeGreaterThanOrEqual(0);
        expect(sig.confidence).toBeLessThanOrEqual(1);
      });
    });

    it("each signal includes reasoning text", () => {
      const result = computeEtfAllocation({ mpr: 18, inflation: 16 });
      result.etfSignals.forEach(sig => {
        expect(sig.reasoning).toBeTruthy();
        expect(typeof sig.reasoning).toBe("string");
      });
    });
  });

  describe("factor signals", () => {
    it("returns both GROWTH and VALUE factor signals", () => {
      const result = computeEtfAllocation({ mpr: 22, inflation: 15 });
      expect(result.factorSignals).toHaveLength(2);
      expect(result.factorSignals.map(f => f.factorType)).toEqual(["GROWTH", "VALUE"]);
    });

    it("favors VALUE over GROWTH in Tight Liquidity", () => {
      const result = computeEtfAllocation({ mpr: 22, inflation: 15 });
      const growth = result.factorSignals.find(f => f.factorType === "GROWTH");
      const value = result.factorSignals.find(f => f.factorType === "VALUE");
      expect(growth?.signal).toBe("SELL");
      expect(value?.signal).toBe("BUY");
    });

    it("favors GROWTH over VALUE in Loose Liquidity", () => {
      const result = computeEtfAllocation({ mpr: 12, inflation: 20 });
      const growth = result.factorSignals.find(f => f.factorType === "GROWTH");
      const value = result.factorSignals.find(f => f.factorType === "VALUE");
      expect(growth?.signal).toBe("BUY");
      expect(value?.signal).toBe("SELL");
    });
  });

  describe("ETF prices", () => {
    it("returns price data for all ETFs", () => {
      const result = computeEtfAllocation({ mpr: 18, inflation: 16 });
      expect(result.etfPrices).toHaveLength(7);
      result.etfPrices.forEach(p => {
        expect(p.price).toBeGreaterThan(0);
      });
    });
  });

  describe("regime confidence", () => {
    it("caps confidence below 1.0", () => {
      const result = computeEtfAllocation({ mpr: 30, inflation: 10 });
      expect(result.regime.confidence).toBeLessThanOrEqual(1);
    });

    it("Tight Liquidity confidence increases with higher MPR", () => {
      const low = computeEtfAllocation({ mpr: 20, inflation: 15 });
      const high = computeEtfAllocation({ mpr: 25, inflation: 15 });
      expect(high.regime.confidence).toBeGreaterThanOrEqual(low.regime.confidence);
    });
  });

  describe("output structure", () => {
    it("includes lastUpdated timestamp", () => {
      const result = computeEtfAllocation({ mpr: 18, inflation: 16 });
      expect(result.lastUpdated).toBeTruthy();
      expect(new Date(result.lastUpdated).getTime()).toBeGreaterThan(0);
    });

    it("includes regime code", () => {
      const result = computeEtfAllocation({ mpr: 22, inflation: 15 });
      expect(result.regime.code).toContain("TIGHT");
    });
  });
});

import type { EquityValuationInput } from "../../types/market-intelligence";

export const homeDepotQ2Fiscal2026Fixture: EquityValuationInput = {
  instrument: {
    id: "us-nyse-hd",
    market: "US",
    nativeCurrency: "USD",
    assetClass: "EQUITY",
    symbol: "HD",
    name: "The Home Depot, Inc.",
    venue: "NYSE",
    liquidity: "HIGH",
    executionMode: "SIMULATION_ONLY",
  },
  currentPrice: 330.19,
  normalizedEps: 15,
  annualDividend: 9.32,
  conservativeMultiple: 20,
  fairMultiple: 22,
  optimisticMultiple: 25,
  downsideMultiple: 18,
  expectedEpsGrowth: 0.05,
  horizonYears: 5,
  minimumRequiredReturn: 0.08,
  dataConfidence: 85,
  unresolvedDiligence: [
    "Confirm that acquisition margins and return on invested capital stabilize.",
    "Reassess normalized earnings after the nonrecurring tariff refund.",
  ],
  provenance: [
    {
      sourceName: "Home Depot Q2 fiscal 2026 Form 10-Q",
      asOfDate: "2026-08-02",
      observedAt: "2026-08-31T00:00:00.000Z",
      freshness: "CURRENT",
      confidence: 95,
    },
    {
      sourceName: "Market close reference",
      asOfDate: "2026-08-28",
      observedAt: "2026-08-31T00:00:00.000Z",
      freshness: "CURRENT",
      confidence: 85,
    },
  ],
};

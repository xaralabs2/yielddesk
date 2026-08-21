# Investment Desk market data

YieldDesk Phase 3 supports NGX equity market data through the NGN Market REST API.

## Configuration

Set these server-side environment variables:

```bash
NGN_MARKET_API_KEY=ngnm_sk_live_...
NGN_MARKET_BASE_URL=https://api.ngnmarket.com/v1
NGN_MARKET_ENABLE_PROFILES=false
```

`NGN_MARKET_API_KEY` is required. Keep it server-side; never expose it through Vite/client environment variables.

`NGN_MARKET_ENABLE_PROFILES=true` enables per-company profile requests for the nine equity tickers in the ₦60m policy. Use this only on an API tier that permits company profile/fundamental fields and has sufficient quota.

## Data policy

The Investment Desk recheck endpoint always works without an NGX key, but equity signals remain allocation-drift only.

When the API key is configured, `/api/investment-desk/recheck` attaches quote data for:

- GTCO
- ZENITHBANK
- UBA
- MTNN
- AIRTELAFRI
- DANGCEM
- BUAFOODS
- NESTLE
- SEPLAT

The response reports `valuationCoverage` and `valuationReady`. Valuation-aware recommendations must not be emitted unless all target equities have price coverage and fundamental/valuation data is actually present.

This design intentionally distinguishes:

1. portfolio allocation facts from YieldDesk holdings;
2. fixed-income context from existing CBN/FMDQ data;
3. equity market/fundamental data from the configured provider;
4. AI interpretation, which must not invent missing prices, P/E ratios, dividends, or earnings.

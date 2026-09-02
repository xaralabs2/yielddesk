# Three-Market Phase 1

## Approved product boundary

YieldDesk Phase 1 is a cross-border investment-information, education, comparison, and simulation platform for the United States, United Kingdom, and Nigeria.

YieldDesk does not recommend investments or providers, determine suitability, advise users to buy or sell, arrange or execute trades, transmit orders, hold customer funds, or custody securities.

The canonical product journey is:

**Discover → Understand → Compare → Simulate → Watch → Monitor**

See [PRODUCT_CONSTITUTION.md](PRODUCT_CONSTITUTION.md).

## Market model

| Market | Currency | Initial instruments |
| --- | --- | --- |
| US | USD | Treasuries, selected ETFs, REITs, and dividend-oriented public securities |
| UK | GBP | Gilts, selected ETFs, REITs, and regulated funds |
| Nigeria | NGN | Treasury bills, FGN bonds, regulated funds, and selected public-market instruments |

Every instrument retains its native currency. Currency conversion is a derived, timestamped observation and never replaces native-currency values.

## First complete workflow

1. A user chooses an amount and base currency.
2. The user selects instruments from one or more supported markets.
3. YieldDesk displays comparable facts: income/yield basis, duration, liquidity, fees, source, and freshness.
4. The user supplies FX, inflation, horizon, and reinvestment assumptions.
5. A deterministic engine produces clearly labelled hypothetical scenarios.
6. The user saves the comparison to a watchlist or virtual portfolio.
7. YieldDesk monitors the selected instruments and source freshness.

## Mandatory output contract

Every comparison or simulation must distinguish sourced facts, deterministic calculations, user assumptions, historical observations, hypothetical scenarios, forecasts or third-party estimates, and missing or stale data.

Every result must include native currency, base currency, data source, observation time, calculation basis, included/excluded costs, and limitations.

YieldDesk presents no decision label such as ACCUMULATE, BUY, SELL, HOLD, AVOID, INVESTABLE, ACTIONABLE, preferred entry, or target allocation.

## Phase 1 delivery slices

1. Freeze the product constitution and prohibited-capability controls.
2. Rebuild navigation around the canonical user journey.
3. Implement structured instrument profiles and provenance.
4. Implement the three-market comparison workspace.
5. Implement multi-currency, inflation, fee, and income scenarios.
6. Add saved comparisons, watchlists, and virtual portfolios.
7. Add factual monitoring and source-freshness alerts.
8. Add AI explanation constrained by the product constitution.
9. Add clearly separated advertising only after audience and advertiser controls exist.

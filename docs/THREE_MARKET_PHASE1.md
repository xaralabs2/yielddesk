# Three-Market Phase 1

## Approved product boundary

YieldDesk Phase 1 is an investment-intelligence and simulation platform for the
United States, United Kingdom, and Nigeria. It does not execute trades, hold
customer funds, or custody securities.

## Market model

| Market | Currency | Initial instruments |
| --- | --- | --- |
| US | USD | Equities, REITs, Treasuries, regulated funds |
| UK | GBP | Equities, REITs, gilts, regulated funds |
| Nigeria | NGN | Equities, T-Bills, FGN bonds, regulated funds, selected SPVs |

Every instrument retains its native currency. Currency conversion is a derived,
timestamped observation and never replaces native-currency values.

## Mandatory intelligence output

Every evaluated opportunity must include:

- evidence provenance and freshness;
- normalized income or earnings;
- sustainable yield;
- downside, preferred-entry, fair, and optimistic values;
- modeled annualized return and required-return comparison;
- unresolved diligence;
- a decision of ACCUMULATE, WATCH, AVOID, or INSUFFICIENT_EVIDENCE;
- human approval required and actionable=false.

## Reference case

Home Depot is the first deterministic US-equity reference case. The fixture
uses normalized EPS of $15, a $300 preferred entry, a $330 fair value, and the
August 28, 2026 market reference of $330.19. The expected engine outcome is
WATCH because the asset is credible but does not provide the required margin of
safety at that price.

Run:

```bash
pnpm exec tsx scripts/src/validate-three-market.ts
```

## Next implementation slice

1. Persist instruments and timestamped observations.
2. Add API contracts for instrument discovery and valuation.
3. Add US-equity market-data adapter with licensing/provenance controls.
4. Add simulated multi-currency ledger.
5. Add UK and Nigerian reference fixtures.
6. Expose the investment memo in the web application.

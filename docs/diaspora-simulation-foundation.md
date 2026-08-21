# Diaspora + Simulation Foundation

This phase adds the first YieldDesk diaspora experience while preserving the existing real-investment portfolio.

## Product boundary

YieldDesk provides education, simulation, investment intelligence, portfolio recording and review. It does not custody funds, open brokerage accounts, or execute securities transactions.

## Real portfolio remains unchanged

The existing real portfolio continues to use `portfolio_holdings`, `portfolio_config`, manual entry and broker PDF parsing. Simulation data is not written to those tables.

## New diaspora profile

`diaspora_profiles` stores investor context used for personalization:

- country of residence
- home/base currency
- investment experience
- risk tolerance
- investment horizon
- goals and asset interests
- estimated capital range
- readiness stage
- consent for future partner-access updates

Endpoints:

- `GET /api/diaspora/profile`
- `PUT /api/diaspora/profile`

## Separate simulator

Simulation uses dedicated tables:

- `simulation_accounts`
- `simulation_holdings`
- `simulation_transactions`

The initial simulator supports NGX equity buy/sell simulations using YieldDesk's existing NGX reference-price resolver. Virtual cash and virtual holdings are updated atomically. The API response explicitly marks trades as simulated.

Endpoints:

- `GET /api/simulation/accounts`
- `POST /api/simulation/accounts`
- `GET /api/simulation/accounts/:id`
- `POST /api/simulation/accounts/:id/trades`

## Frontend

Two new protected areas are added:

- `/diaspora` — investor profile, readiness and product boundary
- `/simulator` — virtual account, buy/sell simulation, holdings, P/L and transaction history

The existing `/portfolio` remains the real-investment portfolio.

## Database rollout

Run the existing Drizzle schema deployment command after review:

`pnpm --filter @workspace/db run push`

Do not apply schema changes to production until the branch has passed typecheck/build and the migration impact has been reviewed.

## Next phase

1. Add fixed-income simulation for T-Bills and FGN bonds using canonical YieldDesk instruments.
2. Add FX-adjusted simulation and real-portfolio performance using diaspora base currency.
3. Add Ready-to-Invest lead/readiness analytics and explicit consent lifecycle.
4. Generalize contract-note ingestion into document -> extract -> preview -> confirm -> real portfolio transaction.
5. Expose deterministic YieldDesk portfolio/risk/allocation tools through Xara AI OS.

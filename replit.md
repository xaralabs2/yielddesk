# YieldDesk — Capital Allocation & Yield Optimization Platform

## Overview

pnpm workspace monorepo using TypeScript. Institutional capital allocation platform for Nigerian fixed income market with decision engine, portfolio management, deal scoring, market signals, and alerts.

## Stack

- **Monorepo tool**: pnpm workspaces
- **Node.js version**: 24
- **Package manager**: pnpm
- **TypeScript version**: 5.9
- **Frontend**: React 19 + Vite + Tailwind CSS + shadcn/ui + Wouter + TanStack Query
- **API framework**: Express 5
- **Database**: PostgreSQL + Drizzle ORM
- **Auth**: JWT (bcrypt for passwords, Bearer token in Authorization header)
- **Validation**: Zod (`zod/v4`), `drizzle-zod`
- **API codegen**: Orval (from OpenAPI spec)
- **Build**: esbuild (CJS bundle)

## Architecture

### Artifacts
- `artifacts/yield-desk` — React+Vite frontend (routes at `/`)
- `artifacts/api-server` — Express API server (routes at `/api/*`)
- `artifacts/mockup-sandbox` — Design sandbox (not user-facing)

### Libraries
- `lib/api-spec` — OpenAPI spec + codegen config
- `lib/api-client-react` — Generated React Query hooks + custom fetch
- `lib/api-zod` — Generated Zod validators
- `lib/db` — Drizzle schema + connection

### Database Tables
- `users` — id, email, passwordHash, role (user|admin)
- `holdings` — id, userId, type (CP|BOND|MMMF|STOCK), amount, rate, issuer, startDate, maturityDate, status
- `deals` — id, userId, issuer, rate, tenorDays, minAmount, riskLevel
- `signals` — id, cpRate, bondYield, createdAt
- `alerts` — id, userId, type (MARKET|PORTFOLIO|SYSTEM), message, read
- `cbn_market_data` — id, source, securityType (NTB|BOND|OMO), tenor, auctionDate, maturityDate, marginalRate, trueYield, amountOffered, totalSubscription, totalSuccessful, fetchedAt

### Money Market Rates
- Four data sources: NTB/OMO proxy rates (from CBN), FMDQ scraping (NIBOR/OBB/Repo), GetEquity CP (live commercial paper), and manual entry (dealer quotes/Bloomberg)
- DB table: `mm_rates` — source (FMDQ|MANUAL), rateType, tenor, rate, date, notes
- FMDQ scraper: tries JSON APIs first (`/wp-json/fmdq/v1/nibor`, `/repo-obb`), falls back to HTML table scraping
- GetEquity integration: `getequity-client.ts` fetches all tokens from GetEquity staging API; `fetchGeCpTokens()` filters to Debt/Fixed Interest/Fund types, `fetchAllDeals()` returns all non-cancelled deals
- GetEquity base URL: `ge-exchange-staging-1.herokuapp.com/v1` (configurable via GETEQUITY_BASE_URL env var); auth via Bearer token (GETEQUITY_API_KEY secret)
- GetEquity deal fields: name, symbol, image, investment_type, investment_category, interest, tenor, maturity, risk, rating, custodian, price, min_trade, max_trade, raise_amount, total_raised, payout_frequency, dividend, management_fee, carry, valuation, discount, milestone, completed_raise, closed, exited, secondaries
- API endpoints: GET /api/mm/rates, GET /api/mm/summary, POST /api/mm/rates, DELETE /api/mm/rates/:id, POST /api/mm/sync-fmdq, GET /api/mm/getequity-cp, GET /api/mm/getequity-deals
- Manual rate types: NIBOR, OBB, REPO, CALL, CP, MMF_YIELD

### CBN Data Feed
- Live data from Central Bank of Nigeria JSON APIs:
  - `https://www.cbn.gov.ng/api/GetAllSecuritiesNTB` — Treasury Bills
  - `https://www.cbn.gov.ng/api/GetAllSecuritiesFGNBond` — FGN Bonds
  - `https://www.cbn.gov.ng/api/GetAllSecuritiesOMO` — Open Market Operations
  - `https://www.cbn.gov.ng/api/GetAllMoneyMarketIndicators` — Policy/Money Market Indicators (MPR, Interbank Call Rate, T-Bill, Savings/1M/3M/6M/12M Deposit, Prime/Max Lending)
  - `https://www.cbn.gov.ng/api/GetAllExchangeRates` — Official Exchange Rates (USD, GBP, EUR, CHF, CNY, ZAR)
- Auto-syncs all feeds on server startup and every hour via `startCbnSync()`
- Creates market signals from live NTB 364-day rate (CP proxy) and FGN Bond rate
- DB tables: `cbn_market_data` (auctions), `cbn_policy_rates` (monthly indicators), `cbn_exchange_rates` (daily FX)
- API endpoints: GET /api/cbn/rates-summary, GET /api/cbn/market-data, GET /api/cbn/policy-rates, GET /api/cbn/exchange-rates, POST /api/cbn/sync, POST /api/cbn/sync-all

### Shared Module (Investment Intelligence + 3-Pillar Portfolio)
- Located in `shared-module/` — contains server routes, portfolio engine, investment landscape data, NGX stock price feed, PDF broker note parser
- Types in `shared-module/types/index.ts`: PortfolioHolding, PortfolioConfig, MacroData, InvestmentOption, etc.
- Server routes registered via `registerInvestmentPortfolioRoutes()` in `app.ts`
- Storage adapter in `artifacts/api-server/src/lib/portfolio-storage.ts` implements `IPortfolioStorage` backed by Drizzle
- DB tables: `portfolio_holdings` (userId, asset, ticker, pillar, valueNgn, shares, corridor, etc.), `portfolio_config` (targets, tolerance, baseline/target values)
- API endpoints (shared module): GET /api/investments, GET /api/portfolio, POST /api/portfolio/holdings, PATCH /api/portfolio/holdings/:id, DELETE /api/portfolio/holdings/:id, POST /api/portfolio/config, POST /api/portfolio/parse-pdf, GET /api/etf/allocation
- ETF allocation engine in `shared-module/server/etf-engine.ts` — regime detection (Tight/Moderate/Loose Liquidity, Easing Cycle) based on MPR/inflation/real-rates, with signal generation (BUY/HOLD/SELL + confidence) for 7 NGX-listed ETFs and factor rotation signals (Value/Growth/Income)
- No standalone pages — features integrated into existing pages:
  - Portfolio page (`portfolio.tsx`) fully enhanced with: Wealth Target tracker (target ₦, achieved %, growth multiplier, gap), 3-pillar gauges with goal amounts and gap-to-goal, rebalance alerts, real/nominal return metrics, 8-metric dashboard (total value, nominal return, real return, available cash, capital deployed, commissions, total costs, cost drag), CRUD holdings table (grouped by pillar with live stock prices, gain/loss%, strategic IRR/rental yield/corridor, vs-target column), add holding dialog (supports both shares×cost and direct value entry), edit/delete inline, portfolio config dialog (baseline/target/pillar targets/tolerance/cash), PDF broker note upload with auto-import, inflation erosion warning banner, ETF Signal Tracker (regime detection + confidence + directional signals for 7 ETFs), Operating Guide section (three pillars, monthly routine, rebalance guidance, real return explanation)
  - Investment Intelligence page (`market-data.tsx`, sidebar: "Investments") — complete rewrite: live header with refresh, macro pills (CPI/MPR/T-Bill/FX), Regime Banner (Tight/Moderate/Loose Liquidity, Easing Cycle), Risk Assessment panel, ETF Strategy Signals table (7 NGX ETFs with role/signal/confidence/price/1D change), Factor Rotation (Growth vs Value with confidence bars), Investment cards grid (7 instruments with tenor breakdowns, risk/liquidity/inflation badges, real yield), Comparison Matrix table, Market Context with allocation bars, collapsible CBN Primary Market Data section (NTB/Bond/OMO rates, policy rates, FX rates, deposit rates)
- 3 pillars: STABILITY (T-Bills, MMF), INFLATION (Equities, Bonds), STRATEGIC (Real Estate)
- `defaultQueryFn` in `lib/api-helpers.ts` handles auth token injection for all useQuery calls
- Packages: multer, pdf-parse (externalized in esbuild build)

### AI-Powered Features
- **AI Market Brief** (Rates page) — Sends current NTB/OMO/FMDQ/CP rates to GPT-4o-mini, returns markdown market intelligence briefing with trend analysis, anomalies, strategic implications
- **AI Deal Screening** (Deals page, GetEquity Deal Room tab) — Screens all GetEquity deals against NTB benchmarks, ranks top picks with ratings (Strong Buy/Buy/Hold/Avoid), risk assessment, portfolio fit commentary
- Uses Replit AI Integrations (OpenAI proxy) — no API key needed, env vars: `AI_INTEGRATIONS_OPENAI_BASE_URL`, `AI_INTEGRATIONS_OPENAI_API_KEY`
- Backend routes: `POST /api/ai/market-brief`, `POST /api/ai/deal-screening`
- Dependency: `openai` SDK + `@workspace/integrations-openai-ai-server` workspace package

### Decision Engine Thresholds
- CP rate >= 18% → INVEST_CP
- Bond yield >= 17% → LOCK_BONDS
- Otherwise → HOLD_MMMF
- Currency: Nigerian Naira (NGN)

### Theme Support
- Dark / Light / System mode toggle in sidebar
- Theme stored in localStorage (`yielddesk-theme` key)
- CSS variables for both modes in `index.css`

## Demo Credentials
- User: `demo@yielddesk.com` / `password123`
- Admin: `admin@yielddesk.com` / `password123`

## Key Commands

- `pnpm run typecheck` — full typecheck across all packages
- `pnpm run build` — typecheck + build all packages
- `pnpm --filter @workspace/api-spec run codegen` — regenerate API hooks and Zod schemas from OpenAPI spec
- `pnpm --filter @workspace/db run push` — push DB schema changes
- `pnpm --filter @workspace/api-server run dev` — run API server
- `npx tsx scripts/src/seed.ts` — seed demo data

## Important Notes
- `lib/api-zod/src/index.ts` must only export from `./generated/api` (not `./generated/types`) to avoid TS2308 errors
- bcrypt in `onlyBuiltDependencies` in `pnpm-workspace.yaml`
- Auth token stored in localStorage and attached via `setAuthTokenGetter` in custom-fetch

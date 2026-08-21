# YieldDesk

**Capital Allocation & Yield Optimization Platform for Nigerian Investments**

YieldDesk is an AI-native investment intelligence, simulation, portfolio management, and capital-allocation platform focused on Nigerian markets. It combines live market data, deterministic financial engines, portfolio intelligence, and Xara AI OS to help investors understand opportunities, practice investment decisions, review real holdings, and make better-informed capital-allocation decisions.

YieldDesk is **not a stockbroker, custodian, or trade-execution platform**. Real investments are executed outside YieldDesk through the investor's chosen provider and can then be recorded manually or, as supported, imported from investment documents for ongoing review.

## Product Model

YieldDesk supports two intentionally separate investment environments:

### Real Portfolio

The existing real portfolio remains the source of truth for investments the user actually owns.

- Manual investment entry
- Broker contract-note PDF parsing
- Portfolio holdings and targets
- Live NGX price enrichment
- Gain/loss and real-return analysis
- Three-pillar allocation framework
- Portfolio recheck and AI CIO brief
- Investment intelligence and market context

Real portfolio data is never mixed with simulator data.

### Simulator

The Simulator is a separate virtual environment for learning and experimentation.

- Dedicated simulation accounts
- Virtual NGN cash
- Simulated NGX equity BUY/SELL
- Live NGX reference prices
- Separate simulated holdings
- Separate transaction history
- Simulated P/L and portfolio value
- Explicit SIMULATED labeling and no-brokerage messaging

No simulated trade purchases or sells a real security, sends an order to a broker, or changes the user's real portfolio.

## Diaspora Investor Journey

YieldDesk is being expanded for Nigerians globally who want to understand and participate in Nigerian investment markets.

The intended journey is:

**Discover → Learn → Watch → Simulate → Get Guided → Ready to Invest → Invest Externally → Record/Upload → Review → Monitor → Reassess**

The diaspora profile captures context used to personalize the experience:

- Country of residence
- Home/base currency
- Investment experience
- Risk tolerance
- Investment horizon
- Goals
- Asset interests
- Estimated capital range
- Readiness stage
- Consent for future third-party access updates

`Ready to Invest` records investment intent and readiness. It does not open an investment account or execute a transaction.

## Investment Coverage

YieldDesk is designed around Nigerian capital allocation across:

- NGX equities
- FGN bonds
- Nigerian Treasury Bills
- OMO instruments
- Commercial paper
- Money Market Funds
- NGX-listed ETFs
- Strategic assets such as real estate

The portfolio framework currently uses three pillars:

1. **STABILITY** — T-Bills, MMFs, short-duration/fixed-income instruments
2. **INFLATION** — Equities and assets intended to protect or grow purchasing power
3. **STRATEGIC** — Long-duration strategic assets such as real estate/private opportunities

Currency exposure is treated as a cross-portfolio dimension rather than a fourth pillar.

## FX Intelligence

FX is important to YieldDesk primarily as an investment-intelligence layer, especially for diaspora investors.

Planned capabilities include:

- NGN vs USD/GBP/CAD/EUR views
- Entry FX rate vs current FX rate
- NGN investment return
- Home-currency return
- FX contribution to total return
- Inflation-adjusted return
- Currency scenarios and alerts

YieldDesk is not intended to become a leveraged forex-trading or forex-brokerage platform.

## AI Architecture

YieldDesk is a product on top of **Xara AI OS and the wider Xara ecosystem**.

YieldDesk owns the investment-domain logic and data. Xara AI OS provides shared AI infrastructure such as model routing, orchestration, tools, research/RAG patterns, evaluations, observability, and agentic capabilities.

The architectural rule is:

> **Deterministic engines calculate financial facts. Xara AI OS reasons, explains, researches, personalizes, and orchestrates. The human decides.**

Target intelligence domains include:

- Market Intelligence
- Portfolio Intelligence
- Decision Intelligence
- Learning/Simulation Intelligence
- Document Intelligence
- Investor/Diaspora Intelligence

## Market Data

Current and planned data sources include:

- CBN — NTB, FGN Bond, OMO, policy/money-market indicators, FX
- FMDQ — money-market and fixed-income context
- NGX / market-data providers — listed equities and market data
- GetEquity — commercial paper/deal data
- Manual/dealer data where required
- Broker notes, issuer documents, investment research, and user-uploaded documents

The target architecture is a YieldDesk **Market Data Fabric** that normalizes observations and preserves source, timestamp, freshness, currency, and provenance before the data reaches portfolio/AI features.

## Current Stack

- **Monorepo:** pnpm workspaces
- **Runtime:** Node.js 24
- **Language:** TypeScript 5.9
- **Frontend:** React 19 + Vite
- **UI:** Tailwind CSS + shadcn/ui
- **Routing:** Wouter
- **Client data:** TanStack Query
- **API:** Express 5
- **Database:** PostgreSQL + Drizzle ORM
- **Validation:** Zod v4 + drizzle-zod
- **API contracts/codegen:** OpenAPI + Orval
- **Authentication:** JWT + bcrypt
- **Build:** esbuild
- **Deployment:** Vercel
- **AI:** Xara AI OS / existing YieldDesk AI integration during transition

## Monorepo Structure

```text
yielddesk/
├── artifacts/
│   ├── yield-desk/        # React/Vite web application
│   ├── api-server/        # Express API / Vercel API
│   └── mockup-sandbox/    # Design sandbox
├── lib/
│   ├── api-spec/          # OpenAPI specification
│   ├── api-client-react/  # Generated React Query hooks
│   ├── api-zod/           # Generated validators
│   └── db/                # PostgreSQL / Drizzle schemas
├── shared-module/         # Portfolio, investment and market intelligence engines
├── docs/
├── scripts/
├── package.json
└── pnpm-workspace.yaml
```

## Vercel Deployment

The monorepo is designed as two Vercel projects connected to the same GitHub repository:

- `yielddesk-web` → `artifacts/yield-desk`
- `yielddesk-api` → `artifacts/api-server`

The API project includes the Vercel serverless entry point and scheduled CBN synchronization. See `docs/vercel-deployment.md`.

## Phase 5 — Diaspora + Simulation Foundation

The current feature branch adds:

- `diaspora_profiles`
- `simulation_accounts`
- `simulation_holdings`
- `simulation_transactions`
- `/api/diaspora/profile`
- `/api/simulation/accounts`
- simulated NGX equity trading
- `/diaspora` UI
- `/simulator` UI

The existing `/portfolio` and real investment data model remain intact.

See `docs/diaspora-simulation-foundation.md` for implementation details.

## Next Build Path

1. Validate and deploy the Phase 5 schema safely.
2. Add canonical Market Data Fabric metadata and instrument normalization.
3. Extend simulation to T-Bills and FGN bonds.
4. Add diaspora FX-adjusted performance and scenarios.
5. Add Ready-to-Invest analytics and consent lifecycle.
6. Generalize contract-note/statement ingestion into extract → preview → confirm → real portfolio.
7. Expand deterministic portfolio, risk, valuation, scenario, and allocation engines.
8. Expose typed YieldDesk domain tools through Xara AI OS.
9. Add AI-dense market, portfolio, simulation, research, document, and investor intelligence.
10. Add GitHub Actions, AI evaluations, observability, and Xara AI Factory engineering automation.

## Key Commands

```bash
pnpm run typecheck
pnpm run build
pnpm --filter @workspace/api-spec run codegen
pnpm --filter @workspace/db run push
pnpm --filter @workspace/api-server run dev
npx tsx scripts/src/seed.ts
```

## Product Boundary

YieldDesk's role is:

**Education + Simulation + Market Intelligence + Portfolio Recording + Investment Review + Risk/FX/Allocation Intelligence**

YieldDesk does not custody client funds, execute securities transactions, or operate as a stockbroker.

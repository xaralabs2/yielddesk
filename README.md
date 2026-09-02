# YieldDesk

**Three-Market Investment Intelligence, Simulation & Capital Allocation Platform**

YieldDesk is an AI-native investment intelligence, simulation, portfolio management, and capital-allocation platform covering the United States, United Kingdom, and Nigeria. It combines live market data, deterministic investment mathematics, portfolio intelligence, and Xara AI OS to help investors understand opportunities, practice investment decisions, review real holdings, and make better-informed capital-allocation decisions.

YieldDesk is **not a stockbroker, custodian, or trade-execution platform**. Real investments are executed outside YieldDesk through the investor's chosen provider and can then be recorded manually or, as supported, imported from investment documents for ongoing review.

## Product Baseline: NOW vs FUTURE

YieldDesk documentation intentionally separates current capabilities from future-state design so roadmap ideas are never confused with production reality.

- **Available today:** [`docs/YIELDDESK_NOW.md`](docs/YIELDDESK_NOW.md)
- **Future-state V2:** [`docs/YIELDDESK_FUTURE.md`](docs/YIELDDESK_FUTURE.md)
- **Investment Mathematics Engine:** [`docs/INVESTMENT_MATHEMATICS_ENGINE.md`](docs/INVESTMENT_MATHEMATICS_ENGINE.md)
- **Approved three-market Phase 1:** [`docs/THREE_MARKET_PHASE1.md`](docs/THREE_MARKET_PHASE1.md)
- **Core + expansion roadmap:** [`docs/YIELDDESK_V2_ROADMAP.md`](docs/YIELDDESK_V2_ROADMAP.md)

The target V2 decision language is:

**INVESTIGATE → INVESTABLE → ACTIONABLE**

After investment:

**THESIS INTACT → THESIS WATCH → THESIS BROKEN**

The central capital-allocation test is:

> **Expected Return vs Required Return vs Risk vs Best Available Alternative**

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

**Discover → Learn → Watch → Simulate → Get Guided → Ready to Invest → Invest Externally → Record/Upload → Review → Monitor → Reassess**

The diaspora profile captures country/base currency, experience, risk tolerance, horizon, goals, asset interests, estimated capital, readiness and consent context. `Ready to Invest` records intent; it does not open an account or execute a transaction.

## Investment Coverage

Phase 1 covers income and wealth-preservation intelligence across USD, GBP, and NGN markets. US and UK instruments begin with public equities, REITs, government securities, and regulated funds. Nigerian coverage includes:

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

## Investment Mathematics

YieldDesk V2 treats investment mathematics as core infrastructure, not decorative analytics.

Target deterministic measures include:

- **Returns:** CAGR, IRR, XIRR, TWRR, MWRR, holding-period return, total/annualized return
- **Economic return:** nominal NGN, real NGN, USD/home-currency return and FX attribution
- **Income:** cash yield, current/effective yield, yield on cost, dividend CAGR and coverage
- **Risk:** volatility, downside deviation, maximum drawdown, recovery, probability of loss and stress loss
- **Risk-adjusted:** Sharpe, Sortino, excess expected return and illiquidity premium
- **Valuation:** NPV, DCF, EV, NAV, SOTP, earnings/FCF yield, Margin of Safety and probability-weighted value
- **Property/private:** IRR, XIRR, MOIC/equity multiple, cash-on-cash, payback and exit-value stress
- **Fixed income:** YTM, real yield, duration, modified duration, convexity and credit spread
- **Portfolio:** TWRR, MWRR, alpha, beta, correlation, contribution, attribution, concentration and drawdown

YieldDesk should explicitly compare **Expected Return**, **Required Return**, and the **best relevant alternative**, including the premium received for accepting illiquidity.

## FX Intelligence

FX is an investment-intelligence layer, especially for diaspora investors. Target capabilities include entry vs current FX, NGN return, home-currency return, FX contribution, inflation-adjusted return and currency scenarios. YieldDesk is not intended to become a leveraged forex-trading or forex-brokerage platform.

## AI Architecture

YieldDesk is a product on top of **Xara AI OS and the wider Xara ecosystem**.

YieldDesk owns investment-domain logic and data. Xara AI OS provides shared model routing, orchestration, tools, research/RAG patterns, evaluations, observability and agentic capabilities.

> **Deterministic engines calculate financial facts. Xara AI OS reasons, explains, researches, personalizes and orchestrates. The human decides.**

The V2 target adds specialist intelligence around evidence, normalized earnings/cash, sector valuation, market-implied expectations, counter-thesis, portfolio fit, thesis monitoring, attribution and investor memory.

## Market Data

Current and planned sources include CBN, FMDQ, NGX/market-data providers, GetEquity, manual/dealer data, broker notes, issuer documents, research and user uploads.

The target **Market Data Fabric** normalizes observations and preserves source, timestamp, freshness, currency and provenance before data reaches portfolio or AI features.

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
│   ├── yield-desk/
│   ├── api-server/
│   └── mockup-sandbox/
├── lib/
│   ├── api-spec/
│   ├── api-client-react/
│   ├── api-zod/
│   └── db/
├── shared-module/
├── docs/
├── scripts/
├── package.json
└── pnpm-workspace.yaml
```

## Vercel Deployment

The monorepo is designed as two Vercel projects connected to the same GitHub repository:

- `yielddesk-web` → `artifacts/yield-desk`
- `yielddesk-api` → `artifacts/api-server`

The API includes the serverless entry point and scheduled CBN synchronization. See `docs/vercel-deployment.md`.

## V2 Build Path

### Core Engine — Weeks 1–13

1. Freeze Investment Constitution, asset ontology and decision states.
2. Build Evidence Graph, provenance, freshness and Assumption Registry.
3. Build deterministic Investment Mathematics Engine.
4. Add CAGR/IRR/XIRR, real/FX return, benchmarks and required-return framework.
5. Add business quality, earnings normalization and cash conversion.
6. Add sector valuation, Bear/Base/Bull and probability-weighted outcomes.
7. Add Market-Implied Expectations, Expectation Gap and Margin of Safety.
8. Add mandatory Counter-Thesis and auditable INVESTIGATE / INVESTABLE synthesis.

### Expansion Engine — Weeks 14–24+

1. Add opportunity cost, illiquidity premium, Portfolio Fit, factor exposure and concentration.
2. Add TWRR/MWRR portfolio performance, downside analytics and position sizing.
3. Add Capital Deployment / Buy Queue.
4. Add Thesis Ledger and INTACT / WATCH / BROKEN monitoring.
5. Add Return Attribution, Decision Journal, management memory and Investor Learning.
6. Extend native intelligence across Real Estate/SPVs, Fixed Income, Money Market and Alternatives.
7. Expand YieldIntel into a natural-language operating layer across research, portfolio and monitoring.

See [`docs/YIELDDESK_V2_ROADMAP.md`](docs/YIELDDESK_V2_ROADMAP.md).

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

YieldDesk's current role is:

**Education + Simulation + Market Intelligence + Portfolio Recording + Investment Review + Risk / FX / Allocation Intelligence**

The future-state product adds deeper AI-native research, deterministic investment mathematics, valuation, adversarial analysis, benchmark/opportunity-cost intelligence, portfolio intelligence, monitoring, attribution and learning while keeping the investor in control.

YieldDesk does not custody client funds, execute securities transactions, or operate as a stockbroker.

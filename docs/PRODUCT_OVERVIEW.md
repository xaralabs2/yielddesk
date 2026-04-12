# YieldDesk — Product Overview

## What is YieldDesk?

YieldDesk is a capital allocation and yield optimization platform built for institutional investors operating in the Nigerian fixed income market. It consolidates market intelligence, portfolio management, deal discovery, and AI-powered analysis into a single decision-support system.

## Problem Statement

Institutional investors in Nigeria's fixed income market face fragmented data sources, manual portfolio tracking, and limited tooling for real-time decision-making. Key challenges include:

- **Scattered Market Data** — NTB auction results, FMDQ interbank rates, OMO bills, and commercial paper yields live across multiple platforms with no unified view.
- **Manual Portfolio Tracking** — Most allocators still track positions in spreadsheets with no automated gain/loss, rebalancing, or inflation-adjusted return calculations.
- **Slow Deal Discovery** — Commercial paper and private debt opportunities surface through broker calls and WhatsApp groups, not structured platforms.
- **No Decision Framework** — Allocation decisions lack systematic signals tied to macro conditions (MPR, inflation, real rates, FX).

## Solution

YieldDesk provides an integrated platform with five core modules:

### 1. Market Intelligence (Rates Page)

- **Live CBN Data Feed** — Auto-syncs NTB, FGN Bond, and OMO auction results directly from the Central Bank of Nigeria's API every hour.
- **FMDQ Interbank Rates** — NIBOR, OBB, and Repo rates scraped and displayed with historical context.
- **Commercial Paper Rates** — Live CP yields from GetEquity's deal platform, filtered to debt/fixed income instruments.
- **Manual Rate Entry** — Dealers can log Bloomberg quotes, broker indications, and proprietary rate observations.
- **AI Market Brief** — One-click AI-generated market intelligence report covering rate trends, anomalies, spread dynamics, and strategic implications.

### 2. Decision Engine

A rules-based signal generator that produces clear allocation directives:

| Condition | Signal | Action |
|-----------|--------|--------|
| CP Rate >= 18% | `INVEST_CP` | Allocate to commercial paper |
| Bond Yield >= 17% | `LOCK_BONDS` | Lock into FGN bonds |
| Otherwise | `HOLD_MMMF` | Park in money market funds |

Signals auto-generate from live CBN data and appear as alerts in the system.

### 3. Portfolio Management (Wealth Portfolio)

A three-pillar portfolio framework designed for Nigerian institutional allocators:

- **Stability Pillar** — T-Bills, Money Market Funds, short-duration instruments. Prioritizes capital preservation and liquidity.
- **Inflation Hedge Pillar** — Bank equities, cement stocks, listed equities. Targets real returns above CPI.
- **Strategic Pillar** — Real estate (Lagos corridors), SPVs, private deals. Long-term capital appreciation with rental yield tracking.

**Key Features:**
- Wealth Target Tracker with progress toward target AUM
- 3-pillar allocation gauges with gap-to-goal analysis
- 8-metric dashboard: total value, nominal return, real return, capital deployed, available cash, commissions, total costs, cost drag
- Live NGX stock prices for listed holdings (146 equities)
- Gain/loss tracking per holding with cost basis
- Cost price tracking for all asset types including strategic assets (real estate, SPVs)
- PDF broker note import with auto-parsing
- Inflation erosion warning when real returns go negative
- Rebalance alerts when pillar allocations drift beyond tolerance

### 4. Deal Discovery (Deals Page)

- **Your Deals** — Track proprietary deal pipeline with issuer, rate, tenor, risk level, and status.
- **GetEquity Deal Room** — Live integration with GetEquity's exchange platform showing 199+ deals with filtering by type (Debt, Fund, Equity), risk level, custodian presence, and raise completion.
- **AI Deal Screening** — AI-powered analysis that screens open deals against NTB benchmarks, ranks top picks (Strong Buy/Buy/Hold/Avoid), and assesses portfolio fit.

### 5. Investment Intelligence

- **Regime Detection** — Classifies the current monetary environment as Tight Liquidity, Moderate, Loose Liquidity, or Easing Cycle based on MPR, inflation, and real rate calculations.
- **ETF Signal Tracker** — Directional signals (BUY/HOLD/SELL) with confidence scores for 7 NGX-listed ETFs.
- **Factor Rotation** — Growth vs. Value tilt recommendations based on the macro regime.
- **Investment Landscape** — Curated grid of 7 instrument types with tenor breakdowns, real yield calculations, risk/liquidity/inflation badges.
- **CBN Primary Market Data** — Full auction history for NTB, Bonds, OMO, plus policy rates and exchange rates.

## Technical Architecture

### Stack
- **Frontend**: React 19 + Vite + Tailwind CSS + shadcn/ui
- **Backend**: Express 5 (TypeScript) with JWT authentication
- **Database**: PostgreSQL + Drizzle ORM
- **AI Engine**: Custom multi-tenant multi-LLM platform (Mistral-powered)
- **Monorepo**: pnpm workspaces with TypeScript project references
- **API Codegen**: OpenAPI spec + Orval for type-safe React Query hooks

### Data Sources
| Source | Type | Frequency |
|--------|------|-----------|
| CBN JSON APIs | NTB/Bond/OMO auctions, Policy rates, FX rates | Hourly auto-sync |
| FMDQ | NIBOR, OBB, Repo interbank rates | On-demand sync |
| GetEquity API | Commercial paper, debt instruments, fund deals | Real-time |
| Manual Entry | Dealer quotes, Bloomberg indications | User-driven |
| NGX Price Feed | 146 listed equities | Real-time |

### Security
- JWT-based authentication with bcrypt password hashing
- Role-based access (user/admin)
- Environment-variable-based secret management
- API key authentication for external integrations

## Key Differentiators

1. **Nigeria-Specific** — Built from the ground up for NGN-denominated fixed income, not a generic portfolio tracker adapted for emerging markets.
2. **Live CBN Integration** — Direct API connection to Central Bank data, not scraped or delayed.
3. **Three-Pillar Framework** — Institutional-grade allocation model (Stability/Inflation Hedge/Strategic) with automated rebalancing signals.
4. **AI-Powered Analysis** — Market briefs and deal screening powered by a dedicated AI platform, not generic chatbot responses.
5. **Deal Discovery** — Integrated commercial paper and private debt marketplace via GetEquity, with institutional-grade screening.
6. **Real Return Focus** — Every return metric is inflation-adjusted, showing real purchasing power changes, not just nominal gains.

## Target Users

- **Asset Managers** — Managing NGN-denominated fixed income portfolios
- **Treasury Departments** — Corporate treasury teams optimizing cash allocation
- **Family Offices** — HNW individuals with multi-asset Nigerian portfolios
- **Pension Fund Managers** — Institutional allocators with regulatory constraints
- **Fixed Income Traders** — Dealers tracking rates and identifying opportunities

## Demo Access

- **URL**: Deployed via Replit
- **Demo User**: `demo@yielddesk.com` / `password123`
- **Admin User**: `admin@yielddesk.com` / `password123`

## Roadmap Considerations

- WhatsApp/Telegram alert integration for real-time signal delivery
- Multi-currency support (USD/GBP hedging for diaspora investors)
- Regulatory compliance module (SEC Nigeria, PenCom guidelines)
- Historical backtesting engine for allocation strategies
- Mobile application (React Native / Expo)
- Bloomberg Terminal data feed integration
- Multi-user workspace with role-based portfolio access

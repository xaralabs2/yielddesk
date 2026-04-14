# Project Audit Findings Report

**Project:** YieldDesk  
**Audit Date:** April 14, 2026  
**Auditor:** Senior Software Product Auditor  
**Method:** Read-only codebase inspection — no changes made  

---

## Executive Summary

**What this system is:** YieldDesk is a capital allocation and yield optimization platform for institutional investors in the Nigerian fixed income market. It consolidates CBN auction data, FMDQ interbank rates, GetEquity commercial paper deals, and AI-powered analysis into a single portfolio management and decision-support system.

**Estimated maturity:** ~65%  
The core product loop is functional — data ingestion, portfolio management, deal discovery, and AI analysis all work end-to-end. However, the platform lacks automated tests, has significant code quality debt, and is missing several production-readiness controls.

**Biggest strengths:**
- Live CBN data integration with hourly auto-sync (357 lines of well-structured scraper logic)
- Three-pillar portfolio framework with real return tracking, rebalancing alerts, and cost basis
- AI-powered market briefs and deal screening via custom multi-LLM platform
- Comprehensive 8-page SPA with dark/light theme support
- Type-safe API codegen pipeline (OpenAPI → Orval → React Query hooks)

**Biggest gaps:**
- Zero automated tests for a financial calculation engine
- No rate limiting or request throttling on any endpoint
- Open CORS policy (`cors()` with no restrictions)
- Several 1,000+ line page components with duplicated logic
- No database indexes beyond primary keys
- AI credentials transmitted over plain HTTP

**Overall readiness level:** PARTIAL — Functional for demo/internal use. Not production-ready for institutional deployment without security hardening, test coverage, and operational monitoring.

---

## Product Snapshot

| Area | Findings |
|------|----------|
| Product Type | Capital allocation & yield optimization SaaS platform |
| Primary Users | Asset managers, treasury departments, family offices operating in Nigerian fixed income |
| Core Value | Unified view of NGN fixed income market with AI-powered analysis, 3-pillar portfolio management, and automated deal screening |
| Current Stage | Late prototype / Early MVP — functional but not production-hardened |

---

## Findings by Area

### Frontend

| Item | Status | Findings | Evidence / Files | Priority |
|------|--------|----------|------------------|----------|
| Page Count | COMPLETE | 11 page components covering all core workflows (Dashboard, Portfolio, Holdings, Deals, Rates, Market Data, Signals, Alerts, Login, Signup, 404) | `artifacts/yield-desk/src/pages/` (11 files) | - |
| Routing | COMPLETE | Wouter-based routing with Protected/PublicOnly route guards and JWT auth check | `artifacts/yield-desk/src/App.tsx` | - |
| Navigation | COMPLETE | 8-item sidebar with icons, unread alert badge, user profile, theme toggle, sign out | `artifacts/yield-desk/src/components/layout.tsx` | - |
| Dashboard | BASIC | Summary page exists but is relatively thin (242 lines) compared to other pages; limited visualizations | `artifacts/yield-desk/src/pages/dashboard.tsx` (242 lines) | Medium |
| Portfolio Page | ADVANCED | Comprehensive: wealth tracker, 3-pillar gauges, 8-metric dashboard, holdings table with live NGX prices, CRUD, PDF import, ETF signals, operating guide | `artifacts/yield-desk/src/pages/portfolio.tsx` (1,572 lines) | - |
| Market Data Page | ADVANCED | Full investment intelligence: regime detection, ETF signals, factor rotation, investment cards, CBN primary market data | `artifacts/yield-desk/src/pages/market-data.tsx` (1,190 lines) | - |
| Rates Page | ADVANCED | 4-tab layout (NTB/OMO, FMDQ, GetEquity CP, Manual Entries) with AI Market Brief | `artifacts/yield-desk/src/pages/mm-rates.tsx` (738 lines) | - |
| Deals Page | COMPLETE | 2-tab layout (Your Deals, GetEquity Deal Room) with AI Deal Screening | `artifacts/yield-desk/src/pages/deals.tsx` (690 lines) | - |
| Charts / Visualizations | BASIC | Limited chart usage; mostly tabular data with badges and gauges. No time-series or trend charts | Multiple pages | Medium |
| Mobile Responsiveness | PARTIAL | Sidebar collapses but page layouts use fixed grids (`grid-cols-3`, `grid-cols-4`) that may overflow on mobile | `portfolio.tsx`, `market-data.tsx` | Medium |
| UX Consistency | PARTIAL | Consistent use of shadcn/ui components and Tailwind styling, but some pages use inline `renderMarkdown()` helpers while others don't | `mm-rates.tsx`, `deals.tsx` | Low |
| File Size Concern | HIGH RISK | 3 page files exceed 700 lines; `portfolio.tsx` at 1,572 lines contains dialogs, table rendering, and business logic all in one file | `portfolio.tsx`, `market-data.tsx`, `mm-rates.tsx` | High |
| Component Duplication | MEDIUM RISK | Full UI component library duplicated between `artifacts/yield-desk/src/components/ui/` and `artifacts/mockup-sandbox/src/components/ui/` | Both `components/ui/` directories | Medium |
| Theme Support | COMPLETE | Dark/Light/System mode with CSS variables, localStorage persistence (`yielddesk-theme` key) | `artifacts/yield-desk/src/index.css`, `layout.tsx` | - |

### Backend

| Item | Status | Findings | Evidence / Files | Priority |
|------|--------|----------|------------------|----------|
| API Routes | COMPLETE | 40+ endpoints covering auth, holdings, deals, signals, alerts, decision engine, CBN data, MM rates, GetEquity proxy, AI, admin, portfolio, investments, ETF allocation | `artifacts/api-server/src/routes/` (10 route files), `shared-module/server/routes.ts` | - |
| Authentication | COMPLETE | JWT-based with bcrypt password hashing. Token issued on login with 7-day expiry. Bearer token auth middleware | `artifacts/api-server/src/middlewares/auth.ts` | - |
| Authorization | BASIC | Two roles only: `user` and `admin`. Admin route (`/admin/stats`) gated by `requireAdmin`. No granular permissions or resource-level access control | `auth.ts` (line 21) | Medium |
| Rate Limiting | MISSING | No rate limiting or throttling on any endpoint, including auth endpoints (login/signup). Vulnerable to brute-force attacks | No evidence of `rate-limit` in codebase | High |
| CORS Policy | HIGH RISK | Wide-open CORS: `app.use(cors())` with no origin restrictions. Any domain can make authenticated API requests | `artifacts/api-server/src/app.ts` (line 33) | High |
| Input Validation | PARTIAL | Zod schemas imported from `@workspace/api-zod` in auth, holdings, deals, signals, alerts routes. However, shared-module portfolio routes use manual validation only | `routes/auth.ts`, `routes/holdings.ts` use Zod; `shared-module/server/routes.ts` does not | Medium |
| Error Handling | PARTIAL | Most routes have try/catch with structured error responses. However, 1 silent `catch {}` block exists in AI routes (swallows GetEquity fetch errors) | `ai.ts` line 80: `} catch {}` | Medium |
| Logging | COMPLETE | Pino logger with request/response logging via `pino-http`. Pretty-print in dev mode. Secret redaction configured | `artifacts/api-server/src/lib/logger.ts` | - |
| CBN Data Sync | ADVANCED | Automated hourly sync of NTB/Bond/OMO auctions, policy rates, and exchange rates from 5 CBN JSON APIs. Deduplication via date-based checks | `artifacts/api-server/src/lib/cbn-scraper.ts` (357 lines) | - |
| FMDQ Scraper | COMPLETE | Dual-strategy: tries JSON API first, falls back to HTML table scraping for NIBOR/OBB/Repo rates | `artifacts/api-server/src/lib/fmdq-scraper.ts` | - |
| GetEquity Client | COMPLETE | Fetches all tokens/deals from staging API with CP type filtering. Bearer token auth | `artifacts/api-server/src/lib/getequity-client.ts` | - |
| Decision Engine | COMPLETE | Rule-based signal generator with 3 actions (INVEST_CP/LOCK_BONDS/HOLD_MMMF), confidence scoring, and deal-level recommendations | `artifacts/api-server/src/lib/decision-engine.ts` (78 lines) | - |
| PDF Parser | COMPLETE | Broker contract note parser using `pdf-parse` with regex extraction of trade data | `shared-module/server/pdf-parser.ts` | - |
| JWT Secret | MEDIUM RISK | Falls back to hardcoded `"dev-secret"` if `SESSION_SECRET` env var is not set. In production, this would be a critical vulnerability | `auth.ts` line 4: `const JWT_SECRET = process.env.SESSION_SECRET \|\| "dev-secret"` | High |

### Database / Data

| Item | Status | Findings | Evidence / Files | Priority |
|------|--------|----------|------------------|----------|
| Schema Definition | COMPLETE | 10 schema files defining users, holdings, deals, signals, alerts, cbn_market_data, mm_rates, cbn_policy_rates, cbn_exchange_rates, portfolio_holdings, portfolio_config | `lib/db/src/schema/` (10 files) | - |
| ORM | COMPLETE | Drizzle ORM with PostgreSQL dialect. Clean schema definitions with proper column types | `lib/db/src/schema/*.ts` | - |
| Migrations | MISSING | No migrations directory. Uses `drizzle-kit push` for direct schema sync. No rollback capability or schema version history | `lib/db/package.json`: `"push": "drizzle-kit push"` | High |
| Foreign Keys | PARTIAL | Only 2 foreign key relationships defined: `holdings.userId → users.id` and `alerts.userId → users.id`. Portfolio holdings, deals, signals, and config tables have NO foreign keys to users | `holdings.ts`, `alerts.ts` have FKs; `portfolio-holdings.ts`, `deals.ts`, `signals.ts` do not | High |
| Indexes | MISSING | Zero custom indexes defined beyond auto-generated primary keys. No indexes on `userId`, `date`, `ticker`, `pillar`, or any frequently queried column | All schema files — no `.index()` calls found | High |
| User ID Inconsistency | MEDIUM RISK | `users.id` is `serial` (integer), but `portfolio_holdings.userId` and `portfolio_config.userId` are `varchar(50)`. No FK constraint possible between them | `users.ts`: `serial`, `portfolio-holdings.ts`: `varchar(50)` | High |
| Timestamps | PARTIAL | `users`, `holdings`, `signals`, `alerts` have `createdAt` timestamps. `portfolio_holdings` has `entryDate` and `lastUpdated`. However, `deals` table only has `createdAt` — no `updatedAt` | Various schema files | Medium |
| Data Quality Controls | BASIC | `.notNull()` constraints on key fields. `users.email` has unique constraint. No check constraints on numeric ranges (rates, amounts could be negative) | Schema files | Medium |
| Historical Data | PARTIAL | CBN market data stores auction history. Signals track rate snapshots over time. But no portfolio value history or snapshots — only current state is stored | `cbn-market-data.ts`, `signals.ts` | Medium |
| Soft Deletes | MISSING | No soft delete support. All deletes are hard deletes. No `deletedAt` columns | All schema files | Low |

### Intelligence / Automation

| Item | Status | Findings | Evidence / Files | Priority |
|------|--------|----------|------------------|----------|
| Decision Engine | COMPLETE | Rule-based with 3 thresholds, confidence scoring (HIGH/MEDIUM/LOW), and capital deployment percentages (50-60%) | `decision-engine.ts` | - |
| AI Market Brief | COMPLETE | Sends live NTB/OMO/FMDQ/CP rates to custom AI platform, returns structured markdown market intelligence | `ai.ts` `/ai/market-brief` route | - |
| AI Deal Screening | COMPLETE | Screens open GetEquity deals against NTB benchmarks with Strong Buy/Buy/Hold/Avoid ratings | `ai.ts` `/ai/deal-screening` route | - |
| AI Platform | COMPLETE | Custom multi-tenant multi-LLM platform (Mistral-powered) at `http://209.38.100.198:8000` with 5,000 char prompt limit | `ai.ts` header config | - |
| Regime Detection | ADVANCED | 4-regime model (Tight/Moderate/Loose Liquidity, Easing Cycle) based on MPR, inflation, and real rate calculations | `shared-module/server/etf-engine.ts` (174 lines) | - |
| ETF Signals | ADVANCED | BUY/HOLD/SELL signals with confidence scores for 7 NGX-listed ETFs, mapped to regime conditions | `etf-engine.ts` | - |
| Factor Rotation | COMPLETE | Growth vs. Value tilt recommendations based on macro regime | `etf-engine.ts` | - |
| Portfolio Engine | ADVANCED | Live stock price integration, macro-adjusted strategic valuations, real return calculation, cost analysis (brokerage/SEC/NSE fees), auto-computed cost basis | `portfolio-engine.ts` (257 lines) | - |
| Rebalancing Alerts | COMPLETE | Drift detection when pillar weights exceed user-defined tolerance (default 5%). Generates specific actionable alerts | `portfolio-engine.ts` | - |
| Scheduled Jobs | COMPLETE | CBN data auto-sync every hour via `startCbnSync()`. Creates market signals on significant rate changes (>0.1%) | `cbn-scraper.ts`, `index.ts` | - |
| Reporting | BASIC | No export functionality (PDF/CSV/Excel). No scheduled reports or email digests | No evidence of export or reporting modules | Medium |
| Search | MISSING | No search functionality across deals, holdings, or market data | No search endpoints or UI | Low |

### Operations / Infrastructure

| Item | Status | Findings | Evidence / Files | Priority |
|------|--------|----------|------------------|----------|
| Environment Variables | COMPLETE | 3 secrets configured (GETEQUITY_API_KEY, SESSION_SECRET, YIELDDESK_AI_API_KEY) plus standard DB vars. AI config uses env vars with hardcoded fallbacks | Replit Secrets panel | - |
| Deployment | PARTIAL | Deployed via Replit with auto-publishing. No CI/CD pipeline, staging environment, or blue-green deployment | Replit deployment system | Medium |
| Logging | COMPLETE | Structured JSON logging via Pino with request/response tracking, latency measurement, and error serialization | `logger.ts`, `app.ts` pino-http config | - |
| Monitoring | MISSING | No application monitoring, uptime checks, error tracking (Sentry/similar), or performance metrics. No `/healthz` dashboard | Only basic `GET /healthz` endpoint exists | High |
| Error Handling | PARTIAL | Backend routes mostly have try/catch. Frontend uses React Query error states. But no global error boundary in the React app | `App.tsx` — no ErrorBoundary wrapper | Medium |
| Security — Transport | HIGH RISK | AI platform endpoint uses plain HTTP (`http://209.38.100.198:8000`) while transmitting API keys in Authorization headers. Credentials exposed to MITM attacks | `ai.ts` line 7: `http://209.38.100.198:8000` | Critical |
| Security — Auth | MEDIUM RISK | JWT with 7-day expiry. No refresh token mechanism. No token revocation. Fallback to hardcoded secret in dev | `auth.ts` line 4, line 21 | High |
| Security — CORS | HIGH RISK | `cors()` called with no configuration — accepts requests from any origin | `app.ts` line 33 | High |
| Security — Input | PARTIAL | Zod validation on core routes but not on portfolio/AI routes. No request size limits beyond Express defaults | Route files; `shared-module/server/routes.ts` lacks Zod | Medium |
| Scalability | BASIC | Single-process Node.js server. No clustering, job queues, or background worker separation. CBN sync runs in-process on a timer | `index.ts` | Medium |
| Backup / Recovery | MISSING | No database backup strategy documented. No point-in-time recovery. Schema uses `push` not migrations, so no rollback path | No migration files found | High |

### Code Quality

| Item | Status | Findings | Evidence / Files | Priority |
|------|--------|----------|------------------|----------|
| Test Coverage | MISSING | Zero project-specific test files. No unit tests, integration tests, or e2e test scripts. Critical for financial calculations | No `*.test.*` or `*.spec.*` files in project source | Critical |
| Large Files | HIGH RISK | 3 files exceed 700 lines: `portfolio.tsx` (1,572), `market-data.tsx` (1,190), `mm-rates.tsx` (738). These combine state, logic, and UI in monolithic components | `artifacts/yield-desk/src/pages/` | High |
| Type Safety | MEDIUM RISK | Extensive use of `any` type across the codebase — estimated 100+ instances in project code (excluding node_modules). Bypasses TypeScript's safety | `portfolio.tsx`, `routes.ts`, `ai.ts`, `cbn-scraper.ts` | Medium |
| Code Duplication | MEDIUM RISK | Portfolio UI/logic duplicated between `shared-module/client/portfolio.tsx` (1,649 lines) and `artifacts/yield-desk/src/pages/portfolio.tsx` (1,572 lines). ~90% overlap | Both files | High |
| UI Component Duplication | LOW RISK | Full shadcn/ui component library duplicated in `mockup-sandbox/src/components/ui/` (expected for sandbox isolation) | Both `components/ui/` directories | Low |
| Dead Code | LOW RISK | `shared-module/client/portfolio.tsx` appears to be an unused earlier version of the portfolio page (1,649 lines) | `shared-module/client/portfolio.tsx` | Medium |
| Import Structure | PARTIAL | Mix of workspace package imports (`@workspace/db`) and relative path imports (`../../../shared-module/`). Inconsistent but functional | `app.ts` line 7: `../../../shared-module/server/routes` | Low |
| Hardcoded Values | MEDIUM RISK | AI platform IP address hardcoded as default (`http://209.38.100.198:8000`). Decision engine thresholds hardcoded (18%, 17%). Corridor list hardcoded in UI | `ai.ts`, `decision-engine.ts`, `portfolio.tsx` | Medium |
| Silent Error Swallowing | MEDIUM RISK | At least 2 empty `catch {}` blocks that silently ignore failures | `ai.ts:80`, `shared-module/client/portfolio.tsx:807` | Medium |
| Markdown Rendering | LOW RISK | Custom `renderMarkdown()` helper duplicated in `mm-rates.tsx` and `deals.tsx` instead of using a shared utility or library | Both page files | Low |

---

## Existing Reusable Assets

These are strong, well-built components that should be preserved and built upon:

1. **CBN Data Scraper** (`cbn-scraper.ts`) — 357 lines of clean, well-structured code that syncs from 5 CBN JSON APIs with deduplication and signal creation. Production-quality.

2. **Portfolio Engine** (`portfolio-engine.ts`) — Sophisticated valuation engine with live NGX pricing, macro-adjusted strategic values, real return calculations, and NGX transaction cost modeling.

3. **ETF Regime Detection Engine** (`etf-engine.ts`) — Novel regime classification model tailored to Nigerian monetary policy, with ETF signal mapping and factor rotation logic.

4. **API Codegen Pipeline** — OpenAPI spec → Orval → React Query hooks → Zod validators. Type-safe end-to-end when used correctly.

5. **Custom Fetch Wrapper** (`custom-fetch.ts`) — Well-implemented with robust error parsing, status code handling, and auth token injection.

6. **Decision Engine** (`decision-engine.ts`) — Clean, concise rule engine with confidence scoring. Easy to extend with additional rules.

7. **GetEquity Integration** (`getequity-client.ts`) — Clean API client with type filtering and error handling.

8. **Theme System** — Complete dark/light/system mode with CSS variables and localStorage persistence.

---

## Risks

| # | Risk | Severity | Details |
|---|------|----------|---------|
| R1 | **Zero test coverage on financial calculations** | Critical | Portfolio returns, real yield, decision engine thresholds, cost basis calculations — all untested. A single rounding or logic error could produce incorrect investment recommendations. |
| R2 | **AI credentials over plain HTTP** | Critical | API key and bearer token sent to `http://209.38.100.198:8000` in cleartext. Any network observer can capture the credentials. |
| R3 | **Open CORS policy** | High | `cors()` with no origin restrictions allows any website to make authenticated requests to the API using a user's JWT token (CSRF-like attacks). |
| R4 | **No rate limiting** | High | Login endpoint is vulnerable to brute-force attacks. AI endpoints could be abused for compute resource exhaustion. No throttling on any endpoint. |
| R5 | **No database indexes** | High | As data grows (especially `cbn_market_data` which stores thousands of auction records), queries will degrade without indexes on `userId`, `date`, `securityType`, `auctionDate`, etc. |
| R6 | **No database migrations** | High | `drizzle-kit push` offers no rollback capability. A schema change that drops data cannot be reversed. No audit trail of schema evolution. |
| R7 | **User ID type mismatch** | High | `users.id` is integer but `portfolio_holdings.userId` is `varchar(50)`. No referential integrity between the portfolio system and the user system. |
| R8 | **JWT secret fallback** | High | Falls back to `"dev-secret"` if env var is missing. If accidentally deployed without `SESSION_SECRET`, all JWTs are signed with a known value. |
| R9 | **1,500+ line monolithic components** | Medium | `portfolio.tsx` is nearly unmaintainable. Bugs are hard to isolate, and code review is impractical at this scale. |
| R10 | **No monitoring or alerting** | Medium | No error tracking (Sentry), no uptime monitoring, no performance dashboards. Failures in CBN sync or GetEquity API would go unnoticed. |

---

## Recommended Priorities

| # | Recommendation | Effort | Impact |
|---|----------------|--------|--------|
| 1 | **Add unit tests for financial engines** — Portfolio engine, decision engine, ETF regime detection, cost basis calculations. These are the highest-risk untested code paths. | Medium | Critical |
| 2 | **HTTPS for AI platform** — Either provision an SSL certificate for `209.38.100.198` or put it behind a reverse proxy with TLS termination. | Low | Critical |
| 3 | **Restrict CORS origins** — Configure `cors({ origin: [allowedDomains] })` to only accept requests from the YieldDesk frontend domain. | Low | High |
| 4 | **Add rate limiting** — Apply `express-rate-limit` to auth endpoints (login/signup) and AI endpoints at minimum. | Low | High |
| 5 | **Add database indexes** — At minimum: `cbn_market_data(securityType, auctionDate)`, `portfolio_holdings(userId)`, `alerts(userId, read)`, `holdings(userId, status)`, `mm_rates(source, date)`. | Low | High |
| 6 | **Switch to proper migrations** — Replace `drizzle-kit push` with `drizzle-kit generate` + `drizzle-kit migrate` for version-controlled schema changes. | Medium | High |
| 7 | **Fix user ID type mismatch** — Align `portfolio_holdings.userId` and `portfolio_config.userId` to integer type with proper FK to `users.id`. | Medium | High |
| 8 | **Break up large page components** — Extract `portfolio.tsx` into smaller components: `AddHoldingDialog`, `EditHoldingDialog`, `HoldingsTable`, `WealthTracker`, `PillarGauges`, `ConfigDialog`. | Medium | Medium |
| 9 | **Remove dead portfolio duplicate** — `shared-module/client/portfolio.tsx` (1,649 lines) appears unused. Confirm and remove. | Low | Low |
| 10 | **Add error boundary and monitoring** — Wrap the React app in an ErrorBoundary. Add basic uptime monitoring and error tracking. | Low | Medium |

---

## Final Verdict

YieldDesk is an **impressive domain-specific product** that demonstrates deep understanding of the Nigerian fixed income market. The data architecture — live CBN feeds, FMDQ rates, GetEquity deal integration, and AI-powered analysis — is genuinely differentiated and would be difficult for a competitor to replicate quickly.

**The core product logic is strong.** The three-pillar portfolio framework, regime detection engine, and decision engine are well-conceived and functionally complete. The AI integration adds genuine value (market briefs and deal screening), and the data pipeline from 5+ sources is robust.

**The primary concern is production readiness.** For a financial platform serving institutional investors, the absence of automated tests, open security posture (CORS, rate limiting, HTTP transport for credentials), and lack of database integrity controls represent material risks. These are not architectural problems — they are known gaps that follow a predictable remediation path.

**Assessment: 65% complete.** The remaining 35% is almost entirely security hardening, testing, code organization, and operational tooling. The product vision, data architecture, and user workflows are solid. With focused effort on the recommended priorities (especially items 1-7), YieldDesk could be production-ready within a focused development cycle.

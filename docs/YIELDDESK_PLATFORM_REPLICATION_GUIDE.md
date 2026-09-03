# YieldDesk Platform Replication Guide

**Audit status:** repository-observed implementation, audited directly from the current source tree.  
**Scope:** the pnpm workspace, the production web artifact, API artifact, shared investment/portfolio module, generated API libraries, database package, scripts, and the design sandbox. Build outputs and generated files are described but are not authoritative over their sources.  
**Security note:** this dossier intentionally omits all secret values, credentials, tokens, embedded remote credentials, and seeded/demo passwords. Where the repository contains a fixed development credential, only the existence and risk are noted.

## 1. Executive and product overview

YieldDesk is an NGN-denominated capital-allocation and yield-intelligence application for Nigerian fixed-income and multi-asset investors. It combines:

1. a rule-based CP/bond/MMMF allocation decision;
2. CRUD tracking for conventional holdings and a separate richer three-pillar wealth portfolio;
3. proprietary deal CRUD, deterministic scoring, and a GetEquity deal-room feed;
4. CBN auction, money-market-policy, and FX ingestion;
5. FMDQ interbank-rate ingestion with an HTML fallback;
6. macro-regime ETF/factor signals;
7. NGX equity mark-to-market;
8. broker-note PDF extraction; and
9. AI-generated market briefs and deal screening.

The target users are asset managers, treasury teams, family offices, pension allocators, and fixed-income traders. The product is a decision-support system, not an execution, custody, accounting, or regulated-advice system. There is no trade placement, payment flow, workspace/tenant model, approval workflow, audit journal, or entitlement system beyond `user`/`admin`.

### Core product models

There are **two holding models**:

- `holdings`: conventional CP/BOND/MMMF/STOCK positions, user-owned, with rate, dates, status, maturity calculations, dashboard allocations, and decision-engine capital.
- `portfolio_holdings`: flexible Stability/Inflation/Strategic assets with tickers, shares, acquisition value, property rent/corridor, macro valuation, live NGX marks, and rebalance analysis.

`GET /api/portfolio` merges active conventional holdings into the richer dashboard as synthetic rows with negative IDs. Conventional CP/MMMF/BOND map to Stability and STOCK maps to Inflation. Synthetic rows are display-only through that API; editing/deleting a negative ID via rich-portfolio endpoints cannot affect the source `holdings` row.

## 2. Observed architecture, artifacts, workflows, and routing

```text
Browser
  └─ React 19 SPA (Wouter + TanStack Query + generated Orval client)
       ├─ generated/OpenAPI calls ─────────────┐
       └─ handwritten fetch/apiRequest calls ──┤
                                               ▼
Express 5 API (/api)
  ├─ OpenAPI-backed routers
  ├─ handwritten CBN/MM/AI routers
  └─ shared-module routes registered directly on app
       ├─ PostgreSQL via Drizzle/pg
       ├─ CBN JSON APIs
       ├─ FMDQ JSON/HTML
       ├─ GetEquity staging API
       ├─ NGX statistics API
       └─ YieldDesk AI run API
```

### Artifact/workflow model

| Artifact | Path | Kind/base | Runtime/build behavior |
|---|---|---|---|
| YieldDesk | `artifacts/yield-desk` | web, `/` | Vite SPA; `BASE_PATH` supplies Vite/Wouter base; output `dist/public`; `PORT` required. |
| API Server | `artifacts/api-server` | API, `/api` | Express listens on required `PORT`; esbuild bundles to ESM `dist/index.mjs`; starts CBN sync after listen. |
| Canvas | `artifacts/mockup-sandbox` | design, `/__mockup` | Vite component-preview gallery. Dynamically discovers `components/mockups`; not a user-facing application and currently has no YieldDesk route integration. |

Replit declares Node 24, autoscale deployment, application router, and ports in `.replit`. The run-button workflow is named `Project`; artifact workflow definitions are platform-managed rather than checked-in command blocks. The repository root enforces pnpm in `preinstall`, uses pnpm workspaces, and requires packages to be at least 1,440 minutes old except allowlisted Replit packages. Native build allowlist includes bcrypt/esbuild/SWC/MSW/unrs-resolver.

### Directory map

```text
.
├── artifacts/
│   ├── api-server/
│   │   ├── src/{app,index}.ts
│   │   ├── src/middlewares/auth.ts
│   │   ├── src/routes/{health,auth,holdings,deals,signals,alerts,decision,admin,cbn,mm-rates,ai,index}.ts
│   │   ├── src/lib/{decision-engine,cbn-scraper,fmdq-scraper,getequity-client,portfolio-storage,logger}.ts
│   │   ├── build.mjs
│   │   └── dist/                         # generated build
│   ├── yield-desk/
│   │   ├── src/App.tsx, main.tsx, index.css
│   │   ├── src/lib/{auth,api-helpers,theme,utils}.tsx|ts
│   │   ├── src/components/layout.tsx
│   │   ├── src/components/ui/*           # shadcn/Radix primitives
│   │   ├── src/pages/*.tsx
│   │   ├── src/pages/{portfolio,market-data,mm-rates}/*
│   │   ├── public/favicon.svg
│   │   └── vite.config.ts
│   └── mockup-sandbox/
│       ├── src/App.tsx
│       ├── src/components/ui/*
│       ├── mockupPreviewPlugin.ts
│       └── vite.config.ts
├── lib/
│   ├── api-spec/{openapi.yaml,orval.config.ts}
│   ├── api-client-react/src/{generated/*,custom-fetch.ts,index.ts}
│   ├── api-zod/src/{generated/*,index.ts}
│   ├── db/src/{index.ts,schema/*}
│   └── integrations-openai-ai-server/src/{client,audio/*,image/*,batch/*}
├── shared-module/
│   ├── server/{routes,portfolio-engine,etf-engine,investment-data,stock-prices,pdf-parser}.ts
│   ├── client/investments.tsx            # legacy/standalone shared client, not mounted by SPA
│   └── types/index.ts
├── scripts/src/{seed,hello}.ts
├── docs/
├── package.json, pnpm-workspace.yaml, pnpm-lock.yaml
├── tsconfig.json, tsconfig.base.json
├── .replit
└── replit.md
```

## 3. Technology and package inventory

Versions below are the **currently installed lockfile resolutions** from `pnpm -r list --depth 0`; workspace links have no independent published version. A dependency being installed does not imply it is used by the production path.

### Root `workspace@0.0.0`

| Packages | Purpose |
|---|---|
| `@replit/connectors-sdk@0.4.0` | Replit connector infrastructure; no current YieldDesk source import. |
| `prettier@3.8.1` | Formatting. |
| `typescript@5.9.3` | Workspace compiler/project references. |
| `vitest@4.1.4` | Unit tests for decision, portfolio, and ETF engines. |

### `@workspace/api-server@0.0.0`

| Packages | Purpose |
|---|---|
| `express@5.2.1`, `cors@2.8.6`, `express-rate-limit@8.3.2`, `cookie-parser@1.4.7` | HTTP routing/middleware, CORS, throttling. Cookie parser is installed but not mounted/used. |
| `jsonwebtoken@9.0.3`, `bcrypt@6.0.0` | 7-day JWTs and password hashing/comparison. |
| `drizzle-orm@0.45.1`, workspace `db` | PostgreSQL queries. |
| `multer@2.1.1`, `pdf-parse@2.4.5`, `@types/multer@2.1.0` | In-memory PDF upload and extraction. |
| `pino@9.14.0`, `pino-http@10.5.0` | Structured application/request logging. |
| workspace `api-zod` | Generated request/response Zod validation. |
| workspace `integrations-openai-ai-server` | Installed and bundled dependency, but current AI routes use native `fetch`, not this library. |
| `esbuild@0.27.3`, `esbuild-plugin-pino@2.3.3`, `pino-pretty@13.1.3`, `thread-stream@3.1.0` | Server build and development logging workers. |
| Type packages: `@types/bcrypt@6.0.0`, `@types/cookie-parser@1.4.10`, `@types/cors@2.8.19`, `@types/express@5.0.6`, `@types/express-rate-limit@6.0.2`, `@types/jsonwebtoken@9.0.10`, `@types/node@25.3.5` | Type declarations. |

### `@workspace/yield-desk@0.0.0`

| Package family | Installed packages and purpose |
|---|---|
| Core | `react@19.1.0`, `react-dom@19.1.0`, `vite@7.3.1`, `@vitejs/plugin-react@5.1.4`; SPA/runtime/build. |
| Data/routing | `@tanstack/react-query@5.90.21`, `wouter@3.9.0`, workspace `api-client-react`; cache, route matching, generated hooks. |
| Styling | `tailwindcss@4.2.1`, `@tailwindcss/vite@4.2.1`, `@tailwindcss/typography@0.5.19`, `tw-animate-css@1.4.0`, `class-variance-authority@0.7.1`, `clsx@2.1.1`, `tailwind-merge@3.5.0`; theme tokens, utility composition, animation. |
| Radix/shadcn | `@radix-ui/react-accordion@1.2.12`, `alert-dialog@1.1.15`, `aspect-ratio@1.1.8`, `avatar@1.1.11`, `checkbox@1.3.3`, `collapsible@1.1.12`, `context-menu@2.2.16`, `dialog@1.1.15`, `dropdown-menu@2.1.16`, `hover-card@1.1.15`, `label@2.1.8`, `menubar@1.1.16`, `navigation-menu@1.2.14`, `popover@1.1.15`, `progress@1.1.8`, `radio-group@1.3.8`, `scroll-area@1.2.10`, `select@2.2.6`, `separator@1.1.8`, `slider@1.3.6`, `slot@1.2.4`, `switch@1.2.6`, `tabs@1.1.13`, `toast@1.2.15`, `toggle@1.1.10`, `toggle-group@1.1.11`, `tooltip@1.2.8`; accessible UI primitives. |
| Forms/interaction | `react-hook-form@7.71.2`, `@hookform/resolvers@3.10.0`, `zod@3.25.76`, `cmdk@1.1.1`, `input-otp@1.4.2`, `vaul@1.1.2`; installed component/form support (pages mostly use local state). |
| Visuals | `lucide-react@0.545.0`, `react-icons@5.6.0`, `recharts@2.15.4`, `framer-motion@12.35.1`, `embla-carousel-react@8.6.0`, `react-resizable-panels@2.1.9`, `react-day-picker@9.14.0`, `date-fns@3.6.0`, `sonner@2.0.7`, `next-themes@0.4.6`; icons and installed UI capabilities. YieldDesk uses its own theme provider rather than next-themes. |
| Replit/dev/types | `@replit/vite-plugin-cartographer@0.5.1`, `dev-banner@0.1.2`, `runtime-error-modal@0.0.6`, `@types/node@25.3.5`, `@types/react@19.2.14`, `@types/react-dom@19.2.3`. |

### `@workspace/mockup-sandbox@2.0.0`

The sandbox repeats the frontend foundation: React/DOM `19.1.0`, Vite `7.3.1`, Tailwind/Vite `4.2.1`, React plugin `5.1.4`, CVA `0.7.1`, clsx `2.1.1`, tailwind-merge `3.5.0`, tw-animate-css `1.4.0`, tailwindcss-animate `1.0.7`, framer-motion `12.35.1`, lucide `0.545.0`, and the same Radix versions listed above. It additionally resolves `chokidar@4.0.3` and `fast-glob@3.3.3` for mockup discovery, and includes `cmdk@1.1.1`, `date-fns@3.6.0`, `embla-carousel-react@8.6.0`, `input-otp@1.4.2`, `next-themes@0.4.6`, `react-day-picker@9.14.0`, `react-hook-form@7.71.2`, `react-resizable-panels@2.1.9`, `recharts@2.15.4`, `sonner@2.0.7`, `vaul@1.1.2`, `zod@3.25.76`, `@hookform/resolvers@3.10.0`, Replit cartographer/runtime modal, and React/Node type packages. Unlike the product artifact it does not include TanStack Query, Wouter, typography, dev-banner, or react-icons.

### Libraries and scripts

| Workspace | Packages | Purpose |
|---|---|---|
| `api-client-react` | `@tanstack/react-query@5.90.21`; React peer `>=18` | Orval split hooks/types plus robust custom fetch, bearer injection, response/error parsing, optional base URL. |
| `api-spec` | `orval@8.5.3` | Generates React Query client and Zod validators from OpenAPI. |
| `api-zod` | `zod@3.25.76` | Generated server validators. Source imports `zod/v4`, available through this package version. |
| `db` | `drizzle-orm@0.45.1`, `drizzle-zod@0.8.3`, `pg@8.20.0`, `zod@3.25.76`; dev `drizzle-kit@0.31.9`, `@types/pg@8.18.0`, `@types/node@25.3.5` | Schema, Pool connection, typed queries, schema push. |
| `integrations-openai-ai-server` | `openai@6.34.0`, `p-limit@7.3.0`, `p-retry@7.1.1` | Generic OpenAI-compatible text/image/audio/batch helper. Present but not called by current YieldDesk routes. |
| `scripts` | workspace `db`, `bcrypt@6.0.0`, `drizzle-orm@0.45.1`; dev `tsx@4.21.0`, bcrypt/node types | Seed and utility execution. |

## 4. Frontend routes, pages, workflows, and component families

Wouter is based on `import.meta.env.BASE_URL` with the trailing slash removed. `Layout` shows login/signup without navigation and wraps authenticated pages with a fixed sidebar. Unknown routes render `not-found.tsx`.

| Route | Access | Observed page/workflow |
|---|---|---|
| `/login` | Public-only | Email/password login through generated hook; token stored; redirects `/`. |
| `/signup` | Public-only | Email/password registration, minimum six characters in UI/spec; auto-login and redirect. No role selector in UI. |
| `/` | Protected | Decision card, suggested amount/confidence, total capital/effective yield/CP/bond metrics, allocation bars, maturing-soon positions, recent deals, unread-alert link. |
| `/portfolio` | Protected | Rich three-pillar wealth target, 8 metrics, pillar gauges, drift alerts, grouped marked holdings, add/edit/delete, configuration, PDF parse/import, real-return warning, ETF signal tracker, operating guide. Portfolio refresh 30s; ETF 60s. |
| `/holdings` | Protected | Conventional holding CRUD for CP/BOND/MMMF/STOCK; amount/rate/issuer/start/maturity/status; displays days left and expected maturity value. |
| `/deals` | Protected | Tabs: shared global “Your Deals” CRUD + expandable deterministic score; GetEquity cards and AI screening. GetEquity query stale for five minutes. |
| `/market-data` | Protected | “Investment Intelligence”: CPI/MPR/T-bill/FX pills, regime/risk panel, 7 ETF signals, factor rotation, 7 investment cards, comparison matrix, fixed illustrative allocation ranges, collapsible CBN auctions/policy/FX, manual sync. Investment refresh 30s and ETF 60s. |
| `/mm-rates` | Protected | NTB/OMO proxy cards; FMDQ, GetEquity CP, and manual rate tabs; FMDQ sync; manual rate create/delete; AI market brief. GetEquity query stale five minutes. |
| `/signals` | Protected | Latest CP/bond status cards, up to 50 signal history rows, unrestricted authenticated signal submission. |
| `/alerts` | Protected | User-scoped list/count, icons by type, mark-read. Sidebar count polls every 30 seconds. |
| any other | Public rendering | 404 page. |

### Component families

- **Global:** `Layout`, `Sidebar`, custom `ThemeToggle`, toast hooks, mobile hook, and a broad shadcn primitive library (accordion, alert/dialog, avatar, badge, button, calendar, card, carousel, chart, command, dialogs/drawers, forms/fields/inputs, menus/navigation, popover/progress, select/slider/switch/tabs/toast/tooltip, etc.).
- **Portfolio:** `MetricCard`, `PillarGauge`, `AddHoldingDialog`, `EditHoldingDialog`, `ConfigDialog`, `GuideSection`, `PdfUploadDialog`, `EtfModelComparison`, `HoldingsTable`, plus local types/constants/helpers.
- **Investment intelligence:** `RegimeBanner`, `RiskPanel`, `EtfStrategyTable`, `FactorRotation`, `InvestmentCard`, `CbnDataSection`, local types/constants.
- **Money markets:** `RatesTabs`, local response types/format helpers.
- **Deals:** local `DealFormFields`, `DealScoreCard`, and `GetEquityDealRoom`.

The Google-hosted Inter font is fetched by the production HTML. The design sandbox loads a much larger Google Fonts family set.

## 5. Authentication, authorization, and browser storage

### Observed implementation

- Signup/login hash passwords with bcrypt cost factor 10 and return `{token,user}`.
- JWT payload is `{userId,email,role}`; HMAC secret is `SESSION_SECRET`, expiry is seven days.
- API auth is `Authorization: Bearer <JWT>`. There is no refresh token, revocation list, rotation, server session, or cookie auth.
- `requireAuth` verifies signature/expiry and trusts the embedded role. `requireAdmin` checks `role === "admin"`.
- Browser `localStorage["token"]` stores the JWT. `main.tsx` and `AuthProvider` register a token getter for generated calls; handwritten helpers/fetches also read that key.
- Startup with a token calls `/api/auth/me`. Any query error clears the token. Logout clears it and redirects.
- `localStorage["yielddesk-theme"]` stores `light|dark|system`; default is light. System mode listens to `prefers-color-scheme`.
- No sessionStorage, IndexedDB, service worker cache, or application cookies are used.
- Frontend guards are UX guards only; API middleware is the security boundary.

### Authorization caveats

- Signup’s OpenAPI/body schema accepts a `role`, including `admin`; a caller can self-register as admin even though the UI omits it.
- Deals and signals are global, not user-owned. Any authenticated user can create/update/delete any deal and submit market signals.
- All sync endpoints and manual MM rate mutation endpoints require only a user JWT, not admin.
- `GET /api/investments` and `GET /api/etf/allocation` are runtime-public.
- `SESSION_SECRET` falls back to the known string `dev-secret`; production does not fail closed.
- JWT in localStorage is exposed to successful XSS. No CSP is defined in this repository.

## 6. Complete runtime API catalog

All paths below are actually mounted. `/api` is prepended by either `app.use("/api", router)` or included directly by shared-module registration. “JWT” means bearer JWT. Unless noted, failures are JSON `{error:string}` for generated routes or `{message:string}` for shared routes; unhandled async failures rely on Express behavior and no custom final error middleware exists.

### Health/auth

| Method/path | Auth | Input | Success output and side effects |
|---|---|---|---|
| `GET /api/healthz` | None | None | `200 {status:"ok"}`; no DB check. |
| `POST /api/auth/signup` | None; auth limiter | JSON `email`, `password>=6`, optional `role=user|admin` default user | `201 {token,user}`; unique-email check, bcrypt hash, inserts user. |
| `POST /api/auth/login` | None; auth limiter | JSON email/password | `200 {token,user}` or 401; bcrypt compare. |
| `GET /api/auth/me` | JWT | None | Public user fields `{id,email,role,createdAt}`; 404 if token user no longer exists. |

### Conventional holdings, decisions, dashboard

| Method/path | Auth | Input | Success output and side effects |
|---|---|---|---|
| `GET /api/holdings` | JWT | None | User’s holdings ascending by creation, enriched with `daysRemaining` and simple-interest `expectedMaturityValue`. |
| `POST /api/holdings` | JWT | `type CP|BOND|MMMF|STOCK`, numeric amount/rate, issuer, ISO startDate, optional maturityDate/status | `201` enriched holding; inserts with authenticated user ID. |
| `GET /api/holdings/maturing-soon` | JWT | None | Active user holdings with `maturityDate <= now+7d`, enriched. **No lower bound:** already-overdue active positions also qualify. |
| `GET /api/holdings/:id` | JWT | Integer path ID | User-owned enriched holding or 404. |
| `PUT /api/holdings/:id` | JWT | Partial holding body | Updates user-owned row; converts dates; returns enriched row. |
| `DELETE /api/holdings/:id` | JWT | Integer ID | `204`; user-scoped deletion. |
| `GET /api/decision` | JWT | None | Current `DecisionResult`; reads latest signal, user holdings, 20 global deals. Uses 15/14 rate and NGN 10m capital fallbacks. |
| `GET /api/portfolio/summary` | JWT | None | Conventional `totalCapital`, active allocations by type/issuer, all count and active count. |
| `GET /api/portfolio/analytics` | JWT | None | Effective yield, deployment, idle percentages/amounts. MMMF is idle; denominator includes all statuses while weighted yield uses active rows. |
| `GET /api/dashboard/summary` | JWT | None | Decision, latest/fallback signal, portfolio summary/analytics, unread count, maturing count, five newest of 20 fetched deals. |

### Deals, signals, alerts, admin

| Method/path | Auth | Input | Success output and side effects |
|---|---|---|---|
| `GET /api/deals` | JWT | None | All global deals ascending by creation. |
| `POST /api/deals` | JWT | issuer, rate, tenorDays, minAmount, riskLevel LOW/MEDIUM/HIGH | `201` global deal insert. |
| `GET /api/deals/:id` | JWT | Integer ID | `{deal,score}`. |
| `PUT /api/deals/:id` | JWT | Partial deal | Updates any global deal. |
| `DELETE /api/deals/:id` | JWT | Integer ID | `204`; deletes any global deal. |
| `GET /api/deals/:id/score` | JWT | Integer ID | `{score,recommendation,factors}`. |
| `GET /api/signals` | JWT | Optional coercible `limit`, default 20 | Newest signals. Invalid query silently uses 20; no explicit upper bound is visible in spec. |
| `POST /api/signals` | JWT | `{cpRate,bondYield}` | `201`; inserts global signal. |
| `GET /api/signals/latest` | JWT | None | Newest signal or 404. |
| `GET /api/alerts` | JWT | Optional coercible `unreadOnly=false` | User’s alerts, ascending creation. |
| `GET /api/alerts/count` | JWT | None | `{unread,total}` for user. |
| `PUT /api/alerts/:id/read` | JWT | Integer ID | Marks user-owned alert read and returns it. |
| `GET /api/admin/stats` | JWT + admin | None | Counts users, conventional holdings, deals, alerts, signals; `activeUsers` incorrectly equals total users. |

### CBN and money markets

| Method/path | Auth | Input | Success output and side effects |
|---|---|---|---|
| `GET /api/cbn/market-data` | JWT | None | `{ntb,bonds,omo}`, latest 12 each by auction date. |
| `GET /api/cbn/rates-summary` | JWT | None | Tenor-keyed latest rate/date maps for up to four NTB/BOND/OMO rows plus last fetched time. |
| `POST /api/cbn/sync` | JWT | None | `{success,recordsInserted,signalCreated,cpRate,bondYield}`; external fetch, auction inserts, possible signal insert. |
| `GET /api/cbn/policy-rates` | JWT | None | Latest 24 monthly indicator rows. |
| `GET /api/cbn/exchange-rates` | JWT | None | Latest 50 rows as `{rates:<currency->rows>,latest:first-six-rows}`; “latest” is not guaranteed one per currency. |
| `POST /api/cbn/sync-all` | JWT | None | Parallel market/policy/FX synchronization and `{success,market,policy,fx}`. |
| `GET /api/mm/rates` | JWT | None | `{fmdq:30,manual:30,proxy:up-to-12}`; proxy transforms CBN records to a common MM row. |
| `GET /api/mm/summary` | JWT | None | Seven-day FMDQ/manual summary and most recent NTB 91/182/364 proxies. Only three NTB rows are fetched before tenor selection, so tenors can be omitted. |
| `POST /api/mm/rates` | JWT | JSON `rateType,tenor,rate,date`, optional notes | `201` manual row. Rate must be `>0 && <=100`; rate type/tenor are otherwise unrestricted strings. |
| `DELETE /api/mm/rates/:id` | JWT | Integer ID | `204`; only rows whose source is MANUAL. |
| `POST /api/mm/sync-fmdq` | JWT | None | `{success,recordsInserted,rates}`; external requests and deduplicated inserts. |
| `GET /api/mm/getequity-cp` | JWT | None | `{configured,tokens}`; live call; tokens restricted to investment types Debt, Fixed Interest, Fund. Missing key returns 200/empty. |
| `GET /api/mm/getequity-deals` | JWT | None | `{configured,deals}`; live call; only cancelled deals removed. Missing key returns 200/empty. |

### AI and shared investment portfolio

| Method/path | Auth | Input | Success output and side effects |
|---|---|---|---|
| `POST /api/ai/market-brief` | JWT; AI limiter | Body ignored | `{brief,generatedAt}`; reads CBN/FMDQ/manual, optionally GetEquity; submits a <400-word analysis prompt. 503 when AI missing. |
| `POST /api/ai/deal-screening` | JWT; AI limiter | Optional `portfolio` is read but never incorporated | `{analysis,dealsAnalyzed,benchmarkRate,generatedAt}`; fetches deals, selects first 12 open deals, AI prompt. |
| `GET /api/investments` | **None** | None | Curated seven-instrument landscape with real-yield ranges from latest macro; 404 without policy data. |
| `GET /api/etf/allocation` | **None** | None | Regime, 7 ETF signals, static ETF prices/zero daily changes, two factor signals; 404 without policy data. |
| `GET /api/portfolio` | JWT | None | Rich dashboard merging rich holdings and active conventional holdings; calls NGX when tickers need refresh. |
| `POST /api/portfolio/holdings` | JWT | `asset,pillar,valueNgn`; optional ticker/shares/entryValueNgn/rent/corridor/date | Adds row or merges same resolved ticker+pillar when shares supplied. Strategic row records current FX. Returns 200, including for create (not 201). |
| `PATCH /api/portfolio/holdings/:id` | JWT | Partial rich holding fields | User-scoped update; stamps `lastUpdated`; strategic value update can reset entry FX. |
| `DELETE /api/portfolio/holdings/:id` | JWT | ID | Always `200 {success:true}`, even when no row matched. |
| `POST /api/portfolio/config` | JWT | Required baselineValue; target/cash/three targets/tolerance optional | User-ID upsert; returns config. Server does not require targets to sum to 1 or enforce ranges. |
| `POST /api/portfolio/parse-pdf` | JWT | `multipart/form-data`, field `file`, PDF MIME, max 5 MiB | Parsed transaction JSON; memory-only processing, no file persistence. |

### OpenAPI/runtime discrepancy audit

OpenAPI 3.1 declares 23 path objects and generated operations. It contains **no security scheme or operation security declarations**, so documentation falsely implies all listed endpoints are public even though all except health/signup/login require JWT at runtime.

Runtime routes absent from OpenAPI:

`GET /cbn/market-data`, `GET /cbn/rates-summary`, `POST /cbn/sync`, all seven `/mm/*` operations, both `/ai/*` operations, `GET /investments`, `GET /etf/allocation`, `GET /portfolio`, rich portfolio holding POST/PATCH/DELETE, portfolio config POST, and PDF parse POST. These are consumed with handwritten types/fetches.

Other discrepancies:

- OpenAPI describes deals as not carrying `userId`, matching current schema; older prose claiming user-owned deals is stale.
- OpenAPI includes only CBN policy/FX/sync-all, not all mounted CBN routes.
- Runtime signup permits caller-selected admin role exactly as OpenAPI declares; this is a security defect, not merely documentation.
- Several handwritten routes use `{message}` rather than the spec’s `{error}`.
- The AI code reads nonexistent Drizzle fields `stopRate` from CBN rows. At runtime this is `undefined`; market-brief NTB/OMO `stopRate` values disappear during JSON serialization and deal-screening benchmark becomes `0` when rows exist. The actual schema field is `marginalRate`.

## 7. External integrations

| Service | Exact base/public URL and called path | Authentication | Transformation, frequency, fallback |
|---|---|---|---|
| CBN | Base `https://www.cbn.gov.ng/api`; GET `/GetAllSecuritiesNTB`, `/GetAllSecuritiesFGNBond`, `/GetAllSecuritiesOMO`, `/GetAllMoneyMarketIndicators`, `/GetAllExchangeRates`; referer `https://www.cbn.gov.ng/rates/GovtSecurities.html` | None; browser-like User-Agent/Accept/Referer | 30s timeout. On startup and hourly; also user-triggered. Each feed catches failure to empty data, so full sync can report success with zero inserts. Auctions retain first 20/feed; policy first 24; FX filters six named currencies. Dates/numeric strings normalized. |
| FMDQ | `https://fmdqgroup.com/wp-json/fmdq/v1/nibor`; `https://fmdqgroup.com/wp-json/fmdq/v1/repo-obb`; fallback `https://fmdqgroup.com/market-data/money-market/` | None; browser-like headers | On authenticated user request only. 15s timeout. JSON arrays map rate/value, tenor/maturity, date; if both yield no records, regex/table HTML scrape. Failures log and return empty. |
| GetEquity | Default base `https://ge-exchange-staging-1.herokuapp.com/v1`; GET `/api/tokens?page=1&limit=200` | `Authorization: Bearer GETEQUITY_API_KEY` | On page query/AI requests; browser cache staleTime five minutes only for page reads, no server cache. 15s timeout. All deals remove `cancelled`; CP removes by investment type. Missing/failing integration becomes empty/null, generally not an exception. Only first page is fetched despite response pagination fields. |
| NGX | GET `https://doclib.ngxgroup.com/REST/api/statistics/equities/?market=&sector=&orderby=&pageSize=300&pageNo=0` | None; custom User-Agent | Lazy when portfolio needs ticker data; in-memory all-equity registry TTL 2 minutes. Uses close then previous close, name/ticker alias and fuzzy containment. On failure logs and retains old cache; holdings remain at stored cost/value with no live mark. |
| YieldDesk AI | Configured base `YIELDDESK_AI_BASE_URL`; current repository deployment metadata points to `http://209.38.100.198:8000`; POST `/v1/runs` | Same key sent in `X-API-Key` and bearer Authorization; tenant in both `X-Tenant` and `X-Tenant-ID` | On explicit brief/screen actions, max API route rate 10/min/IP. Sends `{prompt,task_type:"fast"}` and extracts `text`, then `result`, then `output`, else stringified response. No timeout/retry/fallback model. Warns for nonlocal HTTP but still transmits credentials. |
| Google Fonts | `https://fonts.googleapis.com` stylesheet and `https://fonts.gstatic.com` assets | None | Browser page load; Inter in product, broad font set in sandbox. No local fallback asset beyond CSS font fallback. |
| Generic OpenAI-compatible library | Base/key from `AI_INTEGRATIONS_OPENAI_BASE_URL` and `AI_INTEGRATIONS_OPENAI_API_KEY` | OpenAI SDK API key | Library supports text, image, audio, batch with retry/concurrency helpers, but is not invoked by current YieldDesk production routes. |

## 8. Environment variables

Only names are shown; the template contains placeholders, not values.

| Name | Required? / default | Purpose | Consumer |
|---|---|---|---|
| `DATABASE_URL` | Required, no default; throws at DB import/config | PostgreSQL connection string | `lib/db/src/index.ts`, Drizzle config, all DB users |
| `PORT` | Required for API and each Vite artifact, no default | Listener/dev-preview port | API `index.ts`, both Vite configs |
| `BASE_PATH` | Required by both Vite configs | Vite public base and Wouter route base | product and sandbox Vite |
| `NODE_ENV` | Optional; API dev command sets development | Production logger mode and conditional Replit plugins | API logger, Vite configs |
| `REPL_ID` | Optional, platform supplied | Enables development cartographer/dev banner | Vite configs |
| `CORS_ALLOWED_ORIGINS` | Optional; absent means reflect any origin | Comma-separated origin allowlist | API app |
| `SESSION_SECRET` | Operationally required for security; code default `dev-secret` | JWT sign/verify secret | auth middleware |
| `LOG_LEVEL` | Optional; default `info` | Pino log level | API logger |
| `GETEQUITY_BASE_URL` | Optional; defaults to staging base above | GetEquity API base | GetEquity client |
| `GETEQUITY_API_KEY` | Optional; feature disabled without it | GetEquity bearer credential | GetEquity client |
| `YIELDDESK_AI_BASE_URL` | Optional; AI returns 503 without it | AI platform base | AI router |
| `YIELDDESK_AI_TENANT_ID` | Optional; default `yielddesk` | AI tenant headers | AI router |
| `YIELDDESK_AI_API_KEY` | Optional; AI returns 503 without it | AI bearer/API key | AI router |
| `VITE_API_URL` | Optional; default empty/same-origin | Browser API origin prefix for custom helpers/PDF | product frontend |
| `AI_INTEGRATIONS_OPENAI_BASE_URL` | Required only if generic integration library is imported/used | OpenAI-compatible SDK base | integration library |
| `AI_INTEGRATIONS_OPENAI_API_KEY` | Required only if generic integration library is imported/used | OpenAI-compatible SDK key | integration library |
| `CI` | Optional/platform build sets true | Build environment behavior | deployment post-build/tooling |

```dotenv
# Server/database
DATABASE_URL=postgresql://<user>:<password>@<host>:<port>/<database>
PORT=<api-port>
SESSION_SECRET=<long-random-secret>
CORS_ALLOWED_ORIGINS=https://<frontend-host>
LOG_LEVEL=info
NODE_ENV=production

# Optional market/deal source
GETEQUITY_BASE_URL=https://<getequity-api-host>/<version>
GETEQUITY_API_KEY=<getequity-api-key>

# Optional YieldDesk AI
YIELDDESK_AI_BASE_URL=https://<ai-host>
YIELDDESK_AI_TENANT_ID=<tenant-id>
YIELDDESK_AI_API_KEY=<ai-api-key>

# Frontend build/run (set separately for the web process)
PORT=<web-port>
BASE_PATH=/
VITE_API_URL=https://<api-host>

# Optional generic OpenAI-compatible library (currently unused by YieldDesk routes)
AI_INTEGRATIONS_OPENAI_BASE_URL=https://<openai-compatible-host>/v1
AI_INTEGRATIONS_OPENAI_API_KEY=<openai-compatible-key>
```

## 9. Database schema dictionary

PostgreSQL is accessed through one `pg.Pool` and Drizzle. Monetary/rate values use PostgreSQL `real` (single precision), not decimal/numeric. There are no checked enums, migrations, row-level security policies, cascade rules, or updated-at triggers in source; schema is applied with `drizzle-kit push`.

| Table | Columns (DB name: type, null/default) | Indexes/relationships |
|---|---|---|
| `users` | `id: serial PK`; `email: text NOT NULL UNIQUE`; `password_hash: text NOT NULL`; `role: text NOT NULL DEFAULT 'user'`; `created_at: timestamptz NOT NULL DEFAULT now()` | Unique email. Referenced by conventional holdings and alerts. Role is unconstrained text at DB level. |
| `holdings` | `id: serial PK`; `user_id: integer NOT NULL`; `type: text NOT NULL`; `amount: real NOT NULL`; `rate: real NOT NULL`; `issuer: text NOT NULL`; `start_date: timestamptz NOT NULL`; `maturity_date: timestamptz NULL`; `status: text NOT NULL DEFAULT 'ACTIVE'`; `created_at: timestamptz NOT NULL DEFAULT now()` | FK `user_id -> users.id` (no cascade). Indexes `holdings_user_id_idx(user_id)`, `holdings_user_status_idx(user_id,status)`, `holdings_maturity_date_idx(maturity_date)`. |
| `deals` | `id: serial PK`; `issuer: text NOT NULL`; `rate: real NOT NULL`; `tenor_days: integer NOT NULL`; `min_amount: real NOT NULL`; `risk_level: text NOT NULL`; `created_at: timestamptz NOT NULL DEFAULT now()` | No secondary index/FK/user owner. |
| `signals` | `id: serial PK`; `cp_rate: real NOT NULL`; `bond_yield: real NOT NULL`; `created_at: timestamptz NOT NULL DEFAULT now()` | `signals_created_at_idx(created_at)`. |
| `alerts` | `id: serial PK`; `user_id: integer NOT NULL`; `type: text NOT NULL`; `message: text NOT NULL`; `read: boolean NOT NULL DEFAULT false`; `created_at: timestamptz NOT NULL DEFAULT now()` | FK `user_id -> users.id`; `alerts_user_id_idx(user_id)`, `alerts_user_read_idx(user_id,read)`. |
| `cbn_market_data` | `id: serial PK`; `source: varchar(20) NOT NULL`; `security_type: varchar(20) NOT NULL`; `tenor: varchar(20) NOT NULL`; `auction_date: timestamptz NULL`; `maturity_date: timestamptz NULL`; `marginal_rate: real NULL`; `true_yield: real NULL`; `amount_offered: real NULL`; `total_subscription: real NULL`; `total_successful: real NULL`; `fetched_at: timestamptz NOT NULL DEFAULT now()` | Indexes `security_type`, `(security_type,auction_date)`, `auction_date`. No unique constraint; sync performs application-level existence query. |
| `cbn_policy_rates` | `id: serial PK`; `period: varchar(30) NOT NULL`; `year: integer NOT NULL`; `month: integer NOT NULL`; nullable `real`: `mpr`, `inter_bank_call_rate`, `treasury_bill`, `savings_deposit`, `one_month_deposit`, `three_months_deposit`, `six_months_deposit`, `twelve_months_deposit`, `prime_lending`, `max_lending`; `fetched_at: timestamptz NOT NULL DEFAULT now()` | `cbn_policy_rates_year_month_idx(year,month)`. No unique constraint. |
| `cbn_exchange_rates` | `id: serial PK`; `currency: varchar(50) NOT NULL`; `rate_date: timestamptz NOT NULL`; nullable `real`: `buying_rate`, `central_rate`, `selling_rate`; `fetched_at: timestamptz NOT NULL DEFAULT now()` | Indexes currency and rate date. No composite unique constraint. |
| `mm_rates` | `id: serial PK`; `source: varchar(30) NOT NULL`; `rate_type: varchar(30) NOT NULL`; `tenor: varchar(30) NOT NULL`; `rate: real NOT NULL`; `date: timestamptz NOT NULL`; `notes: text NULL`; `created_at: timestamptz NOT NULL DEFAULT now()` | Indexes source, `(source,date)`, date. No user ownership or unique constraint. |
| `portfolio_holdings` | `id: serial PK`; `user_id: varchar(50) NOT NULL`; `asset: varchar(200) NOT NULL`; `ticker: varchar(50) NULL`; `pillar: varchar(20) NOT NULL`; nullable `real`: `shares`, `entry_value_ngn`, `entry_fx_rate`, `annual_rent_ngn`, `cumulative_rent_ngn`; `value_ngn: real NOT NULL`; `corridor: varchar(50) NULL`; `entry_date: timestamptz NULL`; `last_updated: timestamptz NULL` | Indexes user, `(user,pillar)`, ticker. **No FK** because user ID is varchar while users.id is integer. |
| `portfolio_config` | `id: serial PK`; `user_id: varchar(50) NOT NULL UNIQUE`; target `real NOT NULL`: stability default `.10`, inflation `.15`, strategic `.75`, tolerance `.05`; nullable `real`: `baseline_value`, `target_value`, `available_cash` | Unique user ID; no FK/index explicitly beyond unique backing index. |

## 10. Business logic and formulas

### Decision engine

1. Eligible deal CP set: global deals where `rate >= 18`, descending rate.
2. `effectiveCpRate = max(signal.cpRate, bestEligibleDeal.rate)` if a deal exists.
3. If effective CP `>=18`: `INVEST_CP`, amount `round(totalCapital*0.60)`.
   - confidence HIGH at `>=22`, MEDIUM at `>=20`, otherwise LOW.
4. Else if bond yield `>=17`: `LOCK_BONDS`, amount `round(totalCapital*0.50)`.
   - confidence HIGH at `>=20`, MEDIUM at `>=18`, otherwise LOW.
5. Else: `HOLD_MMMF`, amount all capital, confidence HIGH.
6. No risk-level exclusion affects CP eligibility; risk appears only in explanation.
7. If user total capital is zero, decision uses NGN 10,000,000. Missing signal uses CP 15 and bond 14.

### Deal score

```text
yieldScore = min(rate / 20 * 5, 5)        # no lower clamp
issuerScore = LOW ? 5 : MEDIUM ? 3 : 1
tenorScore = <=90 ? 5 : <=180 ? 4 : <=365 ? 3 : 2
diversificationScore = 3                  # constant
totalScore = average(four factors) * 5    # displayed /20, theoretical max 25
recommendation = >=15 INVEST, >=10 HOLD, else PASS
```

The UI labels the score `/20`, while four factors max to 5 and the formula can produce 22.5 because diversification is fixed at 3 (or 25 if later raised). This scale is internally inconsistent.

### Conventional holding and portfolio metrics

- Days remaining: `max(0, ceil((maturity-now)/86,400,000))`.
- Expected maturity value (simple annualized interest): `amount * (1 + rate/100 * totalDays/365)`.
- Conventional total capital includes all statuses.
- Allocation values include active holdings only; each percentage is `active type-or-issuer value / active total * 100`, rounded to 2 decimals.
- Deployed = active non-MMMF amount. Idle = all-status total capital − deployed.
- Effective yield = `sum(active rate*amount) / all-status totalCapital`, rounded 2 decimals.
- Deployment and idle percentages use all-status total as denominator. Therefore matured/sold capital can inflate “idle”.

### Rich three-pillar portfolio

Defaults: Stability 10%, Inflation 15%, Strategic 75%, tolerance 5 percentage points. For each pillar:

```text
value = sum(current values)
weight = value / totalValue
drift = weight - target
alert when abs(drift) > tolerance           # equality does not alert
```

Baseline is configured positive baseline if present, else sum of each holding’s `entryValueNgn ?? valueNgn`. Nominal return is `(totalValue-baseline)/baseline*100`. Exact Fisher real return is:

```text
realReturn = ((1 + nominalReturn/100) / (1 + inflation/100) - 1) * 100
```

Investment-card real yield uses the simpler endpoint subtraction `nominal range endpoint - inflation`.

Wealth target UI:

- achieved `% = totalValue/targetValue*100`;
- growth needed `x = targetValue/totalValue`;
- gap `= max(targetValue-totalValue,0)`;
- holding vs target `= holdingValue/targetValue*100`;
- cost drag `= (commissions+fees+taxes)/baseline*100`.

### Live equity values and costs

For non-Strategic positions with ticker and positive shares:

```text
liveValue = shares * NGX close-or-previous-close
gainLossPct = (liveValue - (entryValueNgn ?? storedValue)) / costBasis * 100
```

Missing feed leaves stored value and a null gain/loss. Same-ticker purchase merge adds shares and cost, computes average price, and stores `valueNgn = totalShares*averagePrice`, which equals total cost until the next dashboard mark.

Costs apply to every holding with a ticker that is not Strategic:

- brokerage/commission: 1.35%;
- SEC fee: 0.30%;
- NSE fee: 0.30%;
- CSCS fee: 0.30%;
- fees total: 0.90%;
- stamp duty/tax: 0.075%;
- aggregate displayed cost: 2.325% of consideration.

They are estimates recomputed on **current value**, not persisted actual transaction costs, and do not distinguish buys/sells.

### Strategic valuation, rent, and IRR

Only Strategic positions with `lastUpdated` at least one day old are adjusted:

```text
inflationFactor = 1 + currentInflation/100 * daysSinceLastUpdated/365
fxFactor = currentFxRate/entryFxRate when both >0, else 1
macroAdjustedValue = storedValue * inflationFactor * fxFactor
cumulativeRent = annualRent * yearsSinceEntry
rentalYield = annualRent / storedValue * 100
strategicIRR = ((adjustedValue+cumulativeRent)/(entryValueNgn ?? storedValue))^(1/years) - 1
```

IRR is suppressed for under 0.01 years. The adjustment compounds again from stored value on every read while `lastUpdated` remains fixed, but does not persist the adjusted value. Inflation is hard-coded to 33.2% in the storage adapter; current FX falls back to 1550 and MPR to 26.5. There is no NBS inflation integration despite UI wording.

### Macro regime and ETF/factor engine

Defaults if nullish macro fields: MPR 18, inflation 15. `realRate = MPR-inflation`.

| Priority condition | Regime | Confidence |
|---|---|---|
| `MPR>=20 && realRate>2` | Tight Liquidity | `min(.85, .4 +(MPR-18)*.05 + max(realRate-1,0)*.08)` |
| else `MPR>=16 && realRate>0` | Moderate Liquidity | `min(.75, .35 + abs(realRate)*.1)` |
| else `realRate<-1` | Loose Liquidity | `min(.8, .4 + abs(realRate)*.06)` |
| else | Easing Cycle | fixed `.45` |

The seven modeled ETFs are VETBANK, VETGOODS, VETINDETF, VSPBONDETF, GREENWETF, MERGROWTH, and MERVALUE. Prices are hard-coded respectively to 15.50, 8.75, 12.30, 105.20, 22.40, 18.60, 14.90 and `change1d=0`; they do not use the NGX feed.

Signal matrix (`signal/confidence`):

| Regime | VETBANK | VETGOODS | VETINDETF | VSPBONDETF | GREENWETF | MERGROWTH | MERVALUE | Growth factor | Value factor |
|---|---|---|---|---|---|---|---|---|---|
| Tight | BUY/.85 | HOLD/.65 | HOLD/.60 | BUY/.80 | HOLD/.65 | SELL/.75 | BUY/.80 | SELL/.80 | BUY/.80 |
| Moderate | HOLD/.60 | HOLD/.55 | HOLD/.55 | BUY/.70 | HOLD/.55 | HOLD/.55 | HOLD/.60 | HOLD/.55 | HOLD/.60 |
| Loose | HOLD/.55 | BUY/.75 | BUY/.70 | SELL/.65 | BUY/.70 | BUY/.80 | HOLD/.55 | BUY/.80 | SELL/.65 |
| Easing | HOLD/.50 | BUY/.65 | BUY/.65 | HOLD/.55 | HOLD/.55 | BUY/.70 | HOLD/.50 | BUY/.70 | HOLD/.50 |

### Curated investment landscape

Seven static instruments and nominal ranges are transformed using hard-coded/current inflation:

- NTB 14–19% (91d 14–17, 182d 15–18, 364d 16–19);
- FGN bonds 16–20% (3–5y 16–19, 7–10y 17–19.5, 15+y 18–20);
- VSP bond ETF 10–20% (yield income 14–18, capital gain −5–10);
- MMF 13–16%;
- Nigerian equities 6–30% (banks 8–12, cement 6–10, energy 7–11);
- prime Lagos real estate 5–15% (rent 5–8, appreciation 8–15);
- fixed deposits 8–14% (90–180d 8–12, one year 10–14).

These are code constants, not live observations.

## 11. Scheduled jobs, sync, and deduplication

- `startCbnSync(3,600,000)` fires three independent initial promises after the server begins listening, then all three every hour using one `setInterval`. Calls can overlap if a cycle lasts over an hour. There is no distributed lock, job persistence, retry/backoff, leader election, or graceful `stopCbnSync()` wiring.
- Autoscale/multiple API replicas would each run the scheduler.
- Auction dedup queries `(securityType,tenor,auctionDate)` before insert. Policy queries `(year,month)`. FX queries `(currency,rateDate)`. None has a matching DB unique constraint, so concurrent runs can duplicate.
- FMDQ dedup queries `(source='FMDQ',rateType,tenor,date>=today-local-midnight)`, retaining at most one daily row per tuple and never updating a changed intraday value.
- Signal creation checks only signals in the prior hour. It inserts if no recent signal or either available rate differs by more than 0.1. Missing sides fall back to newest signal, then CP 15/bond 14.
- CBN market sync only processes the first 20 records per security feed and skips a record when `marginalRate` is falsy, including zero.
- Manual rates are never deduplicated.
- GetEquity and NGX are not persisted. NGX has process-local 2-minute cache; GetEquity has no server cache.

## 12. PDF parsing

The endpoint accepts one multipart field named `file`, memory storage, maximum 5 MiB, and exact MIME `application/pdf`. `pdf-parse` extracts text. Regexes derive:

- transaction type: “BUY CONTRACT”, “SELL CONTRACT”, any word “buy”, else SELL;
- security: two uppercase-oriented patterns, else `"Unknown"`;
- quantity and price;
- gross amount from `Gross NGN`, else quantity×price;
- total contract amount, else gross;
- trade/settlement dates in `DD-Mon-YYYY`;
- fees = rounded `(totalAmount-grossAmount)`;
- broker names for Meristem, Stanbic, CSL/CardinalStone, Chapel Hill Denham, Renaissance Capital, Afrinvest, and Cordros; else Unknown Broker.

The parsed ticker is simply uppercase security text; the subsequent rich-holding route attempts NGX resolution. No OCR, encrypted/image PDF support, page-layout model, validation that numeric outputs are nonzero, SELL-specific portfolio reduction, duplicate contract-note detection, malware scanning, hash/audit storage, or parser cleanup call exists. The UI imports both BUY and SELL output as a positive holding.

## 13. Errors, logging, and security

### Observed controls

- Pino request logs contain request ID/method/path-without-query and response status.
- Redaction covers authorization, cookie, and set-cookie headers.
- Pretty transport is development-only; `LOG_LEVEL` defaults to info.
- CORS accepts only configured comma-separated origins when supplied; no-origin clients are allowed. Without configuration it reflects any origin and allows credentials.
- Limits: JSON 1 MiB, PDF 5 MiB; auth 20 requests/15m/IP, AI 10/min/IP, global 200/min/IP. Standard rate-limit headers enabled.
- Password hashes are never returned. Queries for conventional holdings/alerts and rich holdings/config are user-scoped.
- Frontend AI markdown first HTML-escapes `&<>`, then performs limited markdown substitutions before `dangerouslySetInnerHTML`, reducing but not formally eliminating renderer risk.
- Supply-chain minimum release age and native build allowlist are configured.

### Gaps and recommendations

Recommendations (not current behavior):

1. Fail startup without a strong `SESSION_SECRET`; prohibit role in public signup and assign user server-side.
2. Add Helmet/CSP/HSTS, HTTPS-only AI, strict CORS in production, request IDs across outbound calls, and a final structured error handler.
3. Move JWT to secure HttpOnly SameSite cookies or implement a hardened token lifecycle; add refresh/revocation and password controls.
4. Apply admin authorization to sync/manual signal/rate/deal-management operations as policy requires.
5. Add Zod validation to every handwritten route, finite/range checks, target-sum checks, and valid-date/ID checks.
6. Avoid logging external response body fragments where sensitive data might appear; centralize console logging into Pino.
7. Add DB constraints/enums, decimal monetary types, unique dedup keys, FK-compatible rich user IDs, transactions, cascade policy, and migrations.
8. Add SSRF-safe configured hosts, outbound timeouts for AI, retries/circuit breakers, and service health metrics.

## 14. OpenAPI/code generation pipeline

`lib/api-spec/openapi.yaml` is OpenAPI 3.1 with server `/api` and title forced to `Api` because generated import names depend on it. Run:

```bash
pnpm --filter @workspace/api-spec run codegen
```

Orval `8.5.3` produces:

- split React Query operations/types under `lib/api-client-react/src/generated`;
- split Zod operations under `lib/api-zod/src/generated` and TS schema types under `generated/types`;
- base URL `/api`;
- generated calls through `customFetch`;
- coercion of query/path boolean/number/string and body/response bigint/date; date objects enabled.

`customFetch` supports optional global base URL and auth getter, merges headers, detects body/media types, parses JSON/text/blob, and throws rich `ApiError`/`ResponseParseError`. `lib/api-zod/src/index.ts` should export generated API validators without wildcard collisions from generated types.

The pipeline is one-way: no CI drift check is configured, and handwritten runtime routes bypass the spec/codegen. Replication should first reconcile the runtime catalog above into OpenAPI, add bearer security, regenerate, then replace handwritten client types.

## 15. Build, development, database, seed, and tests

```bash
# install (pnpm is enforced)
pnpm install

# full project references + artifact/script checks
pnpm run typecheck

# typecheck, then recursively build packages that define build
pnpm run build

# API (builds first, then starts dist; PORT required)
pnpm --filter @workspace/api-server run dev
pnpm --filter @workspace/api-server run build
pnpm --filter @workspace/api-server run start

# product web (PORT and BASE_PATH required)
pnpm --filter @workspace/yield-desk run dev
pnpm --filter @workspace/yield-desk run build
pnpm --filter @workspace/yield-desk run serve

# design sandbox
pnpm --filter @workspace/mockup-sandbox run dev
pnpm --filter @workspace/mockup-sandbox run build
pnpm --filter @workspace/mockup-sandbox run preview

# schema/code generation
pnpm --filter @workspace/db run push
pnpm --filter @workspace/db run push-force
pnpm --filter @workspace/api-spec run codegen

# seed (not idempotent; inserts fixed development users/data)
pnpm --filter @workspace/scripts run seed

# tests: root has Vitest; no package test script is declared
pnpm exec vitest run
```

There are 54 observed unit cases: 18 decision, 20 ETF, 16 portfolio. There are no route/integration/browser tests, external adapter contract tests, DB migration tests, accessibility tests, or load/security tests. The seed contains fixed development credentials and will fail on repeated unique emails; never use those credentials in production and rotate/remove them from distributable seeds.

The API build is bundled ESM with linked source maps and Pino worker plugin. Native/dynamic packages including bcrypt, multer, and pdf-parse are externalized and therefore must be present at runtime.

## 16. AI-tool replication prompt and implementation order

### Copyable implementation prompt

> Reconstruct YieldDesk as a TypeScript pnpm monorepo for Nigerian NGN capital allocation. Use React 19/Vite/Tailwind/shadcn/Wouter/TanStack Query, Express 5, PostgreSQL/Drizzle, JWT+bcrypt, Zod, OpenAPI 3.1/Orval, and Vitest. Implement the exact routes, schemas, formulas, external adapters, two holding models, pages, sync behavior, PDF parser, and ETF regime matrix in this dossier. Treat sections labeled observed as compatibility requirements and sections labeled recommendations as hardening work requiring explicit approval. Never embed credentials or demo passwords. Build OpenAPI first as the complete contract, generate clients/validators, then implement adapters/services/routes/UI. Use decimal monetary storage, DB unique constraints, migrations, server-assigned roles, strict production secret checks, HTTPS integrations, and tests unless byte-for-byte legacy compatibility is required. Preserve NGN formatting and three pillars: Stability, Inflation Hedge, Strategic. Clearly label static research assumptions and never present them as live data.

### Recommended implementation sequence

1. **Workspace/platform:** root pnpm/TypeScript configs, Node 24, package boundaries, environment schema, lint/format/test scripts.
2. **Contract first:** put every runtime operation in OpenAPI, bearer scheme and per-operation auth, consistent error envelope, generated clients/Zod.
3. **Database:** migrations for every table; decimal money/rates; enum/check constraints; FK-rich user IDs; unique CBN/FMDQ keys; indexes.
4. **Security/auth:** fail-closed secret validation, user-only signup, bcrypt, JWT/session strategy, admin policy, CORS/Helmet/rate limits.
5. **Core repositories:** user, holdings, deal, signals, alerts, macro/MM, rich portfolio/config repositories with transactions.
6. **Pure engines:** conventional enrichment/analytics, decision and deal scoring, portfolio/real-return/strategic metrics, investment landscape, ETF matrix. Lock behavior with unit tests.
7. **External adapters:** CBN then FMDQ then NGX then GetEquity then AI; explicit DTO schemas, timeouts, retries, provenance/freshness, caching and fallback state.
8. **Schedulers:** singleton/queue worker, idempotent upserts under unique keys, run history/metrics, startup strategy.
9. **API routes:** generated validation and serializers; integration tests for auth, ownership, errors, dedup, and malformed external data.
10. **Frontend shell:** fonts/theme/auth, query client, protected/public routing, sidebar/toasts/error boundaries.
11. **Primary pages:** dashboard → holdings/deals/signals/alerts → rates → investments → rich portfolio.
12. **PDF flow:** MIME/signature validation, parser fixtures for each broker, BUY/SELL handling, duplicate hash and user confirmation.
13. **AI features:** provider abstraction, HTTPS, prompt limits, provenance, timeout/fallback, safe Markdown.
14. **Operational readiness:** seed factory without static production credentials, health/readiness, observability, backup/restore, CI codegen drift and E2E.

## 17. Validation checklist

- [ ] Fresh pnpm install succeeds under Node 24 and lockfile is unchanged.
- [ ] Typecheck/build/codegen all succeed; generated diff is clean.
- [ ] All cataloged paths are represented in OpenAPI and runtime; security declarations match middleware.
- [ ] Health, signup/login/me, JWT expiry/invalid token, non-admin 403, and forbidden self-admin signup are tested.
- [ ] User A cannot read/update/delete User B holdings, alerts, rich holdings, or config.
- [ ] Deal/signal/global-data authorization policy is explicit and tested.
- [ ] Every table/column/default/index/FK/unique key matches migrations and dictionary.
- [ ] CBN dates/numbers, partial failures, dedup/upsert, signal threshold >0.1, and multi-worker concurrency are tested.
- [ ] FMDQ JSON and HTML fixtures parse; failed source is surfaced with freshness, not silently “live”.
- [ ] GetEquity pagination, missing key, timeout, malformed DTO, cancelled/CP filtering are tested.
- [ ] NGX aliases, cache expiry, stale-cache fallback, and missing ticker preserve values correctly.
- [ ] Decision boundaries 18/20/22 CP and 17/18/20 bond, amounts, deal precedence, and empty-capital behavior match.
- [ ] Deal score scale/recommendation is intentionally selected and UI denominator matches.
- [ ] Nominal/real return, transaction costs, target progress, rent, IRR, FX/inflation adjustment, and drift equality boundaries match.
- [ ] All four regimes and all ETF/factor matrix cells match; ETF prices are clearly static or replaced with live data.
- [ ] PDF limit/MIME/signature/invalid/encrypted/image cases and broker fixtures work; SELL does not add a positive position.
- [ ] Browser token/theme storage, logout, expired-token redirect, API-base and non-root `BASE_PATH` work.
- [ ] Every page has loading/empty/error states, keyboard navigation, responsive layout, and accessible labels.
- [ ] Rate limits, CORS, CSP, log redaction, no-secret scans, SQL constraints, and dependency audit pass.
- [ ] Scheduler runs once per intended deployment, is observable/idempotent, and shuts down cleanly.
- [ ] Seed is idempotent or explicitly destructive and contains no distributable password.
- [ ] Backup/restore and data-retention procedures are validated.

## 18. Current risks, gaps, and replacement options

### High priority observed risks

1. **Privilege escalation:** public signup accepts `role:"admin"`.
2. **Weak secret fallback:** absent session secret uses `dev-secret`.
3. **Plain-HTTP configured AI host:** credentials and investment context can transit unencrypted.
4. **Incorrect CBN field in AI:** `stopRate` does not exist; benchmark/context is wrong.
5. **Hard-coded macro data:** inflation 33.2 and FX/MPR fallbacks drive “live” intelligence; no NBS source.
6. **Static ETF prices:** ETF cards present constants and zero change as price data.
7. **Global mutable business data:** deals/signals/MM entries are not owned and broadly mutable by authenticated users.
8. **Money precision:** `real` is unsuitable for institutional NGN balances and exact rates.
9. **Scheduler races:** no unique constraints/distributed lock; autoscale replicas can duplicate.
10. **OpenAPI drift:** many product-critical routes absent and all auth undocumented.

### Additional gaps

- Two overlapping holding models and two portfolio endpoint meanings cause consistency/UX issues.
- CBN/FMDQ error catches can make a “successful” sync empty; no source status/freshness table.
- GetEquity is staging-only by default and only fetches the first page.
- No DB transactions around dedup-check/insert, ticker merge, or config upsert.
- Rich IDs are varchar and lack FK; delete returns success on no-op.
- Inputs on handwritten routes permit NaN/infinity/negative or invalid dates in several paths.
- No pagination on internal lists; deal room renders all returned cards.
- AI has no timeout and can tie up requests; output lacks model/provider/provenance.
- AI `portfolio` request body is ignored.
- Dashboard analytics mix all-status denominators with active numerators.
- Maturing-soon includes overdue active rows.
- Rebalance targets are UI-enforced only.
- Conventional holdings synthesized into rich portfolio cannot be managed there.
- PDF parsing is regex-only and SELL semantics are wrong.
- Admin `activeUsers` is total users.
- UI says ETF intelligence refreshes every six hours, while query refetches every minute and server computes on request.
- UI claims live NBS data in ETF disclaimer, but no NBS call exists.
- No migrations, CI definition, API integration/E2E tests, audit logs, telemetry, readiness DB check, backups, or compliance controls.

### Replacements if proprietary/unavailable services are missing

| Dependency | Compatible replacement |
|---|---|
| YieldDesk AI platform | Provider interface over OpenAI/Azure OpenAI/Anthropic/Mistral or self-hosted vLLM; preserve `run(prompt,taskType)->text+metadata`, enforce HTTPS and prompt limits. The included generic OpenAI-compatible workspace can be adapted. |
| GetEquity | Licensed CP/deal provider, FMDQ/SEC issuer disclosures, dealer-operated admin feed, or CSV import. Preserve normalized deal DTO and provenance; never fabricate live deals. |
| NGX doclib endpoint | Licensed NGX market-data vendor, broker API, Bloomberg/Refinitiv, or end-of-day CSV. Preserve symbol registry, as-of timestamp, close/previous close, stale flag. |
| FMDQ undocumented WordPress APIs/HTML | Licensed FMDQ feed or controlled dealer upload. HTML regex scraping should be a last-resort adapter with fixture monitoring. |
| CBN endpoints | CBN downloadable files or licensed macro vendor with archived raw payloads. Preserve source date, auction/security identity, and idempotent upsert keys. |
| Google Fonts | Self-host licensed Inter WOFF2 files to remove runtime dependency/privacy leakage. |
| PostgreSQL/Replit | Any managed PostgreSQL 15+ with TLS, backups, pooling, and migrations; deployment can be containers/Kubernetes/serverless web + singleton worker. |

## 19. Source file index

### Runtime and domain authority

| Concern | Authoritative files |
|---|---|
| API composition/security limits/CORS | `artifacts/api-server/src/app.ts`, `src/index.ts`, `src/middlewares/auth.ts`, `src/lib/logger.ts` |
| OpenAPI/generation | `lib/api-spec/openapi.yaml`, `lib/api-spec/orval.config.ts`, `lib/api-client-react/src/custom-fetch.ts`, generated directories |
| Auth/holding/deal/signal/alert/admin HTTP | `artifacts/api-server/src/routes/auth.ts`, `holdings.ts`, `deals.ts`, `signals.ts`, `alerts.ts`, `admin.ts` |
| Decisions/dashboard | `artifacts/api-server/src/routes/decision.ts`, `src/lib/decision-engine.ts` |
| Market ingestion | `src/routes/cbn.ts`, `src/routes/mm-rates.ts`, `src/lib/cbn-scraper.ts`, `fmdq-scraper.ts`, `getequity-client.ts` |
| AI | `src/routes/ai.ts`; optional generic library under `lib/integrations-openai-ai-server/src` |
| Shared rich API/storage | `shared-module/server/routes.ts`, `artifacts/api-server/src/lib/portfolio-storage.ts`, `shared-module/types/index.ts` |
| Portfolio formulas | `shared-module/server/portfolio-engine.ts` |
| ETF/investment assumptions | `shared-module/server/etf-engine.ts`, `investment-data.ts` |
| NGX/PDF | `shared-module/server/stock-prices.ts`, `pdf-parser.ts` |
| DB | `lib/db/src/index.ts`, `lib/db/src/schema/{users,holdings,deals,signals,alerts,cbn-market-data,cbn-policy-rates,mm-rates,portfolio-holdings}.ts` |

### Frontend authority

| Concern | Files |
|---|---|
| Bootstrap/routes/auth/theme/API | `artifacts/yield-desk/src/{main,App}.tsx`, `src/lib/{auth,theme,api-helpers}.tsx|ts` |
| Shell/navigation | `src/components/layout.tsx`, `src/components/ui/*`, `src/index.css` |
| Conventional workflows | `src/pages/{dashboard,holdings,deals,signals,alerts,login,signup,not-found}.tsx` |
| Rich portfolio | `src/pages/portfolio.tsx`, `src/pages/portfolio/*` |
| Investment intelligence | `src/pages/market-data.tsx`, `src/pages/market-data/*` |
| Money-market UI | `src/pages/mm-rates.tsx`, `src/pages/mm-rates/*` |
| Build | `artifacts/yield-desk/vite.config.ts`, `index.html`, `package.json` |

### Operations/tests/non-product

| Concern | Files |
|---|---|
| Server build | `artifacts/api-server/build.mjs`, `package.json` |
| Unit specifications | `artifacts/api-server/src/lib/decision-engine.test.ts`, `shared-module/server/etf-engine.test.ts`, `portfolio-engine.test.ts` |
| Seed | `scripts/src/seed.ts` |
| Workspace/deployment | root `package.json`, `pnpm-workspace.yaml`, `pnpm-lock.yaml`, `tsconfig*.json`, `.replit`, `scripts/post-merge.sh` |
| Design sandbox | `artifacts/mockup-sandbox/src/App.tsx`, `mockupPreviewPlugin.ts`, `src/components/ui/*`, `vite.config.ts` |

## 20. Final replication position

The current repository is sufficient to reproduce the visible product and most calculations, but not to claim institution-grade data quality, security, or accounting. For strict visual/behavioral replication, preserve the observed formulas and route responses—including the two portfolio models—while fixing only defects explicitly accepted by the product owner. For a production replacement, the recommendations in sections 13, 16, and 18 should be treated as required design work, especially role assignment, secrets, HTTPS AI, decimal storage, migrations/constraints, complete OpenAPI, live macro/ETF provenance, scheduler singularity, and PDF SELL handling.
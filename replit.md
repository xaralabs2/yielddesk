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
- `signals` — id, userId, cpRate, bondYield
- `alerts` — id, userId, type (MARKET|PORTFOLIO|SYSTEM), message, read

### Decision Engine Thresholds
- CP rate >= 18% → INVEST_CP
- Bond yield >= 17% → LOCK_BONDS
- Otherwise → HOLD_MMMF
- Currency: Nigerian Naira (NGN)

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

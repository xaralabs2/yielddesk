# YieldDesk on Vercel — Canonical Application Deployment

> **STATUS: CURRENT / CANONICAL APPLICATION HOSTING.**
>
> Cloudflare provides YieldDesk's domain, DNS, edge, WAF, DDoS protection and related network/edge services. Vercel remains the application hosting and deployment platform for the YieldDesk frontend/web application and API.
>
> See [cloudflare-deployment.md](cloudflare-deployment.md) for the Cloudflare infrastructure boundary.

Deploy the monorepo as two Vercel projects connected to the same GitHub repository.

## 1. API project

Project name: `yielddesk-api`

Root directory:

`artifacts/api-server`

The Vercel entry point is `api/index.ts`. Do not use `src/index.ts` in production on Vercel; that file remains for traditional/local server hosting.

Required environment variables:

- `DATABASE_URL` — PostgreSQL connection string
- `SESSION_SECRET` — long random production secret
- `CRON_SECRET` — long random secret used by Vercel Cron
- `NGN_MARKET_API_KEY` — NGN Market API key
- `NGN_MARKET_ENABLE_PROFILES=true` — optional, if the account tier supports profiles/fundamentals
- `NGN_MARKET_BASE_URL` — optional; defaults to the configured client default
- `YIELDDESK_AI_API_KEY` — if using the existing AI integration
- `YIELDDESK_AI_BASE_URL` — AI service URL
- `YIELDDESK_AI_TENANT_ID=yielddesk`

The Vercel cron calls `/api/cron/cbn-sync` daily at 06:00 UTC. Hobby Vercel plans support daily cron cadence; increase frequency only on a plan that supports it.

## 2. Frontend project

Project name: `yielddesk-web`

Root directory:

`artifacts/yield-desk`

Settings:

- Framework: Vite
- Build command: `pnpm build`
- Output directory: `dist`
- Install command: `pnpm install`

Environment variable:

- `VITE_API_URL=https://<yielddesk-api-domain>`

The frontend `vercel.json` rewrites SPA routes to `index.html` so routes such as `/investment-desk` work on direct navigation.

## 3. Database

YieldDesk uses PostgreSQL via `DATABASE_URL`. Use a managed PostgreSQL provider that supports serverless connections. Provision the database and run the existing Drizzle migrations before using the application.

## 4. Deployment order

1. Create and configure `yielddesk-api`.
2. Add API environment variables and deploy it.
3. Confirm `/api/health` responds successfully.
4. Create `yielddesk-web`.
5. Set `VITE_API_URL` to the API production URL.
6. Deploy the frontend.
7. Sign in and test `/investment-desk` and the portfolio recheck flow.

## Security

Never expose `DATABASE_URL`, `SESSION_SECRET`, `CRON_SECRET`, `NGN_MARKET_API_KEY`, or AI API keys as `VITE_*` variables. `VITE_*` values are bundled into browser JavaScript.

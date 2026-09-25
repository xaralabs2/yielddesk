# YieldDesk Production Deployment — Cloudflare Workers & Pages

**Status:** Canonical production deployment document
**Updated:** 2026-09-25

## Current production target
YieldDesk production targets **Cloudflare Workers & Pages**.

Observed configuration:
- Service: `yielddesk`
- Environment: Production
- Repository: `xaralabs2/yielddesk`
- Branch: `main`
- Root: `/`
- Build: `pnpm run build`
- Deploy: `npx wrangler deploy`
- Build token: configured in Cloudflare
- Build variables: none shown
- Detected toolchain: Node.js 24.18.0 / pnpm 10.11.1
- Worker Previews: available for branches and pull requests.

## Current build state
Latest observed build:
- ID: `b01718fc-ef03-4fd5-9deb-d13650cb7a28`
- Source: `main`
- Trigger: manual
- Result: **FAILED**
- Stage: dependency installation, before application compilation
- Error: `ERR_PNPM_LOCKFILE_CONFIG_MISMATCH`

Cloudflare uses `pnpm install --frozen-lockfile`; repository overrides and `pnpm-lock.yaml` are inconsistent.

## Required remediation
1. Reconcile dependency/override configuration.
2. Regenerate `pnpm-lock.yaml` with the intended pnpm version.
3. Review the diff.
4. Run `pnpm run build`.
5. Commit legitimate config/lockfile changes.
6. Push through the approved engineering path.
7. Retry Cloudflare production build.
8. Verify deployment and health.

Do **not** make `pnpm install --no-frozen-lockfile` the permanent production workaround.

## Historical deployment
The former two-project Vercel design (`yielddesk-web` and `yielddesk-api`) is historical/reference architecture. See `docs/vercel-deployment.md`.

## Security
Keep database credentials, secrets, market-data keys, AI keys and brokerage credentials outside source control and client-visible variables.

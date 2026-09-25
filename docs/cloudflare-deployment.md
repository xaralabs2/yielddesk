# YieldDesk — Cloudflare Infrastructure Boundary

**Status:** Canonical Cloudflare infrastructure document
**Updated:** 2026-09-25

## Role of Cloudflare

Cloudflare is YieldDesk's **domain, DNS, edge and security infrastructure layer**. It is not the canonical application-hosting platform for the YieldDesk frontend or API.

Cloudflare responsibilities include:
- Domain and DNS management
- Edge proxy/CDN capabilities where enabled
- WAF and edge security controls
- DDoS protection
- TLS and related edge services
- Other explicitly configured Cloudflare network/edge capabilities

## Application hosting

YieldDesk application hosting and deployment remain on **Vercel**:
- Frontend/web application: Vercel
- API/backend: Vercel

See [vercel-deployment.md](vercel-deployment.md) for the canonical application deployment architecture.

## Cloudflare Workers / Pages

A Cloudflare Worker/Pages service or build configuration may exist for YieldDesk, including repository integration and experimental or transitional deployment work. Its existence does **not** make Cloudflare Workers/Pages the canonical YieldDesk application hosting platform.

Any future decision to move application workloads from Vercel to Cloudflare Workers/Pages requires an explicit architecture decision. It must not be inferred from DNS ownership, edge configuration, a connected Git repository, or a Cloudflare build.

## Security

Keep database credentials, secrets, market-data keys, AI keys and brokerage credentials outside source control and client-visible variables.

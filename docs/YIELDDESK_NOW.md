# YieldDesk — Available Today

_Last updated: 2026-08-26_

This document is the canonical current-state view of YieldDesk. It separates capabilities that exist today from future-state design so product and engineering teams do not confuse vision with production reality.

## Product Position

YieldDesk is an AI-native investment intelligence, simulation, portfolio management, and capital-allocation platform focused on Nigerian markets. It is designed to help investors understand opportunities, compare assets, practice decisions, review real holdings, and improve capital-allocation discipline.

YieldDesk is not a stockbroker, custodian, or trade-execution platform. Real investments are executed externally and can be recorded or imported for ongoing review.

## Available Today

| Area | Available Today |
|---|---|
| Product model | Real Portfolio + separate Simulator |
| Asset classes | Equities, Fixed Income, Money Market, Real Estate, Alternatives |
| Dashboard | Investment dashboard and asset-class navigation |
| Comparison | Cross-asset comparison views |
| Inflation context | Nigerian inflation benchmark in investment comparison |
| Return metrics | Yield, IRR and return-oriented comparison foundation |
| YieldDesk Score | Composite analysis score across fundamentals, valuation, cash flow/yield, growth, inflation hedge, governance, liquidity and risk/pessimism |
| YieldIntel | AI analysis / conversational intelligence foundation |
| AI Market Brief | AI market-intelligence capability |
| AI Deal Screening | AI-assisted screening foundation |
| Screener | Investment screening surface |
| Watchlist | Save and track investment opportunities |
| Portfolio | Real portfolio recording/review plus portfolio simulation foundation |
| Simulation | Separate virtual NGN investment environment, including simulated NGX equity trading |
| Diaspora layer | Investor profile, readiness and home-currency context foundation |
| Data ingestion | Manual investment entry, uploaded documents, broker contract-note parsing |
| Market data | NGX enrichment plus planned/partial CBN, FMDQ and other market feeds |
| CBN sync | Scheduled CBN synchronization architecture |
| FX intelligence | FX-adjusted performance direction and data model foundation |
| Real-estate intelligence | Property/SPV presentation and comparison surface |
| Deployment | Vercel web + API architecture |
| Core stack | pnpm, Node 24, TypeScript 5.9, React 19, Vite, Tailwind, shadcn/ui, Wouter, TanStack Query, Express 5, PostgreSQL, Drizzle, Zod, OpenAPI/Orval |
| AI platform | YieldDesk domain intelligence on top of Xara AI OS direction |

## Current Decision Flow

The current product is best described as:

**Instrument → Metrics → Comparison → Score → AI Interpretation → Watchlist / Portfolio / Simulation**

This is a strong foundation, but it is not yet the complete investment operating system described in `YIELDDESK_FUTURE.md`.

## Current Architectural Principle

> Deterministic engines calculate financial facts. AI researches, reasons, explains, personalizes and orchestrates. The investor decides.

## Current Product Boundary

YieldDesk currently sits in:

**Education + Simulation + Market Intelligence + Portfolio Recording + Investment Review + Risk / FX / Allocation Intelligence**

It does not custody funds or execute securities transactions.

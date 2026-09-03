# YieldDesk Nigeria Intelligence Blueprint

_Status: canonical Nigeria-first product and implementation direction._  
_Source basis: repository-observed Replit audit supplied 2026-09-03, current production repository, and the YieldDesk Product Constitution._

## Product role

Nigeria is YieldDesk's deepest initial market, not a decorative market selector. The Nigeria desk must preserve local market structure and terminology while remaining part of the approved three-market platform.

YieldDesk Nigeria supports this journey:

**Discover → Understand → Compare → Simulate → Watch → Monitor**

It provides investment information, education, objective comparison, deterministic calculation, hypothetical simulation, and user-controlled monitoring. It does not recommend, advise, rank providers, determine suitability, broker, execute, transmit orders, or hold customer assets.

## Nigeria capability model

### Public intelligence

- CBN Treasury-bill, OMO, bond, policy-rate and official FX observations.
- FMDQ money-market observations where use is permitted.
- NGX company, security, price, dividend, corporate-action and financial-statement evidence.
- Regulated-fund information from permitted disclosures or providers.
- Source, observation date, retrieval date, freshness and delayed/live/end-of-day status on every material observation.
- Explicit empty and unavailable states; no hard-coded fallback may be presented as current data.

### Deterministic analysis

- Nominal, annualized, real and FX-adjusted returns.
- Treasury-bill and bond cash-flow mathematics.
- Fees and taxes included/excluded.
- Liquidity, tenor, maturity, concentration and scenario comparisons.
- Equity business quality, normalized earnings, dividend yield, valuation ranges, market-implied expectations and scenario outcomes.
- Evidence sufficiency and unresolved diligence, without YieldDesk buy/sell/hold/avoid conclusions.

### User workspaces

Registration is optional for browsing. Accounts are used only for saved work:

- comparisons and assumptions;
- watchlists and factual alerts;
- hypothetical portfolios and simulations;
- separately recorded externally held investments;
- broker contract-note review and confirmed import;
- learning and research history.

Real recorded holdings and simulations must remain distinct.

### Nigeria asset universe

1. Treasury bills and OMO.
2. FGN bonds and permitted public-sector fixed-income instruments.
3. Money-market funds and other regulated funds.
4. Fixed deposits and commercial paper where reliable, permitted evidence exists.
5. Selected NGX equities, ETFs and REITs.
6. User-recorded real assets and alternatives for portfolio context, never represented as exchange-traded or continuously priced assets.

## Preserved legacy capabilities

The Replit implementation provides useful foundations that remain in scope:

- conventional CP/BOND/MMMF/STOCK holding records;
- richer Stability / Inflation Hedge / Strategic portfolio analysis;
- CBN, FMDQ, NGX and GetEquity adapters;
- fixed-income and macro context;
- diaspora home-currency simulation;
- broker-note PDF extraction;
- deterministic portfolio, valuation and regime engines;
- AI market briefs and factual instrument comparison.

These foundations are retained only after alignment with the Product Constitution and the controls below.

## Mandatory corrections

The following observed legacy behaviors are defects, not compatibility requirements:

- public signup may never assign an admin role;
- production may not use a known fallback signing secret;
- static rates, inflation, FX or ETF prices may not be labelled live;
- AI and deterministic engines may not issue YieldDesk recommendations;
- the former INVEST/HOLD/PASS and BUY/SELL/HOLD matrices must be converted to factual status or user-filter outputs;
- AI must use correct schema fields, HTTPS, timeouts and provenance;
- data mutations and synchronization require explicit administrative authority;
- concurrent schedulers require idempotent unique keys and single-run control;
- money and rates require appropriate precision;
- OpenAPI must describe actual runtime routes and authentication;
- PDF SELL transactions must reduce or reconcile positions, never create positive purchases;
- another user must never receive cached account-scoped data after logout.

## Market-data fabric

Every normalized observation should carry:

- market and instrument identity;
- native currency;
- provider/source and permitted-use classification;
- source publication timestamp;
- retrieval timestamp;
- freshness state;
- delayed/live/end-of-day/manual classification;
- raw value and normalized value;
- units and calculation method;
- validation status and quality flags;
- lineage to the raw source or uploaded evidence.

Provider failures must be visible. Missing information remains missing.

## Delivery order

### N1 — Public Nigeria desk

Expose the Nigerian universe, current source-aware observations, public rates, NGX directory and transparent data states without account registration.

### N2 — Data integrity and operations

Add source-status records, unique ingestion keys, idempotent upserts, job history, administrative sync authority, timeouts, retry policy and readiness checks.

### N3 — Fixed-income intelligence

Complete Treasury-bill, OMO, FGN-bond, commercial-paper and regulated-fund normalization, comparison and deterministic mathematics.

### N4 — NGX company intelligence

Connect primary-source fundamentals, dividends, prices and actions to business quality, earnings normalization, valuation scenarios, evidence confidence and thesis monitoring.

### N5 — Portfolio and document workflows

Unify the two holding experiences at the UX layer while preserving distinct real-recorded and simulated books. Correct PDF validation, duplicate detection, BUY/SELL semantics and confirmation.

### N6 — Nigeria AI explanation

AI explains dated evidence and deterministic calculations. Policy tests must block selection, prescriptions, target allocations and provider endorsements.

### N7 — Operational readiness

Complete OpenAPI, migrations, integration/E2E tests, CSP/CORS/security controls, observability, backups, restoration and data-retention procedures.

## Expansion rule

The United States and United Kingdom implementations will reuse the common observation, calculation, simulation, provenance and policy framework. They will not flatten or replace Nigeria-specific instruments, sources, terminology or workflows.

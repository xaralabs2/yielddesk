# PRD — YieldDesk Personal Investment Intelligence

**Version:** 1.0
**Date:** 2026-09-25
**Status:** Founder-approved requirements; implementation subject to policy/legal feature gate
**Pilot:** Founder-first, multi-user architecture from day one

## 1. Vision
Every YieldDesk user has a neutral Personal AI Agent that understands the user and provides continuity across everything the user does on the platform. Investment intelligence is one domain served by that agent; it is not the definition of the agent.

YieldDesk becomes a personal investment intelligence system that understands both the investment and the investor. It combines market intelligence, portfolio intelligence, investor intelligence, research, deterministic financial mathematics, decision memory and feedback learning.

## 2. Problem
Broker/portfolio apps show holdings, value and P/L but generally do not preserve why the user bought, whether the thesis changed, what behavioral pattern is repeating, whether prior exits improved results, whether sold securities were repurchased, whether winners are sold too early, or whether broker cost basis matches verified economic cost.

## 3. Goals
- Trustworthy provenance-aware Investor Intelligence Profile for every user.
- Exact portfolio/transaction ledger distinct from simulations.
- Investment thesis and decision memory.
- Evidence-backed behavioral pattern detection.
- Separate realized, unrealized, income and opportunity-cost outcomes.
- Combine investor, portfolio, market and research context.
- Human remains final decision-maker.
- Learn without hindsight bias.
- Multi-market architecture: Nigeria, US, UK; Canada later.
- Configurable for different investor types.

## 4. Non-goals
No brokerage, custody, money movement, autonomous trading, hidden portfolio mutations, silent risk-policy changes, or hard-coding the Founder profile as universal logic.

## 5. Personal AI Agent scope
The Personal AI Agent participates across discovery, education, comparison, simulation, watchlists, monitoring, portfolio management, research, wealth planning, alerts, reporting, decision journaling and future platform workflows. It supplies relevant context to specialist services while the user remains the authority.

It may maintain general user preferences, goals, experience, interaction/decision history and memory/continuity, plus domain-specific contexts such as Investor Intelligence Profile. Domain contexts must remain modular so future non-investment contexts can be added without redefining the agent.

## 6. Core objects
### Investor Intelligence Profile
Goals, horizon, risk, markets, sectors, liquidity, experience, preferences, constraints, decision style, version and provenance. Separate Declared, Observed and Learned layers.

### Investment Policy Statement
Versioned user-approved rules: classifications, position/sector limits, core/tactical framework, review cadence, reduce/exit/re-entry criteria, risk constraints and exceptions.

### Portfolio Ledger
Account/source, instrument, quantity, currency, broker cost, verified economic cost, provenance, value, cash flows, realized/unrealized P/L, dividends/interest, fees/taxes, corporate actions and timestamps.

### Investment Thesis
Reason for ownership, classification, evidence, horizon, catalysts, risks, add/reduce/exit conditions, status and last review.

### Decision Record
Contemplated action, evidence available at the time, portfolio/profile context, behavioral flags, analysis, human decision, outcome snapshots, process-quality review and opportunity-cost review.

## 7. Agent/service architecture
- **Personal AI Agent:** neutral per-user context and continuity layer across all YieldDesk experiences. It interprets the user's general profile plus domain contexts such as Investor Intelligence Profile and IPS; it has no trade authority and does not make decisions for the user.
- **Market Intelligence Agent:** market conditions, prices, fundamentals, corporate actions, macro/regulation with provenance/freshness.
- **Portfolio Intelligence Agent:** holdings, transactions, cost basis, P/L, allocation, concentration and performance.
- **Research & Analytics Agent:** company/instrument research, valuation, industry, governance and thesis evidence.
- **Decision Agent:** combines other layers; under current constitution remains non-prescriptive.
- **Learning & Feedback Engine:** tracks decisions/outcomes, behavioral patterns, process quality and personalization.

## 8. Behavioral intelligence
Initial detectors: premature full exit from intact thesis; sell/re-entry cycles; FOMO-style re-entry; loss anchoring; winner/loser patience asymmetry; excessive turnover; excessive averaging down; position creep; sector concentration; horizon deviation; declared-vs-observed divergence.

Every finding requires evidence, timeframe, confidence and explanation. Findings are hypotheses, not diagnoses.

## 9. Founder pilot
Use verified private portfolio/transaction data. Never commit brokerage account numbers, clearing numbers, credentials or secrets.

Validate whether YieldDesk can reconstruct holdings/cost basis, preserve source-vs-corrected cost, distinguish realized/unrealized/opportunity cost, detect exit/re-entry patterns, evaluate decisions using information available at the time, detect concentration/turnover and provide useful human-controlled support.

## 10. Deterministic performance mathematics
Support contributions, withdrawals, purchase cost, sale proceeds, realized/unrealized P/L, dividends/interest, fees/taxes, total return, XIRR, TWR where supported, turnover, security/sector/strategy attribution, FX effects, inflation-adjusted results and separate opportunity-cost analytics.

Preserve source, timestamp, currency, assumptions and methodology version.

## 11. Decision review
Separate process quality from outcome quality:
- good process / good outcome;
- good process / bad outcome;
- weak process / good outcome;
- weak process / bad outcome.

Later appreciation after a sale does not automatically make the sale a bad decision.

## 12. UX surfaces
Investor Profile; IPS & Rules; Portfolio; Transaction Ledger; Thesis Library; Decision Journal; Behavioral Insights; Performance & Attribution; Market/Research; Decision Review; Alerts.

Alerts prioritize thesis changes, fundamentals, policy breaches, concentration and meaningful evidence rather than pure price movement.

## 13. Privacy/security
Strong tenant isolation; sensitive identifiers encrypted; no secrets in profile memory; provenance retained; user can review profile layers; material IPS/profile changes require confirmation; audit trail required.

## 14. Human-in-the-loop
No autonomous buy/sell/order submission, money movement, rebalance, IPS/risk change or conversion of simulation to real holding.

## 15. Regulatory/product gate
Current Product Constitution forbids personalized recommendations and BUY/SELL/HOLD conclusions. Profile, ledger, analytics, journaling, behavior detection, simulations and sourced explanation may proceed within current boundaries. Personalized recommendation/action labels require explicit reclassification, counsel/product review and approved constitution changes.

## 16. Acceptance criteria
1. Every registered user has an Investor Intelligence Profile.
2. Declared/Observed/Learned layers are separate and versioned.
3. Ledger supports broker and verified economic cost with provenance.
4. Real holdings and simulations cannot be conflated.
5. Transaction imports preserve executed quantities/source.
6. Realized/unrealized/income/opportunity cost remain distinct.
7. Thesis can attach to a holding.
8. Decision records are additive/auditable.
9. Behavioral detectors return evidence/confidence.
10. Decision review supports sell/re-entry comparison without hindsight leakage.
11. No autonomous trade path exists.
12. Policy tests block prohibited language under current constitution.
13. Private founder brokerage identifiers are absent from repo fixtures/docs.
14. Multi-user tenant-isolation tests pass.
15. Deterministic financial-math tests pass.

## 17. Delivery phases
**A — Foundation:** profile, IPS, ledger provenance, thesis/decision records, performance math.
**B — Founder pilot:** private import/reconciliation; behavioral analytics and decision journal.
**C — Intelligence:** market/research integration, thesis monitoring, detectors, process-vs-outcome reviews.
**D — Productization:** onboarding/customization for arbitrary users and privacy controls.
**E — Regulated decision features:** only after explicit legal/product approval.

## 18. Frozen principle
> YieldDesk does not merely understand the investment. It understands the investor making the decision.

The platform is shared. The Investor Intelligence Profile is personal. The human remains in control.

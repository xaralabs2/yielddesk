# YieldDesk Personal Investment Intelligence — Frozen Product Direction

**Status:** FROZEN / FOUNDER-APPROVED PRODUCT DIRECTION
**Date:** 2026-09-25

## Frozen decision
YieldDesk will evolve into a personalized investment-intelligence platform. The Founder is the first pilot, but architecture MUST be multi-tenant and configurable for other users.

> Market intelligence tells YieldDesk what is happening. Portfolio intelligence tells YieldDesk what the user owns. Investor intelligence tells YieldDesk who the user is. Decision intelligence combines all three.

The **Personal AI Agent** is the neutral, always-on user-context and continuity layer for every registered user across everything they do in YieldDesk. The **Investor Intelligence Profile** is one domain context managed by that agent, not the agent itself.

## Required layers
1. Market Intelligence.
2. Personal AI Agent.
3. Portfolio Intelligence.
4. Research & Analytics.
5. Decision Intelligence.
6. Learning & Feedback.

## Personal AI Agent
The agent is neutral: it does not exist only for investing recommendations and does not decide for the user. It carries relevant user context across exploration, comparison, simulation, watchlists, monitoring, portfolio work, research, wealth planning, decision journaling, alerts and future YieldDesk capabilities.

It owns/interprets goals, horizon, risk, IPS, preferences, constraints, position/sector limits, investment classifications, behavioral strengths/weaknesses, historical decision patterns and approved exceptions.

Profile state has three distinct layers:
- **Declared** — user-provided.
- **Observed** — measured from activity.
- **Learned** — evidence-backed hypotheses.

These MUST remain distinguishable. Learned state must not silently overwrite declared state.

## Founder pilot hypotheses
- strength in identifying securities that later appreciate;
- willingness to deploy meaningful capital;
- decisiveness and willingness to reconsider;
- primary improvement area: position management after purchase;
- pattern to test: profitable full exits followed by continued appreciation and sometimes later re-entry;
- distinguish accounting loss from opportunity cost;
- apply consistent standards to winners and losers;
- prefer thesis-driven monitoring over price-only alerts.

These are measurable hypotheses, not permanent labels.

## Accounting and memory
- Preserve broker-reported and user-verified economic data separately with provenance.
- Verified corrections never destroy original source data.
- Separate current holdings, transactions, realized P/L, unrealized P/L, income, fees/taxes and cash flows.
- Treat reported quantity on executed partial-fill records as executed quantity.
- Opportunity cost is analytics, not accounting loss.
- Keep real holdings and simulations separate.
- Deterministic engines calculate financial facts; AI explains sourced facts and calculations.

## Decision memory
Retain security, classification, thesis, cost/provenance, evidence available at decision time, portfolio/profile context, behavioral flags, human decision, subsequent outcome, process-quality assessment and later re-entry analysis.

## Human authority
No autonomous trade execution, order transmission, money movement, real-portfolio rebalance or silent IPS/profile-rule changes.

## Policy conflict gate
The current `docs/PRODUCT_CONSTITUTION.md` prohibits personalized recommendations and YieldDesk BUY/SELL/HOLD conclusions. Personalized recommendation features therefore MUST fail closed until explicit product/legal classification and constitution changes are approved.

Permitted pre-gate work includes profile/ledger infrastructure, deterministic analytics, decision journaling, behavioral analytics, simulations, sourced explanations and non-prescriptive decision support consistent with the constitution.

No engineering worker is assigned by this document.

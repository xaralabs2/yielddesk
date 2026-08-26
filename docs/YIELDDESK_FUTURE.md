# YieldDesk — Future State

_Last updated: 2026-08-26_

This document defines the target YieldDesk V2 product. It is intentionally separated from current-state documentation so future capabilities are not mistaken for production features.

## Product Thesis

YieldDesk should become an **AI-native investment intelligence and capital-allocation operating system** for Nigerian assets and diaspora investors.

The platform should not merely display ratios or issue generic BUY/HOLD/SELL labels. It should understand the economics of an investment, challenge assumptions, determine portfolio fit, monitor the original thesis after investment, and learn from outcomes over time.

## Canonical Decision Model

**Business / Asset Understanding → Evidence → Normalization → Resilience → Governance → Macro & FX → Market-Implied Expectations → Expectation Gap → Valuation → Margin of Safety → Counter-Thesis → Return Analysis → Portfolio Fit → Position Sizing → Decision → Monitoring → Learning**

Decision states:

**INVESTIGATE → INVESTABLE → ACTIONABLE**

Post-investment states:

**THESIS INTACT → THESIS WATCH → THESIS BROKEN**

## Target Intelligence Engines

| Area | To Be Added | Final Target |
|---|---|---|
| Evidence | Evidence Graph: claim → source → data → calculation | Every material conclusion auditable |
| Assumptions | Fact / derived fact / user assumption / YieldDesk assumption / AI estimate registry | Clear separation of evidence from judgment |
| Calculation | Deterministic IRR, NPV, FCF, ROE, valuation, FX and portfolio math | AI never owns critical arithmetic |
| Business quality | Durability, moat, ROE/ROIC, competitive position | Evidence-backed quality analysis |
| Earnings quality | Normalize FX, revaluations, disposals and one-offs | Sustainable earnings view |
| Cash conversion | PAT → OCF → capex → FCF | Cash-quality intelligence |
| Balance-sheet resilience | Rate, inflation, FX, demand and commodity stress | Survival and downside engine |
| Governance | Ownership, related parties, capital allocation, dilution | Governance intelligence |
| Management memory | Promise-vs-delivery tracking | Management Credibility Ledger |
| Valuation | Asset- and sector-specific valuation models | Correct model for banks, telecoms, oil, property, fixed income, etc. |
| Scenarios | Bear / Base / Bull | Range-based intrinsic value |
| Market expectations | Reverse-engineer assumptions embedded in price | Market-Implied Expectations Engine |
| Mispricing | Compare market-implied assumptions with YieldDesk/investor assumptions | Expectation Gap |
| Margin of safety | Required vs current MOS | Explicit investment gate |
| Adversarial review | Bear / Counter-Thesis Agent | Mandatory challenge before INVESTABLE |
| Forensics | Accounting and anomaly analysis | Forensic Analyst |
| Evidence confidence | Completeness, reliability and freshness | Know when evidence is insufficient |
| Macro | Nigeria/global macro interpretation | Company- and portfolio-specific macro intelligence |
| Macro transmission | Shock → sector → company → portfolio | Nigerian Macro Transmission Engine |
| FX / inflation | Nominal NGN, real NGN and USD returns | Economic-return intelligence |
| Opportunity cost | Compare next ₦X across assets | Capital Allocation Engine |
| Portfolio fit | Incremental portfolio impact | Decide whether a good asset belongs in this portfolio |
| Factor exposure | FX, rates, oil, consumer, sovereign, liquidity, etc. | Economic exposure graph |
| Hidden concentration | Correlation + shared economic drivers | Detect false diversification |
| Position sizing | Conviction, downside, liquidity, correlation | Suggested maximum/target allocation |
| Buy zones | Price/MOS entry conditions | Capital Deployment Queue |
| Thesis ledger | Immutable original thesis snapshot | Permanent investment memory |
| Thesis monitor | Assumption and catalyst monitoring | INTACT / WATCH / BROKEN |
| Decision journal | BUY/PASS/ADD/REDUCE/EXIT reasoning | Decision history |
| Investor learning | Analyze patterns in past decisions | YieldDesk learns the investor's process |

## AI-Dense Architecture

AI should be dense underneath and simple above.

Target specialist roles:

- Research Analyst
- Financial Analyst
- Earnings Normalization / Cash Analyst
- Forensic Analyst
- Governance Analyst
- Macro Analyst
- Valuation Analyst
- Market Expectations Analyst
- Bear Analyst
- Portfolio Manager
- Risk Officer
- Thesis Monitor
- Investment Committee Synthesizer

The user should not see a wall of agents. The product should surface a calm conclusion with drill-down paths such as **Why?**, **Evidence**, **Stress Test**, **Counter-Thesis**, and **Portfolio Impact**.

## Asset-Class Expansion

The same investment philosophy applies across assets, but each asset receives a native analytical model.

- **Equities:** normalized earnings, cash, ROE/ROIC, valuation, governance, market expectations.
- **Fixed Income:** yield, duration, credit, inflation, reinvestment and liquidity.
- **Money Market:** yield, fees, liquidity, portfolio quality and real return.
- **Real Estate / SPVs:** sponsor/developer quality, title/legal evidence, funding, construction, rent, exit value, IRR, liquidity and downside scenarios.
- **Alternatives:** asset-specific risk, liquidity, cashflow and valuation frameworks.

## Long-Term Moat

The durable moat is not the LLM. It is accumulated structured investment memory:

**Company / asset history + management history + evidence + assumptions + theses + valuations + decisions + outcomes + investor behavior.**

Over time, YieldDesk should become proprietary institutional memory for the investor.

## Product Boundary

The V2 roadmap should initially remain focused on **research, intelligence, simulation and decision support**. Brokerage, custody, autonomous trading or personalized regulated advisory should only be introduced through an appropriate regulatory/partner structure.

# YieldDesk — Future State

_Last updated: 2026-08-26_

This document defines the target YieldDesk V2 product. It is intentionally separated from current-state documentation so future capabilities are not mistaken for production features.

## Product Thesis

YieldDesk should become an **AI-native investment intelligence and capital-allocation operating system** for Nigerian assets and diaspora investors.

The platform should not merely display ratios or issue generic BUY/HOLD/SELL labels. It should understand the economics of an investment, challenge assumptions, quantify returns and risk correctly, determine portfolio fit, monitor the original thesis after investment, and learn from outcomes over time.

## Canonical Decision Model

**Business / Asset Understanding → Evidence → Normalization → Resilience → Governance → Macro & FX → Market-Implied Expectations → Expectation Gap → Valuation → Margin of Safety → Investment Mathematics → Counter-Thesis → Return Analysis → Portfolio Fit → Position Sizing → Decision → Monitoring → Attribution → Learning**

Decision states:

**INVESTIGATE → INVESTABLE → ACTIONABLE**

Post-investment states:

**THESIS INTACT → THESIS WATCH → THESIS BROKEN**

## Core Capital-Allocation Test

Every investment should ultimately be tested as:

**Expected Return vs Required Return vs Risk vs Best Available Alternative**

YieldDesk must not confuse high nominal returns with attractive investments. Inflation, FX, liquidity, uncertainty, downside and opportunity cost must be included in the decision.

## Target Intelligence Engines

| Area | To Be Added | Final Target |
|---|---|---|
| Evidence | Evidence Graph: claim → source → data → calculation | Every material conclusion auditable |
| Assumptions | Fact / derived fact / user assumption / YieldDesk assumption / AI estimate registry | Clear separation of evidence from judgment |
| Investment mathematics | Deterministic CAGR, IRR, XIRR, TWRR, MWRR, NPV, return/risk and portfolio math | Reproducible investment mathematics across assets |
| Required return | Risk-, inflation-, FX-, liquidity- and uncertainty-aware hurdle rate | Know whether expected return actually compensates for risk |
| Benchmark intelligence | Compare with T-Bills, MMFs, inflation, NGX, USD/home currency and appropriate peers | Measure opportunity cost rather than return in isolation |
| Illiquidity premium | Return premium over relevant liquid alternative | Price lock-up and exit risk explicitly |
| Return attribution | Explain earnings/appreciation/income/multiple/FX contribution | Know why money was made or lost |
| Business quality | Durability, moat, ROE/ROIC, competitive position | Evidence-backed quality analysis |
| Earnings quality | Normalize FX, revaluations, disposals and one-offs | Sustainable earnings view |
| Cash conversion | PAT → OCF → capex → FCF | Cash-quality intelligence |
| Balance-sheet resilience | Rate, inflation, FX, demand and commodity stress | Survival and downside engine |
| Governance | Ownership, related parties, capital allocation, dilution | Governance intelligence |
| Management memory | Promise-vs-delivery tracking | Management Credibility Ledger |
| Valuation | Asset- and sector-specific valuation models | Correct model for banks, telecoms, oil, property, fixed income, etc. |
| Scenarios | Bear / Base / Bull + probability-weighted outcomes | Range-based intrinsic value and expected value |
| Market expectations | Reverse-engineer assumptions embedded in price | Market-Implied Expectations Engine |
| Mispricing | Compare market-implied assumptions with YieldDesk/investor assumptions | Expectation Gap |
| Margin of safety | Required vs current MOS | Explicit investment gate |
| Adversarial review | Bear / Counter-Thesis Agent | Mandatory challenge before INVESTABLE |
| Forensics | Accounting and anomaly analysis | Forensic Analyst |
| Evidence confidence | Completeness, reliability and freshness | Know when evidence is insufficient |
| Macro | Nigeria/global macro interpretation | Company- and portfolio-specific macro intelligence |
| Macro transmission | Shock → sector → company → portfolio | Nigerian Macro Transmission Engine |
| FX / inflation | Nominal NGN, real NGN and USD/home-currency returns | Economic-return intelligence |
| Opportunity cost | Compare next ₦X across assets | Capital Allocation Engine |
| Portfolio fit | Incremental portfolio impact | Decide whether a good asset belongs in this portfolio |
| Factor exposure | FX, rates, oil, consumer, sovereign, liquidity, etc. | Economic exposure graph |
| Hidden concentration | Correlation + shared economic drivers | Detect false diversification |
| Position sizing | Conviction, downside, liquidity, correlation | Suggested maximum/target allocation |
| Buy zones | Price/MOS entry conditions | Capital Deployment Queue |
| Thesis ledger | Immutable original thesis snapshot | Permanent investment memory |
| Thesis monitor | Assumption and catalyst monitoring | INTACT / WATCH / BROKEN |
| Decision journal | BUY/PASS/ADD/REDUCE/EXIT reasoning | Decision history |
| Investor learning | Analyze patterns in past decisions and attribution | YieldDesk learns the investor's process |

## Investment Mathematics Engine

The mathematics layer is a first-class V2 core capability, not optional analytics.

### Returns

CAGR • IRR • XIRR • TWRR • MWRR • Holding Period Return • Total Return • Annualized Total Return • Nominal NGN Return • Real NGN Return • USD/home-currency Return • FX Attribution • Income Return • Capital Appreciation Return • Yield on Cost • Rolling Returns

### Risk

Volatility • Downside Deviation • Maximum Drawdown • Recovery Time • Probability of Loss • Stress Loss • Beta • Correlation, with VaR / Expected Shortfall available as later advanced analytics.

### Risk-Adjusted Return

Sharpe • Sortino • Calmar where appropriate • Excess Expected Return • Return Premium over liquid alternatives • Illiquidity Premium.

### Valuation / Quality

NPV • DCF • EV • NAV • SOTP • Earnings Yield • FCF Yield • ROE • ROIC • Incremental ROIC • Sustainable Growth • Margin of Safety • Probability-weighted Expected Value.

### Property / Private / SPV

IRR • XIRR • MOIC / Equity Multiple • Cash-on-Cash • Payback Period • NPV • Exit Value • Rental/Distribution Yield • Delay/Rent/Cost/Appreciation stress cases.

### Fixed Income

YTM • Yield to Call/Worst where applicable • Effective Annual Yield • Real Yield • Duration • Modified Duration • Convexity • Credit Spread • Reinvestment scenarios.

### Portfolio

TWRR • MWRR • CAGR • Alpha • Beta • Correlation • Contribution • Attribution • Concentration • Drawdown • Stress/Scenario Loss.

Full specification: `INVESTMENT_MATHEMATICS_ENGINE.md`.

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

The user should not see a wall of agents. The product should surface a calm conclusion with drill-down paths such as **Why?**, **Evidence**, **Stress Test**, **Counter-Thesis**, **Portfolio Impact**, and **Return Attribution**.

## Asset-Class Expansion

The same investment philosophy applies across assets, but each asset receives a native analytical model.

- **Equities:** normalized earnings, cash, ROE/ROIC, valuation, governance, market expectations, total/real/FX-adjusted return and attribution.
- **Fixed Income:** yield, YTM, duration, credit, inflation, reinvestment and liquidity.
- **Money Market:** effective yield, fees, liquidity, portfolio quality and real return.
- **Real Estate / SPVs:** sponsor/developer quality, title/legal evidence, funding, construction, rent, exit value, CAGR/IRR/XIRR/MOIC, liquidity and downside scenarios.
- **Alternatives:** asset-specific risk, liquidity, cashflow, benchmark and valuation frameworks.

## Long-Term Moat

The durable moat is not the LLM. It is accumulated structured investment memory:

**Company / asset history + management history + evidence + assumptions + theses + valuations + calculations + decisions + outcomes + attribution + investor behavior.**

Over time, YieldDesk should become proprietary institutional memory for the investor.

## Product Boundary

The V2 roadmap should initially remain focused on **research, intelligence, simulation and decision support**. Brokerage, custody, autonomous trading or personalized regulated advisory should only be introduced through an appropriate regulatory/partner structure.

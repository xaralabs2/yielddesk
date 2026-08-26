# YieldDesk Investment Mathematics Engine

_Last updated: 2026-08-26_

## Purpose

The Investment Mathematics Engine is a deterministic core service for YieldDesk V2. It converts investment cash flows, market values, inflation, FX, risk observations and valuation assumptions into reproducible financial measures. LLMs may select, interpret and explain calculations, but they must not own critical arithmetic.

## Core Capital-Allocation Question

YieldDesk should evaluate investments using:

**Expected Return vs Required Return vs Risk vs Best Available Alternative**

A high nominal return is not sufficient. YieldDesk must determine whether expected reward compensates for inflation, currency exposure, uncertainty, downside, illiquidity and opportunity cost.

## Return Engine

- CAGR — compound annual growth rate
- IRR — internal rate of return
- XIRR — irregular dated cash-flow return
- TWRR — time-weighted portfolio return
- MWRR — money-weighted investor return
- Holding Period Return
- Total Return
- Annualized Total Return
- Nominal NGN Return
- Real NGN Return
- USD / home-currency Return
- FX contribution / attribution
- Income Return
- Capital Appreciation Return
- Yield on Cost
- Rolling Returns

## Income & Distribution Engine

- Cash Yield
- Current Yield
- Effective Annual Yield
- Dividend Yield
- Dividend CAGR
- Distribution Coverage
- Dividend Payout
- Sustainable Dividend analysis inputs

## Risk Engine

- Volatility
- Downside Deviation
- Maximum Drawdown
- Recovery Time
- Probability of Loss
- Probability of Permanent Capital Loss where modelable
- Stress Loss
- Scenario Loss
- Beta
- Correlation
- Value at Risk / Expected Shortfall as later advanced analytics

## Risk-Adjusted Return

- Sharpe Ratio
- Sortino Ratio
- Calmar Ratio where appropriate
- Excess Expected Return
- Return Premium over liquid alternative
- Illiquidity Premium
- Risk-adjusted ranking

## Valuation Mathematics

- NPV
- DCF
- Enterprise Value
- Earnings Yield
- FCF Yield
- NAV
- SOTP
- Margin of Safety
- Probability-weighted Expected Value
- Bear / Base / Bull values

## Equity Quality Mathematics

- ROE
- ROIC
- Incremental ROIC
- Sustainable Growth Rate
- Cash Conversion
- Normalized earnings measures
- Growth-adjusted valuation where appropriate

## Private / Property / SPV Mathematics

- IRR
- XIRR
- MOIC / Equity Multiple
- Cash-on-Cash Return
- Payback Period
- NPV
- Exit Value
- Rental / distribution yield
- Funding and construction scenario impacts
- Delay, rent, cost-overrun and appreciation stress cases

## Fixed-Income Mathematics

- Yield to Maturity
- Yield to Call / Yield to Worst where applicable
- Effective Annual Yield
- Real Yield
- Duration
- Modified Duration
- Convexity
- Credit Spread
- Reinvestment scenarios

## Portfolio Mathematics

- TWRR
- MWRR
- CAGR
- Alpha
- Beta
- Correlation
- Contribution to Return
- Return Attribution
- Factor Exposure
- Concentration
- Drawdown
- Portfolio stress and scenario loss

## Required Return / Hurdle Rate

YieldDesk must explicitly model the return required to justify taking a risk. The hurdle may incorporate:

- risk-free / alternative liquid return
- inflation
- FX risk
- business / asset risk
- credit risk
- governance risk
- duration
- liquidity / lock-up
- evidence uncertainty

The product should expose:

**Expected Return**

**Required Return**

**Excess Expected Return = Expected Return − Required Return**

This sits alongside Margin of Safety as a core investment gate.

## Benchmark Intelligence

Every investment should be compared with relevant alternatives, not judged in isolation. Benchmarks may include NGX indices, Nigerian Treasury Bills, Money Market Funds, inflation, USD/home currency and asset-class comparables.

YieldDesk should calculate the incremental return earned for accepting additional risk or illiquidity.

## Illiquidity Premium

For locked or difficult-to-exit investments, YieldDesk should compare expected return with an appropriate liquid alternative and quantify whether the incremental return compensates for lock-up, exit uncertainty and other risks.

## Probability-Weighted Outcomes

Bear/Base/Bull scenarios should support explicit probabilities where evidence permits. YieldDesk should calculate probability-weighted expected return/value while preserving the individual downside cases rather than hiding them in one average.

## Return Attribution

After investment, YieldDesk should explain where return actually came from.

Equity example:

**Earnings Growth + Multiple Change + Dividends + FX = Investor Return**

Property example:

**Rental Income + Appreciation − Cost Overruns − Fees +/− FX = Investor Return**

Attribution feeds the Decision Journal and Investor Learning Engine.

## Calculation Governance

Every calculation must preserve:

- formula/version
- inputs
- units/currency
- dates
- source/provenance
- assumptions
- output
- calculation timestamp

Material calculations must be reproducible. AI-generated explanations must reference the deterministic result rather than recalculate it independently.

# YieldDesk Wealth Builder Agent V1

**Status:** Approved product direction; implementation proposed on `feature/wealth-builder-agent-v1`.

## Outcome

A logged-in YieldDesk user can select **Build my wealth portfolio**, describe the goal, enter the total amount to model, choose a horizon and choose an illustrative strategy. YieldDesk then calculates a transparent hypothetical asset-category allocation and saves it only after explicit confirmation.

## User flow

1. User clicks **Build my wealth portfolio**.
2. Agent asks: **What are you building toward?**
3. Agent asks: **How much do you want to model in total?**
4. Agent asks for the time horizon.
5. User chooses one model: Preserve Capital, Balanced, Growth First or Income First.
6. Deterministic engine calculates percentages and naira amounts.
7. User reviews methodology, assumptions and limitations.
8. User explicitly confirms before the plan is saved.
9. The saved plan remains separate from recorded real holdings and simulated trades.

## V1 scope

- Nigeria-first and NGN-denominated.
- Logged-in users only.
- Broad asset-category models, not individual security selections.
- Deterministic calculations with a versioned methodology.
- Explicit SIMULATION state and limitation language.
- Additive plan history linked to the authenticated user.
- No brokerage connection, custody, account opening, funding or order transmission.
- No automatic changes to real holdings or simulator accounts.

## Authority split

- **YieldDesk UI:** guided questions, display, confirmation and history.
- **Deterministic engine:** percentages, amounts, reconciliation and assumptions.
- **AI layer:** future sourced explanation and question handling; never calculates hidden financial facts.
- **User:** chooses the model and confirms whether to save.
- **Portfolio Operator / Xara services:** future research, evidence, monitoring and explanation through an authenticated product integration; not embedded as an uncontrolled execution engine.

## Policy classification

**REQUIRES_CONTROLS**

Controls:

- user chooses the model;
- outputs are labelled hypothetical and simulated;
- no “recommended,” “suitable,” “best,” BUY/SELL/HOLD or trade-instruction language;
- the server regenerates saved allocations from versioned templates;
- explicit confirmation is required;
- real holdings and simulation transactions are never mutated;
- fees, taxes, FX, inflation, data freshness and missing information are disclosed.

## V1 deterministic models

| Model | Purpose |
|---|---|
| Preserve Capital | Liquidity and lower-volatility Nigerian fixed-income categories |
| Balanced | Mixture of Nigerian growth, income, liquidity and strategic assets |
| Growth First | Higher Nigerian equity and strategic-asset exposure with stabilizers |
| Income First | Sovereign income, liquidity and dividend-oriented equity exposure |

The templates are educational comparison models. They are not suitability determinations or personalized investment recommendations.

## Acceptance criteria

- Route is protected and unavailable to logged-out users.
- Dashboard and sidebar expose the Wealth Builder entry point.
- Goal requires 3–500 characters.
- Total modeled spend is validated server-side.
- Horizon and model are explicit user choices.
- Allocation percentages total 100%.
- Allocation amounts reconcile exactly to the entered budget after rounding.
- Preview creates no database write.
- Save fails unless `confirmed: true`.
- Saved plans are scoped to the authenticated user.
- UI is responsive, keyboard usable and includes loading, error, review and completion states.
- No trade, holding, funding or brokerage mutation occurs.

# FinancialPlanner — Loan Payoff Simulator

**Project:** `FinancialPlanner`  
**Canonical spec (this file):** `docs/SPEC.md`  
**Spec-driven workflow:** See `AGENTS.md`. **New feature delivery:** `.cursor/skills/sdd-create-feature/SKILL.md`. **Task checklist (check off when done):** [`TASKS.md`](TASKS.md) (this folder). **Domain implementation:** `.cursor/skills/spec-driven-financial-planner/SKILL.md`.

---

# Loan Payoff Simulator — Product & Engineering Specification

**Version:** 1.2  
**Audience:** Engineers / Cursor agents implementing the application  
**Locale:** India (INR, lakhs in UI optional)  
**Status:** Draft for implementation

---

## 1. Purpose

Build a **client-side or lightweight web application** that lets a user model a **reducing-balance loan** (home / personal / LAP-style) and compare **multiple payoff strategies**, including:

- Lump-sum prepayments from **cash**, **gold liquidation**, and **PF (Provident Fund corpus)**  
- Prepayment policies: **reduce tenure** vs **reduce EMI** (where applicable)  
- Optional **extra monthly principal** payments  
- A dedicated **unemployment + PF staged withdrawal** timeline per product rules defined in this spec  

The app must produce **transparent numbers**: amortisation tables, totals, interest paid, payoff month, and scenario comparison tables.

Optional **strategic interaction** modelling (§4.13) compares borrower, lender, household, and nature moves using the same amortisation engine as a **payoff oracle**—not a replacement for §4.3–§4.6 deterministic scenarios.

---

## 2. Glossary

| Term | Meaning |
|------|---------|
| **Lakh** | 100,000 INR (UI may accept “lakhs” and store rupees internally) |
| **PF corpus** | Employee Provident Fund balance available for modelling (user-entered) |
| **Gold value** | User-entered liquidatable value (post haircut optional field) |
| **Prepayment** | Principal reduction outside scheduled EMI |
| **Moratorium** | Out of scope unless explicitly added later |
| **Player** | Decision-maker in §4.13 (`B` borrower, `L` lender, `H` household co-decider, `N` nature) |
| **Action profile** | One chosen action per active player in a game round |
| **Payoff oracle** | Existing simulation (§4.3–§4.8, §4.12) that maps actions → INR outcomes |
| **Normal-form game** | Simultaneous choices; payoff matrix per action profile |
| **Extensive-form game** | Sequential choices; solved by backward induction when information is perfect |
| **Nash equilibrium (pure)** | Action profile where no player gains by unilateral deviation |
| **Best response** | Optimal action for one player holding others’ actions fixed |

---

## 3. User Personas

1. **Borrower optimiser:** Employed, wants to minimise interest while keeping liquidity.  
2. **Stress tester:** Wants unemployment path + staged PF withdrawals + cash runway.  
3. **Comparator:** Wants side-by-side scenarios exportable to CSV.  
4. **Strategic planner:** Wants best responses and equilibria when lender fees, household splits, or unemployment paths interact with prepay choices (§4.13).

---

## 4. Functional Requirements

### 4.1 Core inputs (global)

| Field | Type | Required | Notes |
|------|------|----------|------|
| `principal_inr` | number | yes | > 0 |
| `annual_interest_rate` | number | yes | Nominal annual %, e.g. `7.9` |
| `tenure_months` | integer | yes | e.g. `168` |
| `start_date` | date | optional | For calendar output; default “today” |
| `rounding_mode` | enum | optional | `banker` / `floor` / `ceil` — document choice in README |
| `prepayment_fee_inr` | number | optional | Default `0` |
| `rate_type` | enum | optional | `fixed` (v1); `floating` deferred |

### 4.2 Asset inputs (for labelling & constraints, not all are auto-spent)

| Field | Type | Required |
|------|------|----------|
| `cash_inr` | number | no |
| `pf_corpus_inr` | number | no |
| `gold_liquid_inr` | number | no |
| `gold_haircut_pct` | number | no | 0–100 applied to gold if user enables |
| `monthly_cash_to_loan_inr` | number | no | Recurring INR applied as **extra principal** after each month’s scheduled EMI (§4.5). v1 UI label: “Monthly cash to loan”; does **not** deduct living expenses—use §4.8 for budgeted cashflow. |

### 4.3 Baseline computation

- Compute **monthly rate**: \( r = \frac{\text{annual\_rate}}{100 \times 12} \)  
- Compute **EMI** (standard annuity):

\[
\text{EMI} = P \cdot \frac{r(1+r)^n}{(1+r)^n - 1}
\]

- Generate **month-by-month schedule** for baseline: opening balance, interest portion, principal portion, closing balance.  
- Totals: **total paid**, **total interest**, **payoff month index**.

### 4.4 Prepayment engine (v1 must support)

Prepayments are applied **at month boundary** unless advanced setting `prepayment_timing` = `mid_month` (optional; default `month_start_after_emi`).

**Policies when prepayment occurs:**

1. **`recompute_tenure_keep_emi`**  
   - EMI unchanged from baseline EMI (snapshot at scenario start unless user specifies “current EMI”).  
   - After prepayment, recompute remaining months until balance ≤ 0 (or final fractional month if you support it; otherwise last month adjustment).  

2. **`recompute_emi_keep_tenure`**  
   - Remaining scheduled months unchanged from original end date (relative to scenario start).  
   - Recompute EMI from new principal and remaining months.  

3. **`lump_sum_full_payoff`**  
   - If prepayment + scheduled payments clear loan early, stop schedule.  

**Partial prepayment minimum:** configurable constant `MIN_PREPAYMENT_INR` default `0`.

### 4.5 Extra monthly principal

- Optional `extra_principal_inr` each month, or a single recurring amount.  
- Applied after EMI allocation for that month (document order: interest → scheduled principal → extra principal).  
- Must not drive balance negative; clamp overpayment to remaining principal + accrued interest rules (define: extra reduces principal after interest).

### 4.6 Scenario catalogue (employed)

Implement as named presets + freeform builder.

| Scenario ID | Description |
|-------------|-------------|
| `BASE` | No prepayment |
| `PREPAY_CASH_25L_TENURE` | One-time prepay ₹25,00,000 from cash at month 1; policy `recompute_tenure_keep_emi` |
| `PREPAY_CASH_25L_EMI` | One-time prepay ₹25,00,000 at month 1; policy `recompute_emi_keep_tenure` |
| `PREPAY_FULL_50L` | Full payoff at month 1 from combined sources (user selects funding mix) |
| `PREPAY_CUSTOM` | User-defined amount + month + policy |
| `EXTRA_EMI` | Recurring extra principal |
| `STAGED_PREPAY` | Multiple timed prepayments (array) |
| `BASE_PLUS_MONTHLY_INFLOW` | Baseline EMI + fixed `monthly_cash_to_loan_inr` each month after EMI (§4.5); compare **payoff months** to BASE |
| `PREPAY_EMI_PLUS_MONTHLY_INFLOW` | One-time prepay (e.g. ₹25L) month 1 + **keep original EMI** + same monthly extra to loan; compare payoff months |

### 4.7 Unemployment + PF withdrawal module (required)

**Trigger:** user toggles `unemployment_mode` and sets `unemployment_start_month` (integer offset from scenario start, default `1`).

**PF withdrawal rule set (canonical for this app — user-specified):**

Let `PF0` be PF corpus at unemployment start (default: user `pf_corpus_inr`; allow editing).

| Event time | Withdrawal fraction of `PF0` | Amount |
|------------|-------------------------------|--------|
| End of **month 1** after unemployment start | **75%** | `0.75 * PF0` |
| End of **month 12** after unemployment start | **25%** | `0.25 * PF0` |

**Constraints / modelling knobs:**

- `pf_withdrawal_destination`: enum per tranche  
  - `loan_prepay` | `cash_buffer` | `split`  
- If `split`, provide `loan_fraction` for each tranche.  
- Default suggestion in UI: user chooses; no hard default beyond `cash_buffer` for tranche 1 if `unemployment_priority` = `liquidity_first`.

**Scenarios (minimum):**

| Scenario ID | Description |
|-------------|-------------|
| `UE_PF_TO_LOAN` | Both tranches 100% to loan prepay; EMIs funded from `cash_inr` via a monthly budget rule (see 4.8) |
| `UE_PF_BRIDGE` | Tranche 1 funds living + EMI shortfall first; remainder prepays; tranche 2 per user split |
| `UE_DELAY_PREPAY` | No loan prepay until month 12 tranche (user configurable) |

### 4.8 Monthly budget / cashflow (unemployment)

Add optional fields:

- `monthly_living_expense_inr`  
- `monthly_income_inr` (default `0` in unemployment)  
- `emi_inr_override` (optional; else use computed EMI)

**Simulation order each month:**

1. Accrue interest on loan opening balance.  
2. Pay EMI if `cash_balance >= emi` OR use rules:  
   - `SHORTFALL_ACTION`: `skip_emi` (mark delinquent + penal interest **optional v2**), `use_pf_if_available` (not unless withdrawal month), `draw_cash_buffer`  
3. Apply PF inflows on scheduled withdrawal months to `cash_balance` and/or `loan_prepay` per user split.  
4. Apply any scheduled prepayments.

**Cash balance model:**

- Initialise `cash_balance = cash_inr` (user input).  
- Each month subtract living expenses + EMI (and add income if any).  
- PF withdrawals add to `cash_balance` before allocation if `split` workflow is used.

### 4.9 Outputs

For each scenario:

- **Summary KPIs:** payoff month (date), total interest, total outflows, total prepayments, interest vs baseline delta  
- **Schedule table:** month index, opening balance, interest, principal, extra principal, prepayment, closing balance, cash_balance (if enabled), events  
- **Charts (optional v1.1):** remaining principal curve, cumulative interest  

**Export:** CSV export of schedule + JSON export of scenario config.

### 4.12 Repayment strategy planner (household allocation)

Compare **three named strategies** over a user horizon. Reuses §4.3 EMI and §4.5 extra-principal engine; adds equity SIP + PF corpus projection.

#### 4.12.1 Inputs (extends §4.1–§4.2)

| Field | Type | Required | Notes |
|------|------|----------|------|
| `monthly_take_home_inr` | number | yes | > 0 for meaningful warnings |
| `monthly_living_expense_inr` | number | no | Used in emergency buffer |
| `extra_monthly_income_inr` | number | no | Post-tax optional via `extra_income_post_tax` |
| `marginal_tax_rate_pct` | number | no | When extra is pre-tax |
| `emergency_months_buffer` | number | no | Default `6` |
| `expected_equity_return_pct` | number | no | Nominal annual % for SIP/lump projection |
| `horizon_months` | number | yes | Compare KPIs at this month index |
| `repayment_pct_of_take_home` | number | no | Only for `STRATEGY_AGGRESSIVE_PREPAY`; 0–100 |

Emergency deployable cash: `deployable = max(0, cash_inr - emergency_months_buffer × (living + emi0))`. If `cash_inr < buffer`, deployable = 0 and warn `EMERGENCY_FUND_SHORTFALL`.

#### 4.12.2 Strategy IDs and allocation rules

| Strategy ID | One-time deployable | Monthly extra (post-EMI) | Equity sleeve |
|-------------|---------------------|--------------------------|---------------|
| `STRATEGY_EQUITY_BLEND` | 40% prepay, 60% equity lump | 60% to loan, 40% SIP | Lump + SIP during loan; post-loan redirect = `emi0 + extra` to equity |
| `STRATEGY_PREPAY_HEAVY` | 100% prepay | 100% to loan | None |
| `STRATEGY_AGGRESSIVE_PREPAY` | 100% prepay | `max(0, repayment_pct_of_take_home × take_home + extra − emi0)` | None |

Month-1 prepay uses `recompute_tenure_keep_emi` (§4.4 policy 1). Post-loan equity redirect runs for `horizon − loan_close_month` months.

#### 4.12.3 Outputs (per strategy row)

`loan_close_month`, `total_interest_inr`, `interest_saved_vs_base_inr`, allocation breakdown, `equity_corpus_at_horizon_inr`, `equity_corpus_at_horizon_post_tax_inr` (LTCG 12.5% on gain above ₹1,25,000 exemption), `pf_corpus_at_horizon_inr`, `net_worth_at_horizon_inr`, `min_living_budget_inr`, `warnings[]`.

#### 4.12.4 Tier presets (UI)

| Tier ID | Label | `monthly_take_home_inr` |
|---------|-------|-------------------------|
| `tier_a` | Tier A | 300,000 |
| `tier_b` | Tier B | 200,000 |
| `tier_c` | Tier C | 100,000 |

Nine golden fixtures: each tier × each strategy (§15.1).

#### 4.12.5 Warnings (strategy module)

| Code | Condition |
|------|-----------|
| `EMERGENCY_FUND_SHORTFALL` | `cash_inr` below emergency buffer |
| `FRAGILE_CASH_FLOW` | `emi0 > 0.5 × monthly_take_home_inr` |
| `BELOW_SUBSISTENCE` | `min_living_budget_inr < 15_000` |
| `AGGRESSIVE_PCT_INVALID` | `repayment_pct_of_take_home` outside 0–100 |
| `HORIZON_TOO_SHORT` | `horizon_months < loan_close_month` |

---

### 4.13 Strategic interaction (game theory)

Model **multi-agent** choices on top of deterministic simulation. Single-agent “pick the best scenario” (§4.6) is **not** §4.13; it remains brute-force comparison over named presets.

#### 4.13.1 Architecture

| Layer | Responsibility |
|-------|----------------|
| **Payoff oracle** | §4.3–§4.8 schedules, §4.12 `simulateStrategy` — no equilibrium logic inside |
| **Game definition** | Players, action sets, information, timing, payoff weights |
| **Solver** | Nash (pure), backward induction, max-min, Pareto scan, bargaining (phased) |
| **UI** | Select `game_profile_id`, opponent assumptions, show matrix / tree / recommendations |

Implement under `src/lib/game/` (names non-binding). Results are **educational** (§14); not lender negotiation or legal advice.

#### 4.13.2 Player roster

| ID | Role | Active when |
|----|------|-------------|
| `B` | Borrower / household principal | Always in §4.13 |
| `L` | Lender (fees, repricing) | `players` includes `L` |
| `H` | Co-decider (spouse/partner split) | `players` includes `H` |
| `N` | Nature (employment, shocks) | `players` includes `N` |

**Valid player sets** (7 configurations; `{B}` alone is excluded—use §4.6):

| `players` | Code | Description |
|-----------|------|-------------|
| `B,L` | `BL` | Prepay vs prepayment fee / reprice |
| `B,H` | `BH` | Surplus split: loan vs equity vs buffer |
| `B,N` | `BN` | Employed path vs unemployment + PF tranches (§4.7) |
| `B,L,H` | `BLH` | Fee + household split |
| `B,L,N` | `BLN` | Fee + unemployment timing |
| `B,H,N` | `BHN` | Split + unemployment |
| `B,L,H,N` | `BLHN` | Full stack (stress + strategic) |

#### 4.13.3 Action dimensions (enumerated levels)

Each dimension applies only if the relevant player is active. **Invalid** cells (e.g. `H` action when `H` ∉ `players`) are omitted from the catalogue.

**Borrower (`B`) — lump prepay at month 1**

| Action ID | Meaning |
|-----------|---------|
| `B_PREPAY_0` | No lump prepay |
| `B_PREPAY_25` | ₹25,00,000 (reference; scale via `prepay_fraction_of_deployable` optional) |
| `B_PREPAY_50` | 50% of deployable cash (after emergency buffer) |
| `B_PREPAY_100` | 100% of deployable |

**Borrower (`B`) — prepayment policy** (when lump > 0)

| Action ID | Maps to §4.4 |
|-----------|----------------|
| `B_POL_TENURE` | `recompute_tenure_keep_emi` |
| `B_POL_EMI` | `recompute_emi_keep_tenure` |

**Borrower (`B`) — recurring extra principal**

| Action ID | Meaning |
|-----------|---------|
| `B_EXTRA_0` | No monthly extra |
| `B_EXTRA_LOW` | `monthly_cash_to_loan_inr` default **₹10,000** |
| `B_EXTRA_HIGH` | `monthly_cash_to_loan_inr` default **₹50,000** |

**Borrower (`B`) — funding source** (labelling + constraint only)

| Action ID | Meaning |
|-----------|---------|
| `B_FUND_CASH` | Prepay from `cash_inr` only |
| `B_FUND_MIX` | Cash first, then gold (haircut), then PF (user fractions) |

**Lender (`L`)**

| Action ID | Meaning |
|-----------|---------|
| `L_FEE_0` | `prepayment_fee_inr = 0` |
| `L_FEE_FLAT` | Charge `prepayment_fee_inr` once per lump prepay event |
| `L_FEE_PCT` | Charge `prepayment_fee_pct × prepay_amount` (new input; default **1%** if unset) |
| `L_RATE_HOLD` | `annual_interest_rate` unchanged (v1 default) |
| `L_RATE_BUMP` | Add `lender_rate_bump_bps` (default **50** bps) after borrower lump prepay (v1.3) |

**Household (`H`) — maps to §4.12 strategy or custom split**

| Action ID | Maps to |
|-----------|---------|
| `H_BLEND` | `STRATEGY_EQUITY_BLEND` |
| `H_PREPAY` | `STRATEGY_PREPAY_HEAVY` |
| `H_AGGR` | `STRATEGY_AGGRESSIVE_PREPAY` |
| `H_CUSTOM_70_30` | 70% deployable + monthly surplus to loan, 30% equity |
| `H_CUSTOM_30_70` | 30% loan / 70% equity |

**Nature (`N`)**

| Action ID | Meaning |
|-----------|---------|
| `N_EMPLOYED` | `unemployment_mode = false` |
| `N_UE_M1` | Unemployment starts month **1** (§4.7) |
| `N_UE_M12` | Unemployment starts month **12** |
| `N_UE_M24` | Unemployment starts month **24** |

**PF tranche routing** (when `N` active and unemployment on)

| Action ID | Meaning |
|-----------|---------|
| `N_PF_LOAN` | Both tranches 100% `loan_prepay` (`UE_PF_TO_LOAN`) |
| `N_PF_BRIDGE` | `UE_PF_BRIDGE` preset |
| `N_PF_DELAY` | `UE_DELAY_PREPAY` preset |

#### 4.13.4 Information and timing

| `information` | Valid if | Semantics |
|---------------|----------|-----------|
| `SIM` | Any player set | Normal form: all players choose simultaneously |
| `SEQ_B` | `L` or `H` present | Borrower moves first; others observe then respond |
| `SEQ_L` | `L` present | Lender announces fee rule first; borrower then prepays |
| `SEQ_N` | `N` present | Nature reveals employment state first; then `B` (and `L`/`H` if present) |

| `game_form` | Requires | Solver |
|-------------|----------|--------|
| `NORMAL` | `information = SIM` | Pure Nash; optional mixed Nash v1.3 |
| `EXTENSIVE` | `SEQ_*` | Subgame-perfect (backward induction) |
| `STOCHASTIC` | `N` present + `game_form = STOCHASTIC` | Scenario-tree / max-min over nature branches (v1.3; not full MDP v2) |

#### 4.13.5 Payoff functions (per player)

Payoffs are computed from oracle outputs. User may select **objective** (applies to `B` / `H`; `L` uses lender objective when in competitive mode).

| `payoff_metric` | Formula (borrower / household) |
|-----------------|----------------------------------|
| `MINUS_TOTAL_INTEREST` | `−total_interest_inr` |
| `MINUS_TOTAL_OUTFLOW` | `−(total_paid_inr + prepayment_fees_inr)` |
| `NET_WORTH_HORIZON` | `net_worth_at_horizon_inr` from §4.12 when `H` active; else cash + PF + equity − loan balance at horizon |
| `INTEREST_SAVED_MINUS_FEES` | `interest_saved_vs_base_inr − prepayment_fees_inr` |
| `MIN_CASH_RUNWAY` | `min(cash_balance_inr)` over schedule (§4.8); maximise for risk-averse |

| `lender_objective` | Formula (`L` active, competitive) |
|--------------------|-----------------------------------|
| `L_FEE_INCOME` | `prepayment_fees_inr` |
| `L_INTEREST_INCOME` | `total_interest_inr` (lender prefers borrower **not** to prepay) |

**Cooperative mode** (`B,H` only, or user toggles `cooperative: true`): single welfare `W = w_b × U_B + w_h × U_H` with default `w_b = w_h = 0.5`; report **Pareto frontier** over deployable splits instead of zero-sum Nash.

#### 4.13.6 Solution concepts

| `solution` | Use when |
|------------|----------|
| `NASH_PURE` | `NORMAL`, finite action sets |
| `SUBGAME_PERFECT` | `EXTENSIVE`, perfect information |
| `MAXMIN_B` | Risk-averse borrower vs unknown `L` or `N` |
| `PARETO` | Cooperative `B,H` |
| `NASH_BARGAINING` | `B,H` with disagreement point = `B_PREPAY_0` + `H_BLEND` (v1.3) |
| `MIXED_NASH` | No pure equilibrium; 2×2 games only (v1.3) |

#### 4.13.7 Combination index (how profiles are built)

A **game profile** is a valid tuple:

```text
game_profile = ( players, information, game_form, solution,
                 b_lump, b_policy, b_extra, b_fund,
                 l_fee, l_rate,          -- omitted if L ∉ players
                 h_split,                -- omitted if H ∉ players
                 n_employment, n_pf_route )  -- omitted if N ∉ players
```

**Validity rules**

1. `{B}` only → not §4.13; use §4.6 / §4.12.  
2. `b_policy` required iff `b_lump ≠ B_PREPAY_0`.  
3. `l_fee`, `l_rate` require `L ∈ players`.  
4. `h_split` requires `H ∈ players`.  
5. `n_employment`, `n_pf_route` require `N ∈ players`; `n_pf_route` only if `n_employment ≠ N_EMPLOYED`.  
6. `SEQ_L` requires `L`; `SEQ_N` requires `N`.  
7. `STOCHASTIC` requires `N` and at least two nature branches in the run config.  
8. `B_FUND_MIX` requires sufficient labelled assets (§4.2); else profile runs with warning `INSUFFICIENT_ASSETS`.

**Raw combinatorial upper bound** (before validity):  
`7 player sets × 4 information × 3 game_form × 6 solution × 4 lump × 2 policy × 3 extra × 2 fund × 4 l_fee × 2 l_rate × 5 h_split × 3 n_emp × 3 n_pf` → millions of tuples; **§4.13.8** lists the **canonical** profiles the product actually names and ships.

#### 4.13.8 Canonical game profile catalogue

Naming: `GAME_{players}_{information}_{focus}` where `focus` summarises the strategic tension. Each row is one preset; implementation may expand action grids internally.

**Tier P0 — v1.2 (implement first)**

| Profile ID | players | information | Focus | B actions (grid) | Other actions | solution |
|------------|---------|-------------|-------|------------------|---------------|----------|
| `GAME_BL_SIM_FEE` | B,L | SIM | Prepay vs fee | lump × {0,25,50} × policy tenure | L: {FEE_0, FEE_FLAT} | NASH_PURE |
| `GAME_BL_SEQ_L_FEE` | B,L | SEQ_L | Lender commits fee rule first | lump × {0,25,50} | L: {FEE_0, FEE_FLAT, FEE_PCT} | SUBGAME_PERFECT |
| `GAME_BH_SIM_SPLIT` | B,H | SIM | Loan vs equity | via H: {BLEND, PREPAY, AGGR} | B: deployable fixed | PARETO |
| `GAME_BH_COOP_PARETO` | B,H | SIM | Custom splits | H: {CUSTOM_70_30, CUSTOM_30_70, BLEND} | cooperative | PARETO |
| `GAME_BN_SEQ_N_UE` | B,N | SEQ_N | Employment shock | B: {EXTRA_0, EXTRA_HIGH} | N: {EMPLOYED, UE_M1} × PF route | MAXMIN_B |
| `GAME_BN_SIM_UE_TIMING` | B,N | SIM | When unemployment hits | B: lump {0,25} | N: {UE_M1, UE_M12, UE_M24} × {PF_LOAN, PF_BRIDGE} | MAXMIN_B |

**Tier P1 — v1.3**

| Profile ID | players | information | Focus |
|------------|---------|-------------|-------|
| `GAME_BLH_SIM_FULL` | B,L,H | SIM | Fee + household split |
| `GAME_BLN_SEQ_N_FEE` | B,L,N | SEQ_N | UE timing + lender fee |
| `GAME_BHN_STOCH_RUNWAY` | B,H,N | STOCHASTIC | Min cash runway vs split |
| `GAME_BLHN_EXT_STRESS` | B,L,H,N | SEQ_N | Full stress + strategic |
| `GAME_BL_SIM_RATE_BUMP` | B,L | SIM | Prepay triggers rate bump |
| `GAME_BL_MIXED_FEE` | B,L | SIM | Mixed strategy Nash on 2×2 fee game |

**Tier P2 — research / non-shipping (document only)**

| Profile ID | Note |
|------------|------|
| `GAME_MULTI_CREDITOR` | >1 loan; blocked by §11 until spec revision |
| `GAME_REPEATED_LENDER` | Repeated game over months; needs horizon policy |
| `GAME_FLOATING_N` | Nature draws rate paths; blocked by §11 stochastic rates |
| `GAME_B_ONLY_OPTIM` | Alias to §4.6 grid search — not game theory |

**Cross-product within P0 `GAME_BL_SIM_FEE`** (explicit 3×2×2 = **12** raw cells):

- `b_lump ∈ {B_PREPAY_0, B_PREPAY_25, B_PREPAY_50}`  
- `b_policy ∈ {B_POL_TENURE, B_POL_EMI}` (ignored when lump = 0)  
- `l_fee ∈ {L_FEE_0, L_FEE_FLAT}`  

Collapsed distinct outcomes: **10** cells (when `b_lump = B_PREPAY_0`, the two policies share one payoff per `l_fee`).

**Expanded grid (optional UI):** include `b_extra ∈ {B_EXTRA_0, B_EXTRA_HIGH}` → 12 × 2 = **24** raw cells, **20** collapsed (same lump=0 policy merge per extra/fee pair).

**Cross-product within P0 `GAME_BN_SIM_UE_TIMING`**:  
`3` UE months × `2` PF routes × `2` lump = **12** cells (B lump {0, 25}).

#### 4.13.9 Outputs (game module)

For each `game_profile_id`:

| Output | Description |
|--------|-------------|
| `payoff_matrix` | Players × action profiles → INR (and lender column if competitive) |
| `equilibria[]` | Pure Nash or subgame-perfect profiles |
| `recommended_b_action` | Max-min or user-selected objective |
| `deviation_gains` | Unilateral deviation Δ payoff (explainability) |
| `warnings[]` | `INSUFFICIENT_ASSETS`, `NO_PURE_EQUILIBRIUM`, `AMBIGUOUS_EQUILIBRIUM` |
| `underlying_scenario_ids[]` | §4.6 scenario IDs used as oracle calls |

Export: JSON of matrix + equilibria; CSV optional v1.3.

#### 4.13.10 Inputs (game-specific)

| Field | Type | Required | Notes |
|------|------|----------|------|
| `game_profile_id` | enum | yes | §4.13.8 |
| `payoff_metric` | enum | no | Default `INTEREST_SAVED_MINUS_FEES` |
| `lender_objective` | enum | no | Default `L_FEE_INCOME` when `L` active |
| `cooperative` | boolean | no | Default `false`; force `true` for `GAME_BH_*` Pareto |
| `prepayment_fee_inr` | number | no | §4.1 |
| `prepayment_fee_pct` | number | no | For `L_FEE_PCT` |
| `lender_rate_bump_bps` | number | no | For `L_RATE_BUMP` |
| `horizon_months` | integer | no | Required when payoff uses `NET_WORTH_HORIZON` |
| `w_b`, `w_h` | number | no | Cooperative weights; default 0.5 / 0.5 |

All §4.1–§4.2 loan and asset fields apply to the oracle.

#### 4.13.11 UI (minimum)

1. **Game picker** — dropdown of Tier P0 profiles + short description.  
2. **Matrix view** — heatmap or table for `NORMAL` games; tree diagram for `EXTENSIVE` (optional v1.3).  
3. **Recommendation card** — equilibrium or max-min action with link to underlying amortisation scenario.  
4. **Disclaimer** — §14 plus: “Opponent behaviour is assumed, not predicted.”

---

## 5. Non-Functional Requirements

- **Deterministic:** same inputs → same outputs (document rounding).  
- **Explainability:** hover / help text showing formulas.  
- **Privacy:** default offline-first; no server required for v1.  
- **Accessibility:** labels for all inputs, readable tables.  
- **Validation:** block negative numbers; show inline errors.

---

## 6. Data Models (TypeScript-friendly sketch)

```ts
type PrepaymentPolicy =
  | "recompute_tenure_keep_emi"
  | "recompute_emi_keep_tenure";

type PfTrancheDestination = "loan_prepay" | "cash_buffer" | "split";

interface PrepaymentEvent {
  month: number; // 1-based index from scenario start
  amount_inr: number;
  policy: PrepaymentPolicy;
  label?: string;
}

interface PfUnemploymentConfig {
  enabled: boolean;
  start_month: number; // when unemployment begins
  pf_corpus_start_inr: number;
  tranche1: { month: number; pct: 0.75; destination: PfTrancheDestination; loan_fraction?: number };
  tranche2: { month: number; pct: 0.25; destination: PfTrancheDestination; loan_fraction?: number };
}

interface Scenario {
  id: string;
  name: string;
  prepayments: PrepaymentEvent[];
  extra_principal_inr?: number;
  pf_unemployment?: PfUnemploymentConfig;
  monthly_income_inr?: number;
  monthly_living_expense_inr?: number;
}

interface SimulationResult {
  scenario_id: string;
  rows: AmortRow[];
  totals: {
    total_paid_inr: number;
    total_interest_inr: number;
    total_prepayments_inr: number;
    payoff_month: number;
  };
}

type PlayerId = "B" | "L" | "H" | "N";

type GameProfileId =
  | "GAME_BL_SIM_FEE"
  | "GAME_BL_SEQ_L_FEE"
  | "GAME_BH_SIM_SPLIT"
  | "GAME_BH_COOP_PARETO"
  | "GAME_BN_SEQ_N_UE"
  | "GAME_BN_SIM_UE_TIMING";
  // v1.3: BLH, BLN, BHN, BLHN, BL_SIM_RATE_BUMP, BL_MIXED_FEE

interface GameActionProfile {
  b_lump?: string;
  b_policy?: string;
  b_extra?: string;
  l_fee?: string;
  h_split?: string;
  n_employment?: string;
  n_pf_route?: string;
}

interface GameEquilibrium {
  action_profile: GameActionProfile;
  payoffs: Partial<Record<PlayerId, number>>;
  is_pure: boolean;
}

interface GameResult {
  game_profile_id: GameProfileId;
  payoff_matrix: unknown; // shape depends on profile; JSON-serialisable
  equilibria: GameEquilibrium[];
  recommended_b_action?: GameActionProfile;
  warnings: string[];
  underlying_scenario_ids: string[];
}

interface AmortRow {
  month: number;
  opening_principal_inr: number;
  interest_inr: number;
  scheduled_principal_inr: number;
  extra_principal_inr: number;
  prepayment_inr: number;
  closing_principal_inr: number;
  emi_inr: number;
  cash_balance_inr?: number;
  events?: string[];
}
```

---

## 7. Algorithm Notes (implementation hints)

### 7.1 EMI with changing principal / tenor

When `recompute_emi_keep_tenure` after prepayment at month `k`:

- Let `P_k` be balance after prepayment.  
- Remaining months `n_rem = n - (k - 1)` (define inclusive/exclusive consistently and test).  
- New EMI uses `P_k`, `r`, `n_rem`.

When `recompute_tenure_keep_emi`:

- Iterate month simulation until balance ≤ 0 using fixed EMI (clarify whether EMI is **original baseline EMI** or **EMI after prior recomputations**; v1: **original baseline EMI** unless user selects “current EMI”).

### 7.2 Closed-form months-to-payoff (optional fast path)

For fixed EMI `A`, rate `r`, principal `P`:

\[
n = \frac{\ln\left(\frac{A}{A - Pr}\right)}{\ln(1+r)}
\]

Use only when `A > Pr`. Handle final-month fractional payoff by simulation for accuracy.

### 7.3 PF unemployment tranche months

Interpret “after 1 month” as **end of month 1 relative to unemployment start**:

- If `unemployment_start_month = S`, tranche1 applies at month `S` (or `S+0` depending on zero-index convention — **pick 1-based for UI**, document mapping).  
- Spec recommendation:  
  - `U` = unemployment start month index (1-based)  
  - Tranche1 at `U` (end of first unemployment month)  
  - Tranche2 at `U + 11` if tranche1 is month 1 and tranche2 end of month 12 of unemployment (i.e., 12 months later **inclusive**); implement exactly as:  
    - **Tranche1 month = U**  
    - **Tranche2 month = U + 11** (totals 12 months span) **OR** `U + 12` if you interpret “end of one year” as 12 months after tranche1.  

**Decision (canonical):**  
- Tranche1 at `U` (first month completion)  
- Tranche2 at `U + 11` to represent **month 12 of the unemployment year** from `U`  
Engineers must add unit tests for off-by-one with an example: `U=1` → tranche2 at month `12`.

---

## 8. UI Specification (minimum viable)

### Screens

1. **Inputs**  
   - Loan + assets + unemployment toggle + budget fields  
2. **Scenario builder**  
   - Checkboxes for presets + advanced JSON/YAML optional (defer)  
3. **Results**  
   - Comparison table + drill-down per scenario  
4. **Schedule**  
   - Virtualised table for 600 rows max  

### Comparison table columns

Scenario name; Payoff month; Total interest; Δ interest vs BASE; Total outflows; Min cash balance (if simulated); Notes/warnings.

---

## 9. Edge Cases & Warnings (must surface in UI)

- Prepayment > outstanding principal → clamp + warning.  
- `recompute_tenure_keep_emi` with EMI too low to cover interest (`A ≤ Pr`) → error state explaining negative amortisation.  
- Unemployment mode with **no cash** and **no income** and **EMI > 0** → warn “EMI default risk”; do not silently succeed.  
- PF withdrawals exceeding corpus → error.  
- Gold haircut toggled → show effective liquidation value.

---

## 10. Testing / Acceptance Criteria

**How to verify:** Use **`.cursor/skills/sdd-verify-feature/SKILL.md`** (maps this section to tests + smoke + build). Check off **Phase 3–4** in **[`TASKS.md`](TASKS.md)** as you complete each task.

### Unit tests (required)

1. **EMI matches reference** for: `P=5_000_000`, `annual=7.9`, `n=168` within **₹1** tolerance after rounding policy documented.  
2. **Baseline total interest** within **0.1%** of a reference spreadsheet for same inputs.  
3. **Prepay ₹25L at month 1 + keep EMI**: payoff month ~ **62** for the reference loan (allow ±1 month due to rounding).  
4. **Prepay ₹25L at month 1 + keep tenure 168**: EMI ~ **half** of baseline within **₹50** (rounding).  
5. **PF unemployment**: for `PF0=2_500_000`, verify inflows **1,875,000** then **625,000** on correct months.  
6. **Cashflow**: constructed fixture where income=0, living+EMI exhaust cash in `k` months → system flags shortfall.  
7. **Monthly inflow to loan:** for fixed `monthly_cash_to_loan_inr` &gt; 0, payoff month count is **strictly less** than baseline for the same principal/rate/tenure (reference loan).

### Golden files

Store JSON golden outputs for scenarios `BASE`, `PREPAY_CASH_25L_TENURE`, `UE_PF_TO_LOAN` with a fixed rounding policy.

### Strategy planner (§4.12)

8. **Equity blend** on reference §15 inputs: `one_time_prepay_inr` = 40% of deployable; `equity_lump_inr` = remainder.  
9. **Nine strategy goldens** (`tier_{a,b,c}` × three strategies) match `src/test/fixtures/strategy/` within documented rounding.

### Game theory (§4.13) — phased

10. **`GAME_BL_SIM_FEE`**: payoff matrix has **10** collapsed cells (12 raw); pure Nash exists for reference loan with `prepayment_fee_inr = 25_000` and fee objective — document equilibrium in golden JSON.  
11. **`GAME_BL_SIM_FEE`**: when `L_FEE_0`, borrower best response is maximum lump in `INTEREST_SAVED_MINUS_FEES` objective (reference loan).  
12. **`GAME_BN_SIM_UE_TIMING`**: **12** cells; max-min borrower action never chooses `B_PREPAY_25` if `min_cash_runway` < 3 months on reference budget fixture (construct in test).  
13. **Oracle purity**: `src/lib/game/` must not duplicate EMI math; all payoffs call §4.3–§4.8 or §4.12 helpers.  
14. **Tier P0 goldens** (when implemented): one JSON per profile in `src/test/fixtures/game/`.

---

## 11. Non-Goals (v1)

- Tax advice, capital gains on gold, or EPFO compliance verification.  
- Floating-rate **stochastic** simulation (§4.13 `GAME_FLOATING_N` remains design-only).  
- **Multi-loan** creditor games (`GAME_MULTI_CREDITOR`) until §4.13.8 Tier P2 is promoted.  
- Lender-specific day-count conventions (ACT/365) unless user requests later.  
- **Machine-learned** or historical lender models; opponents use user-selected discrete actions only.  
- Legal settlement / IBC negotiation outcomes.

**In scope (v1.2+):** §4.13 Tier **P0** two-player games with discrete actions and deterministic payoffs.

---

## 12. Suggested Tech (non-binding)

- **React + TypeScript + Vite** (or Next.js if SEO needed)  
- **Zod** for input validation  
- **TanStack Table** for schedules  
- **Vitest** for unit tests  
- **`src/lib/game/`** — payoff matrix + solvers; **no** React imports in lib

---

## 13. Open Questions (track in issues)

1. Should “keep EMI” use **original** EMI or **recomputed** EMI after prior partial prepays?  
2. Exact EPFO legal copy vs product copy (keep disclaimers).  
3. Mid-cycle prepayment interest accrual model.  
4. §4.13: Default `lender_objective` — `L_FEE_INCOME` vs `L_INTEREST_INCOME` in UI?  
5. §4.13: Show **all** Pareto-efficient splits for `GAME_BH_COOP_PARETO` or cap at top 5 by `NET_WORTH_HORIZON`?  
6. §4.13: Collapse duplicate normal-form cells when `b_lump = 0` in export vs show full grid?  
7. §4.13 v1.3: Implement `L_RATE_BUMP` before or after mixed Nash?

---

## 14. Legal / Product Disclaimer (show in app footer)

“This calculator is for educational planning only. EPF withdrawal eligibility, taxes, lender prepayment charges, and loan terms vary. Verify with EPFO, your lender, and a qualified financial adviser.”

---

## 15. Reference Scenario (for QA parity with prior chat)

- Principal: **₹50,00,000**  
- Rate: **7.9%** p.a. fixed  
- Tenure: **168** months  
- Assets for labelling: cash **₹25,00,000**, PF **₹25,00,000**, gold **₹25,00,000**  
- Unemployment PF rule: **75% month 1**, **25% month 12** of unemployment window  

### 15.1 Strategy golden matrix

Regenerate: `npm run goldens:update` (strategy fixtures).  
Paths: `src/test/fixtures/strategy/tier_{a,b,c}_{equity_blend,prepay_heavy,aggressive_prepay}.json`.

### 15.2 Game profile golden matrix (when §4.13 P0 ships)

One fixture per Tier P0 profile ID under `src/test/fixtures/game/{profile_id}.json` containing `payoff_matrix`, `equilibria`, and `recommended_b_action` for §15 reference inputs.

---

**End of specification**

# FinancialPlanner — Loan Payoff Simulator

**Project:** `FinancialPlanner`  
**Canonical spec (this file):** `docs/SPEC.md`  
**Spec-driven workflow:** See `AGENTS.md`. **New feature delivery:** `.cursor/skills/sdd-create-feature/SKILL.md`. **Task checklist (check off when done):** [`TASKS.md`](TASKS.md) (this folder). **Domain implementation:** `.cursor/skills/spec-driven-financial-planner/SKILL.md`.

---

# Loan Payoff Simulator — Product & Engineering Specification

**Version:** 1.7  
**Audience:** Engineers / Cursor agents implementing the application  
**Locale:** India (INR, lakhs in UI optional)  
**Status:** Draft for implementation

---

## 1. Purpose

Build a **client-side or lightweight web application dashboard** that lets a user:

- model a **reducing-balance loan** (home / personal / LAP-style) and compare **multiple payoff strategies**
- run a **debt payoff planner** with avalanche/snowball ordering and payoff-date simulation
- run a **retirement planner** with corpus projection, inflation assumptions, and scenario testing

Loan payoff capabilities include:

- Lump-sum prepayments from **cash**, **gold liquidation**, and **PF (Provident Fund corpus)**  
- Prepayment policies: **reduce tenure** vs **reduce EMI** (where applicable)  
- Optional **extra monthly principal** payments  
- A dedicated **unemployment + PF staged withdrawal** timeline per product rules defined in this spec  

The app must produce **transparent numbers**: amortisation tables, totals, interest paid, payoff month, and scenario comparison tables.

---

## 2. Glossary

| Term | Meaning |
|------|---------|
| **Lakh** | 100,000 INR (UI may accept “lakhs” and store rupees internally) |
| **PF corpus** | Employee Provident Fund balance available for modelling (user-entered) |
| **Gold value** | User-entered liquidatable value (post haircut optional field) |
| **Prepayment** | Principal reduction outside scheduled EMI |
| **Moratorium** | Out of scope unless explicitly added later |

---

## 3. User Personas

1. **Borrower optimiser:** Employed, wants to minimise interest while keeping liquidity.  
2. **Stress tester:** Wants unemployment path + staged PF withdrawals + cash runway.  
3. **Comparator:** Wants side-by-side scenarios exportable to CSV.

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
| `monthly_salary_inr` | number | no | Default `0`; recurring monthly salary contribution applied toward loan across all scenarios |
| `pf_corpus_inr` | number | no |
| `pf_annual_interest_rate_pct` | number | no | Default `8.25`; annual PF credit used in unemployment module (§4.7) |
| `monthly_pf_addition_inr` | number | no | Default `0`; amount added to PF corpus every month for PF scenario modelling |
| `gold_liquid_inr` | number | no |
| `gold_haircut_pct` | number | no | 0–100 applied to gold if user enables |
| `monthly_cash_to_loan_inr` | number | no | Recurring INR applied as **extra principal** after each month’s scheduled EMI (§4.5). v1 UI label: “Monthly cash to loan”; does **not** deduct living expenses—use §4.8 for budgeted cashflow. |
| `monthly_take_home_inr` | number | no | Default `0`. Household post-tax income reaching the bank account. **Distinct** from `monthly_salary_inr`, which represents amount routed to the loan as recurring extra principal. Used by §4.12 as the basis for percent-of-take-home repayment policies. |
| `monthly_living_expense_inr` | number | no | Default `0`. Promoted from §4.8; used globally by §4.12 for emergency-fund sizing and surplus calculation. |
| `extra_monthly_income_inr` | number | no | Default `0`. Side / rental / variable income, **post-tax** unless `extra_income_post_tax` is `false`. |
| `extra_income_post_tax` | boolean | no | Default `true`. If `false`, app applies user-provided `marginal_tax_rate_pct` to net it down. |
| `marginal_tax_rate_pct` | number | no | Default `0`. Only consulted when `extra_income_post_tax = false`. |
| `emergency_months_buffer` | integer | no | Default `6`. Number of months of `monthly_living_expense_inr + emi_inr` to reserve as untouchable cash before any deployment. |
| `expected_equity_return_pct` | number | no | Default `11`. Long-run nominal expected return for the equity sleeve in §4.12. |
| `horizon_months` | integer | no | Default = `tenure_months`. Used by §4.12 as the comparison horizon for net worth at horizon. |
| `tax_regime` | enum | no | `old` \| `new`. Display-only hint in v1; does not auto-compute Sec 24b deductions. |

> **Note on `monthly_salary_inr` vs `monthly_take_home_inr`:** `monthly_salary_inr` retains its existing v1 semantics (recurring monthly amount routed to the loan as extra principal across all §4.6 scenarios). `monthly_take_home_inr` is the new household-income field used **only** by §4.12 strategy math. Conversely, the §4.12 strategy planner computes its own monthly extra principal from `monthly_take_home_inr` and `extra_monthly_income_inr`; it does **not** add `monthly_salary_inr` on top.

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
- `monthly_salary_inr` is treated as a recurring monthly extra-principal contribution in all scenarios.

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
| `CASHFLOW_NO_PF` | One-time prepay from `cash_inr` at month 1 + recurring `monthly_cash_to_loan_inr`; excludes PF withdrawals |
| `CASHFLOW_PLUS_PF` | `CASHFLOW_NO_PF` plus PF tranches (§4.7) layered on top (month 1 + month 12) |

### 4.7 Unemployment + PF withdrawal module (required)

**Trigger:** user toggles `unemployment_mode` and sets `unemployment_start_month` (integer offset from scenario start, default `1`).

**PF withdrawal rule set (canonical for this app — user-specified):**

Let `PF0` be PF corpus at unemployment start (default: user `pf_corpus_inr`; allow editing).

PF balance earns annual interest at `pf_annual_interest_rate_pct` (default **8.25%**) credited once per year for full-year spans that elapse before a tranche is withdrawn.
`monthly_pf_addition_inr` is added to PF balance each month; for the month-12 tranche calculation, include **12 monthly additions** from the unemployment year.

| Event time | Withdrawal fraction of `PF0` | Amount |
|------------|-------------------------------|--------|
| End of **month 1** after unemployment start | **75%** | `0.75 * PF0` |
| End of **month 12** after unemployment start | Remaining 25% + monthly PF additions + annual PF credit | `((0.25 * PF0) + (12 * monthly_pf_addition_inr)) * (1 + pf_annual_interest_rate_pct/100)` |

**Canonical credit order for month 12 tranche:** add monthly PF additions for the 12-month window to remaining PF balance, then apply annual PF interest, then withdraw tranche 2.

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

### 4.10 Debt payoff planner dashboard (required)

Support a dedicated debt module that accepts multiple debts and simulates monthly payoff under two methods:

- `avalanche`: prioritise highest APR debt first (tie-breaker: higher balance)
- `snowball`: prioritise lowest balance debt first (tie-breaker: higher APR)

#### Inputs

| Field | Type | Required | Notes |
|------|------|----------|------|
| `debts[]` | array | yes | Each debt has `name`, `balance_inr`, `apr_pct`, `minimum_payment_inr` |
| `monthly_budget_inr` | number | yes | Total monthly debt-payment budget across all debts |
| `start_date` | date | yes | Used by payoff-date simulator |

#### Debt simulation order

For each month:

1. Accrue interest on each debt (`balance * apr/12`).
2. Pay each debt's minimum payment (clamped to remaining balance).
3. Allocate remaining budget to one target debt by chosen strategy.
4. Continue until all balances are 0 or less.

#### Outputs

- Payoff month count and projected payoff date
- Total interest paid
- Monthly timeline table with: month, total opening debt, interest, payment, total closing debt, target debt label
- Strategy comparison table (`avalanche` vs `snowball`) showing payoff months/date and total interest
- Validation warning when `monthly_budget_inr` is less than sum of minimum payments

### 4.11 Retirement planner dashboard (required)

Support a retirement module for corpus projection and scenario testing.

#### Inputs

| Field | Type | Required | Notes |
|------|------|----------|------|
| `current_corpus_inr` | number | yes | Current invested corpus |
| `monthly_contribution_inr` | number | yes | Recurring monthly investment |
| `annual_return_pct` | number | yes | Expected nominal return |
| `inflation_pct` | number | yes | Long-term inflation assumption |
| `years_to_retirement` | integer | yes | Projection horizon |
| `annual_expense_today_inr` | number | yes | Current annual expenses |
| `safe_withdrawal_rate_pct` | number | yes | Default `4` unless user edits |

#### Computation

- Project nominal corpus month by month with compounding and monthly contributions.
- Inflate current annual expenses to retirement year using inflation assumptions.
- Compute target corpus using withdrawal rule:

\[
\text{target\_corpus} = \frac{\text{annual\_expense\_at\_retirement}}{\text{safe\_withdrawal\_rate}}
\]

- Report real corpus (inflation-adjusted) and funded ratio (`projected / target`).

#### Scenario testing

Provide at least three scenarios from the same base inputs:

1. `Base` (as entered)
2. `Conservative` (lower return, higher inflation)
3. `Optimistic` (higher return, lower inflation and/or higher contribution)

Show projected corpus, retirement expense, target corpus, and funded ratio per scenario.

### 4.12 Repayment Strategy Planner (required)

A composer that simulates **three named allocation strategies** over the loan's remaining horizon and reports loan close, interest paid, equity sleeve growth, and net worth at horizon. It **reuses** the §4.3–4.5 loan engine and §4.11 corpus projection — no new amortisation math.

#### 4.12.1 Derived quantities

Let:

- `THM` = `monthly_take_home_inr`
- `LE` = `monthly_living_expense_inr`
- `EMI0` = baseline EMI from §4.3
- `EXTRA` = `extra_monthly_income_inr` × (1 if `extra_income_post_tax` else 1 − `marginal_tax_rate_pct`/100)
- `BUFFER` = `emergency_months_buffer × (LE + EMI0)`
- `DEPLOYABLE` = `max(0, cash_inr − BUFFER)`

Validation:

- If `cash_inr < BUFFER` → §9 warning `EMERGENCY_FUND_SHORTFALL`; strategies still simulate but treat `DEPLOYABLE` as `0`.
- If `EMI0 > 0.5 × THM` → §9 warning `FRAGILE_CASH_FLOW`.

#### 4.12.2 Strategy presets

| Strategy ID | One-time prepayment (month 1) | Monthly extra principal | Equity sleeve during loan | Post-loan redirection |
|---|---|---|---|---|
| `STRATEGY_EQUITY_BLEND` | `0.4 × DEPLOYABLE` | `0.6 × EXTRA` | Lump = `0.6 × DEPLOYABLE` invested month 1 + SIP from `0.4 × EXTRA` | After payoff, `EMI0 + EXTRA` → SIP until `horizon_months` |
| `STRATEGY_PREPAY_HEAVY` | `DEPLOYABLE` (full) | `EXTRA` (full) | None | After payoff, `EMI0 + EXTRA` → SIP until `horizon_months` |
| `STRATEGY_AGGRESSIVE_PREPAY` | `DEPLOYABLE` (full) | `(repayment_pct_of_take_home / 100) × THM + EXTRA − EMI0`, clamped ≥ 0 | None | After payoff, `(repayment_pct_of_take_home / 100) × THM + EXTRA` → SIP |

Additional input for the third strategy:

| Field | Type | Required | Notes |
|---|---|---|---|
| `repayment_pct_of_take_home` | number | only for `STRATEGY_AGGRESSIVE_PREPAY` | 0–100. Effective monthly cash to loan = `(pct/100) × THM + EXTRA`. |

The 0.4 / 0.6 split for `STRATEGY_EQUITY_BLEND` is canonical in v1.7 and **must be referenced** as `EQUITY_BLEND_PREPAY_FRACTION = 0.4` in `src/lib/strategy/`. Open question §13.4 tracks future user-tunability.

#### 4.12.3 Simulation procedure (each strategy)

1. **Loan side:** call the §4.5 fixed-EMI-with-monthly-extra engine with the strategy's one-time prepayment and monthly extra principal. Result includes `payoff_month`. EMI is **not** recomputed at any stage; one-time prepayment shortens tenure naturally (policy `recompute_tenure_keep_emi`).
2. **Equity sleeve during loan months 1 → `payoff_month`:** project a corpus per §4.11 monthly compounding using the strategy's lump and monthly SIP at `expected_equity_return_pct`.
3. **Equity sleeve post-loan, months `payoff_month + 1` → `horizon_months`:** continue projection with the redirected monthly amount; lump at start of this phase = corpus from step 2.
4. **Final corpus** = projection result at month `horizon_months`. Report **pre-tax**; an additional KPI applies 12.5% LTCG above ₹1.25L gain (canonical India rule, v1.7) for an indicative post-tax figure.
5. **PF at horizon** = `pf_corpus_inr` projected with `pf_annual_interest_rate_pct` (annual credit, full years) plus `monthly_pf_addition_inr × horizon_months`. Strategy planner does **not** simulate unemployment PF tranches (§4.7 stays its own module).

#### 4.12.4 Outputs (per strategy)

Extends §4.9 with strategy-specific KPIs:

| KPI | Definition |
|---|---|
| `loan_close_month` | From step 1 above. |
| `total_interest_inr` | From step 1. |
| `interest_saved_vs_base_inr` | Baseline §4.3 interest minus this strategy's `total_interest_inr`. |
| `equity_corpus_at_horizon_inr` | Step 4, pre-tax. |
| `equity_corpus_at_horizon_post_tax_inr` | Step 4 with 12.5% LTCG over ₹1.25L on the gain only. |
| `net_worth_at_horizon_inr` | `equity_corpus_at_horizon_inr + cash_buffer_remaining_inr + pf_corpus_at_horizon_inr − loan_balance_at_horizon_inr`. Loan balance is `0` if `horizon_months ≥ loan_close_month`. |
| `min_living_budget_inr` | `THM + EXTRA − (EMI0 + monthly_extra_principal + monthly_sip)`. Surfaced for §9 subsistence warning. |

#### 4.12.5 Comparison output

A side-by-side table with one row per strategy and columns: `loan_close_month`, `total_interest_inr`, `equity_corpus_at_horizon_inr`, `net_worth_at_horizon_inr`, `min_living_budget_inr`, `warnings[]`.

#### 4.12.6 Take-home tier presets (UI helper)

The UI **must** expose three quick-select presets that populate `monthly_take_home_inr` only — they do not change loan/asset inputs:

| Preset | `monthly_take_home_inr` |
|---|---|
| Tier A | `300_000` |
| Tier B | `200_000` |
| Tier C | `100_000` |

Tier presets are convenience only; nothing in the engine depends on them.

#### 4.12.7 Known v1.7 simplifications

- All three strategies use a **single** equity expected-return number; no scenario fan (cf. §4.11's `Conservative`/`Optimistic`).
- `STRATEGY_PREPAY_HEAVY` deploys the **full** `EXTRA` to extra principal; the conversational variant of starting a small equity SIP even during the loan is **not** modelled. Users wanting that should use `STRATEGY_EQUITY_BLEND`.
- `monthly_salary_inr` is ignored by §4.12 (see §4.2 note).
- Sec 24b interest deduction is **not** auto-applied to derive an effective loan rate; `tax_regime` is display-only (cf. §13.7).

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

type StrategyId =
  | "STRATEGY_EQUITY_BLEND"
  | "STRATEGY_PREPAY_HEAVY"
  | "STRATEGY_AGGRESSIVE_PREPAY";

interface StrategyInputs {
  principal_inr: number;
  annual_interest_rate: number;
  tenure_months: number;
  cash_inr: number;
  pf_corpus_inr: number;
  pf_annual_interest_rate_pct: number;
  monthly_pf_addition_inr: number;
  monthly_take_home_inr: number;
  monthly_living_expense_inr: number;
  extra_monthly_income_inr: number;
  extra_income_post_tax: boolean;
  marginal_tax_rate_pct: number;
  emergency_months_buffer: number;
  expected_equity_return_pct: number;
  horizon_months: number;
  repayment_pct_of_take_home?: number;
}

interface StrategyResult {
  strategy_id: StrategyId;
  loan_close_month: number;
  total_interest_inr: number;
  interest_saved_vs_base_inr: number;
  one_time_prepay_inr: number;
  monthly_extra_principal_inr: number;
  monthly_sip_inr: number;
  equity_lump_inr: number;
  equity_corpus_at_horizon_inr: number;
  equity_corpus_at_horizon_post_tax_inr: number;
  pf_corpus_at_horizon_inr: number;
  cash_buffer_remaining_inr: number;
  loan_balance_at_horizon_inr: number;
  net_worth_at_horizon_inr: number;
  min_living_budget_inr: number;
  warnings: string[];
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
- `EMERGENCY_FUND_SHORTFALL` (§4.12): `cash_inr < emergency_months_buffer × (monthly_living_expense_inr + EMI0)` → emit warning; strategies still run but `DEPLOYABLE = 0`.
- `FRAGILE_CASH_FLOW` (§4.12): baseline `EMI0 > 0.5 × monthly_take_home_inr` → emit warning on every strategy result.
- `BELOW_SUBSISTENCE` (§4.12): any strategy whose `min_living_budget_inr < 15,000` → emit warning attached to that strategy row.
- `AGGRESSIVE_PCT_INVALID` (§4.12): `repayment_pct_of_take_home` outside `[0, 100]` for `STRATEGY_AGGRESSIVE_PREPAY` → emit warning and clamp to range; do not error.
- `HORIZON_TOO_SHORT` (§4.12): `horizon_months < loan_close_month` → emit warning; equity sleeve is computed only up to `horizon_months` and post-loan redirection does not occur.

---

## 10. Testing / Acceptance Criteria

**How to verify:** Use **`.cursor/skills/sdd-verify-feature/SKILL.md`** (maps this section to tests + smoke + build). Check off **Phase 3–4** in **[`TASKS.md`](TASKS.md)** as you complete each task.

### Unit tests (required)

1. **EMI matches reference** for: `P=5_000_000`, `annual=7.9`, `n=168` within **₹1** tolerance after rounding policy documented.  
2. **Baseline total interest** within **0.1%** of a reference spreadsheet for same inputs.  
3. **Prepay ₹25L at month 1 + keep EMI**: payoff month ~ **62** for the reference loan (allow ±1 month due to rounding).  
4. **Prepay ₹25L at month 1 + keep tenure 168**: EMI ~ **half** of baseline within **₹50** (rounding).  
5. **PF unemployment**: for `PF0=2_500_000` and `pf_annual_interest_rate_pct=8.25`, verify inflows **1,875,000** then **676,562.50** on correct months.  
6. **Cashflow**: constructed fixture where income=0, living+EMI exhaust cash in `k` months → system flags shortfall.  
7. **Monthly inflow to loan:** for fixed `monthly_cash_to_loan_inr` &gt; 0, payoff month count is **strictly less** than baseline for the same principal/rate/tenure (reference loan).
8. **Reference PF scenario recalculation:** for `PF0=2_500_000`, total withdrawals over month 1 + month 12 equal **2,551,562.50** (reflecting annual PF interest on the remaining 25%).
9. **Cashflow layering:** `CASHFLOW_PLUS_PF` payoff month is less than or equal to `CASHFLOW_NO_PF` for the same inputs.
10. **PF monthly addition:** for `PF0=2_500_000`, `pf_annual_interest_rate_pct=8.25`, and `monthly_pf_addition_inr=10_000`, month-12 PF tranche is **806,462.50**.
11. **Salary contribution impact:** with `monthly_salary_inr > 0`, payoff month for each scenario is less than or equal to the same scenario computed with `monthly_salary_inr = 0` (all else equal).
12. **Debt strategy comparison:** for a fixed multi-debt fixture, `avalanche` total interest is less than or equal to `snowball` total interest.
13. **Debt payoff date simulator:** payoff date equals `start_date + payoff_months` for both strategies.
14. **Debt budget guard:** when monthly budget is lower than sum of minimum payments, planner returns a warning and does not claim full payoff.
15. **Retirement projection monotonicity:** increasing monthly contribution increases projected corpus (all else equal).
16. **Retirement scenario ranking:** conservative funded ratio is less than or equal to optimistic funded ratio for the same base inputs.
17. **Retirement inflation impact:** increasing inflation increases required target corpus.
18. **Strategy monotonicity (aggressive):** Increasing `repayment_pct_of_take_home` strictly reduces (or equals at boundary) `loan_close_month` for `STRATEGY_AGGRESSIVE_PREPAY`, all else equal.
19. **Equity-blend dominance under high return:** With `expected_equity_return_pct ≥ annual_interest_rate + 2`, `STRATEGY_EQUITY_BLEND.equity_corpus_at_horizon_inr ≥ STRATEGY_PREPAY_HEAVY.equity_corpus_at_horizon_inr` for the §15.1 reference loan.
20. **Prepay-heavy dominance under low equity return:** With `expected_equity_return_pct ≤ annual_interest_rate`, `STRATEGY_PREPAY_HEAVY.net_worth_at_horizon_inr ≥ STRATEGY_EQUITY_BLEND.net_worth_at_horizon_inr` for the §15.1 reference loan.
21. **Emergency fund guard:** When `cash_inr < emergency_months_buffer × (monthly_living_expense_inr + EMI0)`, all three strategy results carry the `EMERGENCY_FUND_SHORTFALL` warning and use `DEPLOYABLE = 0`.
22. **Subsistence warning:** For `STRATEGY_AGGRESSIVE_PREPAY` with `repayment_pct_of_take_home = 90`, `monthly_take_home_inr = 100_000`, `monthly_living_expense_inr = 50_000` (and §15.1 loan), the result carries the `BELOW_SUBSISTENCE` warning.
23. **Net-worth golden tiers:** For the three reference tiers in §15.1, each strategy's `StrategyResult` matches the golden file under `src/test/fixtures/strategy/<tier>_<strategy>.json` exactly.
24. **Post-loan redirection sanity:** With `horizon_months > loan_close_month`, equity corpus at `horizon_months` strictly exceeds equity corpus at `loan_close_month` for any strategy with `EXTRA > 0` or `EMI0 > 0`.

### Golden files

Store JSON golden outputs for scenarios `BASE`, `PREPAY_CASH_25L_TENURE`, `UE_PF_TO_LOAN` with a fixed rounding policy.

---

## 11. Non-Goals (v1)

- Tax advice, capital gains on gold, or EPFO compliance verification.  
- Floating-rate stochastic simulation.  
- Multi-loan optimisation.  
- Lender-specific day-count conventions (ACT/365) unless user requests later.
- §4.12 strategy planner does **not** model: equity drawdown / sequence-of-returns risk, dividend reinvestment policy, exit-load drag, expense ratios, NPS / PPF lock-ins, or deduction-aware effective loan rates beyond the §4.2 `tax_regime` display hint. Equity is treated as a single nominal-return sleeve.
- §4.12 strategy planner does **not** auto-recommend a strategy; it only reports per-strategy KPIs and emits warnings. Users compare and choose.

---

## 12. Suggested Tech (non-binding)

- **React + TypeScript + Vite** (or Next.js if SEO needed)  
- **Zod** for input validation  
- **TanStack Table** for schedules  
- **Vitest** for unit tests  

---

## 13. Open Questions (track in issues)

1. Should “keep EMI” use **original** EMI or **recomputed** EMI after prior partial prepays?  
2. Exact EPFO legal copy vs product copy (keep disclaimers).  
3. Mid-cycle prepayment interest accrual model.
4. Should `EQUITY_BLEND_PREPAY_FRACTION` (default `0.4`) be user-tunable in v1.8, or remain a constant?
5. Should equity LTCG be modelled as a tax drag during the SIP years, or only applied at horizon (current spec)?
6. Should `STRATEGY_AGGRESSIVE_PREPAY` enforce a minimum `min_living_budget_inr` floor (e.g. ₹15,000) by clamping `repayment_pct_of_take_home`, or merely warn (current spec)?
7. Tax-regime-aware effective loan rate: should §4.12 honour Sec 24b in old regime to compute an effective rate, or keep the pure nominal-rate model in v1?

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
- PF annual interest assumption: **8.25%** yearly credit on remaining PF balance
- Recalculated PF withdrawals for this reference:
  - Month 1 tranche: **₹18,75,000.00**
  - Month 12 tranche: **₹6,76,562.50**
  - Combined PF withdrawals: **₹25,51,562.50**

### 15.1 Strategy planner reference tiers

For §10 acceptance bullet 23 and golden fixtures under `src/test/fixtures/strategy/`:

**Common loan + assets across all three tiers:**

- Principal: **₹36,00,000**
- Annual rate: **7.9%** fixed
- Tenure: **98 months**
- `cash_inr`: **₹20,00,000**
- `pf_corpus_inr`: **₹26,20,000**
- `monthly_pf_addition_inr`: **₹0**
- `pf_annual_interest_rate_pct`: **8.25**
- `extra_monthly_income_inr`: **₹17,000**
- `extra_income_post_tax`: **true**
- `expected_equity_return_pct`: **11**
- `horizon_months`: **98**

**Tier-specific:**

| Tier | `monthly_take_home_inr` | `monthly_living_expense_inr` | `emergency_months_buffer` | `repayment_pct_of_take_home` (aggressive) |
|---|---|---|---|---|
| A | 300,000 | 80,000 | 6 | 90 |
| B | 200,000 | 80,000 | 8 | 80 |
| C | 100,000 | 50,000 | 12 | 75 |

Goldens for each tier × strategy combination are stored as `src/test/fixtures/strategy/tier_<a|b|c>_<strategy>.json` and re-generated via `npm run goldens:update`.

---

**End of specification**

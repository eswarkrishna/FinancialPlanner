# FinancialPlanner — Loan Payoff Simulator

**Project:** `FinancialPlanner`  
**Canonical spec (this file):** `docs/SPEC.md`  
**Spec-driven workflow:** See `AGENTS.md`. **New feature delivery:** `.cursor/skills/sdd-create-feature/SKILL.md`. **Task checklist (check off when done):** [`TASKS.md`](TASKS.md) (this folder). **Domain implementation:** `.cursor/skills/spec-driven-financial-planner/SKILL.md`.

---

# Loan Payoff Simulator — Product & Engineering Specification

**Version:** 1.1  
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

---

## 11. Non-Goals (v1)

- Tax advice, capital gains on gold, or EPFO compliance verification.  
- Floating-rate stochastic simulation.  
- Multi-loan optimisation.  
- Lender-specific day-count conventions (ACT/365) unless user requests later.

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

---

**End of specification**

# FinancialPlanner — UK Locale Product & Engineering Specification

**Project:** `FinancialPlanner`  
**Canonical spec (this file):** `docs/SPEC-UK.md`  
**India locale spec:** [`docs/SPEC.md`](SPEC.md) (shared solver architecture; section numbers align where features are parallel)  
**US locale spec:** [`docs/SPEC-US.md`](SPEC-US.md)  
**Research:** [`docs/research/2026-07-uk-employee-benefits-mapping.md`](research/2026-07-uk-employee-benefits-mapping.md) (UK desk research + parity matrix) · [`docs/research/2026-07-other-planner-areas.md`](research/2026-07-other-planner-areas.md) §3.1 (earlier UK options analysis)  
**Spec-driven workflow:** See `AGENTS.md`.

---

**Version:** 1.0  
**Audience:** Engineers / Cursor agents implementing the UK locale  
**Locale:** United Kingdom (GBP; `en-GB` number formatting)  
**Status:** Specced — not yet implemented. No UK code ships until this spec's §10 acceptance tests are mapped to Vitest + goldens. **Maintenance mode (2026-07):** no new UK parity features until the India prepayment wedge wins — see [`FEATURE-ROADMAP.md`](FEATURE-ROADMAP.md).  
**Parity target:** Same planner tabs and decision surfaces as India and US locales for **employed UK workers** modelling mortgage payoff, multi-debt, retirement, repayment strategies, and strategic games.

> **Core design decision (differs from IN / US):** UK workplace/personal pensions are **legally inaccessible** before normal minimum pension age (**55**, rising to **57 on 6 April 2028**) except ill-health or protected pension ages. The UK locale therefore has **no staged pension-withdrawal tranche module**. The job-loss bridge (§4.7) is built from **redundancy pay, New Style JSA, ISA/GIA draws, and Support for Mortgage Interest (SMI)** instead. The pension pot is projection-only (§4.11–§4.12).

---

## 1. Purpose

Deliver a **UK locale** of FinancialPlanner that lets a user model a **reducing-balance repayment mortgage** (or personal loan) and compare **multiple payoff strategies**, including:

- Lump-sum overpayments from **cash**, **ISA withdrawals** (tax-free), and **general investment account (GIA) liquidation** (capital gains tax applied)  
- Prepayment policies: **reduce term** vs **reduce monthly payment** (same semantics as IN §4.4)  
- Optional **extra monthly principal** overpayments, with the UK **early repayment charge (ERC)** model: a fee-free annual overpayment allowance and a percentage charge on the excess  
- A dedicated **job loss** timeline funded by **redundancy pay + New Style JSA + savings draws + optional SMI** per canonical rules in UK§4.7 — **never** by early pension access  
- **Multi-debt** avalanche/snowball payoff (UK§4.10)  
- **Retirement corpus** projection with optional **State Pension** income (UK§4.11)  
- **Repayment strategy planner** comparing equity blend vs prepay-heavy paths, with an **ISA-first** equity sleeve (UK§4.12)  
- Optional **strategic interaction** games (UK§4.13) using the same amortisation oracle pattern as IN §4.13

The app must produce **transparent numbers**: amortisation tables, totals, interest paid, payoff month, and scenario comparison tables — all in **GBP**.

---

## 2. Glossary

| Term | Meaning |
|------|---------|
| **GBP** | Pound sterling; store as number; UI may show `£` prefix |
| **NMPA** | Normal minimum pension age — earliest lawful pension access: **55**, rising to **57 on 6 Apr 2028** (ill-health and protected ages excepted) |
| **Pension pot** | User-entered defined-contribution workplace/personal pension balance. **Projection-only** in this locale — never a prepay or job-loss funding source |
| **ISA** | Individual Savings Account; withdrawals are **tax-free** at any time; annual subscription allowance £20,000 (until Apr 2031) |
| **GIA** | General investment account (taxable); gains above the annual exempt amount attract capital gains tax |
| **Mortgage payment** | Fixed monthly P&I payment (same annuity formula as IN EMI) |
| **ERC** | Early repayment charge — lender fee on overpayments **above** the annual overpayment allowance during a fixed deal |
| **Overpayment allowance** | Fee-free overpayment headroom per year, typically **10%** of outstanding balance |
| **Redundancy pay** | Statutory + contractual termination lump sum; first **£30,000** of a genuine redundancy package is tax-free |
| **New Style JSA** | Contribution-based Jobseeker's Allowance; ~**£95.55/wk** (25+, 2026/27) for up to **6 months** |
| **SMI** | Support for Mortgage Interest — a **repayable loan** (not a grant) paying a standard interest rate (currently **3.66%**) on up to **£200,000** of the mortgage after a 3-month qualifying period on Universal Credit |
| **State Pension** | User-entered expected weekly benefit at State Pension age (full new rate **£241.30/wk**, 2026/27); no NI-record engine in v1 |
| **Player** | Decision-maker in UK§4.13 (`B`, `L`, `H`, `N`) — same roles as IN §4.13 |
| **Payoff oracle** | Existing simulation (UK§4.3–§4.8, UK§4.10–§4.12) mapping actions → GBP outcomes |

**Locale switch:** Application exposes `locale: "IN" | "US" | "UK"`. India behaviour remains governed by [`SPEC.md`](SPEC.md), US by [`SPEC-US.md`](SPEC-US.md). UK behaviour is governed by this file. Shared pure math (payment formula, avalanche ordering, retirement compounding) lives in locale-agnostic helpers parameterised by `roundMoney(amount, locale)`.

---

## 3. User Personas

1. **UK borrower optimiser:** PAYE employee with a repayment mortgage; wants to minimise interest using the fee-free overpayment allowance while keeping liquidity and pension contributions.  
2. **Redundancy stress tester:** Models job loss with redundancy lump sum, JSA window, savings runway, and optional SMI safety net.  
3. **Debt snowball/avalanche comparator:** Credit cards + personal loan + car finance against a monthly budget.  
4. **Retirement gap checker:** Projects pension pot + ISA/GIA vs expense target, with State Pension shown separately.  
5. **Strategic planner:** Household split and lender-ERC games (UK§4.13).  
6. **Self-employed / contractor:** No employer pension contribution; no statutory redundancy; New Style JSA usually unavailable (Class 1 NI requirement) — use `employment_type: self_employed` preset.

**Employment preset (`employment_type`):**

| Value | Effect |
|-------|--------|
| `employee` (default) | Auto-enrolment employer contribution formula enabled; redundancy + JSA fields shown in job-loss mode |
| `self_employed` | `employer_pension_gbp = 0`; `redundancy_payment_gbp` defaults `0`; `monthly_jsa_gbp` defaults `0` (UI hint: New Style JSA needs employee Class 1 NI) |

---

## 4. Functional Requirements

### 4.0 Locale and money

| Field | Type | Required | Notes |
|------|------|----------|------|
| `locale` | enum | yes | `"UK"` when this spec applies |
| `rounding_mode` | enum | optional | `banker` / `floor` / `ceil` — **round to pence**; document in README for UK |

All monetary fields use suffix `_gbp`. Minimum prepayment: `MIN_PREPAYMENT_GBP` default `0`.

---

### 4.1 Core inputs (global)

| Field | Type | Required | Notes |
|------|------|----------|------|
| `principal_gbp` | number | yes | > 0 |
| `annual_interest_rate` | number | yes | Nominal annual %, e.g. `4.5` |
| `tenure_months` | integer | yes | e.g. `300` for 25-year mortgage |
| `start_date` | date | optional | Default today |
| `rate_type` | enum | optional | `fixed` (v1); UK fix/reversion cycles deferred (§11) |
| `overpayment_allowance_pct` | number | optional | Default **10** — fee-free overpayment per rolling 12-month block, % of opening balance at block start |
| `erc_pct` | number | optional | Default **0** — early repayment charge % applied to overpayment **excess** above the allowance (typical deals 1–5) |
| `prepayment_fee_gbp` | number | optional | Default `0` — flat per-event fee, kept for engine parity with IN/US; most users should use `erc_pct` instead |

**ERC fee model (UK-canonical, replaces the flat-fee default of IN/US):**

```text
block          = rolling 12-month window from scenario start (months 1–12, 13–24, …)
allowance_gbp  = overpayment_allowance_pct / 100 × opening_balance_at_block_start
excess_gbp     = max(0, total_overpayments_in_block − allowance_gbp)
erc_fee_gbp    = erc_pct / 100 × excess_gbp        (charged in the month the excess arises)
```

Overpayments = lump prepayments + recurring extra principal. When `erc_pct = 0` and `excess_gbp > 0`, emit informational warning `ERC_ALLOWANCE_EXCEEDED` (no fee charged). `lump_sum_full_payoff` applies ERC to the full excess unless user sets `erc_pct = 0` (SVR / end-of-deal assumption).

---

### 4.2 Asset inputs

| Field | Type | Required | Notes |
|------|------|----------|------|
| `cash_gbp` | number | no | Current/savings accounts |
| `isa_balance_gbp` | number | no | Tax-free liquid sleeve (cash + stocks & shares ISA combined in v1) |
| `gia_balance_gbp` | number | no | Taxable general investment account |
| `gia_cost_basis_gbp` | number | no | Default = `gia_balance_gbp` (no unrealised gain); used for CGT on liquidation |
| `pension_pot_gbp` | number | no | DC pension balance — **projection-only**; never drawable in any scenario (§4.7) |
| `monthly_cash_to_loan_gbp` | number | no | Recurring extra principal after scheduled payment (UK§4.5); counts toward the overpayment allowance |
| `monthly_salary_gbp` | number | no | Optional stress-test: GBP routed as **extra principal** after payment in scenarios that include salary sweep (`BASE_PLUS_SALARY_SWEEP`, prepay rows, §4.8 when configured). **Excluded from `BASE`.** v1 UI label: "Monthly salary" |
| `annual_salary_gbp` | number | no | For auto-enrolment contribution formula |
| `employee_pension_pct` | number | no | Default **5** — % of qualifying earnings |
| `employer_pension_pct` | number | no | Default **3** — % of qualifying earnings |
| `monthly_employer_pension_gbp` | number | no | Optional override; if set, ignores formula |
| `employment_type` | enum | no | `employee` (default) \| `self_employed` — see §3 preset table |

**Auto-enrolment contributions (monthly):** when formula enabled **and** `employment_type = employee`,

```text
qualifying_gbp        = max(0, min(annual_salary_gbp, 50_270) − 6_240)     // 2026/27 band
employee_monthly_gbp  = qualifying_gbp × employee_pension_pct / 100 / 12
employer_monthly_gbp  = qualifying_gbp × employer_pension_pct / 100 / 12
```

Band constants `AE_LOWER_GBP = 6_240`, `AE_UPPER_GBP = 50_270` are named constants (reviewed annually by DWP).

**Reference example (UK§15):** `annual_salary_gbp = 60_000` → qualifying £44,030 → employee **£183.46/mo**, employer **£110.08/mo** (total ≈ £293.53/mo). Salary sacrifice, DB schemes, and scheme-specific higher minima are non-goals (§11).

---

### 4.3 Baseline computation

Identical math to IN §4.3; labels use **mortgage payment** instead of EMI. Monthly rate \( r = \frac{\text{annual\_rate}}{100 \times 12} \).

---

### 4.4 Prepayment engine

Same three policies as IN §4.4:

1. `recompute_tenure_keep_payment` (alias of IN `recompute_tenure_keep_emi`)  
2. `recompute_payment_keep_tenure` (alias of IN `recompute_emi_keep_tenure`)  
3. `lump_sum_full_payoff`

Application order: interest → scheduled principal → lump prepay → recurring extra principal. ERC fee (§4.1) is computed after prepay application and added to the month's outflows (never to principal).

---

### 4.5 Extra monthly principal

Same as IN §4.5 with `_gbp` fields. Recurring extra principal counts toward the §4.1 overpayment allowance.

---

### 4.6 Scenario catalogue (employed)

| Scenario ID | Description |
|-------------|-------------|
| `BASE` | No prepayment; scheduled payment only for full original tenure (§4.3). **Ignores** `monthly_salary_gbp` and `monthly_cash_to_loan_gbp`. |
| `PREPAY_CASH_25K_TERM` | One-time £25,000 from cash at month 1; `recompute_tenure_keep_payment` |
| `PREPAY_CASH_25K_PAYMENT` | One-time £25,000 at month 1; `recompute_payment_keep_tenure` |
| `PREPAY_FULL_COMBINED` | Full payoff at month 1 from combined **liquid** sources (cash → ISA → GIA net of CGT; pension excluded); clamps + warns `INSUFFICIENT_ASSETS` when liquid funds < balance |
| `PREPAY_CUSTOM` | User-defined amount + month + policy |
| `EXTRA_PRINCIPAL` | Recurring extra principal |
| `STAGED_PREPAY` | Multiple timed prepayments |
| `BASE_PLUS_SALARY_SWEEP` | Baseline payment + `monthly_salary_gbp` as extra principal each month (§4.5); compare **payoff months** to `BASE` |
| `BASE_PLUS_MONTHLY_INFLOW` | Baseline payment + fixed `monthly_cash_to_loan_gbp` each month after payment (§4.5); does **not** include `monthly_salary_gbp`; compare **payoff months** to `BASE` |
| `PREPAY_PAYMENT_PLUS_MONTHLY_INFLOW` | One-time prepay month 1 + keep original payment + monthly extra |

All prepay scenarios respect the §4.1 ERC model (fee or `ERC_ALLOWANCE_EXCEEDED` warning on excess).

---

### 4.7 Job loss module (required) — redundancy + JSA + savings + SMI

**Trigger:** `job_loss_mode` (boolean) and `job_loss_start_month` `U` (1-based, default `1`).

> **No pension access.** Registered pension schemes must not pay benefits before NMPA (55; 57 from 6 Apr 2028) except ill-health or protected pension age. The simulator **never** decrements `pension_pot_gbp` in this module. Any configuration attempting a pension draw is rejected with error `PENSION_LOCKED_NMPA`. Unauthorised-payment modelling (55% tax charge) is a non-goal (§11).

**Funding sources (canonical for this app):**

**1. Redundancy lump sum** — one-time inflow at month `U`:

| Field | Type | Notes |
|------|------|------|
| `redundancy_payment_gbp` | number | Gross package (statutory + contractual combined); default `0` |
| `marginal_tax_rate_pct` | number | Used for the taxable excess; default `20` |

```text
taxable_gbp = max(0, redundancy_payment_gbp − 30_000)
net_redundancy_gbp = redundancy_payment_gbp − taxable_gbp × marginal_tax_rate_pct / 100
```

Destination per event: `loan_prepay` | `cash_buffer` | `split` (with `loan_fraction`) — same destination enum as IN PF tranches. Statutory caps (£751/wk, £22,530 max, 2026/27) are UI helper text only; the app does not compute service-based entitlement. PILON / notice pay is out of scope (§11).

**2. New Style JSA** — recurring inflow, months `U` … `U + jsa_duration_months − 1`:

| Field | Type | Notes |
|------|------|------|
| `monthly_jsa_gbp` | number | Default `0` (explicit opt-in). UI hint **£414/mo** (= £95.55/wk × 52 ÷ 12, 2026/27, age 25+) |
| `jsa_duration_months` | integer | Default **6** (≈182-day statutory limit) |

After the window, JSA contribution is `0` — the schedule must show the income cliff. Universal Credit is a non-goal (user may approximate via `monthly_income_gbp`).

**3. Savings draw order** — when monthly cash balance would go negative:

```text
draw order: cash_gbp → isa_balance_gbp → gia_balance_gbp (net of CGT per §7.5)
```

ISA draws are tax-free. GIA draws realise gains pro-rata to `gia_cost_basis_gbp` and apply the §7.5 liquidation model; net proceeds fund the shortfall. Pension pot is **never** in the draw order.

**4. Support for Mortgage Interest (SMI)** — optional repayable-loan safety net:

| Field | Type | Notes |
|------|------|------|
| `smi_enabled` | boolean | Default `false` |
| `smi_wait_months` | integer | Default **3** (Universal Credit qualifying period) |
| `smi_rate_pct` | number | Default **3.66** (standard rate; user-editable) |
| `smi_capital_cap_gbp` | number | Default **200,000** |

From month `U + smi_wait_months` while job loss persists:

```text
smi_credit_gbp = min(opening_balance_gbp, smi_capital_cap_gbp) × smi_rate_pct / 100 / 12
```

credited to `cash_balance` (modelling DWP paying interest toward the lender). Cumulative credits are tracked as **`smi_loan_balance_gbp`** — a **debt secured on the home**, surfaced as a KPI and warning `SMI_IS_A_LOAN`, and subtracted in any net-worth output. SMI-loan interest accrual (OBR gilt rate) is deferred (§11).

**Scenarios (minimum):**

| Scenario ID | Description |
|-------------|-------------|
| `JL_REDUNDANCY_TO_LOAN` | Net redundancy 100% to loan prepay at month `U`; living + payments funded from cash/ISA draws + JSA |
| `JL_REDUNDANCY_BRIDGE` | Net redundancy to cash buffer; funds living + payment shortfall first; user split for any surplus prepay |
| `JL_SMI_SAFETY_NET` | No prepay; JSA + SMI (enabled, wait 3) carry the mortgage; KPI focus: min cash balance and `smi_loan_balance_gbp` |

**Pension projection during employment** (for strategy module UK§4.12): monthly additions = `employee_monthly_gbp + employer_monthly_gbp` (§4.2); annual growth at `pension_annual_return_pct` (default `5`) credited once per year after 12 months of additions — same cadence as IN `projectPfCorpusMonths`.

#### 4.7.1 Educational model (not DWP / HMRC compliance)

Amounts, rates, waiting periods, and caps above are **2026/27 snapshots** used as editable defaults — not benefits eligibility determinations. Real entitlement depends on NI record, household means, and DWP assessment. The UI **must** show: "Simplified job-loss scenario — not a benefits entitlement calculation." See research: [`2026-07-uk-employee-benefits-mapping.md`](research/2026-07-uk-employee-benefits-mapping.md) §3.

---

### 4.8 Monthly budget / cashflow (job loss)

| Field | Type | Notes |
|------|------|------|
| `monthly_living_expense_gbp` | number | |
| `monthly_income_gbp` | number | Default `0` in job loss (other household income) |
| `mortgage_payment_gbp_override` | number | Optional |

**Simulation order each month:**

1. Accrue interest on loan opening balance.  
2. Add `monthly_jsa_gbp` (while within JSA window) + `monthly_income_gbp` to `cash_balance`.  
3. Add SMI credit when active (§4.7 item 4); increment `smi_loan_balance_gbp`.  
4. Apply redundancy inflow at month `U` per destination split.  
5. Subtract living expenses.  
6. Pay mortgage payment if funds available after the §4.7 draw order (cash → ISA → GIA); else apply `SHORTFALL_ACTION` (`skip_payment`, `draw_savings` default).  
7. Apply scheduled prepayments (ERC model per §4.1).

Warn `MORTGAGE_DEFAULT_RISK` when a payment is skipped with positive balance. Warn `JSA_WINDOW_ENDED` in the first month after the JSA window when cash flow is still negative.

---

### 4.9 Outputs

Same structure as IN §4.9 with `_gbp` suffixes. CSV + JSON export; JSON import and per-locale `localStorage` persistence follow IN §4.9 v1.7 with key `financial-planner-loan-form-UK`.

Additional job-loss KPIs: `net_redundancy_gbp`, `total_jsa_received_gbp`, `smi_loan_balance_gbp` (final), min cash balance month.

---

### 4.10 Multi-debt payoff planner

**Parity:** IN implementation (`src/lib/debt/`) with GBP fields.

| Field | Type | Required |
|------|------|----------|
| `start_date` | date | yes |
| `monthly_debt_budget_gbp` | number | yes |
| `debts[]` | array | yes (≥1) |

Each debt: `name`, `balance_gbp`, `apr_pct`, `minimum_payment_gbp`.

**Strategies:** `avalanche` (highest APR first), `snowball` (lowest balance first).

**Outputs:** month rows, payoff month, total interest, warning when budget < sum of minimums.

**Export:** CSV of active-strategy timeline + JSON of debts, budget, both strategy summaries.

---

### 4.11 Retirement planner

**Parity:** IN retirement module with UK extension (State Pension field, mirroring US Social Security treatment).

| Field | Type | Required | Notes |
|------|------|----------|------|
| `current_corpus_gbp` | number | yes | Pension pot + ISA/GIA total or pension only (user choice) |
| `monthly_contribution_gbp` | number | yes | Includes employee + employer pension contributions |
| `annual_return_pct` | number | yes | |
| `inflation_pct` | number | yes | |
| `years_to_retirement` | number | yes | |
| `annual_expense_today_gbp` | number | yes | |
| `safe_withdrawal_rate_pct` | number | no | Default classic 4% when user enters value |
| `expected_state_pension_weekly_gbp` | number | no | User-entered; UI placeholder **£241.30** (full new State Pension 2026/27). Does not compound in corpus |

**Scenarios:** `base`, `conservative` (−2% return, +1% inflation), `optimistic` (+2% return, −1% inflation, +20% contribution) — same deltas as IN.

**Outputs:** projected corpus, real corpus, expense at retirement, target corpus (expense / SWR), funded ratio, yearly timeline.

**Funded ratio v1:** `corpus_gbp / target_corpus_gbp` (State Pension shown separately as `annual_state_pension_gbp = expected_state_pension_weekly_gbp × 52`, not in funded ratio numerator).

**v1.1 optional KPI:** `sp_adjusted_funded_ratio` using `expense_gap = max(0, annual_expense_at_retirement − annual_state_pension_gbp)` and `sp_adjusted_target = expense_gap / SWR` — same shape as US `ss_adjusted_funded_ratio`.

**Export:** CSV of selected-scenario yearly timeline + JSON of inputs and all scenario projections.

---

### 4.12 Repayment strategy planner (household allocation)

Compare **three named strategies** over a horizon. Reuses UK§4.3–§4.5; adds **ISA-first equity sleeve** + pension pot projection.

#### 4.12.1 Inputs

| Field | Type | Required | Notes |
|------|------|----------|------|
| `monthly_take_home_gbp` | number | yes | |
| `monthly_living_expense_gbp` | number | no | Emergency buffer |
| `extra_monthly_income_gbp` | number | no | |
| `marginal_tax_rate_pct` | number | no | When extra income is pre-tax |
| `emergency_months_buffer` | number | no | Default `6` |
| `expected_equity_return_pct` | number | no | ISA + GIA sleeve, nominal annual % |
| `pension_annual_return_pct` | number | no | Default `5` |
| `isa_annual_allowance_gbp` | number | no | Default **20,000** |
| `cgt_rate_pct` | number | no | Default **24** (GIA gains above exemption) |
| `cgt_annual_exempt_gbp` | number | no | Default **3,000** |
| `horizon_months` | number | yes | |
| `repayment_pct_of_take_home` | number | no | For `STRATEGY_AGGRESSIVE_PREPAY`; 0–100 |

Deployable cash: `max(0, cash_gbp − emergency_months_buffer × (living + payment0))`. ISA/GIA balances are **not** auto-deployed; user folds them into `cash_gbp` explicitly if desired.

#### 4.12.2 Strategy IDs

| Strategy ID | One-time deployable | Monthly extra | Equity sleeve |
|-------------|---------------------|---------------|---------------|
| `STRATEGY_EQUITY_BLEND` | 40% prepay, 60% equity lump | 60% loan / 40% SIP | Lump + SIP, **ISA-first**; post-loan redirect = `payment0 + extra` |
| `STRATEGY_PREPAY_HEAVY` | 100% prepay | 100% to loan | None |
| `STRATEGY_AGGRESSIVE_PREPAY` | 100% prepay | `max(0, repayment_pct × take_home + extra − payment0)` | None |

Month-1 prepay uses `recompute_tenure_keep_payment` (§4.4 policy 1). Strategy prepays and monthly extras respect the §4.1 ERC model.

**ISA-first sleeve allocation:** within each rolling 12-month block, equity contributions (lump + SIP + post-loan redirect) fill the **ISA** bucket up to `isa_annual_allowance_gbp`; the remainder goes to the **GIA** bucket. Both compound at `expected_equity_return_pct`.

#### 4.12.3 Outputs

`loan_close_month`, `total_interest_gbp`, `erc_fees_gbp`, `interest_saved_vs_base_gbp`, allocation breakdown, `equity_corpus_at_horizon_gbp` (ISA + GIA), `equity_corpus_at_horizon_post_tax_gbp`, `pension_pot_at_horizon_gbp`, `net_worth_at_horizon_gbp`, `min_living_budget_gbp`, `warnings[]`.

**Post-tax model:** ISA bucket is tax-free; GIA bucket pays `cgt_rate_pct` on `max(0, gia_gain − cgt_annual_exempt_gbp)`:

```text
post_tax = isa_corpus + gia_corpus − max(0, gia_gain − cgt_annual_exempt_gbp) × cgt_rate_pct / 100
```

Single-year exemption applied once at horizon (no multi-year harvesting engine — warn `TAX_SIMPLIFIED`).

**Export:** CSV of strategy comparison table + JSON of inputs and all strategy results.

#### 4.12.4 Tier presets (UI)

| Tier ID | Label | `monthly_take_home_gbp` |
|---------|-------|-------------------------|
| `tier_a` | Tier A | 9,000 |
| `tier_b` | Tier B | 6,000 |
| `tier_c` | Tier C | 4,000 |

Nine golden fixtures: each tier × each strategy under `src/test/fixtures/strategy-uk/`.

#### 4.12.5 Warnings

| Code | Condition |
|------|-----------|
| `EMERGENCY_FUND_SHORTFALL` | `cash_gbp` below buffer |
| `FRAGILE_CASH_FLOW` | `payment0 > 0.5 × monthly_take_home_gbp` |
| `BELOW_SUBSISTENCE` | `min_living_budget_gbp < 1_500` |
| `AGGRESSIVE_PCT_INVALID` | repayment pct outside 0–100 |
| `HORIZON_TOO_SHORT` | horizon < loan close month |
| `ERC_ALLOWANCE_EXCEEDED` | overpayments exceed allowance with `erc_pct = 0` (informational) |
| `TAX_SIMPLIFIED` | GIA post-tax uses flat rate + single exemption; band stacking not modelled |

---

### 4.13 Strategic interaction (game theory)

**Architecture:** identical to IN §4.13; oracle uses UK§4.3–§4.8 and UK§4.12.

**Lender (`L`) actions:** `L_FEE_0` (`erc_pct = 0`), `L_FEE_FLAT` (flat `prepayment_fee_gbp` per lump event), **`L_ERC_PCT`** (`erc_pct` on excess above the §4.1 allowance; default **2%** if unset — UK-canonical replacement for `L_FEE_PCT`), `L_RATE_HOLD`, `L_RATE_BUMP` (v1.1).

**Nature (`N`) employment actions:** `N_EMPLOYED`, `N_JL_M1`, `N_JL_M12`, `N_JL_M24` (job loss months).

**Job-loss funding routes** (when job loss on) — map to UK§4.7 presets:

| Action ID | Maps to |
|-----------|---------|
| `N_JL_LOAN` | `JL_REDUNDANCY_TO_LOAN` |
| `N_JL_BRIDGE` | `JL_REDUNDANCY_BRIDGE` |
| `N_JL_SMI` | `JL_SMI_SAFETY_NET` |

**Borrower funding:** `B_FUND_CASH`, `B_FUND_MIX` (cash → ISA → GIA net of CGT; **pension excluded always** — a profile requesting pension funding is invalid, error `PENSION_LOCKED_NMPA`).

**Reference amounts:** `B_PREPAY_25` → **£25,000**; deployable fractions unchanged.

**Tier P0 profiles** (UK IDs mirror IN):

| Profile ID | IN analogue |
|------------|-------------|
| `GAME_UK_BL_SIM_FEE` | `GAME_BL_SIM_FEE` |
| `GAME_UK_BL_SEQ_L_FEE` | `GAME_BL_SEQ_L_FEE` |
| `GAME_UK_BH_SIM_SPLIT` | `GAME_BH_SIM_SPLIT` |
| `GAME_UK_BH_COOP_PARETO` | `GAME_BH_COOP_PARETO` |
| `GAME_UK_BN_SEQ_N_JL` | `GAME_BN_SEQ_N_UE` |
| `GAME_UK_BN_SIM_JL_TIMING` | `GAME_BN_SIM_UE_TIMING` |

Payoff metrics use `_gbp` fields; `INTEREST_SAVED_MINUS_FEES` counts ERC fees + flat fees. Collapsed cell counts match IN §4.13.8 (e.g. `GAME_UK_BL_SIM_FEE` → 12 raw / 10 collapsed cells).

**Tier P2 — research / non-shipping:** same list as IN §4.13.8 Tier P2; additionally `GAME_UK_FIX_RESET` (fix-expiry reversion-rate game) is design-only until floating-rate modelling is promoted (§11).

---

## 5. Non-Functional Requirements

Same as IN §5. UI `en-GB` number formatting (`£1,234.56`). Accessibility and validation unchanged. Form persistence per IN §5 with UK locale key. Analytics (§5.1 IN) gain `locale: "UK"` as a valid parameter value on existing events; no new event names.

---

## 6. Data Models (TypeScript sketch)

```ts
type Locale = "IN" | "US" | "UK";

type PrepaymentPolicy =
  | "recompute_tenure_keep_payment"
  | "recompute_payment_keep_tenure";

type InflowDestination = "loan_prepay" | "cash_buffer" | "split";

interface UkJobLossConfig {
  enabled: boolean;
  start_month: number; // U, 1-based
  redundancy_payment_gbp: number;
  marginal_tax_rate_pct: number; // default 20
  redundancy_destination: InflowDestination;
  redundancy_loan_fraction?: number;
  monthly_jsa_gbp: number; // default 0
  jsa_duration_months: number; // default 6
  smi_enabled: boolean;
  smi_wait_months: number; // default 3
  smi_rate_pct: number; // default 3.66
  smi_capital_cap_gbp: number; // default 200_000
}

interface UkScenario extends Omit<Scenario, "pf_unemployment"> {
  uk_job_loss?: UkJobLossConfig;
  // all monetary fields use *_gbp; pension_pot_gbp is read-only in simulation
}

interface ErcConfig {
  overpayment_allowance_pct: number; // default 10
  erc_pct: number; // default 0
}
```

Shared amortisation row shape mirrors IN `AmortRow` with `_gbp` suffixes plus optional `erc_fee_gbp` and `smi_credit_gbp` columns.

---

## 7. Algorithm Notes

### 7.1–7.2

Same as IN §7.1–§7.2.

### 7.3 Job-loss month indexing

Same 1-based convention as IN §7.3:

- Redundancy inflow at month `U`.  
- JSA inflows months `U` … `U + jsa_duration_months − 1` (default: `U=1` → months 1–6; month 7 has no JSA).  
- SMI credits start month `U + smi_wait_months` (default: `U=1` → first credit month **4**) and continue while job loss persists.

Unit tests required for each boundary (first JSA month, last JSA month, first SMI month).

### 7.4 ERC block accounting

Allowance blocks are rolling 12-month windows from scenario start (months 1–12, 13–24, …). `allowance_gbp` is computed from the **opening balance of the block's first month**. Track `overpaid_in_block_gbp`; charge ERC only on the increment above the allowance in the month it occurs (no retroactive fees).

### 7.5 GIA liquidation net proceeds

When drawing `d` from a GIA with balance `V` and cost basis `C`:

```text
gain_realised = d × max(0, V − C) / V
tax = max(0, gain_realised − remaining_exempt_gbp) × cgt_rate_pct / 100
net = d − tax          // remaining_exempt decremented per tax year (v1: per 12-month block)
```

Report tax in `events[]`.

---

## 8. UI Specification

### Locale selector

- Header or settings: **Country / locale** toggle `India (INR)` | `United States (USD)` | `United Kingdom (GBP)`.  
- Persist in `localStorage` key `financial-planner-locale`.  
- Switching locale resets form defaults to the target locale's §15 reference values (confirm dialog) — same behaviour as IN/US.

### Screens (UK)

Same five tabs as current app: Loan, Multi-debt, Retirement, Strategies, Strategic — all GBP-labelled. Loan tab shows the **overpayment allowance / ERC** fields where IN/US show the flat prepayment fee. Job-loss panel shows redundancy, JSA, and SMI groups; **no pension-withdrawal controls exist** in this locale.

### Deploy metadata

Same footer behaviour as IN §8.

### Comparison table columns

Scenario name; Payoff month; Total interest; Δ interest vs BASE; Total outflows; ERC fees (if any); Min cash balance; SMI loan balance (if any); Notes/warnings.

---

## 9. Edge Cases & Warnings

All IN §9 cases plus:

- Any attempted pension draw (config or game profile) → error `PENSION_LOCKED_NMPA`.  
- Overpayments above allowance with `erc_pct = 0` → informational `ERC_ALLOWANCE_EXCEEDED`.  
- Overpayments above allowance with `erc_pct > 0` → fee shown in schedule + totals.  
- GIA draw exceeding balance → error; ISA draw exceeding balance cascades to GIA.  
- Job loss with no cash, no ISA/GIA, no JSA, payment > 0 → `MORTGAGE_DEFAULT_RISK`.  
- SMI enabled → always show `SMI_IS_A_LOAN` note with cumulative `smi_loan_balance_gbp`.  
- First month after JSA window with negative cashflow → `JSA_WINDOW_ENDED`.  
- Redundancy above £30,000 → show tax deduction line in events.

---

## 10. Testing / Acceptance Criteria

### Unit tests (required)

1. **Mortgage payment** matches reference: `P=250_000`, `annual=4.5`, `n=300` → **£1,389.58** within **£0.01** after rounding policy documented.  
2. **Prepay £25,000 month 1 + keep payment:** payoff month materially less than 300 (document reference in test).  
3. **Prepay £25,000 month 1 + keep term:** new payment ≈ 10% lower than baseline (document reference within **£1**).  
4. **Redundancy tax:** £40,000 gross at `marginal_tax_rate_pct=40` → net **£36,000**; £25,000 gross → net **£25,000** (fully within exemption).  
5. **JSA window:** `U=1`, defaults → inflows months **1–6** only; month 7 inflow `0`; total received = `6 × monthly_jsa_gbp`.  
6. **SMI indexing + amount:** `U=1`, wait 3 → first credit month **4**; reference loan (balance ≥ £200,000) credit **£610.00/mo**; `smi_loan_balance_gbp` accumulates exactly the credits.  
7. **Pension locked:** job-loss fixture with all cash exhausted — `pension_pot_gbp` unchanged in every row; forced pension-draw config throws `PENSION_LOCKED_NMPA`.  
8. **ERC on excess:** balance £250,000, allowance 10%, prepay £37,500, `erc_pct=2` → fee **£250**; same prepay with `erc_pct=0` → fee 0 + `ERC_ALLOWANCE_EXCEEDED`.  
9. **ERC block reset:** £25,000 prepay in month 1 (block 1 allowance = 10% × £250,000) and **£21,841.09** prepay in month 13 (block 2 allowance = 10% × month-13 opening balance ≈ £218,410.93 after month-1 prepay and 11 scheduled payments) → **no ERC fee** in either block for the reference loan with `erc_pct = 2`.  
10. **Auto-enrolment:** £60,000 salary, 5%/3% → employee **£183.46/mo**, employer **£110.08/mo** (±£0.01); `employment_type=self_employed` → employer **£0** regardless of inputs.  
11. **GIA CGT:** corpus £50,000, basis £40,000, full liquidation, defaults → tax **£1,680**, net **£48,320**.  
12. **Cashflow shortfall** fixture (no JSA, no redundancy) flags `MORTGAGE_DEFAULT_RISK`.  
13. **Monthly inflow** shortens payoff vs `BASE`; **salary sweep:** reference mortgage with `monthly_salary_gbp=5_000` → `BASE` payoff **300**, `BASE_PLUS_SALARY_SWEEP` materially less (document reference in test).  
14. **Debt avalanche** total interest ≤ snowball for reference debts.  
15. **Retirement:** contribution monotonicity; conservative ≤ optimistic funded ratio; State Pension excluded from funded ratio (changing `expected_state_pension_weekly_gbp` leaves `funded_ratio` unchanged).  
16. **Strategy equity blend:** 40/60 deployable split on UK§15 inputs; sleeve contributions fill ISA up to £20,000 per 12-month block before GIA.  
17. **Nine UK strategy goldens** under `src/test/fixtures/strategy-uk/`.  
18. **`GAME_UK_BL_SIM_FEE`:** 10 collapsed cells; oracle purity — no duplicate payment math in `src/lib/game/`; `B_FUND_MIX` never touches pension.  
19. **Locale switch:** IN and US goldens unchanged when `locale=IN` / `locale=US`; UK fixtures pass when `locale=UK`.

### Golden files

`src/test/fixtures/goldens-uk/`: `BASE`, `PREPAY_CASH_25K_TERM`, `JL_SMI_SAFETY_NET`.

---

## 11. Non-Goals (UK v1)

- **Early pension access of any kind** — no tranche module, no unauthorised-payment (55% charge) scenario, no pension in draw orders or game funding mixes.  
- DWP benefits entitlement engines: Universal Credit awards/taper, means tests, NI-record qualification for JSA or State Pension (user enters flat amounts).  
- Statutory redundancy **entitlement calculation** from service history (user enters the package total; caps shown as helper text only).  
- PILON / notice pay / settlement agreement tax treatment.  
- Income tax band engine (single user `marginal_tax_rate_pct`); CGT band stacking (18%/24% split — single user `cgt_rate_pct`); dividend tax.  
- ISA product taxonomy: cash vs stocks & shares split, LISA bonus/penalty, the April 2027 £12,000 cash-ISA sub-limit (note in UI copy only).  
- Salary sacrifice, DB pensions, pension carry-forward, annual/lifetime allowance charges, tax relief modelling on contributions.  
- SMI loan **interest accrual** (OBR gilt rate) and repayment-on-sale mechanics (balance tracked, not compounded).  
- UK fix/reversion rate cycles and remortgage advice; floating-rate **stochastic** simulation (`GAME_UK_FIX_RESET` remains design-only).  
- Help to Buy / shared ownership / equity loan structures; buy-to-let.  
- Multi-loan creditor games until promoted from IN §4.13 Tier P2.  
- Additional country locales beyond IN / US / UK.

**In scope (v1):** ERC-on-excess fee model (§4.1); ISA-first equity sleeve with GIA CGT (§4.12); redundancy + JSA + SMI job-loss bridge (§4.7); State Pension as separate retirement income (§4.11).

---

## 12. Suggested Tech (non-binding)

- Locale-aware money helpers: `roundGbp`, `formatGbp` parallel to `roundInr` / `roundUsd`.  
- Zod discriminated union on `locale` for form schemas (extend the existing IN/US union).  
- Named constants module for 2026/27 UK defaults (`AE_LOWER_GBP`, `AE_UPPER_GBP`, `REDUNDANCY_TAX_FREE_GBP`, `SMI_RATE_PCT`, …) so annual uprating is a one-file change.  
- Feature flag: ship locale selector option behind `VITE_ENABLE_UK_LOCALE` until UK goldens pass CI (same pattern as US).

---

## 13. Open Questions

1. Should the ERC model support **per-deal expiry** (`erc_end_month` after which `erc_pct = 0`, modelling fix expiry)? → Likely **v1.1**; v1 uses a constant `erc_pct`.  
2. Offset-mortgage modelling (cash offsets interest instead of prepaying)? → Needs product call; candidate for research spike before any spec change.  
3. Should `JL_REDUNDANCY_BRIDGE` auto-default the redundancy destination to `cash_buffer` like IN's liquidity-first suggestion? → **Yes** (mirrors IN §4.7 / US `JL_401K_BRIDGE` resolution).  
4. LISA (Lifetime ISA) as a first-home/retirement bucket with 25% bonus and withdrawal penalty? → Deferred; revisit after v1 goldens.

---

## 14. Legal / Product Disclaimer (UK footer variant)

"This calculator is for educational planning only. Pension access rules, redundancy entitlements, Jobseeker's Allowance, Support for Mortgage Interest, ISA limits, tax rates, and mortgage early repayment charges vary and change over time. Verify with GOV.UK, your pension provider, your lender, and a qualified financial adviser. Figures shown use 2026/27 defaults."

---

## 15. Reference Scenario (UK QA)

- Principal: **£250,000**  
- Rate: **4.5%** p.a. fixed  
- Tenure: **300** months (baseline payment ≈ **£1,389.58**)  
- Assets: cash **£30,000**, ISA **£40,000**, GIA **£20,000** (cost basis £16,000), pension pot **£60,000** (projection-only)  
- Salary **£60,000**; auto-enrolment **5% + 3%** on qualifying earnings £6,240–£50,270 → employee **£183.46/mo**, employer **£110.08/mo**  
- Overpayment allowance **10%**/yr; `erc_pct` **0** default (typical test variant: **2**)  
- Job loss: redundancy **£40,000** gross (net **£36,000** at 40% marginal), JSA **£414/mo** × **6** months, SMI wait **3** months at **3.66%** on ≤ **£200,000** (credit **£610/mo**)  
- Retirement: State Pension placeholder **£241.30/wk**  
- Strategy defaults: `cgt_rate_pct` **24**, `cgt_annual_exempt_gbp` **£3,000**, `isa_annual_allowance_gbp` **£20,000**

### 15.1 Strategy golden matrix

Regenerate: `npm run goldens:update:uk` (add script when implementing).  
Paths: `src/test/fixtures/strategy-uk/tier_{a,b,c}_{equity_blend,prepay_heavy,aggressive_prepay}.json`.

### 15.2 Game profile golden matrix

`src/test/fixtures/game-uk/{profile_id}.json` when UK§4.13 P0 ships.

---

## 16. Implementation map (IN / US → UK)

| Work package | Primary files (expected) |
|--------------|--------------------------|
| Locale + money | `src/lib/money.ts`, `src/lib/formatGbp.ts`, `App.tsx` |
| ERC fee model | `src/lib/loan/erc.ts` (+ amortisation post-processing hook) |
| UK job loss | `src/lib/loan/joblossUk.ts`, `cashflow.ts` (locale branch) |
| UK constants | `src/lib/ukConstants.ts` (2026/27 defaults) |
| UK forms | `src/features/loan/`, hooks with locale |
| Strategy UK | `src/lib/strategy/` locale params + ISA/GIA sleeve |
| Game UK | `src/lib/game/` profile IDs |
| Tests / goldens | `src/test/fixtures/goldens-uk/`, `strategy-uk/` |

---

**End of UK specification**

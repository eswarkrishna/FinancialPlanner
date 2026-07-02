# FinancialPlanner — US Locale Product & Engineering Specification

**Project:** `FinancialPlanner`  
**Canonical spec (this file):** `docs/SPEC-US.md`  
**India locale spec:** [`docs/SPEC.md`](SPEC.md) (shared solver architecture; section numbers align where features are parallel)  
**Research:** [`docs/research/2026-07-us-employee-benefits-mapping.md`](research/2026-07-us-employee-benefits-mapping.md) (summary) · [`docs/research/2026-07-us-employee-locale-deep-dive.md`](research/2026-07-us-employee-locale-deep-dive.md) (full per-topic) · [`docs/research/2026-07-other-planner-areas.md`](research/2026-07-other-planner-areas.md) (IN symmetry, HSA, PMI, locales, Tier P2)  
**Spec-driven workflow:** See `AGENTS.md`.

---

**Version:** 1.4  
**Audience:** Engineers / Cursor agents implementing the US locale  
**Locale:** United States (USD; optional thousands separators in UI)  
**Status:** Partially implemented — loan, debt, retirement, strategy tabs and US goldens ship in code; remaining gaps tracked in §13 (game profile aliases `GAME_US_*`, full `_inr` field rename deferred).
**Parity target:** Same planner tabs and decision surfaces as India locale for **employed US workers** modeling mortgage payoff, multi-debt, retirement, repayment strategies, and strategic games.

---

## 1. Purpose

Deliver a **US locale** of FinancialPlanner that lets a user model a **reducing-balance mortgage** (or personal loan) and compare **multiple payoff strategies**, including:

- Lump-sum prepayments from **cash**, **taxable brokerage liquidation**, and **401(k) vested balance** (with early-withdrawal penalty modeling when applicable)  
- Prepayment policies: **reduce term** vs **reduce monthly payment** (same semantics as IN §4.4)  
- Optional **extra monthly principal** payments  
- A dedicated **job loss + staged 401(k) distribution** timeline per canonical rules in US§4.7  
- **Multi-debt** avalanche/snowball payoff (US§4.10)  
- **Retirement corpus** projection with optional **Social Security** benefit (US§4.11)  
- **Repayment strategy planner** comparing equity blend vs prepay-heavy paths (US§4.12)  
- Optional **strategic interaction** games (US§4.13) using the same amortisation oracle pattern as IN §4.13  

The app must produce **transparent numbers**: amortisation tables, totals, interest paid, payoff month, and scenario comparison tables — all in **USD**.

---

## 2. Glossary

| Term | Meaning |
|------|---------|
| **USD** | United States dollar; store as number; UI may show `$` prefix |
| **401(k) vested balance** | User-entered retirement plan balance available for modeling (employer match vesting applied via `vested_fraction_pct`) |
| **Brokerage liquidation** | User-entered taxable investment account value (optional haircut) |
| **Mortgage payment** | Fixed monthly P&I payment (same annuity formula as IN EMI) |
| **Early distribution penalty** | Educational 10% federal penalty on qualifying 401(k) cash withdrawals (US§4.7); not plan-specific hardship compliance |
| **Employer match** | Monthly employer 401(k) contribution derived from deferral and match formula (US§4.2) |
| **Social Security benefit** | User-entered expected monthly benefit at retirement (nominal USD); no SSA actuarial engine in v1 |
| **Player** | Decision-maker in US§4.13 (`B`, `L`, `H`, `N`) — same roles as IN §4.13 |
| **Payoff oracle** | Existing simulation (US§4.3–§4.8, US§4.10–§4.12) mapping actions → USD outcomes |

**Locale switch:** Application exposes `locale: "IN" | "US"`. India behaviour remains governed by [`SPEC.md`](SPEC.md). US behaviour is governed by this file. Shared pure math (EMI formula, avalanche ordering) may live in locale-agnostic helpers parameterized by `roundMoney(amount, locale)`.

---

## 3. User Personas

1. **US borrower optimiser:** W-2 employee with mortgage; wants to minimise interest while keeping liquidity and retirement contributions.  
2. **Job-loss stress tester:** Models unemployment, UI income, staged 401(k) access, and mortgage default risk.  
3. **Debt snowball/avalanche comparator:** Multiple consumer debts + budget constraint.  
4. **Retirement gap checker:** Projects 401(k) + brokerage + optional Social Security vs expense target.  
5. **Strategic planner:** Household split and lender-fee games (US§4.13).  
6. **Self-employed / 1099:** Solo 401(k) or SEP-IRA; no employer match; no UI income — use `employment_type: self_employed` preset (US§4.2).

**Employment preset (`employment_type`):**

| Value | Effect |
|-------|--------|
| `w2` (default) | Employer match formula enabled; UI benefit field shown in job-loss mode |
| `self_employed` | `employer_match_usd = 0`; UI benefit defaults to `0`; user may enter `monthly_other_income_usd` via `monthly_income_usd` |

---

## 4. Functional Requirements

### 4.0 Locale and money

| Field | Type | Required | Notes |
|------|------|----------|------|
| `locale` | enum | yes | `"US"` when this spec applies |
| `rounding_mode` | enum | optional | `banker` / `floor` / `ceil` — **round to cents**; document in README for US |

All monetary fields use suffix `_usd` instead of IN `_inr`. Minimum prepayment: `MIN_PREPAYMENT_USD` default `0`.

---

### 4.1 Core inputs (global)

| Field | Type | Required | Notes |
|------|------|----------|------|
| `principal_usd` | number | yes | > 0 |
| `annual_interest_rate` | number | yes | Nominal annual %, e.g. `6.5` |
| `tenure_months` | integer | yes | e.g. `360` for 30-year mortgage |
| `start_date` | date | optional | Default today |
| `prepayment_fee_usd` | number | optional | Default `0` |
| `rate_type` | enum | optional | `fixed` (v1) |
| `pmi_monthly_usd` | number | optional | Default `0`. Flat private mortgage insurance added to monthly cashflow outflows when &gt; 0 (v1.1). Auto LTV-based cancellation deferred |
| `pmi_active` | boolean | optional | Default `true` when `pmi_monthly_usd > 0`; user may toggle off to model PMI already cancelled |

---

### 4.2 Asset inputs

| Field | Type | Required | Notes |
|------|------|----------|------|
| `cash_usd` | number | no | Checking/savings |
| `k401_vested_balance_usd` | number | no | After vesting haircut |
| `vested_fraction_pct` | number | no | Default `100`; apply to `k401_vested_balance_usd` for withdrawals |
| `brokerage_liquid_usd` | number | no | Taxable account |
| `brokerage_haircut_pct` | number | no | 0–100 if user enables liquidation discount |
| `monthly_cash_to_loan_usd` | number | no | Recurring extra principal after scheduled payment (US§4.5); does **not** include salary sweep |
| `monthly_salary_usd` | number | no | Optional stress-test: USD routed as **extra principal** after payment in scenarios that include salary sweep (`BASE_PLUS_SALARY_SWEEP`, prepay rows, §4.8 when configured). **Excluded from `BASE`.** v1 UI label: “Monthly salary”. |
| `monthly_401k_deferral_usd` | number | no | Employee pre-tax deferral (projection only) |
| `annual_salary_usd` | number | no | For employer match formula |
| `employer_match_rate_pct` | number | no | Default **50** (50% of deferral) |
| `employer_match_cap_pct_of_salary` | number | no | Default **6** → match on deferral up to 6% of annual salary / 12 per month |
| `monthly_employer_match_usd` | number | no | Optional override; if set, ignores match formula |
| `employment_type` | enum | no | `w2` (default) \| `self_employed` — see §3 preset table |
| `hsa_balance_usd` | number | no | Health savings account balance (v1.2) |
| `monthly_health_premium_usd` | number | no | Health insurance premium during job loss; HSA may cover tax-free per IRS qualified expense rules (v1.2) |

**Employer match (monthly):** when formula enabled **and** `employment_type = w2`,

```text
cap_monthly = (annual_salary_usd × employer_match_cap_pct_of_salary / 100) / 12
eligible_deferral = min(monthly_401k_deferral_usd, cap_monthly)
employer_match_usd = eligible_deferral × (employer_match_rate_pct / 100)
```

**Reference example (US§15):** `annual_salary_usd = 120_000`, `monthly_401k_deferral_usd = 1_000` → `cap_monthly = 600`, `eligible_deferral = 600`, **`employer_match_usd = 300`/mo** (most common US formula per desk research).

---

### 4.3 Baseline computation

Identical math to IN §4.3; labels use **mortgage payment** instead of EMI. Monthly rate \( r = \frac{\text{annual\_rate}}{100 \times 12} \).

---

### 4.4 Prepayment engine

Same three policies as IN §4.4:

1. `recompute_tenure_keep_payment` (alias of IN `recompute_tenure_keep_emi`)  
2. `recompute_payment_keep_tenure` (alias of IN `recompute_emi_keep_tenure`)  
3. `lump_sum_full_payoff`

Application order: interest → scheduled principal → lump prepay → recurring extra principal.

---

### 4.5 Extra monthly principal

Same as IN §4.5 with `_usd` fields.

---

### 4.6 Scenario catalogue (employed)

| Scenario ID | Description |
|-------------|-------------|
| `BASE` | No prepayment; scheduled payment only for full original tenure (§4.3). **Ignores** `monthly_salary_usd` and `monthly_cash_to_loan_usd`. |
| `PREPAY_CASH_50K_TENURE` | One-time $50,000 from cash at month 1; `recompute_tenure_keep_payment` |
| `PREPAY_CASH_50K_PAYMENT` | One-time $50,000 at month 1; `recompute_payment_keep_tenure` |
| `PREPAY_FULL_100K` | Full payoff at month 1 from combined sources (user funding mix) |
| `PREPAY_CUSTOM` | User-defined amount + month + policy |
| `EXTRA_PRINCIPAL` | Recurring extra principal |
| `STAGED_PREPAY` | Multiple timed prepayments |
| `BASE_PLUS_SALARY_SWEEP` | Baseline payment + `monthly_salary_usd` as extra principal each month (§4.5); compare **payoff months** to `BASE` |
| `BASE_PLUS_MONTHLY_INFLOW` | Baseline payment + fixed `monthly_cash_to_loan_usd` each month after payment (§4.5); does **not** include `monthly_salary_usd`; compare **payoff months** to `BASE` |
| `PREPAY_PAYMENT_PLUS_MONTHLY_INFLOW` | One-time prepay month 1 + keep original payment + monthly extra |

---

### 4.7 Job loss + 401(k) staged distribution module (required)

**Trigger:** `job_loss_mode` (boolean) and `job_loss_start_month` (1-based, default `1`).

**Canonical distribution rule set (educational — user-specified for this app):**

Let `K0` = vested 401(k) balance at job loss start:

```text
K0 = k401_vested_balance_usd × (vested_fraction_pct / 100)
```

| Event time | Withdrawal fraction of `K0` | Gross amount |
|------------|----------------------------|--------------|
| End of **month 1** after job loss start | **50%** | `0.50 × K0` |
| End of **month 12** after job loss start | **50%** | `0.50 × K0` |

**Month indexing (canonical):** same as IN §7.3 — tranche1 at `U`, tranche2 at `U + 11` where `U` = job loss start month.

**Early withdrawal cost model** (amounts routed to `cash_buffer` or split cash portion):

```text
penalty_usd = gross × 0.10
withholding_usd = gross × (early_withdrawal_tax_withholding_pct / 100)   // default 22
net_to_cash_usd = gross − penalty_usd − withholding_usd
```

Default `early_withdrawal_tax_withholding_pct = 22`. Amounts routed **directly** to `loan_prepay` use **gross** toward principal (penalty/withholding still reported in KPIs as warnings, not double-counted against loan).

**Distribution destination** per tranche: `loan_prepay` | `cash_buffer` | `split` (with `loan_fraction`).

**Scenarios (minimum):**

| Scenario ID | Description |
|-------------|-------------|
| `JL_401K_TO_LOAN` | Both tranches 100% to loan prepay; payments funded from `cash_usd` + optional UI |
| `JL_401K_BRIDGE` | Tranche 1 covers living + payment shortfall first; remainder prepays; tranche 2 per user split |
| `JL_DELAY_PREPAY` | No loan prepay until month-12 tranche |

**401(k) balance projection during employment** (for strategy module US§4.12): monthly additions = `monthly_401k_deferral_usd + employer_match_usd`; annual growth at `k401_annual_return_pct` (default `7`) credited once per year after 12 months of additions — same cadence as IN PF projection in §4.12 / `projectPfCorpusMonths`.

#### 4.7.1 Educational model (not IRS / plan compliance)

This module is a **stress-test fiction** parallel to IN §4.7’s user-specified EPFO 75/25 rule. Real 401(k) plans:

- Do **not** allow general penalty-free withdrawals solely because of job loss ([IRS Topic 558](https://www.irs.gov/taxtopics/tc558); [hardship FAQs](https://www.irs.gov/retirement-plans/retirement-plans-faqs-regarding-hardship-distributions)).
- Hardship withdrawals require specific “immediate and heavy” needs (foreclosure risk, medical, etc.) and usually still incur the 10% penalty if under age 59½.

The UI **must** show: “Simplified job-loss scenario — not IRS hardship or plan rules.” See research: [`2026-07-us-employee-benefits-mapping.md`](research/2026-07-us-employee-benefits-mapping.md) §3; full topic coverage: [`2026-07-us-employee-locale-deep-dive.md`](research/2026-07-us-employee-locale-deep-dive.md) Topic 1.

**v1.1 optional overlay:** `secure2_emergency_1k` — up to $1,000/yr penalty-free (SECURE 2.0; income tax still applies; plan adoption assumed).

---

### 4.8 Monthly budget / cashflow (job loss)

| Field | Type | Notes |
|------|------|------|
| `monthly_living_expense_usd` | number | |
| `monthly_income_usd` | number | Default `0` in job loss |
| `monthly_uib_usd` | number | Unemployment insurance benefit; default `0` (user must enter — varies by state). UI hint only: **$1,800/mo** (~$450/wk) as illustrative mid-range. Hidden or zero when `employment_type = self_employed` |
| `mortgage_payment_usd_override` | number | Optional |

**Simulation order each month:**

1. Accrue interest on loan opening balance.  
2. Add `monthly_uib_usd` + other income to `cash_balance`.  
3. Subtract living expenses.  
4. Subtract `pmi_monthly_usd` when `pmi_active` and amount &gt; 0.  
5. During job loss: draw `min(hsa_balance, monthly_health_premium_usd)` from HSA for qualified premiums (tax-free); remainder of premium from cash.  
6. Pay mortgage payment if `cash_balance >= payment` else apply `SHORTFALL_ACTION` (`skip_payment`, `draw_cash_buffer`).  
7. Apply 401(k) distributions on scheduled months per destination split (net of penalty/withholding for cash).  
8. Apply scheduled prepayments.

Warn `MORTGAGE_DEFAULT_RISK` when payment skipped with positive balance.

---

### 4.9 Outputs

Same structure as IN §4.9 with `_usd` suffixes. CSV + JSON export.

Optional v1.1 charts: remaining principal curve, cumulative interest.

---

### 4.10 Multi-debt payoff planner

**Parity:** IN implementation (`src/lib/debt/`) with USD fields.

| Field | Type | Required |
|------|------|----------|
| `start_date` | date | yes |
| `monthly_debt_budget_usd` | number | yes |
| `debts[]` | array | yes (≥1) |

Each debt: `name`, `balance_usd`, `apr_pct`, `minimum_payment_usd`.

**Strategies:** `avalanche` (highest APR first), `snowball` (lowest balance first).

**Outputs:** month rows, payoff month, total interest, warning when budget < sum of minimums.

---

### 4.11 Retirement planner

**Parity:** IN retirement module with US extensions.

| Field | Type | Required | Notes |
|------|------|----------|------|
| `current_corpus_usd` | number | yes | 401(k) + IRA + brokerage total or 401(k) only (user choice) |
| `monthly_contribution_usd` | number | yes | Includes employee deferral |
| `annual_return_pct` | number | yes | |
| `inflation_pct` | number | yes | |
| `years_to_retirement` | number | yes | |
| `annual_expense_today_usd` | number | yes | |
| `safe_withdrawal_rate_pct` | number | no | Default classic 4% when user enters value |
| `expected_social_security_monthly_usd` | number | no | User-entered; UI placeholder **$2,000** (≈ SSA avg retired worker 2025). Does not compound in corpus |

**Scenarios:** `base`, `conservative` (−2% return, +1% inflation), `optimistic` (+2% return, −1% inflation, +20% contribution) — same deltas as IN.

**Outputs:** projected corpus, real corpus, expense at retirement, target corpus (expense / SWR), funded ratio, yearly timeline.

**Funded ratio v1:** `corpus_usd / target_corpus_usd` (Social Security shown separately as `annual_ss_income_usd = expected_social_security_monthly_usd × 12`, not in funded ratio numerator).

**v1.1 optional KPI:** `ss_adjusted_funded_ratio` using `expense_gap = max(0, annual_expense_at_retirement − annual_ss_income)` and `ss_adjusted_target = expense_gap / SWR`.

---

### 4.12 Repayment strategy planner (household allocation)

Compare **three named strategies** over a horizon. Reuses US§4.3–§4.5; adds brokerage SIP + 401(k) projection.

#### 4.12.1 Inputs

| Field | Type | Required | Notes |
|------|------|----------|------|
| `monthly_take_home_usd` | number | yes | |
| `monthly_living_expense_usd` | number | no | Emergency buffer |
| `extra_monthly_income_usd` | number | no | |
| `marginal_tax_rate_pct` | number | no | Federal marginal; state deferred |
| `emergency_months_buffer` | number | no | Default `6` |
| `expected_equity_return_pct` | number | no | Brokerage sleeve |
| `k401_annual_return_pct` | number | no | Default `7` |
| `horizon_months` | number | yes | |
| `repayment_pct_of_take_home` | number | no | For `STRATEGY_AGGRESSIVE_PREPAY` |

Deployable cash: `max(0, cash_usd − emergency_months_buffer × (living + payment0))`.

#### 4.12.2 Strategy IDs

| Strategy ID | One-time deployable | Monthly extra | Brokerage sleeve |
|-------------|---------------------|---------------|------------------|
| `STRATEGY_EQUITY_BLEND` | 40% prepay, 60% brokerage lump | 60% loan / 40% SIP | Lump + SIP; post-loan redirect |
| `STRATEGY_PREPAY_HEAVY` | 100% prepay | 100% to loan | None |
| `STRATEGY_AGGRESSIVE_PREPAY` | 100% prepay | `max(0, repayment_pct × take_home + extra − payment0)` | None |

#### 4.12.3 Outputs

`loan_close_month`, `total_interest_usd`, `interest_saved_vs_base_usd`, allocation breakdown, `brokerage_corpus_at_horizon_usd`, `brokerage_corpus_at_horizon_post_tax_usd` (LT cap gain: `ltcg_rate_pct` default **15%** on gain; no exemption floor in v1), `k401_corpus_at_horizon_usd`, `net_worth_at_horizon_usd`, `min_living_budget_usd`, `warnings[]`.

#### 4.12.4 Tier presets (UI)

| Tier ID | Label | `monthly_take_home_usd` |
|---------|-------|-------------------------|
| `tier_a` | Tier A | 18,000 |
| `tier_b` | Tier B | 12,000 |
| `tier_c` | Tier C | 8,000 |

Nine golden fixtures: each tier × each strategy under `src/test/fixtures/strategy-us/`.

#### 4.12.5 Warnings

| Code | Condition |
|------|-----------|
| `EMERGENCY_FUND_SHORTFALL` | `cash_usd` below buffer |
| `FRAGILE_CASH_FLOW` | `payment0 > 0.5 × monthly_take_home_usd` |
| `BELOW_SUBSISTENCE` | `min_living_budget_usd < 2_000` |
| `AGGRESSIVE_PCT_INVALID` | repayment pct outside 0–100 |
| `HORIZON_TOO_SHORT` | horizon < loan close month |
| `EARLY_401K_WITHDRAWAL` | job loss mode uses 401(k) distributions |
| `TAX_SIMPLIFIED` | brokerage post-tax uses flat `ltcg_rate_pct`; short-term gains not modeled |

---

### 4.13 Strategic interaction (game theory)

**Architecture:** identical to IN §4.13; oracle uses US§4.3–§4.8 and US§4.12.

**Nature (`N`) employment actions:** `N_EMPLOYED`, `N_JL_M1`, `N_JL_M12`, `N_JL_M24` (job loss months).

**401(k) routing actions** (when job loss on): `N_401K_LOAN`, `N_401K_BRIDGE`, `N_401K_DELAY` — map to US§4.7 presets.

**Borrower funding:** `B_FUND_CASH`, `B_FUND_MIX` (cash → brokerage haircut → 401(k) with `EARLY_401K_WITHDRAWAL` warning if 401(k) used outside job loss module).

**Reference amounts:** `B_PREPAY_25` → **$25,000**; deployable fractions unchanged.

**Tier P0 profiles** (US IDs mirror IN):

| Profile ID | IN analogue |
|------------|-------------|
| `GAME_US_BL_SIM_FEE` | `GAME_BL_SIM_FEE` |
| `GAME_US_BL_SEQ_L_FEE` | `GAME_BL_SEQ_L_FEE` |
| `GAME_US_BH_SIM_SPLIT` | `GAME_BH_SIM_SPLIT` |
| `GAME_US_BH_COOP_PARETO` | `GAME_BH_COOP_PARETO` |
| `GAME_US_BN_SEQ_N_JL` | `GAME_BN_SEQ_N_UE` |
| `GAME_US_BN_SIM_JL_TIMING` | `GAME_BN_SIM_UE_TIMING` |

Payoff metrics use `_usd` fields. Collapsed cell counts match IN §4.13.8.

**Tier P2 — research / non-shipping:** See IN §4.13.8 Tier P2 and [`2026-07-other-planner-areas.md`](research/2026-07-other-planner-areas.md) §4–§5. When promoted:

| Profile ID | Product note |
|------------|--------------|
| `GAME_FLOATING_N` | Deterministic rate paths only (`N_RATE_PATH_{UP,FLAT,DOWN}`); no Monte Carlo |
| `GAME_MULTI_CREDITOR` | Max **2 loans** in v1 promotion; reuse debt avalanche oracle |
| `GAME_REPEATED_LENDER` | Document only until P0 ships |

---

## 5. Non-Functional Requirements

Same as IN §5. UI `en-US` number formatting. Accessibility and validation unchanged.

---

## 6. Data Models (TypeScript sketch)

```ts
type Locale = "IN" | "US";

type PrepaymentPolicy =
  | "recompute_tenure_keep_payment"
  | "recompute_payment_keep_tenure";

type K401TrancheDestination = "loan_prepay" | "cash_buffer" | "split";

interface K401JobLossConfig {
  enabled: boolean;
  start_month: number;
  k401_corpus_start_usd: number;
  vested_fraction_pct: number;
  early_withdrawal_tax_withholding_pct: number;
  tranche1: { month: number; pct: 0.5; destination: K401TrancheDestination; loan_fraction?: number };
  tranche2: { month: number; pct: 0.5; destination: K401TrancheDestination; loan_fraction?: number };
}

interface UsScenario extends Omit<Scenario, "pf_unemployment"> {
  k401_job_loss?: K401JobLossConfig;
  // all monetary fields use *_usd
}
```

Shared amortisation row shape mirrors IN `AmortRow` with `_usd` suffixes.

---

## 7. Algorithm Notes

### 7.1–7.2

Same as IN §7.1–§7.2.

### 7.3 401(k) job-loss tranche months

Identical indexing to IN §7.3: `U=1` → tranche2 at month `12`. Unit test required.

### 7.4 Early withdrawal net cash

Apply penalty and withholding only to cash-bound portion of each tranche; report gross penalty in `events[]`.

---

## 8. UI Specification

### Locale selector

- Header or settings: **Country / locale** toggle `India (INR)` | `United States (USD)`.  
- Persist in `localStorage` key `financial-planner-locale`.  
- Switching locale resets form defaults to US§15 / IN §15 reference values respectively (confirm dialog).

### Screens (US)

Same five tabs as current app: Loan, Multi-debt, Retirement, Strategies, Strategic — all USD-labelled.

### Deploy metadata

Same footer behaviour as IN §8.

### Comparison table columns

Scenario name; Payoff month; Total interest; Δ interest vs BASE; Total outflows; Min cash balance; Early 401(k) penalties (if any); Notes/warnings.

---

## 9. Edge Cases & Warnings

All IN §9 cases plus:

- 401(k) withdrawal exceeding vested balance → error.  
- Brokerage haircut → show effective liquidation value.  
- Job loss with no cash, no UI, payment > 0 → `MORTGAGE_DEFAULT_RISK`.  
- Using 401(k) for prepay while employed → warn `EARLY_401K_WITHDRAWAL`.

---

## 10. Testing / Acceptance Criteria

### Unit tests (required)

1. **Mortgage payment** matches reference: `P=400_000`, `annual=6.5`, `n=360` within **$0.01** after rounding.  
2. **Prepay $50,000 month 1 + keep payment:** payoff month materially less than baseline (document reference in test).  
3. **Prepay $50,000 month 1 + keep tenure:** new payment ~ half baseline within **$1**.  
4. **401(k) job loss:** for `K0=100_000`, verify gross inflows **50,000** then **50,000** on months `U` and `U+11`; cash-bound tranche net **$27,200** each at 10% penalty + 22% withholding ($40k gross).  
5. **Cashflow shortfall** fixture flags warning.  
6. **Monthly inflow** shortens payoff vs BASE.  
6b. **BASE vs salary sweep:** reference mortgage (US§15) with `monthly_salary_usd=10_000` and `monthly_cash_to_loan_usd=0` — `BASE` payoff month = **360**; `BASE_PLUS_SALARY_SWEEP` payoff month materially less than baseline (document reference in test).  
7. **Employer match:** $120k salary, $1k deferral, 50%/6% → **$300/mo** match.  
8. **Debt avalanche** total interest ≤ snowball for reference debts.  
9. **Retirement:** contribution monotonicity and conservative ≤ optimistic funded ratio.  
10. **Strategy equity blend:** 40/60 deployable split on US§15 inputs.  
11. **Nine US strategy goldens** under `src/test/fixtures/strategy-us/`.  
12. **`GAME_US_BL_SIM_FEE`:** 10 collapsed cells; oracle purity — no duplicate EMI math in `src/lib/game/`.  
13. **Locale switch:** IN golden unchanged when `locale=IN`; US fixtures pass when `locale=US`.  
14. **PMI cashflow:** with `pmi_monthly_usd=200`, `pmi_active=true`, job-loss cashflow reduces `min_cash_balance` by ~$200 × months vs same fixture without PMI.  
15. **HSA premium draw:** job-loss fixture with `hsa_balance_usd=500`, `monthly_health_premium_usd=400` → HSA event `400` from HSA, cash unchanged for premium portion; remainder from cash when premium &gt; balance.  
16. **`employment_type=self_employed`:** employer match computes to **$0** regardless of salary/deferral inputs.

### Golden files

`src/test/fixtures/goldens-us/`: `BASE`, `PREPAY_CASH_50K_TENURE`, `JL_401K_TO_LOAN`.

---

## 11. Non-Goals (US v1)

- IRS hardship withdrawal eligibility determination or plan-document compliance.  
- State income tax, NIIT, or AMT modeling.  
- Roth vs Traditional tax arbitrage (single 401(k) bucket only).  
- SSA PIA calculation engine (user enters expected benefit).  
- 529, ESPP, stock options.  
- Chapter 7/13 bankruptcy outcomes.  
- Floating-rate ARM **stochastic** simulation (deterministic stress paths only — see Tier P2 research).  
- Multi-loan creditor games until promoted from IN §4.13 Tier P2.  
- SECURE 2.0 $1,000 emergency withdrawal engine (v1.1).  
- 401(k) loan as prepay funding source (v1.2).  
- State-by-state unemployment insurance tables (user enters `monthly_uib_usd` in v1).  
- **UK / Canada / other country locales** (desk research in [`2026-07-other-planner-areas.md`](research/2026-07-other-planner-areas.md) §3).  
- **Wash-sale** / lot-level capital gains tracking (flat `ltcg_rate_pct` only).  
- **Auto PMI cancellation** at 78% LTV (user flat `pmi_monthly_usd` or manual toggle in v1.1).  
- **Property tax / escrow** modeling.

**In scope (v1.1–v1.2):** optional flat PMI (§4.1); HSA premium bridge in job-loss cashflow (§4.2 / §4.8); `employment_type` preset (§3). **Mortgage prepayment fee default $0** (QM primary loans rarely have penalties per HMDA desk research).

---

## 12. Suggested Tech (non-binding)

- Locale-aware money helpers: `roundUsd`, `formatUsd` parallel to `roundInr` / `formatInr`.  
- Zod discriminated union on `locale` for form schemas.  
- Feature flags: ship locale selector behind `VITE_ENABLE_US_LOCALE` until US goldens pass CI.

---

## 13. Open Questions

1. Include Roth IRA as separate bucket in v1.1? → **Likely yes** (research §3.2 Option C).  
2. Model 401(k) loan as prepay funding source? → **v1.2** (research §3.2 Option D).  
3. Default job-loss tranche split: liquidity-first auto-default like IN? → **Yes for `JL_401K_BRIDGE` preset**; user chooses otherwise.  
4. Show itemized penalty + withholding in schedule rows vs summary only? → **Both**: `events[]` per month + summary KPIs.

**Resolved:** IN §4.10–§4.11 promoted to [`SPEC.md`](SPEC.md) (symmetry). UK/CA locales deferred per [`2026-07-other-planner-areas.md`](research/2026-07-other-planner-areas.md).

---

## 14. Legal / Product Disclaimer (US footer variant)

“This calculator is for educational planning only. 401(k) distribution rules, tax withholding, mortgage prepayment charges, and unemployment benefits vary by plan, state, and lender. Verify with your plan administrator, the IRS, SSA, and a qualified financial adviser.”

---

## 15. Reference Scenario (US QA)

- Principal: **$400,000**  
- Rate: **6.5%** p.a. fixed  
- Tenure: **360** months  
- Assets: cash **$50,000**, 401(k) vested **$80,000**, brokerage **$30,000**  
- Salary **$120,000**; deferral **$1,000**/mo; employer match **50%** up to **6%** salary  
- Job loss 401(k) rule: **50% month 1**, **50% month 12** of unemployment window  
- Early withdrawal: **10%** penalty, **22%** withholding on cash-bound amounts  
- `prepayment_fee_usd`: **0** (default for conforming primary mortgage)  
- `expected_social_security_monthly_usd` UI placeholder: **$2,000**  

### 15.1 Strategy golden matrix

Regenerate: `npm run goldens:update:us`.  
Paths: `src/test/fixtures/strategy-us/tier_{a,b,c}_{equity_blend,prepay_heavy,aggressive_prepay}.json`.

### 15.2 Game profile golden matrix

`src/test/fixtures/game-us/{profile_id}.json` when US§4.13 P0 ships.

---

## 16. Implementation map (IN → US)

| Work package | Primary files (expected) |
|--------------|--------------------------|
| Locale + money | `src/lib/money.ts`, `src/lib/formatUsd.ts`, `App.tsx` |
| 401(k) job loss | `src/lib/loan/k401.ts`, `cashflow.ts` (locale branch) |
| US forms | `src/features/loan/`, hooks with locale |
| Strategy US | `src/lib/strategy/` locale params |
| Game US | `src/lib/game/` profile IDs |
| Tests / goldens | `src/test/fixtures/goldens-us/`, `strategy-us/` |

---

**End of US specification**

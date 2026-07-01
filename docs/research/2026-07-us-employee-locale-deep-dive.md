# US employee locale — deep-dive research (all topics)

**Date:** 2026-07-01  
**Parent spike:** [`2026-07-us-employee-benefits-mapping.md`](2026-07-us-employee-benefits-mapping.md)  
**Product spec:** [`../SPEC-US.md`](../SPEC-US.md) v1.1  
**Status:** Desk research complete; not legal/tax advice

---

## How to read this document

Each section follows: **Real world → Product implication → Options → Recommendation → Numeric example → Sources**.

---

# Topic 1 — 401(k) access on job loss

## 1.1 Real world

### Penalty framework

- Withdrawals before **59½** from qualified plans generally incur **10% additional tax** on the taxable portion ([IRS Topic 558](https://www.irs.gov/taxtopics/tc558)).
- **Ordinary income tax** applies to pre-tax amounts regardless of penalty.
- **Job loss is not** a standalone exception for 401(k) plans.

### Hardship withdrawals

Plans *may* allow hardship distributions; employers are not required to offer them ([IRS hardship FAQs](https://www.irs.gov/retirement-plans/retirement-plans-faqs-regarding-hardship-distributions)).

Qualifying needs (plan may subset):

| IRS category | Example |
|--------------|---------|
| Medical | Deductible medical for employee/spouse/dependents |
| Principal residence | Purchase (not routine mortgage P&I) |
| Foreclosure/eviction prevention | Payments to avoid losing home |
| Tuition | Next 12 months postsecondary |
| Funeral | Employee/spouse/children/dependents |
| Casualty | Repair principal residence |
| FEMA disaster | Declared disaster area |

**Critical:** Hardship eligibility ≠ penalty exemption. TurboTax and Fidelity both note hardship withdrawals before 59½ typically still owe **10% penalty** unless a separate exception applies.

**Job loss bridge:** Foreclosure/eviction hardship could apply if the user is at risk of losing the home — but amount is limited to need, not “50% of balance,” and plan must permit it.

### Listed penalty exceptions (401(k), partial list)

| Exception | Relevance to job-loss planner |
|-----------|------------------------------|
| Separation at **55+** (Rule of 55) | Layoff at 55+ → penalty-free from *that employer’s plan* |
| **72(t) SEPP** | Fixed payments 5 years or until 59½ |
| Disability / death | Edge cases |
| Medical >7.5% AGI | Specific bills |
| SEPP, Rule of 55 | See Topics 1.2–1.3 |

### IRA contrast (why US ≠ simple)

IRA allows penalty-free withdrawals for **health insurance premiums** after 12 weeks of unemployment ([Investopedia](https://www.investopedia.com/articles/insights/073116/how-401k-withdrawals-work-when-youre-unemployed.asp)). **401(k) does not.** Product should not silently apply IRA rules to 401(k).

## 1.2 Rule of 55 (deep dive)

**Requirements (all must hold):**

1. Separate from service with the **plan sponsor** (layoff, quit, retire, termination — not part-time continuation).
2. Separation occurs in or after the **calendar year** you turn **55** (50 for qualified public safety).
3. Withdraw from **that employer’s 401(k)/403(b)** — not old employer plans, not IRAs.
4. **Rolling to IRA destroys** Rule of 55 for those dollars ([IRS plan sponsor guide](https://www.irs.gov/retirement-plans/plan-sponsor/401k-resource-guide-plan-sponsors-general-distribution-rules)).

| Account | Rule of 55? |
|---------|-------------|
| Current employer plan after qualifying separation | Yes |
| Old employer 401(k) | No (unless rolled into current plan before separation — advanced) |
| IRA / rollover IRA | No |
| Still employed | No |

**Tax:** Penalty waived; **ordinary income tax still applies** on pre-tax portions.

**Product v1.1:** `rule_of_55_eligible: boolean` + `separation_age` — if true, set `early_withdrawal_penalty_pct = 0` for distributions from job-loss module only.

## 1.3 72(t) SEPP (deep dive)

**Mechanics ([IRS SEPP FAQ](https://www.irs.gov/retirement-plans/substantially-equal-periodic-payments)):**

- Three IRS methods: **RMD**, **fixed amortization**, **fixed annuitization**.
- Payments must continue for **longer of 5 years or until 59½**.
- **Modification** before period ends → retroactive 10% penalty on all prior SEPP distributions.
- From **401(k):** requires **separation from service** first.
- Many practitioners roll to IRA first for administrative control ([UngrindFi guide](https://ungrindfi.com/guides/72t-sepp-early-retirement)).

**Age lock-in examples:**

| Start age | Lock-in ends |
|-----------|--------------|
| 45 | Age 59½ (14.5 years) |
| 50 | Age 59½ (9.5 years) |
| 55 | 5 years (to age 60) |

**Product fit:** Poor match for lump-sum mortgage prepay stress tests. **Defer** to v2 “income bridge” mode; do not conflate with IN staged tranches.

## 1.4 SECURE 2.0 emergency $1,000 (deep dive)

Effective **2024+** ([Vanguard SECURE 2.0 PDF](https://workplace.vanguard.com/content/dam/inst/iig-transformation/secure20/SCRACT_BRO_ExpenseWithdrawal_V10_Accessible.pdf)):

| Rule | Detail |
|------|--------|
| Max | Lesser of **$1,000** or (vested balance − $1,000) |
| Penalty | **None** (if plan adopts or taxpayer claims on return) |
| Income tax | **Still owed** on pre-tax portion |
| Frequency | Once per calendar year |
| 3-year rule | No repeat until prior distribution repaid or offset by new contributions |
| Withholding | 10% voluntary (not 20% rollover withholding) |
| Certification | Self-certification allowed |

**Product v1.1:** Optional `JL_SECURE2_1K` scenario — adds $1k penalty-free month-1 inflow; income tax at `marginal_tax_rate_pct`.

## 1.5 Product model (SPEC-US §4.7)

**Chosen:** Staged 50%/50% gross tranches at months `U` and `U+11`, with 10% penalty + 22% withholding on cash-bound amounts.

| Dimension | IN (EPFO fiction) | US (product fiction) |
|-----------|-------------------|----------------------|
| Tranche 1 | 75% PF0 | 50% K0 |
| Tranche 2 | 25% PF0 | 50% K0 |
| Penalty | None in model | 10% + withholding |
| Legal basis | User-specified EPFO-style | User-specified stress |

### Numeric examples

**US§15:** `K0 = $80,000`, both tranches to cash:

| Tranche | Gross | Penalty | Withholding | Net |
|---------|-------|---------|-------------|-----|
| M1 | $40,000 | $4,000 | $8,800 | $27,200 |
| M12 | $40,000 | $4,000 | $8,800 | $27,200 |
| **Total** | $80,000 | $8,000 | $17,600 | **$54,400** |

**Compare IN:** `PF0 = ₹25,00,000` → ₹18,75,000 + ₹6,25,000, no penalty in model.

**JL_401K_TO_LOAN:** $40k gross prepay each tranche; economic cost KPI shows $12,800/tranche in penalty+withholding “tax drag” even when gross hits loan.

## 1.6 Recommendation

| Priority | Feature |
|----------|---------|
| v1 | Staged bridge + disclaimers |
| v1.1 | Rule of 55 toggle; SECURE 2.0 $1k overlay |
| v1.2 | 401(k) loan path |
| v2 | Hardship-gated partial withdrawal (foreclosure need capped) |

---

# Topic 2 — 401(k) loans

## 2.1 Real world ([IRS loan topics](https://www.irs.gov/retirement-plans/plan-participant-employee/retirement-topics-loans))

| Rule | Value |
|------|-------|
| Maximum | **50%** of vested balance or **$50,000**, whichever is less |
| Small balance | If 50% < $10k, some plans allow up to **$10k** |
| Term | **5 years** standard; longer for primary residence |
| Payments | At least quarterly; principal + interest |
| Job termination | Outstanding balance often **due immediately**; unpaid → deemed distribution (tax + possible 10%) |
| Double taxation | Repay with after-tax dollars; taxed again on withdrawal in retirement |

## 2.2 vs withdrawal for mortgage prepay

| Path | Pros | Cons |
|------|------|------|
| Loan | No penalty if repaid; no immediate tax event | Must repay while unemployed; default on job loss |
| Withdrawal | Cash immediately | Penalty + tax; irreversible |

**Stress-test insight:** A user modeling job loss who borrows pre-layoff may face **loan acceleration** at separation — often worse than staged withdrawal fiction.

## 2.3 Product recommendation

**v1.2:** Add `k401_loan_usd` input (capped at `min(50% vested, 50_000)`):

- While employed: loan proceeds → prepay funding source (no penalty).
- On `job_loss_start_month`: if `loan_balance > 0`, trigger `LOAN_OFFSET_DISTRIBUTION` — taxable + 10% on outstanding (simplified).

Do **not** model loan in v1 — adds cashflow coupling the IN locale does not have.

---

# Topic 3 — Vesting and employer match

## 3.1 Vesting schedules ([IRS Issue Snapshot](https://www.irs.gov/retirement-plans/issue-snapshot-vesting-schedules-for-matching-contributions))

**Employee deferrals:** Always **100% vested**.

**Employer match:** Federal maximum schedules:

### 3-year cliff

| Years of service | Vested % |
|------------------|----------|
| 0–2 | 0% |
| 3+ | 100% |

### 6-year graded

| Years | Vested % |
|-------|----------|
| <2 | 0% |
| 2 | 20% |
| 3 | 40% |
| 4 | 60% |
| 5 | 80% |
| 6+ | 100% |

Many employers vest faster (immediate, 1-year cliff, etc.).

## 3.2 Match formulas (desk research)

| Formula | Effective employer % (if maxed) | Prevalence |
|---------|--------------------------------|------------|
| **50% of first 6%** | 3% of salary | Most common (Vanguard HAS) |
| 100% of first 3% + 50% of next 2% | 4% of salary | Common (Fidelity) |
| 100% of first 4% | 4% of salary | Common |
| Dollar-for-dollar to 6% | 6% of salary | Generous tech/finance |

**Average employer contribution:** ~**4.5–5%** of salary when including non-elective ([Wealthvieu 2026](https://wealthvieu.com/retirement/401k/average-401k-employer-match/)).

## 3.3 Contribution limits (projection caps)

| Limit | 2025 | 2026 |
|-------|------|------|
| Employee deferral | $23,500 | $24,500 |
| Catch-up (50+) | $7,500 | $8,000 |
| Super catch-up (60–63) | $11,250 | $11,250 |
| Annual additions (emp+emp) | $70,000 | $72,000 |

**Product:** Warn `DEFERRAL_EXCEEDS_IRS_LIMIT` if `monthly_401k_deferral_usd × 12` > limit (user override for simplicity).

## 3.4 Product fields

```text
vested_fraction_pct          — manual override (default 100)
years_of_service             — v1.1: auto-compute from cliff/graded enum
employer_match_rate_pct      — default 50
employer_match_cap_pct       — default 6
```

**Worked example (US§15):**

```text
Salary $120,000/yr → cap_monthly = $600
Deferral $1,000/mo → eligible = $600
Match = $600 × 50% = $300/mo = $3,600/yr
```

If 6-year graded, 4 years service → 60% vested on employer match portion only.

## 3.5 Recommendation

- v1: `vested_fraction_pct` manual + match formula (SPEC-US §4.2).
- v1.1: `vesting_schedule: immediate | cliff_3 | graded_6` + `years_of_service`.

---

# Topic 4 — Unemployment insurance (cashflow)

## 4.1 Duration by state ([CBPP 2025](https://www.cbpp.org/research/economy/how-many-weeks-of-unemployment-compensation-are-available))

| Bucket | Weeks | Example states |
|--------|-------|----------------|
| 26 (norm) | 26 | CA, NY, TX, PA, OH |
| Short | 12–16 | FL 12, NC 12, AL 14, AR 16 |
| Mid | 20–24 | MO 20, ID 21, MT 24 |
| Long | 28–30 | MA up to 30 (variable); MT 28 |

**National average duration received** is shorter than maximum — claimants exhaust or find work.

## 4.2 Benefit amount

**Replacement rate:** UI replaces ~**40–45%** of prior weekly wages nationally ([Minneapolis Fed 2025](https://www.minneapolisfed.org/article/2025/how-unemployment-insurance-access-and-benefits-vary-by-state)); range ~**31% (AK) to 67% (HI)** ([St. Louis Fed](https://www.stlouisfed.org/on-the-economy/2026/mar/unemployment-insurance-eligibility-replacement-takeup-rates-us)).

**Weekly max examples (2025):**

| State | Approx max weekly |
|-------|-------------------|
| MS | ~$235 |
| FL | ~$275 |
| CA | ~$450 |
| MA | ~$1,051 |

**Recipiency:** Only ~**29%** of unemployed received UI in 2023 (many ineligible: quit, fired for cause, expired) ([Minneapolis Fed](https://www.minneapolisfed.org/article/2025/how-unemployment-insurance-access-and-benefits-vary-by-state)).

## 4.3 Product modeling

**v1 (SPEC-US §4.8):**

| Field | Default | Notes |
|-------|---------|-------|
| `monthly_uib_usd` | 0 | User enters |
| UI hint | $1,800/mo | ≈ $450/wk × 4; ~43% of $4,200/mo prior wage |

**v1.1 optional:**

```text
prior_monthly_wage_usd
ui_replacement_pct        — default 43
ui_max_weeks              — default 26
ui_weekly_cap_usd         — optional
→ monthly_uib = min(cap, wage × 12/52 × replacement_pct) × 52/12
```

**Cashflow timeline:**

```text
Months 1–26:  cash += monthly_uib_usd
Month 27+:    cash += 0 (unless other income)
```

Aligns with IN §4.8 `monthly_income_inr` pattern.

## 4.4 Recommendation

Do **not** ship 50-state tables in v1 (maintenance burden, still wrong for individual). Link to [USDOL replacement rate tool](https://www.dol.gov/) in UI help.

---

# Topic 5 — Mortgage prepayment

## 5.1 Prepayment penalties ([Homebuyer.com HMDA](https://homebuyer.com/learn/prepayment-penalty))

| Loan type | % with penalty (2024) |
|-----------|----------------------|
| Conventional | 0.32% |
| FHA | 0.10% |
| VA | 0.09% |

**QM rule (post-2014):** If penalty exists, max **2%** yr1–2, **1%** yr3, none after ([Bankrate](https://www.bankrate.com/mortgages/prepayment-penalty/)).

**Investment/DSCR:** Step-down 5-4-3-2-1 common.

## 5.2 Extra principal mechanics ([CFPB](https://www.consumerfinance.gov/ask-cfpb/can-i-be-charged-a-penalty-for-paying-off-my-mortgage-early-en-204/), [Chase](https://www.chase.com/personal/mortgage/education/financing-a-home/how-to-pay-down-your-principal))

- Extra payments must be **designated principal-only** or lender may apply to future interest.
- Biweekly = **13 monthly payments/year** — accelerates payoff.
- Small extra payments each month reduce interest (same math as IN §4.5).

## 5.3 Product alignment with IN

| IN | US | Shared engine |
|----|-----|---------------|
| EMI | Mortgage P&I | `emi()` |
| `recompute_tenure_keep_emi` | `recompute_tenure_keep_payment` | Same |
| `prepayment_fee_inr` | `prepayment_fee_usd` | Same hook |
| ₹25L prepay reference | $50k prepay reference | Scaled QA |

**Default `prepayment_fee_usd = 0`** — research-backed for primary conforming loans.

## 5.4 PMI / escrow (out of scope)

PMI drops at 78–80% LTV; escrow for taxes/insurance — **§11 non-goal** unless spec revision.

---

# Topic 6 — Brokerage sleeve and capital gains

## 6.1 LT capital gains brackets (2025, [IRS Topic 409](https://www.irs.gov/taxtopics/tc409))

**Single filer:**

| Taxable income (LT gains portion) | Rate |
|-----------------------------------|------|
| $0 – $48,350 | 0% |
| $48,351 – $533,400 | 15% |
| > $533,400 | 20% |

**Married filing jointly:** 0% to $96,700; 15% to $600,050; 20% above.

**NIIT:** +3.8% on investment income above thresholds — defer.

## 6.2 Short-term vs long-term

| Holding | Tax treatment |
|---------|---------------|
| ≤ 1 year | Ordinary income rates (10–37%) |
| > 1 year | LTCG schedule |

**Product v1:** Assume all brokerage gains are **long-term** at user `ltcg_rate_pct` (default 15%). Warn `TAX_SIMPLIFIED`.

## 6.3 Compare IN §4.12

| IN | US |
|----|-----|
| LTCG 12.5% on gain | `ltcg_rate_pct` on gain |
| ₹1.25L exemption | No exemption floor v1 |
| Equity SIP in INR | Brokerage SIP in USD |

**Post-tax formula (both):**

```text
gain = max(0, corpus_at_horizon − contributions)
tax = gain × rate   // US: no exemption subtract
post_tax = corpus − tax
```

## 6.4 Wash sales, lot selection

**Non-goal.** User-entered rate is sufficient for educational planner.

---

# Topic 7 — Social Security

## 7.1 Average benefits ([SSA Oct 2025 snapshot](https://www.ssa.gov/policy/docs/quickfacts/stat_snapshot/2025-10.html))

| Metric | ~Amount |
|--------|---------|
| Retired worker avg | **$2,012/mo** |
| All OASI | $1,923/mo |
| Range | ~$900 – $5,108/mo (age 70 max 2025) |

## 7.2 PIA calculation (if we ever build engine)

**Steps:**

1. **AIME:** Average indexed monthly earnings over **35 highest years** (wage base capped — $176,100 in 2025).
2. **Bend points (2025 eligibility):** $1,226 and $7,391 ([SSA bend points](https://www.ssa.gov/OACT/COLA/bendpoints.html)).
3. **PIA formula:**
   - 90% × first $1,226 of AIME
   - 32% × AIME from $1,226 to $7,391
   - 15% × AIME above $7,391
4. **Claiming age adjustment:**
   - Age 62: ~70% of PIA (permanent reduction)
   - Age 67 (FRA for 1960+): 100%
   - Age 70: ~124% of PIA

**Example** ($65k/yr career → AIME ~$5,416):

```text
PIA = 0.90×1226 + 0.32×(5416−1226) = $2,444/mo at FRA
Age 62: ~$1,710/mo
Age 70: ~$3,030/mo
```

## 7.3 Product recommendation

| Version | Approach |
|---------|----------|
| v1 | User `expected_social_security_monthly_usd`; placeholder $2,000 |
| v1.1 | `ss_adjusted_funded_ratio` KPI |
| v2 | Optional rough PIA from `annual_salary_usd` + `years_worked` (wide error bars) |

**Do not** promise SSA accuracy — link to [ssa.gov/myaccount](https://www.ssa.gov/myaccount/).

---

# Topic 8 — Roth vs Traditional (v1.1)

## 8.1 Traditional 401(k)

- Pre-tax deferral → fully taxable on distribution.
- Early withdrawal: 10% penalty + ordinary tax (unless exception).

## 8.2 Roth 401(k) ([Investopedia](https://www.investopedia.com/ask/answers/101314/what-are-roth-401k-withdrawal-rules.asp))

- Contributions after-tax.
- Qualified withdrawal: age **59½** + **5-year** account age → tax-free.
- Early withdrawal: **pro-rata** — cannot take contributions first (unlike Roth IRA).
- Earnings portion: tax + 10% penalty.

## 8.3 Product split (v1.1 recommendation)

| Field | Purpose |
|-------|---------|
| `k401_traditional_usd` | Pre-tax balance |
| `k401_roth_usd` | Roth balance |
| `k401_roth_contribution_basis_usd` | For pro-rata on early withdrawal |

Penalty engine:

```text
traditional_early = gross × (penalty + withholding)
roth_early_pro_rata = gross × (earnings_ratio) × (penalty + tax)
```

**v1:** Single bucket — acceptable simplification per research.

---

# Topic 9 — Multi-debt planner

## 9.1 Avalanche vs snowball

| Strategy | Optimizes | Psychology |
|----------|-----------|------------|
| Avalanche | Min total interest (highest APR first) | Mathematically optimal |
| Snowball | Smallest balance first | Quick wins |

**Product:** Same as IN — already implemented in `src/lib/debt/`. US locale = USD fields only.

## 9.2 US-specific debt types (labels only)

| Type | Typical APR range | Notes |
|------|-------------------|-------|
| Credit card | 18–29% | Variable |
| Auto loan | 5–12% | Fixed |
| Student loan | 4–8% | Federal vs private |
| Personal loan | 8–15% | |
| 401(k) loan | ~prime +1% | Not in v1 |

No algorithm change — user enters APR and minimums.

---

# Topic 10 — Retirement corpus projection

## 10.1 Shared engine

`projectRetirementCorpus` — monthly compounding, annual inflation on expense target, SWR for target corpus. **Identical math** to IN; cents vs paise rounding.

## 10.2 US-specific inputs

| Input | IN | US |
|-------|-----|-----|
| Corpus | `current_corpus_inr` | `current_corpus_usd` |
| SS | N/A | `expected_social_security_monthly_usd` |
| Contribution limit | N/A | Optional IRS cap warning |

## 10.3 Scenario deltas (conservative/optimistic)

Same as IN: ±2% return, ±1% inflation, +20% contribution on optimistic.

---

# Topic 11 — Repayment strategy planner (§4.12)

## 11.1 Asset mapping

| IN sleeve | US sleeve |
|-----------|-----------|
| PF projection | 401(k) projection |
| Equity SIP | Brokerage SIP |
| Emergency buffer | Same logic, USD thresholds |
| `BELOW_SUBSISTENCE` ₹15k | **$2,000/mo** |

## 11.2 Tier presets rationale

| Tier | Take-home/mo | Rough profile |
|------|--------------|---------------|
| A | $18,000 | Senior tech/finance dual income |
| B | $12,000 | Mid-career professional |
| C | $8,000 | Early career / single income |

IN tiers (₹300k/200k/100k) are ~similar percentile intent.

## 11.3 Post-loan redirect

Same assumption as IN §4.12: `payment0 + monthly_extra` → brokerage sleeve until horizon. **Learning note:** real users should refill emergency fund first ([LEARNINGS.md](../LEARNINGS.md)).

---

# Topic 12 — Game theory (§4.13)

## 12.1 Action mapping

| IN | US |
|----|-----|
| `N_PF_LOAN` | `N_401K_LOAN` |
| `N_PF_BRIDGE` | `N_401K_BRIDGE` |
| `B_PREPAY_25` (₹25L) | `B_PREPAY_25` ($25k) |
| `B_FUND_MIX` (cash/gold/PF) | `B_FUND_MIX` (cash/brokerage/401k) |

## 12.2 Payoff differences

US matrix should include **penalty/withholding columns** when 401(k) routes active — lender fee profiles unchanged.

## 12.3 Oracle purity

Unchanged: `src/lib/game/` calls locale-aware cashflow helpers, no duplicate EMI.

---

# Topic 13 — Locale architecture

## 13.1 Money layer

```ts
type Locale = "IN" | "US";

function roundMoney(amount: number, locale: Locale): number {
  return locale === "US" ? roundUsd(amount) : roundInr(amount);
}
```

**USD:** 2 decimal places (cents). **INR:** integer paise policy per existing `roundInr`.

## 13.2 Module fork map

| Module | Shared | Locale-specific |
|--------|--------|-----------------|
| `emi.ts` | ✓ | labels only |
| `amortisation.ts` | ✓ | `roundMoney` inject |
| `pf.ts` / `k401.ts` | | separate |
| `cashflow.ts` | partial | unemployment bridge |
| `strategy/projection.ts` | `projectEquity*` | `projectPf*` / `projectK401*` |
| `debt/` | ✓ | field names |
| `retirement/` | ✓ | SS field |
| `game/` | profiles | `GAME_US_*` IDs |

## 13.3 Golden fixture trees

```text
src/test/fixtures/goldens/        — IN (existing)
src/test/fixtures/goldens-us/     — US loan scenarios
src/test/fixtures/strategy-us/    — 9 strategy goldens
src/test/fixtures/game-us/        — P0 game profiles
```

## 13.4 Feature flag

`VITE_ENABLE_US_LOCALE=true` until US goldens pass CI.

---

# Topic 14 — UI copy and disclaimers

| Surface | Required text |
|---------|---------------|
| Job loss toggle | “Educational stress scenario — not IRS hardship or plan rules.” |
| 401(k) tranche table | “10% federal penalty and estimated withholding shown for illustration.” |
| UI field | “Benefits vary by state — enter your estimate.” |
| SS field | “For a personal estimate, use ssa.gov/myaccount.” |
| Brokerage tax | “Assumes long-term gains at your selected rate.” |
| Locale switch | “Switching country resets inputs to reference defaults.” |

---

# Topic 15 — Consolidated spec deltas

Apply to [`SPEC-US.md`](../SPEC-US.md):

1. **§4.2** — Add `vesting_schedule` + `years_of_service` as v1.1 fields (document in §13).
2. **§4.7.1** — Cross-link this deep-dive.
3. **§4.8** — Document v1.1 `ui_replacement_pct` derived UIB helper.
4. **§4.11** — Optional rough PIA as v2 non-goal reinforcement.
5. **§10** — Add vesting graded fixture; SECURE 2.0 $1k test (v1.1).
6. **§11** — Explicit: 50-state UI tables, PIA engine, PMI, wash sales.
7. **§16** — Add `src/lib/loan/k401.ts` vesting helpers.

---

# Topic 16 — Source bibliography

| # | Topic | URL |
|---|-------|-----|
| 1 | Early withdrawal penalty | https://www.irs.gov/taxtopics/tc558 |
| 2 | Hardship FAQs | https://www.irs.gov/retirement-plans/retirement-plans-faqs-regarding-hardship-distributions |
| 3 | Rule of 55 | https://www.irs.gov/retirement-plans/plan-sponsor/401k-resource-guide-plan-sponsors-general-distribution-rules |
| 4 | SEPP / 72(t) | https://www.irs.gov/retirement-plans/substantially-equal-periodic-payments |
| 5 | SECURE 2.0 emergency | https://workplace.vanguard.com/content/dam/inst/iig-transformation/secure20/SCRACT_BRO_ExpenseWithdrawal_V10_Accessible.pdf |
| 6 | 401(k) loans | https://www.irs.gov/retirement-plans/plan-participant-employee/retirement-topics-loans |
| 7 | Vesting | https://www.irs.gov/retirement-plans/issue-snapshot-vesting-schedules-for-matching-contributions |
| 8 | UI duration | https://www.cbpp.org/research/economy/how-many-weeks-of-unemployment-compensation-are-available |
| 9 | UI replacement | https://www.minneapolisfed.org/article/2025/how-unemployment-insurance-access-and-benefits-vary-by-state |
| 10 | Mortgage prepay | https://www.consumerfinance.gov/ask-cfpb/can-i-be-charged-a-penalty-for-paying-off-my-mortgage-early-en-204/ |
| 11 | HMDA penalties | https://homebuyer.com/learn/prepayment-penalty |
| 12 | LTCG | https://www.irs.gov/taxtopics/tc409 |
| 13 | SSA bend points | https://www.ssa.gov/OACT/COLA/bendpoints.html |
| 14 | SSA snapshot | https://www.ssa.gov/policy/docs/quickfacts/stat_snapshot/2025-10.html |
| 15 | 401(k) limits | https://www.irs.gov/retirement-plans/plan-participant-employee/retirement-topics-401k-and-profit-sharing-plan-contribution-limits |
| 16 | Roth 401(k) | https://www.investopedia.com/ask/answers/101314/what-are-roth-401k-withdrawal-rules.asp |
| 17 | Employer match | https://www.uschamber.com/co/run/human-resources/401k-company-match-plan |

---

**End of deep-dive**

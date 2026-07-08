# UK employee locale — research spike

**Date:** 2026-07-07  
**Status:** Recommendation accepted — feeds [`docs/SPEC-UK.md`](../SPEC-UK.md)  
**Supersedes:** the "defer UK locale" call in [`2026-07-other-planner-areas.md`](2026-07-other-planner-areas.md) §3.1 (user has now requested UK specs); its architecture guidance (no pension-tranche fiction, ISA bridge, SMI note, GBP formatting) is **retained**.  
**Question:** How should FinancialPlanner model UK employee finances so the UK locale delivers the same planner surfaces as India (IN) and the US, while staying honest about UK pension-access law?  
**Constraints:** SPEC §11 / SPEC-US §11 non-goals; offline-first; no legal/tax/benefits advice; mirror existing tabs without duplicating solver cores; **do not clone the EPFO 75/25 or 401(k) 50/50 tranche UX** — UK pensions are legally inaccessible before normal minimum pension age.

**Related:** [`docs/SPEC-UK.md`](../SPEC-UK.md) · [`docs/SPEC-US.md`](../SPEC-US.md) · [`docs/SPEC.md`](../SPEC.md)

---

## 1. Executive summary

| Area | Real-world UK behaviour | Recommended product model (v1) | Confidence |
|------|--------------------------|--------------------------------|------------|
| Pension on job loss | **No access** before normal minimum pension age (NMPA) **55**, rising to **57 on 6 Apr 2028**, except ill-health / protected ages; unauthorised payments → up to **55% tax charge** | **No pension bridge.** Pension pot is projection-only; job-loss module never draws it (`PENSION_LOCKED_NMPA` guard) | High |
| Redundancy pay | Statutory: age-banded weeks × capped weekly pay (**£751**/wk, max **£22,530**, 2026/27); first **£30,000** of a genuine redundancy package tax-free, excess at marginal rate | One-time inflow at job-loss month; net-of-tax above £30,000 using user `marginal_tax_rate_pct` | High |
| Unemployment income | New Style JSA **£95.55/wk** (25+, 2026/27) for up to **6 months**; Universal Credit means-tested on top | User-entered `monthly_jsa_gbp` with hint **£414/mo**, auto-stops after `jsa_duration_months` (default 6) | High |
| Mortgage safety net | **SMI**: repayable loan paying **3.66%** standard rate on up to **£200,000** of the mortgage, after **3 months** on Universal Credit | Optional toggle: monthly interest credit `min(balance, 200k) × 3.66%/12` starting month `U + 3`; accrued amount reported as `smi_loan_balance_gbp` | High |
| Liquid bridge | **ISA** withdrawals are tax-free anytime; allowance £20,000/yr (until Apr 2031; cash-ISA sub-limit £12,000 for under-65s from Apr 2027) | `isa_balance_gbp` sleeve; shortfall draw order cash → ISA → GIA | High |
| Taxable investments | General investment account (GIA); CGT **18% / 24%** above **£3,000** annual exempt amount (2026/27, shares aligned with property since Oct 2024) | GIA sleeve with `cgt_rate_pct` default **24** on gain above `cgt_annual_exempt_gbp` **£3,000** | High |
| Workplace pension | Auto-enrolment minimum **8%** of qualifying earnings (**£6,240–£50,270**, 2026/27), employer ≥ **3%** | Formula in SPEC-UK §4.2; tier presets use it | High |
| Mortgage prepay | Fixes typically allow **10%/yr** fee-free overpayment; ERC **1–5%** on the excess | `overpayment_allowance_pct` default 10; `erc_pct` default 0 (user opts in); fee applies to **excess only** | High |
| State Pension | Full new State Pension **£241.30/wk** (£12,547.60/yr, 2026/27, triple lock); needs 35 NI years | User-entered `expected_state_pension_weekly_gbp`, placeholder **£241.30**; shown separately from funded ratio (same as US SS) | High |

**Bottom line:** Ship the UK locale spec with a **redundancy + JSA + ISA/SMI bridge** as the job-loss module. This is the honest UK analogue of IN PF tranches / US 401(k) tranches: the *decision surface* (fund living costs vs prepay the mortgage) is identical, but the funding sources are legal UK ones. Pension pots appear only in retirement/strategy projections.

---

## 2. Feature parity matrix (IN / US → UK)

| IN (SPEC §) | US (SPEC-US §) | UK (SPEC-UK §) | Parity notes |
|-------------|----------------|----------------|--------------|
| PF corpus | 401(k) vested balance | Workplace pension pot | UK pot is **projection-only**; never a job-loss source |
| Monthly PF addition | Deferral + employer match | Auto-enrolment 5% + 3% on qualifying earnings | Band-limited (£6,240–£50,270), not full salary |
| EPFO 75/25 tranches (§4.7) | 401(k) 50/50 tranches (§4.7) | **Redundancy lump + JSA + SMI** (§4.7) | UK inflows are calendar-driven, not corpus-fraction-driven |
| Gold liquidation | Taxable brokerage | GIA (+ ISA tax-free sleeve) | ISA is the distinct UK liquid bucket |
| EMI / home loan | Mortgage P&I | Repayment mortgage P&I | Same annuity math |
| `prepayment_fee_inr` flat | `prepayment_fee_usd` flat, default 0 | **ERC on excess over 10%/yr allowance** | UK-canonical fee shape; flat fee still supported |
| LTCG 12.5% + ₹1.25L exemption | LT cap gains flat 15% | CGT 24% above **£3,000** exemption | UK mirrors IN's exemption-then-rate shape |
| Tier A/B/C ₹3L/2L/1L | Tier A/B/C $18k/12k/8k | Tier A/B/C **£9k/6k/4k** | Monthly take-home |
| — | Social Security (user-entered) | **State Pension** (user-entered, weekly) | Same "separate from funded ratio" treatment |
| Game PF routes | Game 401(k) routes | Game **JL funding routes** (redundancy / ISA / SMI-delay) | Same oracle pattern |

### Why no staged pension tranches for the UK

- Registered pension schemes **must not** pay benefits before NMPA (55; **57 from 6 Apr 2028**) except ill-health or protected pension age ([HMRC PTM028000](https://www.gov.uk/hmrc-internal-manuals/pensions-tax-manual/ptm028000), [GOV.UK NMPA increase](https://www.gov.uk/government/publications/increasing-normal-minimum-pension-age)).
- Unauthorised early access triggers tax charges of up to **55%** — modelling it as a planning lever would be dishonest even with a disclaimer.
- The IN 75/25 and US 50/50 tranches are product fictions *layered on accounts the user can technically touch*. A UK employee under 55 **cannot** touch a workplace pension at all, so the fiction has no honest UK counterpart. The bridge role passes to redundancy pay, JSA, ISA, and SMI.

---

## 3. Desk research — job-loss income and support

### 3.1 Statutory redundancy pay

- Eligible after 2 years' service; 0.5 / 1 / 1.5 weeks' pay per year of service by age band; weekly pay capped at **£751** and total at **£22,530** for redundancies on/after 6 Apr 2026 ([GOV.UK redundancy rights](https://www.gov.uk/redundancy-your-rights/redundancy-pay)).
- First **£30,000** of a combined genuine redundancy package (statutory + enhanced + ex-gratia) is tax-free; the excess is taxed at the marginal rate. PILON is fully taxable and excluded from the exemption ([GOV.UK termination payments](https://www.gov.uk/termination-payments-and-tax-when-you-leave-a-job/what-you-pay-tax-and-national-insurance-on)).

**Product model:** user enters gross `redundancy_payment_gbp` (statutory + contractual combined). App computes `net = gross − max(0, gross − 30_000) × marginal_tax_rate_pct / 100`. PILON/notice pay is a non-goal.

**Numeric example:** £40,000 package, 40% marginal → taxable £10,000 → tax £4,000 → **net £36,000**.

### 3.2 New Style JSA

- Contribution-based; **£95.55/wk** for 25-and-over (2026/27 rates; £75.65 under 25); payable up to **182 days (~6 months)**; not means-tested on savings ([GOV.UK New Style JSA](https://www.gov.uk/guidance/new-style-jobseekers-allowance), [DWP benefit rates 2026/27](https://assets.publishing.service.gov.uk/media/69931706ceeaa48d377f6bd5/Benefit-and-pension-rates-2026-2027.pdf)).
- Universal Credit may add means-tested support but tapering depends on household details — too variable to default.

**Product model:** `monthly_jsa_gbp` user-entered, UI hint **£414/mo** (= £95.55 × 52 ÷ 12); `jsa_duration_months` default **6**; income stops automatically after the window. UC modelling is a non-goal (user may fold an estimate into `monthly_income_gbp`).

### 3.3 Support for Mortgage Interest (SMI)

- A **repayable loan** (secured on the home), not a grant. Working-age claimants qualify after receiving Universal Credit for **3 assessment periods** ([GOV.UK SMI eligibility](https://www.gov.uk/support-for-mortgage-interest/eligibility)).
- Pays interest at a **standard rate — currently 3.66%** — on up to **£200,000** of the loan, generally direct to the lender; e.g. £200,000 × 3.66% ÷ 12 = **£610/mo** ([GOV.UK SMI what you'll get](https://www.gov.uk/support-for-mortgage-interest/what-youll-get)). The SMI loan itself accrues interest (OBR gilt rate) and is repaid on sale/transfer.

**Product model:** optional `smi_enabled` toggle. From month `U + smi_wait_months` (default wait **3**), credit `min(opening_balance, smi_capital_cap_gbp) × smi_rate_pct / 100 / 12` to cash each job-loss month. Track cumulative `smi_loan_balance_gbp` as a KPI/warning (it is debt, not income). Do not model SMI-loan interest accrual in v1.

### 3.4 Options considered for the job-loss module

| Option | Description | Pros | Cons |
|--------|-------------|------|------|
| **A — Redundancy + JSA + ISA/SMI bridge (chosen)** | Calendar-driven inflows + on-demand liquid draws | Honest; every lever is legally real; same decision surface as IN/US | More input fields than a tranche rule |
| B — Clone tranche fiction on pension pot | 75/25 or 50/50 pension draws | Max code reuse | Implies illegal early access; rejected by prior research |
| C — "Unauthorised payment" stress scenario | Model the 55% tax charge path | Technically honest | Encourages a catastrophic action; no planning value |
| D — Universal Credit engine | Model UC awards + taper | Realistic for low earners | Means-test engine out of scope; state churn |

**Recommendation:** **A.** Reject B and C outright (list under §11 non-goals). D deferred; user-entered flat benefit only.

---

## 4. Desk research — savings, investments, tax

### 4.1 ISA

- Overall allowance **£20,000/yr**, confirmed unchanged **until April 2031**; withdrawals tax-free at any time; from **6 Apr 2027** the **cash**-ISA sub-limit drops to **£12,000** for under-65s (overall limit unchanged) ([HMRC tax-free savings newsletter 19](https://www.gov.uk/government/publications/tax-free-savings-newsletter-19/tax-free-savings-newsletter-19-november-2025)).

**Product model:** `isa_balance_gbp` is the tax-free liquid sleeve (job-loss draws and strategy SIP destination). Strategy sleeve fills ISA first up to `isa_annual_allowance_gbp` (default 20,000) per 12-month block, remainder to GIA. Cash-vs-stocks sub-limits are a non-goal (note only).

### 4.2 Capital gains tax (GIA sleeve)

- Annual exempt amount **£3,000** (2026/27); gains above it taxed **18%** within the basic band, **24%** above; shares and property rates aligned since 30 Oct 2024 ([GOV.UK CGT rates](https://www.gov.uk/capital-gains-tax/rates)).

**Product model:** post-tax GIA corpus = corpus − `max(0, gain − 3_000) × cgt_rate_pct / 100` with `cgt_rate_pct` default **24**; warn `TAX_SIMPLIFIED` (no band-stacking engine).

**Numeric example:** GIA corpus £50,000, cost basis £40,000 → gain £10,000 → taxable £7,000 → tax £1,680 → **post-tax £48,320**.

### 4.3 Workplace pension (auto-enrolment)

- Minimum **8%** of **qualifying earnings** (£6,240–£50,270 for 2026/27), of which the employer pays at least **3%** ([GOV.UK workplace pensions](https://www.gov.uk/workplace-pensions/what-you-your-employer-and-the-government-pay), [TPR thresholds](https://www.thepensionsregulator.gov.uk/employers/new-employers/im-an-employer-who-has-to-provide-a-pension/declare-your-compliance/ongoing-duties-for-employers/earnings-thresholds)).

**Product model (monthly):**

```text
qualifying = max(0, min(annual_salary_gbp, 50_270) − 6_240)
employee_monthly = qualifying × employee_pension_pct / 100 / 12    // default 5
employer_monthly = qualifying × employer_pension_pct / 100 / 12    // default 3
```

**Reference example (SPEC-UK §15):** salary £60,000 → qualifying £44,030 → employee **£183.46/mo**, employer **£110.08/mo** (total ≈ £293.53/mo). Salary sacrifice, DB schemes, and higher scheme minima are non-goals.

### 4.4 State Pension (retirement tab)

- Full new State Pension **£241.30/wk** (£12,547.60/yr) for 2026/27 after the 4.8% triple-lock uprating; full rate needs **35** qualifying NI years ([DWP benefit rates 2026/27](https://assets.publishing.service.gov.uk/media/69931706ceeaa48d377f6bd5/Benefit-and-pension-rates-2026-2027.pdf)).

**Product model:** user-entered `expected_state_pension_weekly_gbp`, UI placeholder **£241.30**; annualised ×52 and shown **separately** from the funded ratio (identical treatment to US Social Security). No NI-record engine.

---

## 5. Desk research — mortgage prepayment (ERC)

- Most UK fixed-rate deals allow overpaying **10%** of the outstanding balance per year fee-free (some lenders 20%); exceeding it triggers an **early repayment charge of 1–5%**, normally on the **excess** only ([HSBC](https://www.hsbc.co.uk/mortgages/paying-your-mortgage-off-early/), [MoneySuperMarket](https://www.moneysupermarket.com/mortgages/early-repayment-charges/)).
- SVR (out-of-deal) mortgages typically have no ERC.

**Product model:** `overpayment_allowance_pct` default **10** (of opening balance per rolling 12-month block from scenario start); `erc_pct` default **0** (user opts into their deal's charge). Fee = `erc_pct × max(0, prepay_in_block − allowance)`. When `erc_pct = 0` and the allowance is exceeded, surface informational warning `ERC_ALLOWANCE_EXCEEDED`. Flat `prepayment_fee_gbp` retained for engine parity, default 0.

**Numeric example:** balance £250,000, allowance 10% = £25,000; prepay £37,500 with `erc_pct = 2` → fee = 2% × £12,500 = **£250**.

---

## 6. Locale architecture recommendation

```text
┌───────────────────────────────────────────────┐
│ App shell: locale IN | US | UK                │
└──────────────────────┬────────────────────────┘
                       │
   roundInr/formatInr  roundUsd/formatUsd  roundGbp/formatGbp
                       │
        Shared: emi(), amortise(), avalanche(), retirement()
                       │
   pf.ts (IN)      k401.ts (US)      jobloss-uk.ts (UK)
   PF tranches     401(k) tranches   redundancy + JSA + SMI + ISA draws
```

- **Do not** fork amortisation cores; the ERC-on-excess fee is a post-processing step on prepay events.
- **Do** fork the job-loss bridge module — the UK one is calendar/benefit-driven, not corpus-fraction-driven.
- Feature flag `VITE_ENABLE_UK_LOCALE` until UK goldens pass CI (same pattern as US).

---

## 7. UI / copy requirements (from research)

| Surface | Required copy |
|---------|---------------|
| Job-loss toggle | "Pensions cannot be accessed before age 55 (57 from April 2028); this scenario uses redundancy pay, benefits, and savings only." |
| SMI toggle | "SMI is a repayable loan secured on your home, not a grant. Illustrative 3.66% standard rate on up to £200,000." |
| JSA field | "New Style JSA is roughly £414/month for up to 6 months (2026/27); enter your estimate." |
| Redundancy field | "First £30,000 of a genuine redundancy package is usually tax-free; PILON is taxed as salary and not modelled." |
| GIA tax | "Capital gains use a single user-assumed rate above the £3,000 exemption; band stacking not modelled." |
| State Pension | "Use the GOV.UK State Pension forecast for a personal estimate." |

---

## 8. Acceptance / test implications

| Test | Research-backed expectation |
|------|-----------------------------|
| Pension untouched | Job-loss sim never decrements `pension_pot_gbp`; forced draw config → `PENSION_LOCKED_NMPA` |
| Redundancy tax | £40,000 gross at 40% marginal → **£36,000** net |
| JSA window | `U=1`, duration 6 → inflows months 1–6 only; month 7 = 0 |
| SMI indexing | `U=1`, wait 3 → first credit month **4**; reference loan credit **£610/mo** |
| Auto-enrolment | £60k salary, 5%/3% → **£183.46** / **£110.08** per month |
| ERC excess | £37,500 prepay, 10% allowance on £250,000, 2% ERC → fee **£250** |
| CGT sleeve | £10,000 gain, £3,000 exempt, 24% → tax **£1,680** |

---

## 9. Recommendation summary

| Decision | Choice |
|----------|--------|
| Job-loss funding model | **Redundancy + JSA + ISA/SMI bridge** (Option A); no pension access |
| Pension pot role | Projection-only (retirement + strategy tabs) |
| JSA default | User-entered; hint £414/mo; 6-month auto-stop |
| SMI | Optional toggle; 3.66% on ≤£200k after 3-month wait; tracked as loan KPI |
| Prepay fee shape | ERC % on excess over 10%/yr allowance; defaults 10% / 0% |
| Equity sleeve | ISA-first (£20k/yr) then GIA; CGT 24% above £3,000 on GIA |
| State Pension | User-entered weekly; placeholder £241.30; outside funded ratio |
| Tier presets | £9,000 / £6,000 / £4,000 monthly take-home |
| Reference loan | £250,000 at 4.5% fixed, 300 months (~£1,390/mo) |

---

## 10. Spec delta (applied)

- [x] Create **`docs/SPEC-UK.md`** v1.0 mirroring SPEC-US structure (§1–§16) with the models above.
- [x] `docs/SPEC.md` header — cross-link the UK spec (no IN behaviour change; version unchanged).
- [x] `docs/SPEC-US.md` §11 / §13 — UK locale no longer "deferred"; now specced in `SPEC-UK.md` (implementation still pending).
- [x] `docs/OVERVIEW.md` — locales line, related docs, research index.

---

## 11. Sources

| Topic | Source |
|-------|--------|
| NMPA 55 → 57 (6 Apr 2028) | [HMRC PTM028000](https://www.gov.uk/hmrc-internal-manuals/pensions-tax-manual/ptm028000), [GOV.UK policy paper](https://www.gov.uk/government/publications/increasing-normal-minimum-pension-age) |
| Redundancy pay caps 2026/27 | [GOV.UK redundancy rights](https://www.gov.uk/redundancy-your-rights/redundancy-pay) |
| £30,000 termination exemption | [GOV.UK termination payments](https://www.gov.uk/termination-payments-and-tax-when-you-leave-a-job/what-you-pay-tax-and-national-insurance-on) |
| New Style JSA + 2026/27 rates | [GOV.UK New Style JSA](https://www.gov.uk/guidance/new-style-jobseekers-allowance), [DWP rates 2026/27 PDF](https://assets.publishing.service.gov.uk/media/69931706ceeaa48d377f6bd5/Benefit-and-pension-rates-2026-2027.pdf) |
| SMI amount / rate / cap | [GOV.UK SMI what you'll get](https://www.gov.uk/support-for-mortgage-interest/what-youll-get) |
| SMI 3-month qualifying period | [GOV.UK SMI eligibility](https://www.gov.uk/support-for-mortgage-interest/eligibility), [Commons Library SN06618](https://commonslibrary.parliament.uk/research-briefings/sn06618/) |
| ISA allowances + 2027 cash sub-limit | [HMRC tax-free savings newsletter 19](https://www.gov.uk/government/publications/tax-free-savings-newsletter-19/tax-free-savings-newsletter-19-november-2025) |
| CGT rates / exemption 2026/27 | [GOV.UK CGT rates](https://www.gov.uk/capital-gains-tax/rates) |
| Auto-enrolment minima + band | [GOV.UK workplace pensions](https://www.gov.uk/workplace-pensions/what-you-your-employer-and-the-government-pay), [TPR earnings thresholds](https://www.thepensionsregulator.gov.uk/employers/new-employers/im-an-employer-who-has-to-provide-a-pension/declare-your-compliance/ongoing-duties-for-employers/earnings-thresholds) |
| State Pension 2026/27 | [DWP rates 2026/27 PDF](https://assets.publishing.service.gov.uk/media/69931706ceeaa48d377f6bd5/Benefit-and-pension-rates-2026-2027.pdf) |
| Overpayment allowance / ERC | [HSBC early repayment](https://www.hsbc.co.uk/mortgages/paying-your-mortgage-off-early/), [MoneySuperMarket ERC](https://www.moneysupermarket.com/mortgages/early-repayment-charges/) |

---

**End of research spike**

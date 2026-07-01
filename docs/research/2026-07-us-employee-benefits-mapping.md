# US employee locale — research spike

**Date:** 2026-07-01 (expanded 2026-07-01)  
**Status:** Recommendation accepted for v1; v1.1 items flagged  
**Question:** How should FinancialPlanner model US employee finances so the US locale delivers the same planner surfaces as India (IN), while staying honest about simplified assumptions?  
**Constraints:** SPEC-US §11 non-goals; offline-first; no legal/tax advice; mirror IN tabs without duplicating solver cores.

**Related:** [`docs/SPEC-US.md`](../SPEC-US.md) · [`docs/SPEC.md`](../SPEC.md) (IN locale)

---

## 1. Executive summary

| Area | Real-world US behaviour | Recommended product model (v1) | Confidence |
|------|-------------------------|--------------------------------|------------|
| 401(k) on job loss | **No** general penalty-free access just because you are unemployed; hardship reasons are specific (foreclosure risk, medical, etc.) | **Educational staged tranches** (50%/50%) with 10% penalty + withholding — mirrors IN PF UX, clearly labeled fictional | High for UX parity; must disclaim |
| 401(k) loans | Up to 50% / $50k; due on job termination if unpaid → taxable distribution | **Defer to v1.1** optional funding path | High |
| SECURE 2.0 emergency | Up to **$1,000**/yr penalty-free (plan optional); income tax still applies | **v1.1** toggle `secure2_emergency_1k` | High |
| Rule of 55 | Penalty-free from **that employer’s plan** if separate in/after year turning 55 | **v1.1** advanced toggle for personas 55+ | Medium |
| UI income | State-varying; ~12–26 weeks; weekly caps | User-entered `monthly_uib_usd`; UI default **$1,800/mo** (~$450/wk) | Medium |
| Employer match | **50% of first 6%** most common (≈3% of salary) | Formula in SPEC-US §4.2; tier presets use it | High |
| Mortgage prepay fee | Rare on QM/conforming primary loans (<0.5% of loans) | Default **$0**; optional fee field kept | High |
| Brokerage tax | LT cap gains 0/15/20% by income; ST = ordinary | User `ltcg_rate_pct` default **15%**; no bracket engine | High |
| Social Security | Avg retired worker ≈ **$2,000/mo** (2025); user-specific | User-entered benefit; placeholder **$2,000** | High |

**Bottom line:** Ship v1 with **staged 401(k) bridge** as a *what-if stress model* (like IN’s user-specified EPFO 75/25 rule), not as compliance simulation. Add prominent UI copy: “Not IRS hardship rules.”

---

## 2. Feature parity matrix (IN → US)

| IN locale (SPEC §) | US locale (SPEC-US §) | Parity notes |
|--------------------|------------------------|--------------|
| PF corpus | 401(k) vested balance | IN PF is employer+employee; US adds **vesting** knob |
| Monthly PF addition | Deferral + employer match | Match formula is US-specific |
| EPFO 75%/25% unemployment tranches (§4.7) | 401(k) 50%/50% staged bridge (§4.7) | **Both are product-canonical**, not legal truth |
| Gold liquidation | Taxable brokerage | Haircut still useful (market impact) |
| EMI / home loan | Mortgage P&I | Same annuity math |
| LTCG 12.5% + ₹1.25L exemption (§4.12) | LT cap gains % on gain (§4.12) | US has no ₹-style exemption in v1 |
| Tier A/B/C take-home | Tier A/B/C ($18k / $12k / $8k) | Roughly top/mid/entry professional |
| Multi-debt | Same avalanche/snowball | Currency only |
| Retirement SIP | Retirement + SS input | SS is US extension |
| Game PF routes (§4.13) | Game 401(k) routes | Penalty line items in matrix |

### India EPFO rule (product canonical)

From SPEC §4.7 / §15:

- Tranche 1: **75%** of `PF0` at end of month 1 of unemployment  
- Tranche 2: **25%** at end of month 12 (month index `U+11`)

### US analogue (product canonical — SPEC-US §4.7)

- Tranche 1: **50%** of vested `K0` at month `U`  
- Tranche 2: **50%** at month `U+11`  
- Cash-bound gross: **10% penalty** + **22% withholding** (defaults)

**Why 50/50 not 75/25?** EPFO’s 75% rule is a specific Indian regulatory fiction for this app. US has no equivalent single rule; 50/50 keeps total withdrawal at 100% of vested balance while preserving two decision points (liquidity now vs later), matching the *interaction design* of IN without implying IRS approval.

---

## 3. Desk research — 401(k) access on job loss

### 3.1 What the IRS actually allows

**Early withdrawal (distribution):**

- Generally **10% additional tax** before age 59½ on taxable amount, plus ordinary income tax ([IRS Topic 558](https://www.irs.gov/taxtopics/tc558)).
- **Unemployment alone is not** a listed exception for 401(k) plans ([Investopedia](https://www.investopedia.com/articles/insights/073116/how-401k-withdrawals-work-when-youre-unemployed.asp)).
- **Rule of 55:** If you separate from service in/after the year you turn **55**, withdrawals from **that employer’s plan** can avoid the 10% penalty (still taxable).
- **Hardship withdrawals:** Permitted only for “immediate and heavy” needs — e.g. foreclosure/eviction prevention, medical, funeral, tuition, disaster ([IRS hardship FAQs](https://www.irs.gov/retirement-plans/retirement-plans-faqs-regarding-hardship-distributions)). **Job loss is not a hardship reason by itself.** Hardship still usually incurs 10% penalty if under 59½ ([Fidelity](https://www.fidelity.com/learning-center/smart-money/401k-hardship-withdrawal)).
- **IRA difference:** IRA allows penalty-free withdrawals for health insurance premiums after 12 weeks of unemployment — **401(k) does not** have this exception in the same way ([Investopedia](https://www.investopedia.com/articles/insights/073116/how-401k-withdrawals-work-when-youre-unemployed.asp)).

**SECURE 2.0 emergency personal expense (since 2024):**

- Up to **$1,000**/calendar year, **penalty-free** if plan adopts; still **ordinary income tax** ([Vanguard SECURE 2.0 guide PDF](https://workplace.vanguard.com/content/dam/inst/iig-transformation/secure20/SCRACT_BRO_ExpenseWithdrawal_V10_Accessible.pdf), [IRS Notice 2024-55](https://www.forbes.com/sites/kellyphillipserb/2024/06/24/irs-issues-guidance-on-penalty-exceptions-for-emergencies-and-domestic-violence-victims/)).
- One per year; 3-year repayment rule if taking another.
- Self-certification allowed.

**401(k) loans ([IRS Retirement Topics — Loans](https://www.irs.gov/retirement-plans/plan-participant-employee/retirement-topics-loans)):**

- Max **50%** of vested balance or **$50,000**, whichever is less (with $10k floor rule for small balances).
- Repay within **5 years** (longer for primary residence).
- **On job termination:** outstanding balance often becomes due; unpaid → **deemed distribution** (tax + possible 10% penalty).

### 3.2 Options for job-loss + 401(k) module

| Option | Description | Pros | Cons |
|--------|-------------|------|------|
| **A — Staged penalty withdrawal (chosen v1)** | 50%/50% tranches; penalty + withholding on cash | Matches IN staged UX; testable; teaches cost of early access | **Not** real IRS behaviour |
| **B — Hardship gate** | User picks hardship reason; amount = need | Closer to plan language | High variance; job loss still doesn’t qualify alone |
| **C — Roth basis first** | Penalty-free up to contributions | Teaches account types | Extra inputs; v1.1 |
| **D — 401(k) loan then default** | Borrow pre-job-loss; offset on termination | Realistic for some users | Different cashflow shape; complex |
| **E — SECURE 2.0 $1k only** | Cap annual access at $1k penalty-free | Legally grounded | Too small for mortgage stress tests |

**Recommendation:** **A** for v1 stress module. Add **E** as v1.1 preset overlay. Add **D** as v1.2 funding source for prepay (SPEC-US §13).

### 3.3 Numeric example (US§15 reference)

`K0 = $80,000` vested, both tranches to cash, 10% penalty + 22% withholding:

| Tranche | Gross | Penalty (10%) | Withholding (22%) | Net cash |
|---------|-------|---------------|-------------------|----------|
| 1 @ month 1 | $40,000 | $4,000 | $8,800 | **$27,200** |
| 2 @ month 12 | $40,000 | $4,000 | $8,800 | **$27,200** |
| **Total** | $80,000 | $8,000 | $17,600 | **$54,400** |

If tranche 1 is **100% loan prepay** (gross applied): loan principal ↓ $40,000; penalty/withholding still reported as **economic cost** warnings (SPEC-US §4.7 — gross to loan, costs in KPIs).

Compare IN: `PF0 = ₹25,00,000` → ₹18,75,000 + ₹6,25,000 with **no** penalty in IN model.

---

## 4. Desk research — unemployment insurance (cashflow)

**Duration:** Federally unstructured; most states **26 weeks**; 13 states **<26 weeks** (e.g. FL/NC **12**, AL **14**) ([CBPP](https://www.cbpp.org/research/economy/how-many-weeks-of-unemployment-compensation-are-available), [NELP](https://www.nelp.org/insights-research/benefit-duration/)).

**Weekly benefit range (illustrative 2025):** roughly **$275–$650** in many states; MA higher (~$1,051 max); MS lower (~$235 max) ([CRS R46687](https://www.congress.gov/crs-product/R46687)).

**Product defaults:**

| Field | Suggested default | Rationale |
|-------|-------------------|-----------|
| `monthly_uib_usd` | **0** (explicit opt-in) | Avoid false precision across 50 states |
| Tier preset hint | **$1,800/mo** | ≈ $450/wk × 4 — mid-range illustrative |
| `ui_duration_weeks` | **26** (v1.1 optional) | User can shorten runway manually |

**Recommendation:** Keep **user-entered** `monthly_uib_usd` only in v1. Show helper text: “Varies by state; enter your estimate from your state workforce agency.”

**Cashflow interaction:** UI pays in months 1–N of job loss; at month 27+ income drops to 0 unless user sets `monthly_income_usd` elsewhere — aligns with IN §4.8 pattern.

---

## 5. Desk research — employer 401(k) match

**Most common formula:** **50% match on first 6% of salary** → effective **3% of salary** employer cost ([Vanguard How America Saves](https://finance.yahoo.com/news/401-k-match-does-203158482.html), [US Chamber](https://www.uschamber.com/co/run/human-resources/401k-company-match-plan)).

**Example (US§15):** Salary $120,000; deferral $1,000/mo ($12,000/yr = 10%):

```text
cap_monthly = 120,000 × 6% / 12 = $600
eligible = min(1,000, 600) = $600
match = 600 × 50% = $300/mo → $3,600/yr
```

**Vesting:** Employer match often vests over 3–6 years. SPEC-US `vested_fraction_pct` default **100%** for simplicity; UI hint to lower for early-career users.

**Recommendation:** Keep SPEC-US §4.2 formula; add tier preset deferral **$1,000/mo** and match **50%/6%** on reference scenario.

---

## 6. Desk research — mortgage prepayment

- **QM conforming primary mortgages:** prepayment penalties **rare** (<0.32% of conventional loans per HMDA 2024) ([Homebuyer.com](https://homebuyer.com/learn/prepayment-penalty)).
- **Dodd-Frank:** If penalty exists on QM, capped at **2%** yr1–2, **1%** yr3, none after ([Bankrate](https://www.bankrate.com/mortgages/prepayment-penalty/)).
- **Investment/DSCR loans:** step-down penalties common (5-4-3-2-1).

**Recommendation:** US default `prepayment_fee_usd = 0`. Game theory lender fee profiles (US§4.13) still valuable for “what if my loan has a fee” — same as IN.

---

## 7. Desk research — brokerage / equity sleeve tax

**Long-term capital gains (2025, assets held >1 year):** 0%, **15%**, or 20% by taxable income ([IRS Topic 409](https://www.irs.gov/taxtopics/tc409/), [Fidelity](https://www.fidelity.com/learning-center/smart-money/capital-gains-tax-rates)).

- Single filer 15% bracket roughly **$48,351 – $533,400** taxable income.
- **NIIT 3.8%** on investment income for high earners — defer (SPEC-US §11).

**Short-term gains:** taxed as ordinary income — if user sells brokerage within 1 year, under-modeling risk. v1 assumes **LT rate user override**.

**Recommendation:** Default `ltcg_rate_pct = 15` for US§4.12 post-tax brokerage corpus; warn `TAX_SIMPLIFIED` in UI.

Compare IN: LTCG 12.5% above ₹1.25L exemption — US v1 has **no** exemption floor.

---

## 8. Desk research — Social Security (retirement tab)

- Average retired worker benefit ≈ **$2,006–$2,012/mo** (SSA snapshots Jul–Oct 2025) ([SSA Jul 2025](https://www.ssa.gov/policy/docs/quickfacts/stat_snapshot/2025-07.html)).
- Range: ~$900 low earners to **$5,108** max at age 70 (2025) ([CBS](https://www.cbsnews.com/news/how-much-the-average-social-security-recipient-earns-monthly-2025-how-to-boost-it/)).
- True estimate needs 35-year earnings history ([AARP calculator](https://www.aarp.org/social-security/benefits-calculator/)).

**Recommendation:** v1 **user-entered** `expected_social_security_monthly_usd`; UI placeholder **$2,000**; show separately from funded ratio (SPEC-US §4.11). Do **not** build PIA engine in v1.

**Retirement funded ratio display (UX):**

```text
portfolio_target = annual_expense_at_retirement / SWR
funded_ratio = corpus_usd / portfolio_target
ss_annual = expected_social_security_monthly_usd × 12
expense_gap = max(0, annual_expense_at_retirement - ss_annual)
ss_adjusted_target = expense_gap / SWR   // optional v1.1 KPI
```

v1 keeps SS informational only per SPEC-US.

---

## 9. Desk research — multi-debt & retirement (shared engines)

| Module | US change | Research note |
|--------|-----------|---------------|
| Avalanche/snowball | USD only | CFPB/FTC consumer guidance favours avalanche mathematically — already tested IN-side |
| Retirement projection | USD + SS field | Same compound formula as IN `projectRetirementCorpus` |
| Safe withdrawal rate | Default 4% when set | Trinity-study convention; same as IN |

No US-specific algorithm changes required beyond money rounding and labels.

---

## 10. Locale architecture recommendation

```text
┌─────────────────────────────────────────┐
│ App shell: locale IN | US               │
└─────────────────┬───────────────────────┘
                  │
     ┌────────────┴────────────┐
     ▼                         ▼
 roundInr / formatInr    roundUsd / formatUsd
     │                         │
     └────────────┬────────────┘
                  ▼
     Shared: emi(), amortise(), avalanche()
                  │
     ┌────────────┴────────────┐
     ▼                         ▼
 pf.ts (IN)              k401.ts (US)
 cashflow presets        cashflow presets
```

- **Do not** fork amortisation cores.  
- **Do** fork unemployment bridge modules (different tranche % and penalty math).  
- **Feature flag:** `VITE_ENABLE_US_LOCALE` until goldens pass.

---

## 11. UI / copy requirements (from research)

| Surface | Required copy |
|---------|---------------|
| Job loss + 401(k) toggle | “Simplified stress scenario — not IRS hardship or plan rules.” |
| Early withdrawal KPIs | “10% federal penalty + withholding shown for illustration.” |
| UI benefit field | “Enter your state unemployment estimate.” |
| Social Security | “Use ssa.gov/myaccount for a personal estimate.” |
| Brokerage tax | “Capital gains rate is user-assumed; short-term not modeled.” |

---

## 12. Acceptance / test implications

| Test | Research-backed expectation |
|------|----------------------------|
| 401(k) tranche months | Same off-by-one as IN: `U=1` → tranche2 month **12** |
| Penalty math | $40k gross → $27,200 net at 10%+22% |
| Match formula | $120k salary, $1k deferral, 50%/6% → **$300/mo** match |
| Mortgage default | `prepayment_fee_usd=0` on US§15 reference |
| SS placeholder | UI shows $2,000 hint only; not in corpus math |

---

## 13. Recommendation summary

| Decision | Choice |
|----------|--------|
| v1 job-loss 401(k) model | **Staged 50/50 + penalty/withholding** (Option A) |
| v1.1 additions | SECURE 2.0 $1k emergency; Rule of 55 toggle; SS-adjusted funded ratio |
| v1.2 additions | 401(k) loan funding path |
| UI income | User-entered; no state table in v1 |
| Match defaults | 50% up to 6% of salary |
| Mortgage prepay fee | Default 0 |
| LTCG default | 15% user override |
| SS | User-entered; ~$2k placeholder |

---

## 14. Spec delta (apply to `docs/SPEC-US.md`)

- [x] §4.7 staged 401(k) bridge documented (already in SPEC-US v1.0)  
- [ ] **Add §4.7.1** “Educational model disclaimer” cross-ref to §14  
- [ ] **Add §4.2** worked example for match ($120k / $1k deferral → $300)  
- [ ] **Add §4.8** `monthly_uib_usd` helper default hint $1,800 in UI only  
- [ ] **Add §4.11** SS placeholder $2,000; optional v1.1 `ss_adjusted_funded_ratio`  
- [ ] **Add §11** SECURE 2.0 engine; state tax; 401(k) loans (confirm non-goals)  
- [ ] **Add §13** resolved: UI income user-entered; match 50%/6%; prepay fee default 0  
- [ ] **Bump SPEC-US to v1.1** when spec deltas applied  

---

## 15. Sources

| Topic | Source |
|-------|--------|
| 10% early withdrawal | [IRS Topic 558](https://www.irs.gov/taxtopics/tc558) |
| Hardship rules | [IRS hardship FAQs](https://www.irs.gov/retirement-plans/retirement-plans-faqs-regarding-hardship-distributions) |
| Unemployment + 401(k) | [Investopedia](https://www.investopedia.com/articles/insights/073116/how-401k-withdrawals-work-when-youre-unemployed.asp) |
| SECURE 2.0 $1k emergency | [Vanguard PDF](https://workplace.vanguard.com/content/dam/inst/iig-transformation/secure20/SCRACT_BRO_ExpenseWithdrawal_V10_Accessible.pdf), [Forbes / Notice 2024-55](https://www.forbes.com/sites/kellyphillipserb/2024/06/24/irs-issues-guidance-on-penalty-exceptions-for-emergencies-and-domestic-violence-victims/) |
| 401(k) loans | [IRS Retirement Topics — Loans](https://www.irs.gov/retirement-plans/plan-participant-employee/retirement-topics-loans) |
| UI duration | [CBPP](https://www.cbpp.org/research/economy/how-many-weeks-of-unemployment-compensation-are-available) |
| UI amounts | [Congress CRS R46687](https://www.congress.gov/crs-product/R46687) |
| Employer match | [US Chamber](https://www.uschamber.com/co/run/human-resources/401k-company-match-plan), [Yahoo / Vanguard HAS](https://finance.yahoo.com/news/401-k-match-does-203158482.html) |
| Mortgage prepay | [Homebuyer.com HMDA](https://homebuyer.com/learn/prepayment-penalty), [Bankrate](https://www.bankrate.com/mortgages/prepayment-penalty/) |
| Capital gains | [IRS Topic 409](https://www.irs.gov/taxtopics/tc409) |
| Social Security averages | [SSA snapshot Oct 2025](https://www.ssa.gov/policy/docs/quickfacts/stat_snapshot/2025-10.html) |

---

**End of research spike**

# Other planner areas — research spike

**Date:** 2026-07-01  
**Status:** Desk research complete; product calls flagged where needed  
**Parent work:** [`2026-07-us-employee-benefits-mapping.md`](2026-07-us-employee-benefits-mapping.md) · [`2026-07-us-employee-locale-deep-dive.md`](2026-07-us-employee-locale-deep-dive.md)  
**Question:** After the US **employed W-2 worker** deep-dive (16 topics), what other product areas need desk research before spec or implementation?  
**Constraints:** SPEC §11 / SPEC-US §11 non-goals; offline-first; not legal/tax advice; prefer parity across locales where engines already exist.

**Related:** [`docs/SPEC.md`](../SPEC.md) · [`docs/SPEC-US.md`](../SPEC-US.md)

---

## 1. Executive summary

| Area cluster | Real-world gist | Product recommendation | Priority |
|--------------|-----------------|------------------------|----------|
| **India SPEC symmetry** | Multi-debt + retirement ship in UI but lack IN §4.10–§4.11 | **Promote** implemented behaviour into `SPEC.md` (doc-only) | P0 doc |
| **India open questions** | Banks offer tenure *or* EMI reduction; product already picks snapshot EMI | **Close §13 Q1–Q3** with canonical answers | P0 doc |
| **UK locale** | No pension access before 55 (57 from 2028) except ill-health | **Defer locale**; if added, use **0% bridge fiction** + SMI note, not EPFO-style tranches | P3 |
| **Canada locale** | RRSP taxable; TFSA tax-free; mortgage IRD penalties common | **Defer locale**; TFSA sleeve maps cleanly to brokerage; RRSP ≠ 401(k) | P3 |
| **HSA job-loss bridge** | Penalty-free for COBRA / UI-period premiums | **v1.2 US optional bucket** — simpler than 401(k), high UX value | P2 |
| **PMI / escrow** | HPA auto-drop at 78% LTV | **Stay non-goal v1**; v1.1 optional `pmi_monthly_usd` flat line item only | P2 |
| **ARM / floating rate** | Periodic + lifetime caps; path-dependent | **Tier P2 design doc** for `GAME_FLOATING_N`; deterministic stress paths only | P2 research |
| **Multi-creditor games** | Real households have 2+ secured loans | **Defer** until IN §4.13.8 P2 promoted; research suggests **2-loan max** first | P2 |
| **Self-employed / gig** | No employer match; SEP-IRA/Solo 401(k) | **Persona extension** — not a locale; add US §3 persona + SEP inputs v2 | P3 |
| **Wash sales / NIIT** | Complex; high earners only | **Reinforce non-goals** in SPEC-US §11 | — |

**Bottom line:** The highest-value “other areas” work is **documentation and symmetry** (India §4.10–§4.11, close §13), plus **HSA** and **flat PMI** as optional US v1.2 inputs. New country locales (UK, CA) are feasible but should wait until US v1 goldens are stable.

---

## 2. India locale — SPEC symmetry & open questions

### 2.1 Multi-debt and retirement (§4.10 / §4.11 gap)

**Real world:** Indian borrowers hold credit cards, personal loans, and home loans simultaneously; retirement planning uses EPF/NPS/PPF/SIP — same planner surfaces as US debt + retirement tabs.

**Current code:** `src/features/debt/`, `src/features/retirement/`, `src/lib/debt/`, `src/lib/retirement/` — locale-agnostic with INR fields.

**Product implication:** SPEC-US documents §4.10–§4.11 explicitly; **SPEC.md jumps from §4.9 to §4.12**, creating an agent onboarding gap noted in SPEC-US §13 Q5.

| Option | Pros | Cons |
|--------|------|------|
| **A — Promote IN §4.10–§4.11** mirroring US text (INR, PF not SS) | Single source of truth; tests map cleanly | Doc churn only |
| **B — Leave implicit** | No edit | Agents re-read US spec for shared engines |
| **C — Move shared sections to SPEC-COMMON.md** | DRY | New file; bigger refactor |

**Recommendation:** **Option A** — add IN §4.10 (multi-debt avalanche/snowball, INR fields, same algorithms as `src/lib/debt/`) and IN §4.11 (retirement corpus projection, no Social Security field). Cross-link US §4.10–§4.11 as parallel.

**Numeric example:** ₹5L corpus, ₹20k/mo contribution, 7% return, 20 years → same `projectRetirementCorpus` as today; document acceptance bullets in IN §10.

---

### 2.2 Open question §13.1 — “Keep EMI” after prior prepays

**Real world:** After a part-prepayment, Indian lenders let the borrower choose **reduce tenure** (same EMI) or **reduce EMI** (same tenure). SBI/HDFC/ICICI all document both paths ([RBI FAQ](https://www.rbi.org.in/Scripts/FAQDisplay.aspx?Id=77), [ICICI prepayment calculator](https://www.icici.bank.in/personal-banking/loans/home-loan/prepayment-calculator)).

**Product canonical (already in SPEC §4.4 policy 1, partially orphaned in §13):**

- **`recompute_tenure_keep_emi`:** EMI = **baseline snapshot at scenario start** (`computeEmi(P₀, r, N)`), not recomputed after earlier prepays in the same scenario unless user selects advanced “current EMI”.
- **`recompute_emi_keep_tenure`:** Remaining **calendar months to original end date** fixed; EMI recomputed from new balance.

**Code alignment:** `schedulePrepayKeepEmi` in `src/lib/amortisation.ts` uses `emi0` from initial principal — matches policy 1.

**Recommendation:** **Close §13 Q1** — move answer into §4.4 as normative text; remove from open questions.

---

### 2.3 Open question §13.2 — EPFO legal copy

**Real world:** EPFO unemployment withdrawal rules (75% / 25% fiction in this app) differ from actual EPFO Form 31 eligibility; product already disclaims in §14.

**Recommendation:** Keep **product-canonical** labels (“PF tranche 1 / 2”) in UI; footer §14 unchanged. Add one sentence in §4.7: “Withdrawal fractions are a **stress-test model**, not EPFO Form 31 compliance.” **Close §13 Q2.**

---

### 2.4 Open question §13.3 — Mid-cycle prepayment timing

**Real world:** Most retail prepayments post on a statement date after EMI debit; mid-month prepay may save a few days’ interest — lender-specific.

| Option | Pros | Cons |
|--------|------|------|
| **A — `month_start_after_emi` only (current default)** | Deterministic; matches §4.4 | Ignores mid-month |
| **B — Add `mid_month` with pro-rata interest** | Slightly more accurate | Two code paths; golden churn |
| **C — Document as non-goal** | Zero work | Leaves ambiguity |

**Recommendation:** **Option A + document** — mid-month remains optional advanced setting; if unset, all prepays apply **after scheduled EMI** on month boundary. **Close §13 Q3** with “v1 uses month boundary after EMI; pro-rata deferred.”

---

## 3. Geographic locale expansion (beyond IN / US)

### 3.1 United Kingdom

**Real world:**

| IN / US analogue | UK behaviour | Planner implication |
|------------------|--------------|---------------------|
| PF / 401(k) bridge on job loss | **No access** before NMPA **55** (rising to **57** Apr 2028) except serious ill-health ([GOV.UK](https://www.gov.uk/workplace-pensions/changing-jobs-and-taking-leave), [FCA guidance summaries](https://www.firstwealth.co.uk/article/can-you-withdraw-from-your-pension-before-55)) | Cannot mirror 50/50 or 75/25 tranche UX honestly |
| Unauthorized early access | Up to **55% tax charge** | If modeled, label “unauthorized payment scenario” |
| Mortgage job loss | FCA forbearance; **SMI** loan after **39 weeks** on qualifying benefits ([RichQuid guide](https://www.richquid.co.uk/guides/what-happens-to-my-mortgage-if-i-lose-my-job)) | Cashflow: user-entered benefit + optional SMI interest-only line |
| Mortgage prepay | Most residential fixes allow overpayment (often 10%/yr penalty-free) | Same engine as US; **£** formatting |

**Options for job-loss liquidity module:**

| Option | Description |
|--------|-------------|
| **A — No pension bridge** | Job-loss tab = cashflow + ISA/cash only |
| **B — “Emergency ISA draw”** | Tax-free ISA withdrawals — maps to brokerage sleeve |
| **C — Fiction tranche (not recommended)** | Implies legal early pension access |

**Recommendation:** **Defer UK locale.** If pursued later: **Option A + B**; reference scenario in **GBP**; NMPA disclaimer prominent. Do **not** clone EPFO/401(k) tranche UX.

---

### 3.2 Canada

**Real world:**

| Topic | Behaviour | Planner mapping |
|-------|-----------|-----------------|
| **RRSP** withdrawal | Taxable + withholding; **contribution room lost** ([Wealthsimple](https://www.wealthsimple.com/en-ca/learn/withdraw-rrsp-without-paying-tax)) | Like Traditional 401(k) — penalty via marginal rate, not 10% flat |
| **TFSA** withdrawal | Tax-free; room restored next year | Maps to `brokerage` / liquid sleeve |
| **HBP / LLP** | Tax-free RRSP for home / education if repaid | Out of scope v1 (purpose-specific) |
| **Mortgage prepay penalty** | Closed mortgages: **3 months’ interest** or **IRD** ([Loans Canada](https://loanscanada.ca/mortgage/ontario/)) | User `prepayment_fee_usd` equivalent in CAD — default **0** for open variable |

**Recommendation:** **Defer Canada locale.** Architecture: `locale: "CA"` + `rrsp_*` / `tfsa_*` buckets; job-loss module uses **TFSA first**, RRSP with marginal tax (user `marginal_tax_rate_pct`). Multi-debt + retirement engines unchanged.

---

### 3.3 Locale expansion priority

```text
Phase 1 (done / in flight): IN + US employed W-2
Phase 2: US v1.1 toggles (Rule of 55, SECURE 2.0, vesting) — see employee deep-dive
Phase 3: IN spec symmetry + HSA (US)
Phase 4: CA locale (TFSA/RRSP split)
Phase 5: UK locale (ISA-only bridge, SMI note)
```

---

## 4. US adjacent products (not in employee deep-dive)

### 4.1 HSA as job-loss liquidity sleeve

**Real world ([IRS Pub 969](https://www.irs.gov/publications/p969), [Form 8889 instructions](https://www.irs.gov/instructions/i8889)):**

- HSA **stays with employee** after job loss.
- **Tax-free withdrawals** for: **COBRA premiums**, **health premiums while receiving unemployment**, LTC premiums, Medicare (65+).
- Non-qualified withdrawal: income tax + **20% penalty** (unless 65+).
- No “tranche” rule — user chooses amount.

**Product implication:** HSA fills a gap 401(k) cannot (premium bridge without 10% penalty).

| Option | Pros | Cons |
|--------|------|------|
| **A — Ignore (non-goal)** | Simple | Misses realistic job-loss path |
| **B — Optional `hsa_balance_usd` + premium draw** | Honest; small input surface | Another bucket |
| **C — Merge into cash** | No UI change | Misleading tax treatment |

**Recommendation:** **Option B for US v1.2** — fields:

```text
hsa_balance_usd
monthly_health_premium_usd   — default 0; if > 0 and job_loss, allow draw up to min(balance, premium)
```

No penalty when `job_loss_mode` and draw tagged `QUALIFIED_PREMIUM`. Cross-link §4.8 cashflow.

---

### 4.2 PMI and escrow

**Real world ([CFPB](https://www.consumerfinance.gov/ask-cfpb/when-can-i-remove-private-mortgage-insurance-pmi-from-my-loan-en-202/), [HPA / FDIC](https://www.fdic.gov/consumer-compliance-examination-manual/v-5-homeowners-protection-act)):**

- Borrower may cancel PMI at **80% LTV** (request); servicer **auto-terminates at 78%** scheduled LTV.
- Escrow (taxes + insurance) is separate from P&I.

**Product implication:** Prepay accelerates LTV; PMI drop affects monthly outflow but not amortisation math core.

| Option | Pros | Cons |
|--------|------|------|
| **A — Non-goal (current)** | Avoids property value input | Monthly budget understated |
| **B — Flat `pmi_monthly_usd` until user clears** | Easy | Manual |
| **C — Auto PMI off at 78% LTV** | Realistic | Needs `property_value_usd` |

**Recommendation:** **Option B for v1.1** optional field; **Option C deferred** (needs home value). Reinforce in SPEC-US §11.

**Numeric example:** $400k loan, 10% down → PMI ~$150–250/mo user-entered; drops when user toggles “PMI ended” or LTV helper added later.

---

### 4.3 Adjustable-rate mortgages (ARM) & `GAME_FLOATING_N`

**Real world ([Stanton ARM paper](http://faculty.haas.berkeley.edu/stanton/pdf/ARMindices.pdf), [Investopedia periodic cap](https://www.investopedia.com/terms/p/periodiccap.asp)):**

Periodic rate update (annual example):

```text
C_t = max(C_min, C_{t-1} - Δ, min(I_t + margin, C_{t-1} + Δ, C_max))
```

Where `I_t` = index, `margin` = lender spread, `Δ` = periodic cap, `C_max` = lifetime cap.

**Product implication:** SPEC §11 blocks **stochastic** rate simulation; Tier P2 `GAME_FLOATING_N` is design-only.

| Option | Description |
|--------|-------------|
| **A — Deterministic stress paths** | Nature picks from `{+2%, 0%, -1%}` per adjustment — no Monte Carlo |
| **B — Single shock** | +2% at month 60 only — minimal |
| **C — Full stochastic** | Non-goal |

**Recommendation:** **Option A** when promoting `GAME_FLOATING_N` — discrete rate paths in JSON fixtures; document in §4.13.8 P2 note. **Do not** add floating EMI to main loan tab until spec revision.

---

### 4.4 Wash sales & NIIT

**Real world:** US wash-sale rules block loss recognition if repurchasing within 30 days; NIIT adds 3.8% above income thresholds.

**Recommendation:** **Reinforce non-goals** — brokerage sleeve uses user `ltcg_rate_pct` only; no lot-level tracking. Already aligned with employee deep-dive Topic 6.

---

## 5. Game theory Tier P2 (`§4.13.8`)

### 5.1 `GAME_MULTI_CREDITOR`

**Real world:** Primary mortgage + HELOC + personal loan — prepay order affects total interest; lender fee games multiply.

**Research note:** Avalanche engine handles **N debts** in `src/lib/debt/` but **game module** oracle assumes **one** amortisation loan.

| Option | Pros | Cons |
|--------|------|------|
| **A — 2-loan BL game** | Borrower picks which loan gets lump | 2× oracle calls |
| **B — Full N-creditor** | General | Combinatorial explosion |
| **C — Stay blocked** | Stable | No multi-loan games |

**Recommendation:** **Option A** as first promotion — max **2 loans** in game profile; use existing debt ordering for automatic cascade. Update §11 non-goals when promoted.

---

### 5.2 `GAME_REPEATED_LENDER`

**Real world:** Lenders adjust fees based on relationship / repeat prepay behaviour — rarely formalized for retail.

**Recommendation:** **Document only** — requires `horizon_months` discount factor policy. Defer until P0 games ship.

---

### 5.3 `GAME_FLOATING_N`

See §4.3 — pair with deterministic rate path enum `N_RATE_PATH_{UP,FLAT,DOWN}`.

---

## 6. Personas beyond employed W-2

### 6.1 Self-employed / 1099 (US)

| Feature | W-2 employee | Self-employed |
|---------|--------------|---------------|
| Employer match | Formula §4.2 | **0** or user override |
| UI income | Unemployment insurance | **None** — user `monthly_other_income_usd` |
| Retirement | 401(k) | **Solo 401(k) / SEP-IRA** — higher limits, no match |
| Job-loss 401(k) bridge | Staged fiction | Same math if user enters vested balance |

**Recommendation:** **Not a new locale** — add **persona preset** in US §3: `employment_type: w2 | self_employed` zeroing match and UI defaults. SEP contribution limit warning optional (IRS §415).

---

### 6.2 Gig / part-time

**Recommendation:** Subset of self-employed — lower tier presets (Tier C). No separate research track.

---

## 7. Consolidated recommendations

| # | Decision | Target |
|---|----------|--------|
| 1 | Promote IN §4.10–§4.11 | `docs/SPEC.md` |
| 2 | Close IN §13 Q1–Q3 | `docs/SPEC.md` §4.4, §4.7, §13 |
| 3 | US HSA optional bucket | `docs/SPEC-US.md` §4.2 / §4.8 v1.2 |
| 4 | US flat PMI optional | `docs/SPEC-US.md` §4.1 v1.1 |
| 5 | UK / CA locales | **Defer** — architecture notes in §3 above |
| 6 | ARM / multi-creditor games | Tier P2 design; deterministic paths only |
| 7 | Self-employed persona | US §3 preset; not new locale |

---

## 8. Spec delta (when accepted)

### `docs/SPEC.md`

- [ ] Add **§4.10 Multi-debt payoff planner** (mirror US §4.10; INR; reference `src/lib/debt/`).
- [ ] Add **§4.11 Retirement planner** (mirror US §4.11 without SS field).
- [ ] **§4.4** — normative: baseline EMI snapshot for `recompute_tenure_keep_emi`.
- [ ] **§4.7** — one-line EPFO fiction disclaimer.
- [ ] **§13** — remove resolved Q1–Q3; keep game questions Q4–Q7.

### `docs/SPEC-US.md`

- [ ] **§4.2** — optional `hsa_balance_usd` (v1.2).
- [ ] **§4.1** — optional `pmi_monthly_usd` (v1.1).
- [ ] **§3** — `employment_type` persona preset.
- [ ] **§11** — explicit: UK/CA locales, wash sales, ARM stochastic sim.
- [ ] **§4.13.8 P2** — cross-link this doc for `GAME_FLOATING_N` / `GAME_MULTI_CREDITOR`.

---

## 9. Sources

| # | Topic | URL |
|---|-------|-----|
| 1 | RBI home loan FAQ | https://www.rbi.org.in/Scripts/FAQDisplay.aspx?Id=77 |
| 2 | ICICI prepayment | https://www.icici.bank.in/personal-banking/loans/home-loan/prepayment-calculator |
| 3 | UK workplace pensions | https://www.gov.uk/workplace-pensions/changing-jobs-and-taking-leave |
| 4 | UK early pension access | https://www.firstwealth.co.uk/article/can-you-withdraw-from-your-pension-before-55 |
| 5 | UK mortgage job loss / SMI | https://www.richquid.co.uk/guides/what-happens-to-my-mortgage-if-i-lose-my-job |
| 6 | Canada RRSP withdrawal | https://www.wealthsimple.com/en-ca/learn/withdraw-rrsp-without-paying-tax |
| 7 | Canada mortgage prepay / IRD | https://loanscanada.ca/mortgage/ontario/ |
| 8 | IRS HSA Pub 969 | https://www.irs.gov/publications/p969 |
| 9 | IRS Form 8889 (qualified premiums) | https://www.irs.gov/instructions/i8889 |
| 10 | CFPB PMI cancellation | https://www.consumerfinance.gov/ask-cfpb/when-can-i-remove-private-mortgage-insurance-pmi-from-my-loan-en-202/ |
| 11 | FDIC Homeowners Protection Act | https://www.fdic.gov/consumer-compliance-examination-manual/v-5-homeowners-protection-act |
| 12 | ARM valuation / caps | http://faculty.haas.berkeley.edu/stanton/pdf/ARMindices.pdf |
| 13 | Periodic rate cap explainer | https://www.investopedia.com/terms/p/periodiccap.asp |

---

**End of research spike**

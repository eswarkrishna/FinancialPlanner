# US employee benefits mapping (India parity)

**Date:** 2026-07-01  
**Question:** What US equivalents should FinancialPlanner model so US employees get the same planner surfaces as the India (IN) locale?  
**Constraints:** SPEC §11 non-goals (no legal/tax advice); offline-first; educational disclaimers; mirror IN feature tabs without duplicating solver logic unnecessarily.

---

## Feature parity matrix

| IN locale (SPEC §) | US locale (SPEC-US §) | Notes |
|--------------------|------------------------|-------|
| PF corpus (`pf_corpus_inr`) | 401(k) vested balance (`k401_vested_balance_usd`) | User-entered; optional Roth sub-balance later |
| Monthly PF addition | Employee deferral + employer match | Match modeled as % of salary capped annually |
| EPFO unemployment 75%/25% tranches (§4.7) | 401(k) unemployment bridge 50%/50% tranches (US§4.7) | **Simplified educational rule**, not IRS hardship compliance |
| Gold liquidation | Taxable brokerage (`brokerage_liquid_usd`) | Optional haircut; no India-specific gold asset |
| EMI / home loan | Mortgage monthly payment | Same annuity math; USD cents rounding |
| LTCG 12.5% above ₹1.25L (§4.12) | LT cap gains at `ltcg_rate_pct` on gain (US§4.12) | User rate default 15%; no wash-sale modeling |
| Tier A/B/C take-home (₹) | Tier A/B/C take-home ($) | US§4.12.4 presets |
| Multi-debt avalanche/snowball | Same strategies | US§4.10 — currency only |
| Retirement corpus SIP (§4.11 in code) | Retirement + optional Social Security (US§4.11) | Add SS monthly benefit input |
| Game theory PF routes (§4.13) | Game theory 401(k) routes (US§4.13) | Rename actions; penalty in payoff |

---

## Options for unemployment + retirement-account access

### A — Penalty withdrawal with staged tranches (recommended)

- **Tranche 1:** end of month 1 of unemployment → up to **50%** of **vested** 401(k) balance.  
- **Tranche 2:** end of month 12 → remainder of vested balance.  
- Apply **10% early-withdrawal penalty** + **marginal tax withholding** (`early_withdrawal_tax_withholding_pct`, default 22%) on gross withdrawal amounts routed to cash (not on amounts routed directly to loan prepay if product allows gross-up — **default: penalty applies to all cash-bound withdrawals**).

**Pros:** Mirrors IN staged PF UX; easy to test; clear warnings.  
**Cons:** Not how real 401(k) hardship rules work.

### B — Hardship-only gate

Allow withdrawal only if `hardship_reason` selected (medical, foreclosure, etc.).

**Pros:** Closer to plan-document language.  
**Cons:** High legal variance; poor fit for generic planner.

### C — Roth contribution basis only

First tranche = Roth contributions (no penalty); earnings penalized.

**Pros:** Teaches Roth vs pre-tax.  
**Cons:** More inputs; still not tax advice.

**Recommendation:** **A** for v1 US locale; document in US§4.7; add **C** as v1.1 optional `k401_account_type` if product wants.

---

## Options for employer match

### A — Simple match formula (recommended)

`employer_match_usd = min(employee_deferral_usd, salary × match_cap_pct) × match_rate_pct` per month, annualized cap optional v1.1.

### B — User-entered flat match

`monthly_employer_match_usd` only.

**Recommendation:** **A** with override field for power users.

---

## Sources (desk research, non-legal)

- IRS Topic 558 — additional tax on early distributions (10% penalty overview).  
- IRS Publication 590-B — IRA distribution timing (context only).  
- SSA benefit calculators — Social Security estimates are user-entered in v1.  
- CFPB — mortgage amortization (same formula as IN EMI).

---

## Spec delta (accepted → `docs/SPEC-US.md`)

1. Add **`docs/SPEC-US.md`** as US locale source of truth; IN remains `docs/SPEC.md`.  
2. Introduce `locale: "IN" | "US"` at app shell; default `IN` until US UI ships.  
3. Map all `*_inr` fields to `*_usd` with **cent rounding** (`roundUsd`).  
4. Replace PF module with **401(k) module** (US§4.7) using staged tranche recommendation **A**.  
5. Replace gold with **brokerage** in asset mix (US§4.2).  
6. Add **Social Security** optional input to retirement (US§4.11).  
7. Add US reference scenario (US§15) and golden fixture paths under `src/test/fixtures/goldens-us/`.  
8. US disclaimer text (US§14) — IRS / SSA / lender verify language.

---

## Open product calls

1. Single 401(k) bucket vs split Traditional/Roth in v1? → **Single bucket v1**.  
2. Show state income tax on early withdrawal? → **Defer**; federal withholding only in v1.  
3. Unemployment insurance (`monthly_uib_usd`) as income in cashflow? → **Yes**, default 0.

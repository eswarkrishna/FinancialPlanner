---
name: sdd-verify-feature
description: Verifies a FinancialPlanner feature end-to-end against docs/SPEC.md acceptance and product intent. Use when validating a feature is done, before merge, when mapping §10 to checks, or when the user asks for acceptance testing, sign-off, or definition of done.
---

# Verify feature

## Preconditions

- **`docs/SPEC.md`**: governing **§§** for the feature are known; map acceptance from **§10** (and any new bullets you added for this slice).
- **`docs/TASKS.md`**: check off **Phase 3** (automated verification) and **Phase 4** (feature sign-off) as you complete each row — that file is the detailed task list next to the spec.

## §10 acceptance index (`docs/SPEC.md` §10)

Use this table when mapping **§10.1–§10.7** to tests or manual checks (update if SPEC numbering changes).

| §10 | Topic | Typical verification |
|-----|--------|-------------------------|
| **10.1** | EMI reference loan | Vitest `computeEmi` / amortisation; align with **README** rounding note. |
| **10.2** | Baseline total interest | Automated or spreadsheet tolerance; extend when a locked golden exists. |
| **10.3** | Prepay ₹25L + keep EMI payoff month | Vitest `schedulePrepayKeepEmi` band (~62 ±1). |
| **10.4** | Prepay ₹25L + keep tenure EMI ~ half | Vitest `schedulePrepayKeepTenure` vs baseline EMI. |
| **10.5** | PF unemployment tranches | Unit tests when `src/lib` implements PF schedule; else **manual / N/A** with PR note. |
| **10.6** | Cashflow shortfall flag | Tests when unemployment cashflow exists in app; else **manual / N/A** with PR note. |
| **10.7** | Monthly inflow to loan shortens payoff | Vitest `scheduleFixedEmiWithMonthlyExtra` vs baseline; **manual:** set **Monthly cash to loan** in UI, confirm comparison table and schedule. |

## Steps

1. **Test mapping:** Each relevant **§10** row above → a **Vitest** test **or** an explicit **manual** check (list manual ones in the PR). Use **`sdd-verify-with-tests`** for goldens, rounding, and lib-level contracts.  
2. **Automated:** Run `npm run test` and `npm run build` (and `npm run lint` if TypeScript/config touched).  
3. **Manual smoke:** `npm run dev` — exercise new UI paths; confirm errors, empty states, and **§14** footer where relevant. For loan scenarios: **comparison table**, **schedule** dropdown (BASE, prepay, **monthly inflow** variants when X &gt; 0).  
4. **Regression:** Neighbouring scenarios (BASE, prepay tenure/EMI, **BASE + monthly inflow**, prepay + inflow if principal allows).  
5. **Record gaps:** If verification reveals missing spec detail, note under **§13** or open a follow-up (see **`sdd-record-learning`**). Update **`docs/TASKS.md`** checkboxes through Phase 4 before calling the feature done.

## Definition of done (default)

- [ ] §10 coverage or justified exception (per-row notes in PR if N/A)  
- [ ] No new linter/type errors  
- [ ] Production build succeeds  

## Examples

- “Verify PF tranche months” → **§10.5** — unit tests for `U` and `U+11` + one unemployment scenario row check.  
- “Sign off prepay keep EMI” → **§10.3** — compare payoff month band + schedule tail.  
- “Sign off monthly cash to loan” → **§10.7** — Vitest strict inequality vs baseline + UI smoke for comparison column **Faster vs BASE**.

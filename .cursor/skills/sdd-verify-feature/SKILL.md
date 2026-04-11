---
name: sdd-verify-feature
description: Verifies a FinancialPlanner feature end-to-end against docs/SPEC.md acceptance and product intent. Use when validating a feature is done, before merge, when mapping §10 to checks, or when the user asks for acceptance testing, sign-off, or definition of done.
---

# Verify feature

## Preconditions

- **`docs/SPEC.md`**: governing **§§** for the feature are known; map acceptance from **§10** (and any new bullets you added for this slice).
- **`docs/TASKS.md`**: check off **Phase 3** (automated verification) and **Phase 4** (feature sign-off) as you complete each row — that file is the detailed task list next to the spec.

## Steps

1. **Test mapping:** Each relevant **§10** bullet → a **Vitest** test **or** an explicit **manual** check (list the manual ones in the PR). Use **`sdd-verify-with-tests`** for goldens, rounding, and lib-level contracts.  
2. **Automated:** Run `npm run test` and `npm run build` (and `npm run lint` if TypeScript/config touched).  
3. **Manual smoke:** `npm run dev` — exercise new UI paths; confirm errors, empty states, and **§14** footer where relevant.  
4. **Regression:** Run scenarios that neighbour the change (e.g. BASE + prepay presets if amortisation changed).  
5. **Record gaps:** If verification reveals missing spec detail, note under **§13** or open a follow-up (see **`sdd-record-learning`**). Update **`docs/TASKS.md`** checkboxes through Phase 4 before calling the feature done.

## Definition of done (default)

- [ ] §10 coverage or justified exception  
- [ ] No new linter/type errors  
- [ ] Production build succeeds  

## Examples

- “Verify PF tranche months” → unit tests for `U` and `U+11` + one unemployment scenario row check.  
- “Sign off prepay keep EMI” → compare payoff month band to §10 + schedule tail.

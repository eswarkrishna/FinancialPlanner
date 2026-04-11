---
name: sdd-verify-feature
description: Verifies a FinancialPlanner feature end-to-end against docs/SPEC.md acceptance and product intent. Use when validating a feature is done, before merge, when mapping §10 to checks, or when the user asks for acceptance testing, sign-off, or definition of done.
---

# Verify feature

## Preconditions

- SPEC § and (if applicable) **§10 acceptance** bullets for this feature are known.

## Steps

1. **Test mapping:** Each §10 bullet → a **Vitest** test or documented manual check. Use **`sdd-verify-with-tests`** for goldens, rounding, and lib-level contracts.  
2. **Automated:** Run `npm run test` and `npm run build` (and `npm run lint` if TypeScript/config touched).  
3. **Manual smoke:** `npm run dev` — exercise new UI paths; confirm errors, empty states, and **§14** footer where relevant.  
4. **Regression:** Run scenarios that neighbour the change (e.g. BASE + prepay presets if amortisation changed).  
5. **Record gaps:** If verification reveals missing spec detail, note under **§13** or open a follow-up (see **`sdd-record-learning`**).

## Definition of done (default)

- [ ] §10 coverage or justified exception  
- [ ] No new linter/type errors  
- [ ] Production build succeeds  

## Examples

- “Verify PF tranche months” → unit tests for `U` and `U+11` + one unemployment scenario row check.  
- “Sign off prepay keep EMI” → compare payoff month band to §10 + schedule tail.

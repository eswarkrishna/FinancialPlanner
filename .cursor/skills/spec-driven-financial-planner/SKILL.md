---
name: spec-driven-financial-planner
description: Implements domain logic and UI for FinancialPlanner per docs/SPEC.md. Use when adding loan simulation, prepayment policies, unemployment PF flows, scenario presets, exports, Zod inputs, React tables, or domain-specific tests; or when the user mentions FinancialPlanner, EMI, amortisation, PF tranches, or SPEC §4–§9.
---

# Spec-driven FinancialPlanner (domain)

## When this skill applies

Use for **domain and UI** work: formulas, schedules, scenarios, components—not for editing the spec document itself (use **`sdd-spec-change-first`**) or commit message hygiene (use **`sdd-commit-and-review`**).

## Workflow

1. Open **`docs/SPEC.md`** and locate the governing section (§4–§10).  
2. Implement the **smallest** change that satisfies that section.  
3. Add or update tests per **`sdd-verify-with-tests`** (Vitest, §10, goldens in `src/test/fixtures/`).  
4. Update **`README.md`** only when user-facing defaults change (rounding, scripts).

## Canonical product rules

- **PF unemployment:** 75% of `PF0` at end of unemployment **month 1**; 25% at end of **month 12** relative to start month `U`; tranche2 month index **`U + 11`** (see §7.3).  
- **Prepayment policies:** `recompute_tenure_keep_emi` vs `recompute_emi_keep_tenure` exactly as §4.4.

## Do not

- Expand scope using §11 **Non-Goals** without a spec edit.  
- Encode legal, tax, or EPFO advice beyond the §14 disclaimer string in UI.

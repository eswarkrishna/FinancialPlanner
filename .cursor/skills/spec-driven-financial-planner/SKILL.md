---
name: spec-driven-financial-planner
description: Implements and maintains FinancialPlanner per docs/SPEC.md. Use when adding loan simulation, prepayment policies, unemployment PF flows, UI for scenarios, tests, goldens, or when the user mentions FinancialPlanner, EMI, amortisation, or spec sections.
---

# Spec-driven FinancialPlanner

## When this skill applies

Use for any change to **loan payoff simulation**, **scenario presets**, **PF unemployment tranches**, **exports**, or **tests** in this repository.

## Workflow

1. Open **`docs/SPEC.md`** and locate the governing section (§4–§10).  
2. Implement the **smallest** change that satisfies that section.  
3. Add or update **Vitest** coverage tied to §10 acceptance criteria.  
4. If outputs are snapshot-like, add **JSON goldens** under `src/test/fixtures/` and name them by scenario id (`BASE`, `PREPAY_CASH_25L_TENURE`, etc.).  
5. Update **`README.md`** only when user-facing defaults change (rounding, scripts).

## Canonical product rules

- **PF unemployment:** 75% of `PF0` at end of unemployment **month 1**; 25% at end of **month 12** relative to start month `U`; tranche2 month index **`U + 11`** (see §7.3).  
- **Prepayment policies:** `recompute_tenure_keep_emi` vs `recompute_emi_keep_tenure` exactly as §4.4.

## Do not

- Expand scope using §11 **Non-Goals** without a spec edit.  
- Encode legal, tax, or EPFO advice beyond the §14 disclaimer string in UI.

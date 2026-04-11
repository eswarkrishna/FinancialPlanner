---
name: sdd-implement-from-spec
description: Implements a FinancialPlanner feature strictly from docs/SPEC.md. Use when the user asks to build, add, or code a spec item; when mapping SPEC § to src/lib or src UI; or when starting implementation after requirements are agreed.
---

# Implement from spec

## Preconditions

- **`docs/SPEC.md`** already describes the behaviour (if not, use **`sdd-spec-change-first`** first).
- Identify the **exact §** (e.g. §4.7 PF unemployment) and any **scenario ids** in §4.6 / §10.

## Steps

1. **Trace:** List files to touch (`src/lib/`, `src/App.tsx`, schemas). Prefer **pure domain** in `src/lib/`; UI only orchestrates.  
2. **Minimal diff:** Implement only what the § requires; defer §11 non-goals.  
3. **Pair with domain skill:** Use **`spec-driven-financial-planner`** for loan/PF/UI specifics.  
4. **Exit:** Leave hooks for **`sdd-verify-feature`** / **`sdd-verify-with-tests`** before calling work “done”.

## Output expectations

- Code + types aligned with SPEC field names where helpful (`principal_inr`, policies in §4.4).  
- If UI exposes new inputs, wire **Zod** (§12) and show §14 disclaimer where user-facing advice could be misread.

## Examples

- “Implement §4.8 cash_balance shortfall flag” → lib + one UI warning + tests.  
- “Add PREPAY_CUSTOM preset” → §4.6 table + scenario builder + tests.

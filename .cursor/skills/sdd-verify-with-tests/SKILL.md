---
name: sdd-verify-with-tests
description: Binds FinancialPlanner implementation to docs/SPEC.md through tests and fixtures. Use when adding or changing src/lib simulation, EMI, amortisation, prepayment, PF unemployment, exports, or when the user mentions Vitest, goldens, fixtures, §10 acceptance, or rounding.
---

# Verify with tests (SDD)

## When to use

After requirements are clear (see **`sdd-spec-change-first`**), for any **executable behaviour** under `src/lib/` or scenario outputs.

## Rules

1. **Rounding:** Match **`README.md`** money policy (paise, half-up) and document any change there and in §4.1 if the spec lists `rounding_mode`.
2. **§10 acceptance:** Add or adjust **Vitest** tests so each new requirement has a failing-then-passing test or an explicit numeric tolerance (e.g. EMI within ₹1 only if the spec says so).
3. **Goldens:** For stable multi-row outputs (schedules, scenario JSON), store fixtures under **`src/test/fixtures/`** with names tied to scenario ids (`BASE`, `PREPAY_CASH_25L_TENURE`, `UE_PF_TO_LOAN`, etc.). Update goldens when the spec intentionally changes numbers.
4. **Off-by-one:** PF tranche months (§7.3) and prepayment month boundaries (§4.4) get **dedicated tests** with comments citing the spec section.
5. **UI:** Prefer testing **pure logic** in `src/lib/`; component tests only when UI logic is non-trivial.

## Do not

- Loosen tests to hide bugs; if the spec is wrong, fix **SPEC** first.  
- Add goldens for volatile debug output; only for contract-stable exports.

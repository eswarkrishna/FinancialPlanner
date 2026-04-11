---
name: sdd-improve-test-harness
description: Improves FinancialPlanner test infrastructure, fixtures, and developer feedback loops. Use when refactoring Vitest setup, adding helpers or factories, stabilising flakes, organising src/test/fixtures, CI scripts, or when the user asks to harden, speed up, or simplify tests.
---

# Improve test harness

## Scope

- **Config:** `vitest.config.ts`, `tsconfig`, path aliases, `jsdom` env.  
- **Fixtures:** `src/test/fixtures/` naming (`BASE.json`, scenario ids from §4.6), README in fixtures if needed.  
- **Helpers:** shared builders for `LoanInput`, schedule snapshots, rounding assertions.  
- **Quality:** reduce duplication; prefer **table-driven** tests for month grids; avoid timing flakes (no real timers unless needed).

## Steps

1. Identify pain: slow tests, duplicate setup, unclear golden update process, missing coverage on edge §.  
2. Refactor harness **without** changing product behaviour unless fixing a test bug; if product changes, **`sdd-spec-change-first`**.  
3. Document **how to update goldens** (one short subsection in `src/test/fixtures/README.md` or root README).  
4. Run full **`npm run test`** after harness moves.

## Do not

- Weaken assertions to greenwash; fix source or SPEC instead.  
- Add network-dependent tests for v1 offline-first product (SPEC §5).

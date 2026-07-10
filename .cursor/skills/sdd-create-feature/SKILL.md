---
name: sdd-create-feature
description: Creates a new FinancialPlanner feature end-to-end using docs/SPEC.md as source of truth. Use when the user asks to add, build, implement, or ship a feature; when starting work from a vague idea; or when coordinating spec, code, tests, docs, and verification in one delivery.
---

# Create a feature

Use this as the **default playbook** for a single vertical slice of product value. Delegate details to the specialised skills listed in each phase.

**Canonical detailed checklist (mark `[x]` when done):** [`docs/TASKS.md`](../../../docs/TASKS.md). Update `docs/TASKS.md` when phases in this file change. Pointer: [TASKS.md](./TASKS.md).

## Phase 0 — Intake

- Restate the **user outcome** in one sentence.  
- If unknowns dominate (APIs, math, policy), run **`sdd-research-spike`** → `docs/research/YYYY-MM-slug.md` before locking behaviour.

## Phase 1 — Requirements

- If **`docs/SPEC.md`** does not yet define the behaviour, run **`sdd-spec-change-first`**: §4–§9 detail, **§10** acceptance bullets, **§11** if excluding scope, **§13** if still ambiguous, bump spec version when material.

## Phase 2 — Implementation

- Run **`sdd-implement-from-spec`**: map § to `src/lib/` then UI; use **`spec-driven-financial-planner`** for loan/PF/domain specifics.  
- Keep the diff **minimal**; no §11 expansion without a spec edit.

## Phase 3 — Automated verification

- Run **`sdd-verify-with-tests`**: Vitest, §10 mapping, goldens under `src/test/fixtures/` when outputs are stable, **README** rounding if money logic changed.

## Phase 4 — Feature sign-off

- Run **`sdd-verify-feature`**: `npm run test`, `npm run build`, `npm run lint` when relevant, manual smoke via `npm run dev`, regression on neighbouring scenarios.

## Phase 5 — Harness & knowledge (as needed)

- If tests were painful or flaky: **`sdd-improve-test-harness`**.  
- After merge or meaningful learning: **`sdd-record-learning`** → `docs/LEARNINGS.md`.  
- If architecture or onboarding changed: **`sdd-create-overview`** → `docs/OVERVIEW.md`.

## Phase 6 — Ship

- **`sdd-commit-and-review`**: commits / PR cite SPEC **§**; checklist before merge.
- **`CHANGELOG.md`**: add user-facing bullets under `[Unreleased]` during the PR; on merge to `main`, move them into a dated `[x.y.z]` section.

## Quick checklist

- [ ] SPEC governs behaviour; §10 has checks  
- [ ] Code + tests merged intent  
- [ ] **CHANGELOG.md** updated for user-visible changes  
- [ ] OVERVIEW / LEARNINGS updated only when useful  

## Do not

- Skip **SPEC** updates when behaviour changes.  
- Mark “done” without **`sdd-verify-feature`** (automated + smoke).

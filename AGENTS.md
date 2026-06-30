# Agent instructions — FinancialPlanner

This repository is **spec-driven**. Treat `docs/SPEC.md` as the source of truth for product behaviour, formulas, scenarios, and acceptance tests.

**Orientation:** For stakeholders and architecture, see **`docs/OVERVIEW.md`**.

## Before implementing

1. Read the relevant sections of `docs/SPEC.md` (note section numbers in PR/commit messages when useful).  
2. Prefer **small, test-backed changes** that map to a spec subsection (e.g. §4.3 baseline EMI, §4.4 prepayment policies).  
3. When behaviour changes, update **unit tests** and any **golden JSON** under `src/test/fixtures/` (create that tree when you add goldens per §10).

## Engineering defaults

- **Stack:** Vite + React + TypeScript (see `package.json`).  
- **Validation:** Zod for user inputs when you add forms (§12).  
- **Money rounding:** Document the chosen policy in `README.md` and use it consistently (§4.1 `rounding_mode`).

## Do not

- Implement features marked **Non-Goals** in §11 without an explicit spec revision.  
- Give legal, tax, or EPFO compliance advice in code comments beyond the §14 disclaimer text in UI.

## Cursor project assets

- Rules: `.cursor/rules/`  
- Hooks: `.cursor/hooks.json` + `.cursor/hooks/` (session context injection, etc.)

### Spec-driven development skills (`.cursor/skills/`)

**New feature (full slice):** start with **`sdd-create-feature`** — it orchestrates the phases below. **Detailed checklist (with `[ ]` / `[x]`):** [`docs/TASKS.md`](docs/TASKS.md).

Lifecycle order (typical feature):

| Order | Skill | Role |
|------:|-------|------|
| ★ | `sdd-create-feature` | **Orchestrate** delivery: intake → spec → code → tests → sign-off → docs → ship. |
| 0 | `sdd-research-spike` | Uncertainly / options → `docs/research/*.md` → recommendation. |
| 1 | `sdd-spec-change-first` | Edit **`docs/SPEC.md`** when requirements change. |
| 2 | `sdd-implement-from-spec` | Map § to code; minimal implementation. |
| 3 | `spec-driven-financial-planner` | Domain + UI specifics (EMI, PF, React, Zod). |
| 4 | `sdd-verify-with-tests` | Vitest, §10 contracts, goldens, rounding. |
| 5 | `sdd-verify-feature` | End-to-end sign-off: test map + build + manual smoke. |
| 6 | `sdd-improve-test-harness` | Refine fixtures, helpers, Vitest config, stability. |
| 7 | `sdd-record-learning` | **`docs/LEARNINGS.md`** dated entries. |
| 8 | `sdd-create-overview` | Keep **`docs/OVERVIEW.md`** accurate for onboarding. |
| — | `sdd-commit-and-review` | Commits / PRs cite SPEC §; review checklist. |

**Note:** `sdd-verify-with-tests` focuses on **automated contracts**; `sdd-verify-feature` adds **acceptance mapping and manual checks**. Use both before calling a feature done.

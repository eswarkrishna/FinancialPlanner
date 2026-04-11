# Agent instructions — FinancialPlanner

This repository is **spec-driven**. Treat `docs/SPEC.md` as the source of truth for product behaviour, formulas, scenarios, and acceptance tests.

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

| Skill | Role |
|-------|------|
| `spec-driven-financial-planner` | Domain + UI: EMI, amortisation, scenarios, PF flows, React/Zod. |
| `sdd-spec-change-first` | Edit **`docs/SPEC.md`** before code when requirements change. |
| `sdd-verify-with-tests` | Vitest, §10 acceptance, **`src/test/fixtures/`** goldens, rounding contract. |
| `sdd-commit-and-review` | Commits and PRs cite SPEC §; review checklist. |

# Tasks run for `sdd-create-feature`

Ordered checklist for **one vertical feature**. Each row is a **task** the agent (or human) should run or explicitly skip with a reason.  
Cross-skill detail lives in the linked **`.cursor/skills/<name>/SKILL.md`** files.

| # | Task | Phase | Delegated skill | Primary artifacts / commands |
|---|------|-------|-----------------|------------------------------|
| 0.1 | Restate user outcome in one sentence | 0 | _(none)_ | Chat / PR description |
| 0.2 | If unknowns dominate: open research doc | 0 | `sdd-research-spike` | `docs/research/YYYY-MM-slug.md` |
| 1.1 | Confirm behaviour exists in SPEC; if not, edit SPEC | 1 | `sdd-spec-change-first` | `docs/SPEC.md` §4–§9 |
| 1.2 | Add or tighten **§10** acceptance bullets for this feature | 1 | `sdd-spec-change-first` | `docs/SPEC.md` §10 |
| 1.3 | Update **§11** if scope is explicitly excluded | 1 | `sdd-spec-change-first` | `docs/SPEC.md` §11 |
| 1.4 | Add **§13** notes if intentionally unresolved | 1 | `sdd-spec-change-first` | `docs/SPEC.md` §13 |
| 1.5 | Bump SPEC **Version** when behaviour or acceptance changes materially | 1 | `sdd-spec-change-first` | `docs/SPEC.md` header |
| 2.1 | Map SPEC § to files (`src/lib/`, UI) | 2 | `sdd-implement-from-spec` | Code plan / commits |
| 2.2 | Implement domain + UI per spec | 2 | `spec-driven-financial-planner` | `src/lib/*`, `src/*` |
| 2.3 | Keep diff minimal; no §11 scope without spec edit | 2 | `sdd-implement-from-spec` | _(constraint)_ |
| 3.1 | Map each relevant §10 bullet → Vitest or documented manual check | 3 | `sdd-verify-with-tests` | `src/**/*.test.ts` |
| 3.2 | Add/update golden JSON if schedule or exports are contract-stable | 3 | `sdd-verify-with-tests` | `src/test/fixtures/*` |
| 3.3 | Document rounding change if money semantics changed | 3 | `sdd-verify-with-tests` | `README.md` |
| 3.4 | Run `npm run test` | 3 | `sdd-verify-with-tests` | CI / local |
| 4.1 | Run `npm run build` | 4 | `sdd-verify-feature` | `dist/` |
| 4.2 | Run `npm run lint` when TS/config/UI types touched | 4 | `sdd-verify-feature` | `tsc --noEmit` |
| 4.3 | Manual smoke: `npm run dev` — new paths, errors, §14 disclaimer if relevant | 4 | `sdd-verify-feature` | Browser |
| 4.4 | Regression: neighbouring scenarios (e.g. BASE + prepay if amortisation changed) | 4 | `sdd-verify-feature` | Manual / tests |
| 4.5 | Record any SPEC gap → §13 or follow-up | 4 | `sdd-verify-feature` / `sdd-record-learning` | SPEC / issue |
| 5.1 | If harness was painful: refactor fixtures / Vitest / helpers | 5 | `sdd-improve-test-harness` | `vitest.config.ts`, `src/test/*` |
| 5.2 | After meaningful delivery: append **LEARNINGS** entry | 5 | `sdd-record-learning` | `docs/LEARNINGS.md` |
| 5.3 | If architecture/onboarding changed: update overview | 5 | `sdd-create-overview` | `docs/OVERVIEW.md` |
| 6.1 | Commit with SPEC **§** in body when behaviour-related | 6 | `sdd-commit-and-review` | Git |
| 6.2 | Open PR: summary, SPEC link, testing notes | 6 | `sdd-commit-and-review` | GitHub |
| 6.3 | Self-review: AGENTS + non-goals + disclaimer | 6 | `sdd-commit-and-review` | PR checklist |

## Copy-paste checklist (single feature)

Use in PR description or a scratch note; check when done or N/A.

- [ ] **0** Outcome stated; research doc only if needed  
- [ ] **1** SPEC updated; §10; version bump if material; §11/§13 as needed  
- [ ] **2** Code merged to intent; minimal diff  
- [ ] **3** Tests + goldens + README rounding if needed; `npm run test` green  
- [ ] **4** `npm run build` (+ `npm run lint` if applicable); manual smoke; regression  
- [ ] **5** Harness / LEARNINGS / OVERVIEW only if warranted  
- [ ] **6** Commits + PR cite SPEC §; review checklist  

## Skipping tasks

If a task is **N/A**, record one line (e.g. in PR): “5.2 N/A — no new learnings.” Do not skip **1.x**, **3.4**, **4.1**, or **4.3** without explicit team agreement.

## Maintenance

When **`SKILL.md`** phases change, update this table so **task #** and **skills** stay aligned.

# Feature delivery — task checklist

This file lives **next to** [`SPEC.md`](SPEC.md). It lists **detailed tasks** for **creating a feature** and **implementing code**, aligned with **`.cursor/skills/sdd-create-feature/SKILL.md`**.

## How to use

- Mark work **done** by changing `- [ ]` to `- [x]`.
- **Option A — track on a branch:** edit this file on your feature branch; merge with checkboxes showing completion (or reset template tasks to `[ ]` in a follow-up commit if you want `main` to stay a clean template).
- **Option B — keep `main` as template:** copy the **Feature block** into your PR description or `docs/research/YYYY-MM-feature.md` and check boxes there; leave this file all `[ ]` on `main`.
- If a task is **N/A**, mark it `[x]` and add a short *italic note* on the same line, e.g. `*(N/A: no UI change)*`.

---

## Feature block (copy for each feature)

| Field | Value |
|-------|-------|
| **Feature name** | Share on Facebook |
| **SPEC sections** | §5.1.1, §8 Analytics UI, §10.20a |
| **Branch / PR** | `cursor/facebook-share-post-193c` |
| **Started** | 2026-07-13 |

---

## Phase 0 — Intake & research

- [x] **0.1** Write the **user outcome** in one sentence (what changes for the borrower / tester). *Users can share the active planner tab on Facebook without exposing loan amounts.*
- [x] **0.2** List **assumptions** (rate type, rounding, offline-only, etc.). *Uses Facebook web sharer only; no Meta Pixel/SDK (§11).*
- [x] **0.3** List **open questions**; decide if any need **`sdd-research-spike`** before locking SPEC. *(N/A: sharer URL is standard)*
- [x] **0.4** If spike needed: create `docs/research/YYYY-MM-slug.md` with question, options, sources, recommendation. *(N/A)*
- [x] **0.5** If spike done: link it from PR and/or [`OVERVIEW.md`](OVERVIEW.md) when relevant. *(N/A)*

---

## Phase 1 — Requirements (`docs/SPEC.md`)

- [x] **1.1** Read current **§1–§3** for product / persona fit.
- [x] **1.2** Edit or add **functional** text in **§4** (correct subsection: inputs, engine, scenarios, UI, etc.). *(N/A: analytics/share UI only)*
- [x] **1.3** Update **§5** NFRs if determinism, privacy, a11y, or validation behaviour changes.
- [x] **1.4** Update **§6** data-model sketch if types / fields changed. *(N/A)*
- [x] **1.5** Update **§7** algorithm notes if month order, prepay timing, or PF tranche rules change. *(N/A)*
- [x] **1.6** Update **§8** UI if new screens, tables, or exports.
- [x] **1.7** Add **§9** edge cases / warnings for new failure modes. *(N/A)*
- [x] **1.8** Add or extend **§10** acceptance bullets (each testable or explicitly manual).
- [x] **1.9** Update **§11** non-goals if scope is explicitly refused. *(Meta Pixel already excluded)*
- [x] **1.10** Add **§13** open questions for anything deferred. *(N/A)*
- [x] **1.11** Bump **Version** in SPEC header when behaviour or acceptance changes materially. *(2.3 → 2.4)*
- [x] **1.12** Spell-check SPEC sections touched.

---

## Phase 2 — Implementation (code)

### 2.A Planning

- [x] **2.A.1** Map each new **§4** requirement to **files** (`src/lib/…`, `src/…`). *`shareUrl.ts`, `ShareFacebook.tsx`, `AppFooter`, analytics*
- [x] **2.A.2** Decide **pure lib** vs **React** boundary; keep finance logic out of UI where possible.
- [x] **2.A.3** Sketch **public functions / types** to add or change.

### 2.B Domain layer (`src/lib/`)

- [x] **2.B.1** Implement or extend **pure functions** (EMI, schedule, policies, cashflow, etc.). *`buildShareTabUrl` / `buildFacebookShareUrl`*
- [x] **2.B.2** Use **shared rounding** (`roundInr` / agreed policy); no ad-hoc `toFixed` unless spec says so. *(N/A)*
- [x] **2.B.3** Add **types** for inputs/outputs; align names with SPEC where helpful (`*_inr`, policy enums). *(N/A)*
- [x] **2.B.4** Handle **§9** edge cases (clamp prepay, guard zero tenure, etc.). *(N/A)*
- [x] **2.B.5** Add **`*.test.ts`** next to lib modules for new logic (happy path + one edge per function).
- [ ] **2.B.6** Run **`npm run test`** and fix failures before UI wiring.

### 2.C Validation (`Zod` / forms)

- [x] **2.C.1** Extend or add **Zod** schema to match SPEC **§4.1–4.2** (and new fields). *(N/A)*
- [x] **2.C.2** Ensure **coercion** and **error messages** match UX expectations. *(N/A)*
- [x] **2.C.3** Block invalid combinations per **§9** if applicable. *(N/A)*

### 2.D UI (`src/`, components)

- [x] **2.D.1** Add or update **components** / **`App.tsx`** for new inputs, toggles, or results.
- [x] **2.D.2** **Labels** on every control; associate **`<label htmlFor>`** (or `aria-label`) per **§5**.
- [x] **2.D.3** Show **validation errors** inline; avoid silent failure. *(N/A)*
- [x] **2.D.4** Add **empty / loading** states if data is async later (placeholder ok for v1 static sim). *(N/A)*
- [x] **2.D.5** Surface **§9** warnings in UI (copy or callout). *(N/A)*
- [x] **2.D.6** Keep **§14** disclaimer visible on screens that give financial projections. *(unchanged footer)*
- [x] **2.D.7** Update **`src/index.css`** (or CSS modules) for layout/readability only as needed. *(N/A: reuses btn-link)*

### 2.E Integration & hygiene

- [x] **2.E.1** Wire **parsed form state → lib → displayed results** (single direction of data flow). *(N/A: footer share only)*
- [x] **2.E.2** Remove **dead code**, **`console.log`**, and commented-out blocks before review.
- [ ] **2.E.3** Run **`npm run lint`** and fix new issues.
- [ ] **2.E.4** Run **`npm run build`** before opening PR.
- [x] **2.E.5** Self-review diff against **§11** (no sneaky non-goals).

---

## Phase 3 — Automated verification (tests & fixtures)

- [ ] **3.1** For each **§10** bullet: add **Vitest** **or** document a **manual** check in PR body.
- [ ] **3.2** Add **unit tests** for new **pure** functions (boundaries, rounding, month indices).
- [ ] **3.3** Add **regression tests** for neighbouring behaviour (e.g. BASE + existing prepay if amortisation touched).
- [ ] **3.4** Add or update **`src/test/fixtures/*.json`** if outputs are **contract-stable**; document update command in PR.
- [ ] **3.5** If rounding policy changed: update **`README.md`** and reference **§4.1**.
- [ ] **3.6** Run **`npm run test`** — all green.
- [ ] **3.7** Run **`npm run build`** — succeeds.

---

## Phase 4 — Feature sign-off (release quality)

- [ ] **4.1** Run **`npm run dev`** and **smoke-test** all new / changed UI paths.
- [ ] **4.2** Confirm **keyboard** focus order is sane on new controls.
- [ ] **4.3** Zoom / narrow viewport quick check if layout changed.
- [ ] **4.4** **Regression:** run scenarios that neighbour your change (same as **3.3** if not already automated).
- [ ] **4.5** If gap found: either fix code **or** file SPEC **§13** / follow-up issue — do not silently drift.
- [ ] **4.6** Re-run **`npm run test`** and **`npm run build`** after any fix from smoke.

---

## Phase 5 — Harness, learnings, overview (as needed)

- [ ] **5.1** If tests were **slow / flaky / duplicated**: refactor harness (**Vitest** config, helpers, fixtures).
- [ ] **5.2** Document **golden update** steps in `src/test/fixtures/README.md` (or root README) if missing.
- [ ] **5.3** Append **dated** entry to [`LEARNINGS.md`](LEARNINGS.md) if something non-obvious was learned.
- [ ] **5.4** Update [`OVERVIEW.md`](OVERVIEW.md) if architecture, stacks, or primary flows changed.

---

## Phase 6 — Ship (git & PR)

- [ ] **6.1** **Commits:** small, logical; **body cites SPEC §** when behaviour changes.
- [ ] **6.2** **PR title** clear; **description** has summary, **SPEC link**, **test plan**, screenshots if UI.
- [ ] **6.3** PR links **`docs/TASKS.md`** (or pasted checklist) with boxes checked for this delivery.
- [ ] **6.4** Update **[`CHANGELOG.md`](../CHANGELOG.md)** — bullets under `[Unreleased]` moved to a dated version on merge (or added before opening PR).
- [ ] **6.5** Self-review: **§11**, **§14**, **AGENTS.md** skill table still valid.
- [ ] **6.6** Request review / merge per team process.

---

## Quick reference — skills & commands

| Phase | Skill | Commands (typical) |
|-------|-------|---------------------|
| 0 | `sdd-research-spike` | _(write `docs/research/…`)_ |
| 1 | `sdd-spec-change-first` | edit `docs/SPEC.md` |
| 2 | `sdd-implement-from-spec`, `spec-driven-financial-planner` | `npm run lint`, `npm run build` |
| 3 | `sdd-verify-with-tests` | `npm run test` |
| 4 | `sdd-verify-feature` | `npm run dev`, `npm run test`, `npm run build` |
| 5 | `sdd-improve-test-harness`, `sdd-record-learning`, `sdd-create-overview` | _(as needed)_ |
| 6 | `sdd-commit-and-review` | `git push`, open PR |

---

## Maintenance

When **`.cursor/skills/sdd-create-feature/SKILL.md`** phases change, update **this file** so tasks stay aligned. When **SPEC** structure changes section numbers, update references in Phase 1 tasks.

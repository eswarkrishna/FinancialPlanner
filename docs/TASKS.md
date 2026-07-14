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
| **Feature name** | Prepayment fee + Reduce EMI vs Tenure (gap-fill) |
| **SPEC sections** | §4.4.1, §4.4.2, §4.9, §10.48–51 |
| **Branch / PR** | `cursor/gap-fill-prepay-fee-fad2` / #45 |
| **Started** | 2026-07-14 |

---

## Phase 0 — Intake & research

- [x] **0.1** Write the **user outcome** in one sentence. *Borrowers see realistic net savings after foreclosure fees and can compare Reduce EMI vs Reduce Tenure side by side.*
- [x] **0.2** List **assumptions**. *Fee is cash outflow; default type `none`; one fee per one-time lump prepay.*
- [x] **0.3** List **open questions**. *(N/A for this slice; remaining gap-fill deferred)*
- [x] **0.4** If spike needed. *(N/A — backlog doc is product intake)*
- [x] **0.5** Link research. *`docs/research/2026-07-gap-fill-competitors.md`*

---

## Phase 1 — Requirements (`docs/SPEC.md`)

- [x] **1.1–1.12** SPEC v2.5: §4.1 fee fields, §4.4.1–4.4.2, §4.9 KPIs, §10.48–51, §11 deferred backlog.

---

## Phase 2 — Implementation (code)

- [x] **2.B** `src/lib/loan/prepaymentFee.ts` + comparison/strategy helpers
- [x] **2.C** Zod `prepayment_fee_*` on loan schema
- [x] **2.D** Loan fee inputs, comparison columns, `PrepayStrategyCompare` panel, KPI strip

---

## Phase 3 — Automated verification

- [x] **3.** Vitest: fee unit + comparison + LoanSection UI (§10.48–51); `npm run lint` / `build` clean

---

## Phase 4 — Feature sign-off

- [x] **4.** Tests + build + lint green on branch

---

## Phase 5 — Harness & knowledge

- [x] **5.** `docs/TEST-MAP.md`, `LEARNINGS.md`, `FEATURE-ROADMAP.md` A0, `OVERVIEW.md`

---

## Phase 6 — Ship

- [x] **6.** Commits cite SPEC §; `CHANGELOG.md` `[Unreleased]`; PR #45

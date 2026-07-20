# Feature delivery — task checklist

This file lives **next to** [`SPEC.md`](SPEC.md). It lists **detailed tasks** for **creating a feature** and **implementing code**, aligned with **`.cursor/skills/sdd-create-feature/SKILL.md`**.

**Gap-fill source of truth:** [`research/2026-07-gap-fill-competitors.md`](research/2026-07-gap-fill-competitors.md) · **Roadmap:** [`FEATURE-ROADMAP.md`](FEATURE-ROADMAP.md) §A0

## How to use

- Mark work **done** by changing `- [ ]` to `- [x]`.
- **Option A — track on a branch:** edit this file on your feature branch; merge with checkboxes showing completion (or reset template tasks to `[ ]` in a follow-up commit if you want `main` to stay a clean template).
- **Option B — keep `main` as template:** copy the **Feature block** into your PR description or `docs/research/YYYY-MM-feature.md` and check boxes there; leave this file all `[ ]` on `main`.
- If a task is **N/A**, mark it `[x]` and add a short *italic note* on the same line, e.g. `*(N/A: no UI change)*`.

---

## Gap-fill backlog (remaining work)

Source: [`research/2026-07-gap-fill-competitors.md`](research/2026-07-gap-fill-competitors.md) · Suggested build order in gap-fill §6.

**Status key:** ✅ shipped · 🟡 partial · ⬜ not started

| # | Item | Status | SPEC / notes |
|---|------|--------|--------------|
| 1.2 | Prepayment fee modeling | ✅ | §4.4.1 — flat / % + net savings |
| 1.3 | Reduce EMI vs Reduce Tenure compare | ✅ | §4.4.2, §10.48–51 |
| 1.4 | Amortisation CSV export | ✅ | Loan tab Export CSV |
| 5.4 | JSON-LD structured data | ✅ | §8, §10.47 |
| 2.1 | Retirement inflation (real vs nominal) | 🟡 | Inflation input + real/nominal columns exist; **missing:** explicit Nominal/Real display toggle per gap-fill §2.1 |
| 4.1 | Budget category charts | 🟡 | Bar chart by category exists; **missing:** monthly/yearly toggle |
| 4.2 | Savings rate tracker | 🟡 | KPI + tone exists; **missing:** explicit red/yellow/green tiers (&lt;10%, 10–20%, &gt;20%) |
| 5.1 | Currency & locale formatting | 🟡 | `formatMoney` per locale; **missing:** lakhs/crores compact notation for IN |
| 5.5 | README / architecture notes | 🟡 | Basic README; **missing:** formulas, state management, stack rationale |
| 5.2 | Scenario save/compare | 🟡 | Loan `localStorage` persistence; **missing:** 3–5 named slots + side-by-side compare |
| 1.1 | Payment timing (advance vs arrears) | ⬜ | Deferred in SPEC §11 |
| 1.4b | Amortisation PDF export | ⬜ | Deferred in SPEC §11 |
| 2.2 | Retirement withdrawal / drawdown phase | ⬜ | Post-retirement corpus depletion model |
| 3 | India instrument calculators | ⬜ | PPF, SIP, SSY, Gratuity, Lumpsum — new tabs |
| 5.3 | Tax-aware effective interest rate | ⬜ | Optional post-tax rate on loan tab |

---

### Slice 1 — Retirement inflation toggle (gap-fill §2.1) — **next suggested**

| Field | Value |
|-------|-------|
| **Feature name** | Retirement real vs nominal display toggle |
| **SPEC sections** | §4.11 (extend), §10 (new bullets), gap-fill §2.1 |
| **Branch / PR** | _TBD_ |
| **Started** | _TBD_ |

#### Phase 0 — Intake & research

- [ ] **0.1** User outcome: borrowers toggle whether charts/KPIs show nominal or inflation-adjusted (today's value) projections.
- [ ] **0.2** Assumptions: reuse existing `inflation_pct` input; defaults 6% IN / 3% US+UK; both values always computed, toggle affects display only.
- [ ] **0.3** Open questions: does toggle apply to chart only, or also scenario comparison table?
- [ ] **0.4** Spike needed? *(likely N/A — math exists in `projectRetirementCorpus`)*
- [ ] **0.5** Link research: `docs/research/2026-07-gap-fill-competitors.md` §2.1

#### Phase 1 — Requirements (`docs/SPEC.md`)

- [ ] **1.1** Add `display_mode: nominal | real` (or equivalent) to §4.11 retirement inputs.
- [ ] **1.2** Acceptance bullets in §10 for toggle behaviour and default inflation by locale.
- [ ] **1.3** Bump spec version; remove §2.1 from deferred backlog when shipped.

#### Phase 2 — Implementation

- [ ] **2.A** Zod + `useRetirementPlanner` state for display toggle; locale defaults.
- [ ] **2.B** UI: radio/toggle + clear "Nominal" vs "Real (today's value)" labels on KPIs and chart.
- [ ] **2.C** Persist toggle in retirement `localStorage` blob.

#### Phase 3 — Automated verification

- [ ] **3.1** Unit test: real corpus = nominal / (1 + inflation)^years.
- [ ] **3.2** UI test: toggle switches chart title and primary KPI column.
- [ ] **3.3** `npm run lint` + `npm run test` + `npm run build` clean.

#### Phase 4–6 — Sign-off, docs, ship

- [ ] **4.** Manual smoke on IN / US / UK retirement tab.
- [ ] **5.** Update `TEST-MAP.md`, mark gap-fill §2.1 done in `FEATURE-ROADMAP.md`.
- [ ] **6.** `CHANGELOG.md` `[Unreleased]`; PR cites SPEC §.

---

### Slice 2 — Currency / locale formatting (gap-fill §5.1)

| Field | Value |
|-------|-------|
| **Feature name** | Lakhs/crores compact notation (IN) |
| **SPEC sections** | §4.1 / formatting notes, gap-fill §5.1 |
| **Branch / PR** | _TBD_ |

- [ ] **SPEC** Define when to use compact vs full `en-IN` format (e.g. inputs full, KPIs compact above ₹1L).
- [ ] **Lib** `formatInrCompact(value)` → `₹12.34 L` / `₹1.23 Cr`; US/UK `formatUsdCompact` / `formatGbpCompact` (K/M).
- [ ] **UI** Apply across loan, debt, retirement, strategy KPI strips; verify locale switch.
- [ ] **Tests** §10 golden strings for IN ₹12,34,567 vs US $1,234,567.
- [ ] **Docs** README rounding/formatting section.

---

### Slice 3 — India instrument calculators (gap-fill §3)

| Field | Value |
|-------|-------|
| **Feature name** | PPF + SIP calculators (priority); then SSY, Gratuity, Lumpsum |
| **SPEC sections** | New §4.x subsections per instrument, §10 acceptance, §5 tab routing |
| **Branch / PR** | _TBD_ |

#### Per calculator (repeat for PPF, SIP, SSY, Gratuity, Lumpsum)

- [ ] **SPEC** Inputs, formula, government default rates, disclaimer to verify latest official rate.
- [ ] **Lib** `src/lib/instruments/ppf.ts`, `sip.ts`, … pure functions + Vitest.
- [ ] **UI** New tab or sub-tab; inputs left/top, results + chart right/bottom (match loan pattern).
- [ ] **Defaults** PPF ~7.1%, SSY ~8.2% (verify at ship time); note in UI.
- [ ] **Locale** India-only or hidden for US/UK until SPEC says otherwise.
- [ ] **SEO** Tab title, description, JSON-LD `featureList` entry (§8).
- [ ] **E2E** Smoke: load tab, edit input, result updates.

**PPF:** annual contribution, rate, years → maturity, total interest.  
**SIP:** monthly investment, return %, duration → maturity, invested vs gains.  
**SSY:** annual contribution, girl's age → maturity at 21.  
**Gratuity:** last salary, years of service → gratuity amount.  
**Lumpsum:** principal, rate, duration → future value.

---

### Slice 4 — Scenario save/compare (gap-fill §5.2)

- [ ] **SPEC** Up to 5 named scenarios per calculator; save / load / delete / compare side-by-side.
- [ ] **Storage** `localStorage` key per tab + locale; schema versioned JSON.
- [ ] **UI** Name dialog, scenario list, compare table (2–3 columns).
- [ ] **Tabs** Loan first (extends existing persistence); then debt, retirement, budget.
- [ ] **Tests** Round-trip save/load; max slot enforcement.

---

### Slice 5 — Loan enhancements (gap-fill §1.1, §1.4b, §5.3)

- [ ] **1.1 Payment timing** — `payment_timing: advance | arrears` (default arrears); amortisation engine + §10 goldens.
- [ ] **1.4b PDF export** — client-side PDF of schedule (e.g. `jspdf` or print CSS); §14 disclaimer on export.
- [ ] **5.3 Tax-aware rate** — optional tax bracket %; output effective post-tax interest rate; India 80C/24(b) note in UI only.

---

### Slice 6 — Retirement drawdown (gap-fill §2.2)

- [ ] **SPEC** Post-retirement: monthly withdrawal, post-retirement return % → depletion age or "indefinite".
- [ ] **Lib** `projectDrawdownPhase(corpus, withdrawal, returnPct)` month-by-month.
- [ ] **UI** Inputs + timeline/chart after retirement age; merge with accumulation phase.
- [ ] **Tests** Depletion at known corpus/withdrawal; indefinite when withdrawal &lt; growth.

---

### Slice 7 — Budget enhancements (gap-fill §4.1, §4.2)

- [ ] **4.1** Monthly / yearly toggle; yearly = 12× monthly categories; bar or pie by category.
- [ ] **4.2** Savings rate colour bands: red &lt;10%, yellow 10–20%, green &gt;20% (accessibility-safe colours).
- [ ] **Tests** Toggle aggregation; savings rate tier boundaries.

---

### Slice 8 — README / architecture polish (gap-fill §5.5)

- [ ] Document stack (Vite, React, TS, Zod, Vitest, Capacitor).
- [ ] State: per-tab hooks + `localStorage`; locale context.
- [ ] Formula appendix: EMI, prepayment fee, retirement corpus, key instrument formulas.
- [ ] Link to `docs/OVERVIEW.md` and `docs/SPEC.md`.

---

## Completed feature block (archive)

| Field | Value |
|-------|-------|
| **Feature name** | Prepayment fee + Reduce EMI vs Reduce Tenure (gap-fill) |
| **SPEC sections** | §4.4.1, §4.4.2, §4.9, §10.48–51 |
| **Branch / PR** | `cursor/gap-fill-prepay-fee-fad2` / #45 |
| **Started** | 2026-07-14 |

### Phase 0 — Intake & research

- [x] **0.1** Write the **user outcome** in one sentence. *Borrowers see realistic net savings after foreclosure fees and can compare Reduce EMI vs Reduce Tenure side by side.*
- [x] **0.2** List **assumptions**. *Fee is cash outflow; default type `none`; one fee per one-time lump prepay.*
- [x] **0.3** List **open questions**. *(N/A for this slice; remaining gap-fill deferred)*
- [x] **0.4** If spike needed. *(N/A — backlog doc is product intake)*
- [x] **0.5** Link research. *`docs/research/2026-07-gap-fill-competitors.md`*

### Phase 1 — Requirements (`docs/SPEC.md`)

- [x] **1.1–1.12** SPEC v2.5: §4.1 fee fields, §4.4.1–4.4.2, §4.9 KPIs, §10.48–51, §11 deferred backlog.

### Phase 2 — Implementation (code)

- [x] **2.B** `src/lib/loan/prepaymentFee.ts` + comparison/strategy helpers
- [x] **2.C** Zod `prepayment_fee_*` on loan schema
- [x] **2.D** Loan fee inputs, comparison columns, `PrepayStrategyCompare` panel, KPI strip

### Phase 3 — Automated verification

- [x] **3.** Vitest: fee unit + comparison + LoanSection UI (§10.48–51); `npm run lint` / `build` clean

### Phase 4 — Feature sign-off

- [x] **4.** Tests + build + lint green on branch

### Phase 5 — Harness & knowledge

- [x] **5.** `docs/TEST-MAP.md`, `LEARNINGS.md`, `FEATURE-ROADMAP.md` A0, `OVERVIEW.md`

### Phase 6 — Ship

- [x] **6.** Commits cite SPEC §; `CHANGELOG.md` `[Unreleased]`; PR #45

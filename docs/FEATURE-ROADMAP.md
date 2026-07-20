# Feature roadmap checklist

Candidate features to build on top of FinancialPlanner. Use this as a backlog; deliver each item via **`sdd-create-feature`** and the detailed phase checklist in [`TASKS.md`](TASKS.md).

**How to use**

- Mark done: `- [ ]` → `- [x]`.
- Before coding: update the governing SPEC (`SPEC.md` / `SPEC-US.md` / `SPEC-UK.md`) when behaviour changes.
- Items marked **§11** need an explicit non-goals revision before implementation.
- Prefer one feature slice per branch/PR; cite SPEC § in commits.

**Sources:** [`SPEC.md`](SPEC.md) §4 / §11 / §13 · [`SPEC-US.md`](SPEC-US.md) · [`SPEC-UK.md`](SPEC-UK.md) · [`research/2026-07-gap-fill-competitors.md`](research/2026-07-gap-fill-competitors.md) · [`research/2026-07-other-planner-areas.md`](research/2026-07-other-planner-areas.md) · [`OVERVIEW.md`](OVERVIEW.md)

---

## Priority order (suggested)

Per gap-fill §6 and current codebase state:

1. **Retirement inflation toggle** (gap-fill §2.1) — math exists; add explicit Nominal/Real UX
2. **Currency/locale formatting** (gap-fill §5.1) — lakhs/crores for IN
3. **SIP + PPF calculators** (gap-fill §3) — highest search-volume new tabs
4. **Scenario save/compare** (gap-fill §5.2) — named localStorage slots
5. **Remaining gap-fill** — drawdown, payment timing, India instruments, budget polish, tax-aware rate, PDF export
6. UK locale completion + game theory Tier P1
7. Loan engine polish (mid-month timing / floating stress)
8. Charts & exports (debt/retirement/strategy charts)
9. Canada locale **or** multi-creditor games (after SPEC bump)
10. Platform (iOS, PDF)

---

## A0 — Competitor gap-fill (SPEC v2.5+)

Source: [`research/2026-07-gap-fill-competitors.md`](research/2026-07-gap-fill-competitors.md) · Detailed tasks: [`TASKS.md`](TASKS.md) **Gap-fill backlog**

### 1. EMI / Loan calculator

| ID | Feature | Status | SPEC / code |
|----|---------|--------|-------------|
| 1.1 | Payment timing (advance vs arrears) | ⬜ | Deferred §11 |
| 1.2 | Prepayment fee (flat / %) + net savings | ✅ | §4.4.1, `prepaymentFee.ts` |
| 1.3 | Reduce EMI vs Reduce Tenure compare | ✅ | §4.4.2, `PrepayStrategyCompare` |
| 1.4 | Amortisation CSV export | ✅ | Loan tab Export CSV |
| 1.4b | Amortisation PDF export | ⬜ | Deferred §11 |

### 2. Retirement calculator

| ID | Feature | Status | SPEC / code |
|----|---------|--------|-------------|
| 2.1 | Inflation adjustment (real vs nominal) | 🟡 | `inflation_pct` + real columns exist; **toggle UX missing** |
| 2.2 | Withdrawal / drawdown phase | ⬜ | Post-retirement depletion model |

### 3. India instrument calculators (new tabs)

| ID | Calculator | Status | Priority |
|----|------------|--------|----------|
| 3.1 | PPF | ⬜ | P1 (with SIP) |
| 3.2 | SIP | ⬜ | P1 |
| 3.3 | Sukanya Samriddhi (SSY) | ⬜ | P2 |
| 3.4 | Gratuity | ⬜ | P2 |
| 3.5 | Lumpsum investment | ⬜ | P2 |

### 4. Budget calculator

| ID | Feature | Status | Notes |
|----|---------|--------|-------|
| 4.1 | Category monthly/yearly view + chart | 🟡 | Category bar chart exists; no M/Y toggle |
| 4.2 | Savings rate colour bands | 🟡 | KPI + tone; no explicit &lt;10 / 10–20 / &gt;20% bands |

### 5. Cross-cutting / platform

| ID | Feature | Status | Notes |
|----|---------|--------|-------|
| 5.1 | Currency & locale formatting | 🟡 | Per-locale symbols; lakhs/crores compact TBD |
| 5.2 | Scenario save/compare (localStorage) | 🟡 | Loan persistence only; named multi-scenario TBD |
| 5.3 | Tax-aware effective interest rate | ⬜ | Optional post-tax rate on loan |
| 5.4 | SEO / JSON-LD | ✅ | §8, §10.47, `seo.test.ts` |
| 5.5 | README / architecture notes | 🟡 | Basic README; formulas/stack depth TBD |

### Gap-fill checklist (rollup)

- [x] 1.2 Prepayment fee modeling
- [x] 1.3 Reduce EMI vs Reduce Tenure
- [x] 1.4 Amortisation CSV export
- [x] 5.4 JSON-LD structured data
- [ ] 2.1 Retirement real/nominal **display toggle**
- [ ] 5.1 Lakhs/crores + locale formatting polish
- [ ] 3.1–3.2 SIP + PPF calculators
- [ ] 5.2 Named scenario save/compare (all tabs)
- [ ] 2.2 Retirement drawdown phase
- [ ] 1.1 Payment timing (advance/arrears)
- [ ] 1.4b PDF amortisation export
- [ ] 3.3–3.5 SSY, Gratuity, Lumpsum
- [ ] 4.1 Budget monthly/yearly toggle
- [ ] 4.2 Savings rate colour bands
- [ ] 5.3 Tax-aware effective rate
- [ ] 5.5 README architecture / formula appendix

---

## A — Highest leverage (in or near SPEC)

### A1. Game theory Tier P1 (§4.13)

- [ ] `GAME_BLH_SIM_FULL` — borrower + lender + household simultaneous
- [ ] `GAME_BLN_SEQ_N_FEE` — unemployment timing + lender fee
- [ ] `GAME_BHN_STOCH_RUNWAY` — min cash runway vs household split
- [ ] `GAME_BLHN_EXT_STRESS` — full stress + strategic
- [ ] `GAME_BL_SIM_RATE_BUMP` — prepay triggers lender rate bump
- [ ] `GAME_BL_MIXED_FEE` — mixed-strategy Nash on 2×2 fee game
- [ ] Goldens under `src/test/fixtures/game/` for each new profile (§15.2)
- [ ] Resolve open questions §13.1–§13.4 (default lender objective, Pareto cap, export grid, rate-bump order)

### A2. UK locale completion (`SPEC-UK.md`)

- [ ] Audit engine/UI/goldens vs SPEC-UK (redundancy / JSA / SMI bridge)
- [ ] ISA / GIA sleeve parity with strategy + job-loss cashflow
- [ ] ERC / overpayment modelling gaps closed
- [ ] UK reference scenario + E2E smoke coverage
- [ ] NMPA / “no early pension access” disclaimer visible where relevant

### A3. Loan engine polish (deferred in SPEC)

- [ ] Mid-month prepayment timing (`prepayment_timing = mid_month`) with documented interest policy
- [ ] Advanced “current EMI” after prior prepays (vs baseline snapshot only)
- [ ] Floating-rate **deterministic** stress paths (discrete shocks; not Monte Carlo)
- [ ] Unit tests + golden updates for any amortisation change

### A4. Charts & exports (§4.9)

- [ ] Debt tab — total balance over time chart
- [ ] Retirement tab — nominal corpus by year chart *(line chart exists; verify gap-fill intent)*
- [ ] Strategies tab — net worth at horizon bar chart
- [ ] Shared SVG chart components reused across tabs
- [ ] Richer CSV/JSON export fields where useful
- [x] Shareable scenario / tab links (UTM rules stay within §5.1) — **Share on Facebook** footer control (`utm_source=facebook`, `utm_medium=social`) shipped; copy-link already present

---

## B — Locale & domain expansion

### B1. Canada locale (research; needs new SPEC)

- [ ] Research spike → `docs/research/YYYY-MM-ca-*.md` (if deeper than existing note)
- [ ] Add `SPEC-CA.md` (or section) — TFSA / RRSP, CAD, mortgage IRD-style fees
- [ ] Locale switcher + formatting (CAD)
- [ ] Job-loss: TFSA-first, RRSP with user marginal tax
- [ ] Goldens + §10 acceptance bullets

### B2. US depth (`SPEC-US.md`)

- [ ] Auto PMI cancellation at 78% LTV (**§11 today** — needs home value + SPEC revision)
- [ ] Self-employed / SEP-IRA / Solo 401(k) persona inputs
- [ ] Audit Rule of 55, vesting, HSA premium bridge for remaining gaps
- [ ] Employment-type presets polish if UX still thin

### B3. Multi-creditor games (**§11** until promoted)

- [ ] SPEC revision: promote `GAME_MULTI_CREDITOR` from Tier P2 / non-goals
- [ ] Start with **2-loan** borrower–lender game (not full N)
- [ ] Wire to existing `src/lib/debt/` ordering where useful
- [ ] Profile goldens + Strategic tab UI

### B4. ARM / `GAME_FLOATING_N` (**§11** stochastic block)

- [ ] Design doc: discrete Nature rate paths only (no Monte Carlo)
- [ ] SPEC revision when ready to ship
- [ ] Fixtures for `{+2%, 0%, -1%}`-style adjustment paths
- [ ] Do **not** add floating EMI to main loan tab until SPEC says so

---

## C — Product & platform

### C1. Persistence & comparison UX

- [ ] Per-locale `localStorage` for debt / retirement / strategy / budget (loan already done)
- [ ] Side-by-side scenario compare (e.g. job loss month 12 vs 24) without full re-entry
- [ ] JSON import/export parity across tabs where missing

### C2. Native & distribution

- [ ] iOS Capacitor shell (**§11 Android non-goal today** — needs SPEC §5.2 revision)
- [ ] Play / App Store listing notes (out of automation scope unless SPEC changes)
- [ ] Deep-link URL schemes beyond default Capacitor links (if desired)

### C3. Documents & adviser-friendly output

- [ ] Print / PDF one-pager summary (educational; keep §14 disclaimer)
- [ ] Optional “export for adviser” pack (tables + assumptions list)

### C4. Analytics & quality (optional polish)

- [ ] Remaining GA4 Tier 2 items if any still open (§5.1.2)
- [ ] Accessibility pass on any new screens (WCAG 2.1 AA)
- [ ] E2E smoke for each new major tab/locale path

---

## D — Explicit non-goals (do not start without SPEC §11 revision)

Keep these out of implementation PRs unless product explicitly revises non-goals:

- [ ] ~~Tax / EPFO / capital-gains compliance advice~~ — stays disclaimer-only (§14)
- [ ] ~~Bank / brokerage account linking~~ — manual entry only (§4.16)
- [ ] ~~Live market-price feeds~~
- [ ] ~~Machine-learned or historical lender models~~
- [ ] ~~Full stochastic floating-rate Monte Carlo~~
- [ ] ~~Third-party ad pixels / fingerprinting~~
- [ ] ~~Server-side push (FCM/APNs) backends~~
- [ ] ~~Legal settlement / IBC negotiation outcomes~~
- [ ] ~~Wash sales / NIIT lot-level tracking (US)~~

---

## Tracking template (per feature)

When picking an item above, copy into the PR or a dated research note:

| Field | Value |
|-------|-------|
| **Feature** | _e.g. retirement-real-nominal-toggle_ |
| **SPEC §** | _e.g. §4.11 + gap-fill §2.1_ |
| **Needs §11 change?** | yes / no |
| **Branch** | `cursor/…-a929` |
| **TASKS.md** | gap-fill slice checklist |
| **Tests** | unit / goldens / e2e |
| **CHANGELOG** | `[Unreleased]` updated if user-facing |

---

**End of roadmap**

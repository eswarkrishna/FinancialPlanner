# Feature roadmap checklist

Candidate features to build on top of FinancialPlanner. Use this as a backlog; deliver each item via **`sdd-create-feature`** and the detailed phase checklist in [`TASKS.md`](TASKS.md).

**How to use**

- Mark done: `- [ ]` → `- [x]`.
- Before coding: update the governing SPEC (`SPEC.md` / `SPEC-US.md` / `SPEC-UK.md`) when behaviour changes.
- Items marked **§11** need an explicit non-goals revision before implementation.
- Prefer one feature slice per branch/PR; cite SPEC § in commits.

**Sources:** [`SPEC.md`](SPEC.md) §4 / §11 / §13 · [`SPEC-US.md`](SPEC-US.md) · [`SPEC-UK.md`](SPEC-UK.md) · [`research/2026-07-other-planner-areas.md`](research/2026-07-other-planner-areas.md) · [`research/2026-07-architecture-review-roadmap.md`](research/2026-07-architecture-review-roadmap.md) · [`OVERVIEW.md`](OVERVIEW.md)

---

## Priority order (suggested)

1. **Competitor gap-fill** ([`research/2026-07-gap-fill-competitors.md`](research/2026-07-gap-fill-competitors.md)) — prepay fee + EMI/tenure compare **shipped**; floating rates + bank validation **shipped**; **PPF**, **SIP**, **SSY**, **Gratuity**, and **Lumpsum** shipped (§4.17–§4.21); PDF schedule export **shipped**; **retirement drawdown** and **inflation toggle** shipped (§4.11.2–§4.11.3); **budget chart view + savings-rate bands** shipped (§4.16.5); **loan scenario save/compare slots** shipped (§4.9.1); next: loan engine polish or tax-aware rate
2. Loan engine polish (timing / EMI / deterministic rate stress)  
3. Charts, exports, persistence UX  
4. **Web traffic first** — India wedge on the public SPA; Android/Capacitor maintenance-only (no new native features until web wins)
5. Canada locale **or** multi-creditor games (after SPEC bump)  
6. Platform (iOS, PDF)

**Frozen (architecture review Phase 2):** §4.13 game theory Tier **P1** profiles — shipped P0 only; no new spec or UI until India prepayment wedge lands. US/UK locale specs in **maintenance mode** (bugfixes, no new parity features).

---

## A0 — Competitor gap-fill (SPEC v2.5+)

Source: [`research/2026-07-gap-fill-competitors.md`](research/2026-07-gap-fill-competitors.md)

- [x] Prepayment fee modeling (flat / %) + net savings (§4.4.1)
- [x] Reduce EMI vs Reduce Tenure side-by-side (§4.4.2)
- [x] Retirement inflation display toggle — §4.11.3 shipped
- [x] Currency/locale formatting polish (lakhs vs millions) — per-locale `formatMoney` + INR lakh/crore KPI suffix shipped (§10.79)
- [x] Amortisation CSV already shipped — PDF export shipped (§10.80)
- [x] PPF calculator (India instruments) — §4.17 shipped
- [x] SIP calculator (India instruments) — §4.18 shipped
- [x] Gratuity calculator (India instruments) — §4.20 shipped
- [x] Lumpsum calculator — §4.21 shipped
- [x] Retirement drawdown phase — §4.11.2 shipped
- [x] Budget chart view toggle + savings-rate bands — §4.16.5 shipped
- [x] Scenario save/compare (named localStorage slots) — §4.9.1 shipped (loan tab; other tabs via C1)
- [ ] Remaining: tax-aware rate, SEO polish

---

## A — Highest leverage (in or near SPEC)

### A1. Game theory Tier P1 (§4.13) — **frozen at P0**

> No new Tier P1 profiles, goldens, or Strategic-tab UI until the India prepayment wedge ships (architecture review Phase 2).

- [ ] `GAME_BLH_SIM_FULL` — borrower + lender + household simultaneous
- [ ] `GAME_BLN_SEQ_N_FEE` — unemployment timing + lender fee
- [ ] `GAME_BHN_STOCH_RUNWAY` — min cash runway vs household split
- [ ] `GAME_BLHN_EXT_STRESS` — full stress + strategic
- [ ] `GAME_BL_SIM_RATE_BUMP` — prepay triggers lender rate bump
- [ ] `GAME_BL_MIXED_FEE` — mixed-strategy Nash on 2×2 fee game
- [ ] Goldens under `src/test/fixtures/game/` for each new profile (§15.2)
- [ ] Resolve open questions §13.1–§13.4 (default lender objective, Pareto cap, export grid, rate-bump order)

### A2. UK locale completion (`SPEC-UK.md`) — **maintenance mode**

> Bugfixes only; no new parity features until India wedge wins.

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

- [x] Debt tab — total balance over time chart (`DebtSection`)
- [x] Retirement tab — corpus by year chart with nominal/real toggle (`RetirementSection`, §4.11.3)
- [x] Strategies tab — net worth at horizon bar chart (`StrategySection`)
- [x] Shared SVG chart components reused across tabs (`src/components/LineChart.tsx`, `BarChart.tsx`)
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
- [x] Side-by-side scenario compare (e.g. job loss month 12 vs 24) without full re-entry — loan tab via §4.9.1 slots; extend to other tabs if needed
- [ ] JSON import/export parity across tabs where missing

### C2. Native & distribution — **deprioritized (web first)**

> Capacitor Android shell remains buildable for smoke tests; no new native work until public web traffic validates the India wedge.

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
| **Feature** | _e.g. GAME_BL_MIXED_FEE_ |
| **SPEC §** | _e.g. SPEC §4.13 Tier P1_ |
| **Needs §11 change?** | yes / no |
| **Branch** | `cursor/…-c501` |
| **TASKS.md** | phases 0–6 checked |
| **Tests** | unit / goldens / e2e |
| **CHANGELOG** | `[Unreleased]` updated if user-facing |

---

**End of roadmap**

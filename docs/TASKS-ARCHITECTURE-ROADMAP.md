# Architecture review — task checklist

Actionable tasks derived from [`research/2026-07-architecture-review-roadmap.md`](research/2026-07-architecture-review-roadmap.md) (chief-architect review, 2026-07-21).

**How to use:** mark done with `- [x]`. Work phases **in order** where possible — later phases assume trust-breakers and cuts land first. Ship via **`sdd-create-feature`**; update **`docs/SPEC.md`** (and locale specs when behaviour changes) before code.

**Operating principle:** before adding work, ask whether it makes the Indian loan calculator the best in its market, or only widens surface area. Default to no on widening.

---

## Feature block

| Field | Value |
|-------|-------|
| **Initiative** | Architecture review remediation + wedge focus |
| **Source** | [`research/2026-07-architecture-review-roadmap.md`](research/2026-07-architecture-review-roadmap.md) |
| **SPEC sections** | §4.4, §4.6, §4.12–§4.13, §5.1.2, §5.2, §8, §10, §11 |
| **Branch / PR** | `cursor/phase-3-mobile-ux-d414` |
| **Started** | 2026-07-21 |

---

## Phase overview

| Phase | Name | Roadmap § | Exit criteria |
|------:|------|-----------|---------------|
| 1 | Trust-breakers | §2 | Canonicals resolve 200 and match sitemap; GA gated on consent; no spec IDs in UI |
| 2 | Cut & clean | §3, §4, §8 | Bell FAB gone; fonts self-hosted; 404 noindexed; README rewritten; PRs ≤ 1 |
| 3 | Mobile UX | §5 (items 1–6) | No horizontal scroll at 360 px; locale switcher reachable; explainer below tool; formatted inputs |
| 4 | Information architecture | §6 | Old slugs redirect; sitemap updated; tab labels intent-clear |
| 5 | Wedge — Indian prepayment | §7 | Floating rates shipped; `docs/VALIDATION.md` published; India instrument companions live; PDF export; Phase 5 sign-off complete |

---

## Phase 1 — Trust-breakers (P0)

### 1.1 Canonical URL double-composition

- [x] **1.1.1** Reproduce bug: built-shell `<link rel="canonical">` and `og:url` show doubled `/FinancialPlanner/FinancialPlanner/{slug}`.
- [x] **1.1.2** Fix URL composition in `resolveSiteUrl` / `tabPageUrl` so canonical, sitemap `<loc>`, and `buildIndexHtmlReplacements` share one source of truth (do not append `routerBase` when `VITE_SITE_URL` already includes it).
- [x] **1.1.3** Add §10 acceptance test: for every tab slug, built-shell canonical === sitemap `<loc>` === `tabPageUrl(tabId)`.
- [x] **1.1.4** Verify deployed canonical URLs return HTTP 200 (manual or E2E).

### 1.2 Analytics consent (SPEC §5.1.2)

- [x] **1.2.1** Ship Tier 2 consent strip (`financial-planner-analytics-consent`); load `gtag.js` only after user **accept**.
- [x] **1.2.2** Persist consent choice; honour decline on subsequent visits.
- [x] **1.2.3** Update `README.md` to match SPEC (remove “loads without consent prompt” wording).
- [x] **1.2.4** Add or extend automated test that GA init does not run before accept.

### 1.3 User-facing copy audit

- [x] **1.3.1** Remove spec references from UI (e.g. staged-prepayments “SPEC §4.6 `STAGED_PREPAY`”).
- [x] **1.3.2** Replace engineer-speak with user language (e.g. “Policy: keep original EMI” → “Your EMI stays the same; the loan ends sooner”).
- [x] **1.3.3** Grep codebase for visible strings containing `SPEC`, scenario IDs, and internal enum names; fix all hits.
- [x] **1.3.4** Spot-check all six calculator tabs on mobile and desktop.

### 1.4 Repo hygiene

- [x] **1.4.1** Delete `google20d8c3662a3fd5d2 (1).html` (duplicate verification file).
- [x] **1.4.2** Remove README “Connect to GitHub” boilerplate section.
- [ ] **1.4.3** Merge or close stale open PRs (target: ≤ 1 open non-draft PR). *Agent lacks permission to close #10, #25, #49, #52, #54 — repo owner action required.*

### Phase 1 sign-off

- [x] **1.5** `npm run lint`, `npm run test`, `npm run build` green.
- [x] **1.6** Map new §10 bullets in `docs/TEST-MAP.md`.

---

## Phase 2 — Cut & clean (P1)

### 2.1 Surface-area cut list (§3)

- [x] **2.1.1** **Remove** release notifications (§4.15): bell FAB, service worker, `version.json` hourly polling, related consent UI.
- [x] **2.1.2** Update SPEC §11 / deferred backlog; remove §4.15 implementation references from code and tests.
- [x] **2.1.3** **Freeze** game theory (§4.13) at shipped P0 — no new Tier P1 spec or UI; mark FEATURE-ROADMAP items deferred.
- [x] **2.1.4** **Deprioritize** Android / Capacitor (§5.2) — document “web traffic first” in OVERVIEW / FEATURE-ROADMAP; no new native work.
- [x] **2.1.5** **Maintenance mode** for US/UK locale specs — no new parity features until India wedge wins.

### 2.2 SEO & platform corrections (§4)

- [x] **2.2.1** Fix `og:locale`: drop hardcoded `en_IN` or emit per-locale variants for IN/US/UK.
- [x] **2.2.2** Add `<meta name="robots" content="noindex">` to `dist/404.html` during `writeBundle` (404 must not carry home canonical).
- [x] **2.2.3** Self-host Inter via `@fontsource/inter`; remove Google Fonts request; update CSP.
- [x] **2.2.4** Spec hygiene spike: resolve duplicate §10 test numbers (E2E vs Android 34–36 collision); plan split or renumber.

### 2.3 README & public artifact (§8)

- [x] **2.3.1** Rewrite README lead: screenshot + three sentences on novel value (spec-driven dev, unemployment + staged-PF stress, bank-validated outputs when available).
- [x] **2.3.2** Keep: MIT license, live-demo link, docs table, disclaimer.
- [x] **2.3.3** Remove: push-to-GitHub instructions; move GA setup detail to `docs/`.
- [x] **2.3.4** Add one distinctive visual element (signature chart style or bold numeric display) — design pass + implement.

### Phase 2 sign-off

- [x] **2.4** Deploy smoke: no bell FAB; 404 noindex; fonts load from self-host; README accurate.
- [x] **2.5** Update `CHANGELOG.md` and `docs/LEARNINGS.md` for major removals.

---

## Phase 3 — Mobile UX (P1)

Priority order from screenshot review (§5). Target viewport: **360 px** width.

- [x] **3.1** **Grid collapse:** stack 4-column input grid to one column below ~480 px; fix clipped “Start date” and truncated “PF annual interest”.
- [x] **3.2** **Locale switcher:** keep IN/US/UK control reachable at narrow widths (do not hide primary control).
- [x] **3.3** **Explainer placement:** move formula prose below KPI strip and form; amend SPEC §8 to “below” default.
- [x] **3.4** **Feedback widget:** move “Helpful? 👍👎” after results / schedule.
- [x] **3.5** **Number ergonomics:** live formatted echo under currency fields (e.g. “₹50,00,000 · 50 lakh”); `inputmode="numeric"` on amount inputs.
- [x] **3.6** **KPI rounding:** round headline KPIs to whole rupees; paise only in schedule table.
- [x] **3.7** **Dead KPI card:** hide “Δ VS BASE: —” until prepay scenario active, or show “Add a prepayment to compare.”
- [x] **3.8** **Helper-text structure:** split Unemployment & cashflow run-on; co-locate “Monthly cash to loan” explanation with its input.
- [x] **3.9** **Contrast:** verify mint “Load reference scenario” buttons meet 4.5:1; adjust teal `#0d9488` if needed for small text.
- [x] **3.10** Manual smoke at 360 px: no horizontal scroll inside forms; KPI visible above fold.

### Phase 3 sign-off

- [x] **3.11** Puppeteer or manual mobile screenshots attached to PR.
- [x] **3.12** `npm run test:e2e` green if mobile layout assertions exist.

---

## Phase 4 — Information architecture (P2)

- [x] **4.1** Decide tab rename/merge: “Strategies” vs “Strategic” → intent-based labels (e.g. “Payoff strategies”, “What-if games”) or fold game theory into §4.12 as advanced panel.
- [x] **4.2** Update SPEC §8 routes, tab labels, and SEO titles/descriptions for new names.
- [x] **4.3** Implement redirects from old slugs (`replaceState` / static redirect rules); update sitemap.
- [x] **4.4** **Home framing:** keep “suite of 6 tools” tagline above the fold on mobile at root route.
- [x] **4.5** Internal links and noscript shells updated for renamed routes.

### Phase 4 sign-off

- [x] **4.6** Old bookmarked URLs land on correct tab; sitemap URLs match canonicals.

---

## Phase 5 — Wedge: best Indian prepayment calculator (P2)

Feature order from gap-fill backlog (§7). One slice per branch/PR.

### 5.1 Core features

- [x] **5.1.1** Floating-rate loan support (top competitor gap) — baseline schedule + rate reset UI (§4.3.1).
- [x] **5.1.2** PPF calculator (India instruments) — §4.17.
- [x] **5.1.3** SIP calculator — §4.18.
- [x] **5.1.4** SSY calculator.
- [x] **5.1.5** Gratuity calculator.
- [x] **5.1.6** Reduce-EMI vs Reduce-Tenure panel polish (§4.4.2 — already spec'd). *Shipped in gap-fill v2.5.*
- [x] **5.1.7** Lakh/crore display formatting throughout UI. *KPI strip + currency field echo.*
- [x] **5.1.8** PDF amortisation export.

### 5.2 Trust layer

- [x] **5.2.1** Create `docs/VALIDATION.md`: compare EMI, prepayment, PF outputs against 2–3 bank calculators (HDFC, SBI); document methodology and deltas.
- [x] **5.2.2** Uniform one-line methodology note per calculator (reducing-balance, compounding, rounding). *All planner tabs.*
- [x] **5.2.3** Add “Your data never leaves your browser” near inputs (localStorage-only).

### Phase 5 sign-off

- [x] **5.3** At least one bank parity case documented with reproducible inputs. *`docs/VALIDATION.md` Case 1 (HDFC).*
- [x] **5.4** First PPF or SIP companion live with tests and golden fixtures where applicable. *PPF §4.17 + SIP §4.18 + SSY §4.19 + Gratuity §4.20 shipped.*
- [x] **5.5** README mentions bank-validated outputs once §5.2.1 ships.

---

## Do not regress (§10)

Keep these intact while executing phases above:

- [ ] Spec-driven workflow, golden fixtures, oracle-purity rule (§10.15), Puppeteer E2E
- [ ] Per-route static shells, noscript fallback, build-time CSP from versioned policy file
- [ ] CSV formula-injection escaping; per-locale localStorage keys with legacy migration; no-PII analytics rules
- [ ] Reactive no-submit inputs; prefilled reference scenario; KPI-first hierarchy

*(Check boxes when verifying each phase — not one-time ship tasks.)*

---

## Related docs

| Doc | Purpose |
|-----|---------|
| [`research/2026-07-architecture-review-roadmap.md`](research/2026-07-architecture-review-roadmap.md) | Full review narrative and rationale |
| [`FEATURE-ROADMAP.md`](FEATURE-ROADMAP.md) | Feature backlog (align wedge items; defer frozen areas) |
| [`TASKS.md`](TASKS.md) | Per-feature `sdd-create-feature` delivery template |
| [`TASKS-SEO.md`](TASKS-SEO.md) | SEO gap-fill checklist (canonical fix may overlap Phase 1) |
| [`SPEC.md`](SPEC.md) | Source of truth — update before behaviour changes |

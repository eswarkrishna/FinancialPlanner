# FinancialPlanner — Architecture Review & Roadmap

**Source:** Chief-architect review of `eswarkrishna/FinancialPlanner` (live site, repo, `index.html`, `vite.config.ts`, SPEC v2.6, mobile screenshots)
**Date:** 2026-07-21
**Status:** Proposed — fold accepted items into `docs/SPEC.md` / [`TASKS-ARCHITECTURE-ROADMAP.md`](../TASKS-ARCHITECTURE-ROADMAP.md)

---

## 1. Executive summary

Engineering discipline is A-grade; product focus is C-grade. The repo has the process rigor of a funded team (spec-driven development, golden fixtures, Puppeteer E2E, build-time CSP, oracle-purity rules) spread across six calculators, three locale specs, a game-theory engine, a Capacitor Android shell, and a deploy-notification system — for a product with zero users.

**Core thesis:** the constraint is attention, not code quality. Fix trust-breakers immediately, cut ~40% of surface area, and reinvest in one winnable wedge: the best Indian loan-prepayment calculator on the internet, mobile-first.

---

## 2. P0 — Trust-breakers (fix this week)

### 2.1 Canonical URL double-composition bug
- **Symptom:** every deployed page's `<link rel="canonical">` and `og:url` point to `…/FinancialPlanner/FinancialPlanner/{slug}` (doubled path). These URLs 404.
- **Root cause:** `VITE_SITE_URL` already contains `/FinancialPlanner`, and the SEO helper (`src/lib/seo` — `buildIndexHtmlReplacements` / `patchIndexHtmlSeo`) appends `routerBase` (`/FinancialPlanner/`) on top.
- **Impact:** canonical ≠ sitemap `<loc>`; Search Console treats every real page as a non-canonical duplicate of a URL that 404s. This silently negates the entire SEO investment (per-route shells, noscript, JSON-LD, sitemap).
- **Fix:** compose canonical and sitemap URLs from a single source of truth in `resolveSiteUrl` / `tabPageUrl`.
- **Acceptance test (add to §10):** for every slug, built-shell canonical === sitemap `<loc>` === `tabPageUrl(tabId)`; fetching the canonical returns HTTP 200.

### 2.2 Analytics consent contradiction (legal exposure)
- **Symptom:** README states GA4 loads on first visit "without an in-app consent prompt"; SPEC §5.1.2 requires an accept/decline strip before `gtag.js` loads. Deployed behavior follows the README.
- **Impact:** consentless GA for UK visitors is PECR/GDPR exposure in a market the product explicitly targets.
- **Fix:** ship the Tier 2 consent strip (`financial-planner-analytics-consent`, init only after `accept`); update README to match SPEC.

### 2.3 Internal spec leakage in user-facing copy
- **Symptom:** staged-prepayments card shows "(SPEC §4.6 `STAGED_PREPAY`)" to end users; other strings use engineer-speak ("Policy: keep original EMI").
- **Fix:** audit all visible strings for spec references, scenario IDs, and jargon. Rewrite in user language (e.g. "Your EMI stays the same; the loan ends sooner").

### 2.4 Repo hygiene (90-second reviewer test)
- Delete `google20d8c3662a3fd5d2 (1).html` (duplicate verification with a download-suffix filename; meta-tag verification already exists).
- Remove the README "Connect to GitHub" section (generated boilerplate instructing how to push the repo to itself).
- Merge or close the 5 stale open PRs.

---

## 3. P1 — Cut list (reclaim ~40% of surface area)

| Item | Action | Rationale |
| --- | --- | --- |
| Release notifications (§4.15) | **Remove entirely** — bell FAB, service worker, `version.json` hourly polling, consent strip | Deploy notifications for a calculator are negative-value complexity; the FAB is the most attention-grabbing element on screen and occludes content |
| Game theory (§4.13) | **Freeze at shipped P0** — no further spec, no Tier P1 | Intellectually impressive; serves ~0% of target users; consumes spec/test/UI surface |
| Android / Capacitor (§5.2) | **Deprioritize** until web has organic traffic | Distribution multiplier with nothing yet to multiply |
| Multi-locale (US/UK specs) | **Maintenance mode** — no new parity features | Three markets triples every feature's cost; win one market first |

---

## 4. P1 — SEO & platform corrections

- **Locale meta:** `og:locale` is hardcoded `en_IN` while targeting IN/US/UK. Drop it or emit per-locale variants.
- **404 shell:** `dist/404.html` is a copy of the home shell carrying the home canonical → unknown paths index as soft duplicates. Add `<meta name="robots" content="noindex">` to the 404 copy during `writeBundle`.
- **Fonts:** self-host Inter via `@fontsource/inter`. Removes render-blocking third-party request, simplifies CSP, and eliminates a GDPR issue for UK visitors (German courts have ruled on Google Fonts specifically).
- **Spec hygiene:** SPEC.md is a 75 KB monolith mixing product spec, engineering spec, and test plan. §10 has duplicate test numbers (two sets of 34–36 — E2E and Android collide). Split per-module specs and renumber, or the TASKS.md check-off workflow will drift.

---

## 5. P1 — Mobile UX corrections (from screenshot review)

The skeleton is right: prefilled reference defaults, results on first paint, no submit button, KPI strip on top, collapsible input groups, ARIA tabs, `tabular-nums`. Execution gaps, in priority order:

1. **Grid collapse.** The 4-column input grid does not stack on narrow screens — "Start date" clips at the viewport edge, "PF annual interest" truncates, forcing horizontal scroll inside a form. Stack to one column below ~480 px. The IN/US/UK locale switcher disappears at narrow widths — a primary control must remain reachable.
2. **Explainer placement.** ~12 lines of formula prose sit between the tab bar and the first KPI; on a phone the entire first screen is text. Move explainer copy **below** the KPI strip and form (SPEC §8 already allows "above or beside" — amend to "below"). Crawlers don't care about position; humans do.
3. **Feedback widget placement.** "Helpful? 👍👎" renders before the tool; move it after the results/schedule.
4. **Number ergonomics.** Raw `5000000` inputs are unreadable in a lakh-based market. Add a live formatted echo under each currency field ("₹50,00,000 · 50 lakh") and `inputmode="numeric"`. Round headline KPIs to whole rupees (paise belongs in the schedule table only).
5. **Dead KPI card.** "Δ VS BASE: —" on the default view reads as broken. Hide until a prepay scenario is active, or show "Add a prepayment to compare."
6. **Helper-text structure.** The Unemployment & cashflow helper is a dense bolded run-on explaining three unrelated fields; split each explanation under its own input. "Monthly cash to loan" sits under Loan terms but is explained elsewhere — co-locate.
7. **Contrast.** Verify mint-background buttons ("Load reference scenario") hit 4.5:1; teal `#0d9488` is borderline for small text.
8. **Design principle:** invert the process — phone-first, desktop as enhancement. Indian financial-tool traffic is overwhelmingly mobile.

---

## 6. P2 — Information architecture

- **Rename or merge "Strategies" vs "Strategic".** No user can predict the difference before clicking; the two near-identical pills sit adjacent in the tab bar. Suggested: "Payoff strategies" (household allocation, §4.12) and fold game theory (§4.13) into it as an advanced panel — or rename to intent-based labels ("Prepay vs invest", "What-if games"). Do this before more content/SEO accretes around the current slugs; add redirects from old slugs.
- **Home page framing.** Root = loan calculator is fine for SEO, but a first-time visitor should immediately see "suite of 6 tools" — the tagline does this; keep it above the fold on mobile.

---

## 7. P2 — The wedge: best Indian prepayment calculator

Reinvest freed capacity here. "Best Indian prepayment calculator" is winnable SEO; "six mediocre calculators for three countries" is not.

**Feature order (from the project's own gap-fill backlog):**
1. Floating-rate support (top gap vs bank calculators)
2. PPF / SIP / SSY / gratuity companion calculators (Indian search volume)
3. Reduce-EMI vs Reduce-Tenure panel polish (§4.4.2 — already spec'd)
4. Lakh/crore display formatting throughout
5. PDF amortisation export (deferred item; high perceived value)

**Trust layer (differentiator):**
- Validate EMI, prepayment, and PF outputs against 2–3 bank calculators (HDFC, SBI) and document the comparison in-repo (`docs/VALIDATION.md`). Goldens prove self-consistency; bank parity proves correctness. "Our numbers match your bank's" is the entire trust proposition for a financial tool.
- Per-calculator one-line methodology note (reducing-balance, compounding, rounding) — partially present; make uniform.
- "Your data never leaves your browser" statement near the inputs (localStorage-only is already true; say it).

---

## 8. Repo as public artifact

- README leads with a screenshot + three sentences on what's genuinely novel: spec-driven solo development, the unemployment + staged-PF stress module, bank-validated outputs (once §7 lands).
- Keep: MIT license, live-demo link, docs table, disclaimer.
- Remove: push-to-GitHub instructions, GA setup verbosity (move to `docs/`).
- Visual identity: the calm teal/slate system is consistent but reads default-Tailwind. Add one distinctive element — a signature chart style or bold numeric display — so it reads as a product, not a template.

---

## 9. Sequenced plan

| Phase | Timeframe | Contents | Exit criteria |
| --- | --- | --- | --- |
| **Phase 1 — Trust** | Week 1 | §2 all items (canonical fix + test, consent strip, copy audit, repo hygiene) | Canonicals resolve 200 and match sitemap; GA gated on consent; no spec IDs visible in UI |
| **Phase 2 — Cut & clean** | Weeks 2–3 | §3 cut list, §4 platform corrections, §8 README | Bell FAB gone; fonts self-hosted; 404 noindexed; PRs ≤ 1; README rewritten |
| **Phase 3 — Mobile** | Weeks 3–5 | §5 items 1–6 | No horizontal scroll at 360 px; locale switcher reachable; explainer below tool; formatted inputs |
| **Phase 4 — IA** | Week 5 | §6 rename/merge with redirects | Old slugs 301/replaceState to new; sitemap updated |
| **Phase 5 — Wedge** | Weeks 6–12 | §7 features + bank validation doc | Floating rates shipped; `docs/VALIDATION.md` published; first PPF/SIP companion live |

---

## 10. What to keep (do not regress)

- Spec-driven workflow, golden fixtures, oracle-purity rule (§10.15), Puppeteer E2E
- Per-route static shells with unique titles/descriptions, noscript fallback, build-time CSP from versioned policy file
- CSV formula-injection escaping; per-locale localStorage keys with legacy migration; no-PII analytics rules
- Reactive no-submit inputs; prefilled reference scenario; KPI-first hierarchy

---

## 11. Operating principle

The recurring pattern to correct: choosing *building more* over *finishing and distributing*. The architecture can carry ten more features; the project needs users, validation, and one sharp edge. Before adding any feature, ask: does this make the loan calculator the best in India, or does it widen the surface? Default answer to widening: no.

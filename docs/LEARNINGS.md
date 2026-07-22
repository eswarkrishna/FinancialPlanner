# Learnings — FinancialPlanner

Short, dated notes after features, incidents, or spikes. Newest first.

---

## 2026-07-22 — Phase 5 wedge slice 1 (floating rate + trust)

- **Context:** Architecture review Phase 5 / gap-fill §7 — floating rates and bank validation doc.
- **What we learned:** Indian floating loans are modelled as deterministic rate steps with EMI reset on remaining tenure; prepay paths still use fixed rate until a follow-up wires `rateConfig` through cashflow helpers.
- **Action:** §4.3.1 baseline floating; `docs/VALIDATION.md` for HDFC/SBI parity methodology; loan-tab privacy + methodology copy.

---

## 2026-07-22 — Production outage: Pages served repo root, not `dist/`

- **Context:** After Phase 4 merge, https://eswarkrishna.github.io/FinancialPlanner/ showed blank page with `__SEO_TITLE__` and `<script src="/src/main.tsx">`.
- **What we learned:** GitHub Pages `build_type` was **`legacy`** (branch `main`, path `/`), so every push served the **unbuilt** Vite `index.html` template. The Actions workflow builds `dist/` correctly but was not the active Pages source. Phase 4 CI also failed `verify:seo` because legacy redirect meta refresh uses `/FinancialPlanner/…` under `VITE_BASE` but the verifier only looked for `/payoff-strategies`.
- **Action:** Repo owner must set **Settings → Pages → Build and deployment → Source: GitHub Actions**. Fix verifier + pass `VITE_BASE` in the verify workflow step; re-run Pages deploy.

---

## 2026-07-22 — Information architecture Phase 4

- **Context:** Architecture review §4 / `TASKS-ARCHITECTURE-ROADMAP.md` Phase 4 — “Strategies” vs “Strategic” confused users and SEO slugs.
- **What we learned:** Internal `TabId` values (`strategies`, `strategic`) can stay stable while UI labels and canonical path slugs change; legacy bookmarks need both client `replaceState` and static redirect shells for no-JS crawlers.
- **Action:** Canonical slugs `payoff-strategies` / `what-if-games`; build emits redirect HTML at old paths; home tagline lists all six tools above the fold on mobile.

---

## 2026-07-14 — Gap-fill prepay fee vs game-theory fees

- **Context:** SPEC §4.4.1–§4.4.2 / gap-fill §1.2–1.3; PR for competitor parity first slice.
- **What we learned:** Strategic-tab `L_FEE_*` actions already modeled fees for game payoffs, but the **loan tab** had no fee inputs—so “interest saved” overstated benefits for everyday users. Fee is a cash outflow (does not reduce principal); net savings = gross interest saved − fees.
- **Action:** Keep loan-tab `prepayment_fee_type` default `none` so goldens stay stable; reuse pure `computePrepaymentFeeInr` rather than coupling loan UI to game action enums.

---

## 2026-07-13 — Share on Facebook without Meta Pixel

- **Context:** SPEC §5.1.1 / §8 / §10.20a — “Create a post for Facebook” delivered as a footer share control.
- **What we learned:** Facebook’s `sharer/sharer.php?u=` is enough for organic link posts and reuses existing OG tags; loading the Meta Pixel would violate §11. Shared URLs must stay tab-canonical + UTM only (same privacy bar as copy-link).
- **Action:** Prefer web sharer + GA `share_link_facebook` over any Facebook SDK; keep amounts out of the `u` parameter.

---

## 2026-07-22 — Mobile UX Phase 3

- **Context:** Architecture review §5 / `TASKS-ARCHITECTURE-ROADMAP.md` Phase 3 (360px target).
- **What we learned:** Explainer prose above inputs pushed KPIs and forms below the fold on narrow screens; multi-column `minmax(11rem)` grids clipped date and PF-interest labels before fields wrapped.
- **Action:** Default tab order is heading → calculator → explainer → feedback; `CurrencyField` echoes lakh/crore for INR; `formatMoneyKpi` for headline strips only.

---

## 2026-07-21 — Phase 2 cut & clean (release notifications removed)

- **Context:** Architecture review §3–§4 / [`TASKS-ARCHITECTURE-ROADMAP.md`](TASKS-ARCHITECTURE-ROADMAP.md) Phase 2.
- **What we learned:** Deploy notification UI (consent strip + bell-adjacent patterns + service worker) added complexity without helping loan-calculator users; it also competed visually with analytics consent and occluded footer content.
- **Action:** Removed §4.15 implementation entirely; moved to §11 non-goals. Renumbered §10 E2E/Android bullets to eliminate 34–36 collision. Self-host Inter; 404 `noindex`; freeze game P1 and US/UK parity in FEATURE-ROADMAP.

---

## 2026-07-21 — Analytics consent restored (Phase 1 trust-breakers)

- **Context:** Architecture review §2.2; SPEC §5.1.2 / §10.23; prior 2026-07-10 note had removed the banner.
- **What we learned:** Consentless GA4 for UK visitors is a PECR/GDPR risk; the web app must gate `initAnalytics()` behind accept and persist `financial-planner-analytics-consent`.
- **Action:** Keep the accept/decline strip in web; native shell still auto-inits. README and LEARNINGS must stay aligned with SPEC.

---

## 2026-07-10 — Analytics without consent banner (superseded)

- **Context:** SPEC §5.1.2 / §8 / §10.23 — product owner asked to capture GA without an in-app permission prompt.
- **What we learned:** Consent was only a UI gate around `initAnalytics()`; Tier 1–2 events already fire once initialized. Removing the banner means bootstrap on load when `VITE_GA_MEASUREMENT_ID` is set; footer opt-out disclosure remains the user control.
- **Action:** ~~Ignore legacy `financial-planner-analytics-consent` localStorage; do not reintroduce an accept/reject strip without a SPEC revision.~~ **Superseded 2026-07-21** — consent strip restored per SPEC §5.1.2.

---

## 2026-05-09 — Repayment Strategy Planner v1.7

- **Context:** SPEC §4.12, §15.1; `src/lib/strategy/` and `src/features/strategy/`; nine strategy golden fixtures under `src/test/fixtures/strategy/`.
- **What we learned:** The planner models post-loan redirection of **full** `EMI + extra` into an equity sleeve for the remainder of the horizon. In real life, users should top up emergency funds, insurance, and discretionary buffers before auto-diverting every rupee to markets; the engine is a projection tool, not an autopilot.
- **Action:** Keep §14 disclaimer and UI hints honest; if we add a “post-loan allocation split” later, track it in SPEC §13 / §4.12 rather than silently changing assumptions.

---

## Template (copy for new entry)

```markdown
## YYYY-MM-DD — title

- **Context:** SPEC §x / PR / issue
- **What we learned:**
- **Action:**
```

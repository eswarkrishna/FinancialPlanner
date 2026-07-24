# Idea backlog expansion — beyond the current roadmap

**Date:** 2026-07-23
**Status:** Ideation — nothing here is committed work; promote items via [`../FEATURE-ROADMAP.md`](../FEATURE-ROADMAP.md) → `sdd-spec-change-first` → `sdd-create-feature`.

## 1. Question

The existing backlog ([`../FEATURE-ROADMAP.md`](../FEATURE-ROADMAP.md), [`2026-07-gap-fill-competitors.md`](2026-07-gap-fill-competitors.md)) covers competitor parity, game-theory P1 (frozen), locales, and platform items. **What new ideas exist beyond it**, and which fit the operating principle from [`2026-07-architecture-review-roadmap.md`](2026-07-architecture-review-roadmap.md) §11: *make the loan calculator the best in India before widening the surface*?

## 2. Constraints

- **Wedge first:** ideas are graded on whether they sharpen the India prepayment wedge or widen surface area.
- **Non-goals §11 (SPEC.md):** no bank linking, live rate feeds, Monte Carlo, ML lender models, ad pixels, server-side push, user accounts, multi-language SEO, or financial inputs in share URLs. Ideas touching these are listed separately and need an explicit §11 revision first.
- **Offline-first, no backend, no PII in analytics** (§5, §5.1) apply to everything below.
- Frozen areas stay frozen: §4.13 Tier P1, US/UK parity (maintenance mode), Android native features.

## 3. Ideas

Effort: **S** (lib helper + small UI), **M** (new module in `src/lib/` + tab section), **L** (new tab / build pipeline / spec section).

### 3.1 Group A — Sharpen the wedge (India loan prepayment)

| # | Idea | Why | Effort |
|---|------|-----|--------|
| A-1 | **Payoff goal-seek (inverse solver).** User picks a target payoff date ("close by Dec 2031"); the tool solves for the required monthly extra principal or one-time lump. Inverts the existing §4.4/§4.5 engine (bisection over `monthly_cash_to_loan_inr` or lump amount). | No mainstream Indian EMI calculator does this; it converts the tool from "what happens if" to "what should I do" — the strongest possible differentiator on the wedge. | M |
| A-2 | **Balance transfer / refinance comparator.** Current loan vs a new lender's rate + processing fee + transfer costs; outputs breakeven month and net savings. Reuses `computeEmi` + fee logic from §4.4.1. | "Should I switch my home loan" is a top search intent after every RBI repo move; complements the prepay-vs-invest story with switch-vs-stay. | M |
| A-3 | **Annual bonus sweep (yearly recurring prepay).** A recurring **yearly** lump (Diwali bonus / RSU vest month) alongside the monthly extra — `{ month_of_year, amount }` repeated until payoff. Extends `STAGED_PREPAY` with a repeat rule. | Matches how salaried Indians actually prepay (once a year, at bonus time); currently requires hand-entering many staged rows. | S |
| A-4 | **RBI foreclosure-fee context note.** Inline copy near the §4.4.1 fee inputs: floating-rate loans to individuals generally cannot carry foreclosure/prepayment penalties under RBI directions — "verify with your lender". Pure copy + a conditional hint when `rate_type = floating` and a fee is entered. | Trust layer: shows the tool knows Indian rules; prevents users from over-modelling fees that likely do not apply. Not legal advice (§14 framing). | S |
| A-5 | **Interest/principal crossover callout.** Surface the month where the principal portion of the EMI first exceeds the interest portion, on the KPI strip and schedule ("From month 74, most of your EMI repays principal"). Derivable from existing schedule rows. | Cheap, memorable, screenshot-friendly insight no bank calculator surfaces; boosts explainability (§5). | S |
| A-6 | **Repo-cycle rate presets.** One-click deterministic `rate_changes` templates on the §4.3.1 floating panel: "+50 bps in month 13", "−25 bps every 12 months ×3", or a hard-coded historical repo-cycle shape. No live feeds — static presets only. | Makes the shipped floating-rate feature usable without hand-typing reset arrays; stays inside the deterministic non-goal boundary. | S |
| A-7 | **Loan eligibility / FOIR calculator.** Given net salary and existing EMIs, apply a FOIR cap (~50%, editable) → maximum affordable EMI → maximum loan amount at a rate/tenure (inverse annuity). | Very high India search volume ("home loan eligibility calculator"); trivially reuses EMI math; natural top-of-funnel entry into the loan tab. | M |

### 3.2 Group B — Instrument expansion (only after Group A; reuses shipped engines)

| # | Idea | Why | Effort |
|---|------|-----|--------|
| B-1 | **FD calculator** (fixed deposit: principal, rate, quarterly compounding, tenure). | Among the highest-volume Indian calculator queries; ~90% code reuse from §4.21 lumpsum with a compounding-frequency knob. | S |
| B-2 | **RD calculator** (recurring deposit: monthly deposit, quarterly compounding). | Same rationale; reuses the §4.18 SIP engine shape. | S |
| B-3 | **Step-up SIP.** Annual increase % on the SIP instalment — explicitly excluded from §4.18 today. | Most-requested SIP variant; one extra input + loop tweak. | S |
| B-4 | **EPF corpus projector** (basic + DA, employee/employer split, notified rate). | Completes the PF story the app already tells in §4.7; distinct from the retirement aggregate in §4.11. | M |
| B-5 | **NPS calculator** (contribution → corpus → mandatory 40% annuity split at 60). | Pairs with §4.11; high search volume; annuity-rate input keeps it deterministic. | M |
| B-6 | **Goal-based SIP (education/marriage corpus).** Target amount in today's money + inflation + years → required monthly SIP (inverse of §4.18, same solver pattern as A-1). | "Child education calculator" volume; showcases the inverse-solver capability twice. | S |
| B-7 | **Rent vs buy comparator.** Rent + rent inflation + invested difference vs EMI + property appreciation, at a horizon. | Big evergreen query; heavier assumptions surface — score against wedge focus before promoting. | L |
| B-8 | **Income-tax regime comparator (old vs new).** Slab arithmetic only, clearly labelled educational. | Highest search volume of all — **but** drifts toward the §11 tax-advice boundary and needs yearly slab maintenance; likely "needs product call". | L |

### 3.3 Group C — Trust & distribution (no new calculators)

| # | Idea | Why | Effort |
|---|------|-----|--------|
| C-1 | **Public accuracy page.** Render `docs/VALIDATION.md` bank-parity cases as a visible `/accuracy` route: inputs, our EMI, bank EMI, delta. | "Our numbers match your bank's" is the entire trust proposition (architecture review §7); today it is buried in the repo. | M |
| C-2 | **Embeddable EMI widget.** A minimal, styled EMI mini-calculator served from a static `/embed` shell that bloggers can iframe, linking back to the full app. No analytics inside the iframe. | Backlink/distribution engine for the wedge; competitors (BankBazaar et al.) grow this way. | M |
| C-3 | **Programmatic SEO shells.** Build-time static pages for common parameter sets ("₹50 lakh home loan EMI for 15 years") reusing the per-route shell pipeline from §8, each with a canonical, unique copy, and a prefill link into the calculator. | Extends the existing shell generator; must avoid thin-content duplication (cap the matrix, unique explainer per page). | L |
| C-4 | **PWA install (manifest + offline cache).** Add a web manifest and a minimal offline-cache service worker — distinct from the removed deploy-notification worker; no push, no polling. | "Installable, works offline" reinforces the privacy/offline-first story at near-zero ongoing cost; worth checking §11 wording since *notification* infrastructure, not PWA caching, was the thing removed. | M |
| C-5 | **Dark mode.** `prefers-color-scheme` + a manual toggle persisted in `localStorage`, on the existing CSS-variable token system (§8 visual design). | Cheap perceived-quality win; token system makes it low-risk. | S |
| C-6 | **Visible FAQ blocks per tab.** 3–5 real questions with visible answers under the explainer copy (e.g. "Does prepayment reduce EMI or tenure?"). §8 allows `FAQPage` JSON-LD **only** with matching visible content — content first, markup optional. | Long-tail SEO + user education without new calculator surface. | S |

### 3.4 Group D — Blocked on a §11 / spec revision (list only, do not start)

| # | Idea | Blocking non-goal |
|---|------|-------------------|
| D-1 | **Shareable scenario links** (inputs compressed into a URL *fragment*, never sent to a server). | §5.1 / §11 explicitly forbid encoding user financial inputs in share links; would need a carefully-worded revision (fragment-only, opt-in). |
| D-2 | **Hindi / regional-language UI.** | §11 "multi-language SEO / English-only UI"; enormous India reach, but tripling copy maintenance contradicts the wedge freeze — revisit only after the wedge wins. |
| D-3 | **EMI moratorium / payment-holiday modelling** (skip N months, interest capitalises). | §2 glossary marks moratorium out of scope; would need a spec section for accrual and tenure-extension rules. Pairs naturally with the §4.7 unemployment module. |
| D-4 | **Penal interest / delinquency modelling** for missed EMIs in §4.8 (`skip_emi` currently marks "optional v2"). | Needs spec text for penal-rate rules before implementation. |

## 4. Sources

- [`../FEATURE-ROADMAP.md`](../FEATURE-ROADMAP.md), [`2026-07-gap-fill-competitors.md`](2026-07-gap-fill-competitors.md) — existing backlog (deduplicated against).
- [`2026-07-architecture-review-roadmap.md`](2026-07-architecture-review-roadmap.md) — wedge strategy, cut list, operating principle.
- `docs/SPEC.md` §4, §11, §13 — shipped surface and non-goals.
- Competitor observation from the gap-fill spike (NerdWallet, Bankrate, BankBazaar, CalculatorSoup); India query-volume claims are qualitative desk knowledge — verify with a keyword tool before committing to Group B ordering.
- RBI foreclosure-fee position (A-4): label all in-app copy "verify with your lender"; not legal advice.

## 5. Recommendation

Ship in this order, one slice per PR:

1. **A-1 payoff goal-seek** — the single strongest wedge differentiator; pure-lib solver over the existing engine plus one input group.
2. **A-4 + A-5 + A-6** — three S-sized trust/usability wins on the loan tab that can share one release.
3. **A-2 balance transfer comparator** — completes the "prepay / invest / switch" decision triangle.
4. **B-1 FD + B-3 step-up SIP** — only after Group A; cheapest instrument wins with real search volume.
5. **C-1 accuracy page** — turn the existing validation work into a public trust asset.

Defer B-7, B-8, C-3 pending a product call; keep Group D untouched until a §11 revision is explicitly agreed.

## 6. Spec delta (if recommendation accepted)

- **§4.4.3 (new):** payoff goal-seek — inputs (`target_payoff_month`, solve mode `monthly_extra` | `one_time_lump`), bisection tolerance, output KPIs, warnings (`TARGET_UNREACHABLE`).
- **§4.5:** add yearly recurring prepay rule (`{ month_of_year, amount_inr }`, repeat until payoff) beside monthly extra.
- **§4.9 / §8:** crossover-month KPI + copy; floating-rate preset buttons on §4.3.1 panel; RBI fee hint copy near §4.4.1 inputs.
- **§4.22 (new, later):** balance transfer comparator — inputs, breakeven definition, fee treatment referencing §4.4.1.
- **§10:** acceptance bullets per item (goal-seek reference case on the §15 loan; bonus-sweep off-by-one test; crossover month for the reference loan).
- **§11:** no changes needed for Groups A–C except confirming PWA-cache wording (C-4); Group D requires explicit revisions as noted.

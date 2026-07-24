# FinancialPlanner test map (SPEC §10)

This document maps `docs/SPEC.md` acceptance criteria (§10) to automated tests and
manual smoke checks.

## Automated coverage

| SPEC §10 bullet | Requirement | Coverage |
|---|---|---|
| 10.1 | EMI matches reference loan within tolerance | `src/lib/emi.test.ts` |
| 10.2 | Baseline total interest within tolerance | `src/lib/amortisation.test.ts` |
| 10.3 | Prepay month-1 keep-EMI payoff month band | `src/lib/amortisation.test.ts` |
| 10.4 | Prepay month-1 keep-tenure EMI reduction | `src/lib/amortisation.test.ts` |
| 10.5 | PF unemployment tranche values/months | `src/lib/pf.test.ts`, `src/lib/amortisation.test.ts` |
| 10.6 | Cashflow shortfall flag fixture | `src/lib/amortisation.test.ts` |
| 10.7 | Monthly inflow shortens payoff vs BASE | `src/lib/amortisation.test.ts` |
| 10.8 | PF scenario total withdrawals recomputed | `src/lib/pf.test.ts` |
| 10.9 | CASHFLOW_PLUS_PF payoff <= CASHFLOW_NO_PF | `src/lib/amortisation.test.ts` |
| 10.10 | PF monthly addition reflected in month-12 tranche | `src/lib/pf.test.ts` |
| 10.11 | Monthly salary contribution improves/maintains payoff | `src/lib/amortisation.test.ts` |
| 10.12 | Debt strategies: avalanche interest <= snowball | `src/lib/debtPlanner.test.ts` |
| 10.13 | Debt payoff date = start_date + payoff_months | `src/lib/debtPlanner.test.ts` |
| 10.14 | Debt budget guard warning path | `src/lib/debtPlanner.test.ts` |
| 10.15 | Retirement corpus monotonicity by contribution | `src/lib/retirement.test.ts` |
| 10.16 | Retirement scenario ranking (conservative <= optimistic) | `src/lib/retirement.test.ts` |
| 10.17 | Retirement inflation increases target corpus | `src/lib/retirement.test.ts` |
| 10.16b | Budget reference totals and 50/30/20 buckets (§4.16) | `src/lib/budget/budget.test.ts` |
| 10.16c | Budget deficit warning | `src/lib/budget/budget.test.ts` |
| 10.16d | Investment projection | `src/lib/budget/budget.test.ts` |
| 10.42–44 | Budget tab E2E smoke | `e2e/specs/budget-planner.spec.ts`, `e2e/specs/planners.spec.ts`, `e2e/specs/navigation.spec.ts` |
| 10.15 | Latest push footer metadata (§8) | `src/components/AppFooter.test.tsx`, `src/lib/buildInfo.test.ts` |
| 10.45 | Keyword-first unique tab titles ≤ 70 chars (§8) | `src/lib/seo.test.ts` |
| 10.46 | Unique 120–160-char tab descriptions (§8) | `src/lib/seo.test.ts` |
| 10.47 | JSON-LD WebApplication + BreadcrumbList, sitemap lastmod (§8) | `src/lib/seo.test.ts`, `src/App.test.tsx` |
| 10.52 | Path-slug canonical URLs (`tabPageUrl`, `getTabFromLocation`) | `src/lib/seo.test.ts` |
| 10.53 | Legacy `/?tab=` redirect preserves other query params | `src/lib/seo.test.ts`, `src/App.test.tsx` |
| 10.54 | Build emits per-slug `index.html` + `404.html` with `noindex` on 404 | `scripts/verify-seo-signoff.ts` (`npm run verify:seo`) |
| 10.55 | Per-shell `<noscript>` with calculator copy + sibling links | `src/lib/seo.test.ts`, `scripts/verify-seo-signoff.ts` |
| 10.56 | One keyword `<h1>` per active tab panel | `src/App.test.tsx`, `e2e/specs/app-shell.spec.ts` |
| 10.57 | ≥1 contextual internal `<a href>` per tab | `src/lib/tabPageContent.test.ts`, `src/App.test.tsx` |
| 10.58 | Explainer copy 100–200 words per tab | `src/lib/tabPageContent.test.ts`, `src/App.test.tsx` |
| 10.59 | Canonical === sitemap `<loc>` === build shell; no doubled deploy base | `src/lib/seo.test.ts`, `scripts/verify-seo-signoff.ts`, `e2e/specs/seo-signoff.spec.ts` |
| 10.52–58 (E2E) | Path smoke: title, h1, JSON-LD, noscript, canonical (JS off) per route | `e2e/specs/seo-signoff.spec.ts` |
| 10.52–55 (build) | Per-shell title, noscript, JSON-LD in `dist/` | `scripts/verify-seo-signoff.ts` (`npm run verify:seo`) |
| 10.48–50 | Prepayment fee flat/%/none → gross & net savings (§4.4.1) | `src/lib/loan/prepaymentFee.test.ts`, `src/features/loan/hooks/buildComparisonRows.test.ts`, `src/features/loan/LoanSection.test.tsx` |
| 10.51 | Reduce EMI vs Reduce Tenure panel selects schedule (§4.4.2) | `src/features/loan/hooks/buildComparisonRows.test.ts`, `src/features/loan/LoanSection.test.tsx` |
| 10.23 | Tier 2 analytics consent gate | `src/hooks/useAnalyticsBootstrap.test.ts`, `src/App.test.tsx` |
| 10.24 | Tier 2 `web_vitals` sample | `src/lib/analytics.test.ts`, `src/lib/analytics/webVitals.ts` |
| 10.29–39 | Browser E2E smoke (shell, navigation, loan, locale, budget) | `e2e/specs/*.spec.ts`, `npm run test:e2e` |
| 10.29–39 (mobile) | 360px layout: no form overflow, locale visible, explainer below calculator | `e2e/specs/mobile-layout.spec.ts` |
| 10.40–41 | Android Capacitor sync + debug APK | `scripts/verify-android-sync.mjs`, `.github/workflows/ci.yml` |
| 10.94 | Savings-rate bands + KPI tone mapping (§4.16.5) | `src/lib/budget/display.test.ts`, `src/features/budget/BudgetSection.test.tsx` |
| 10.95–96 | Budget chart Monthly/Yearly toggle scales charts only (§4.16.5) | `src/lib/budget/display.test.ts`, `src/features/budget/BudgetSection.test.tsx` |
| 10.97 | Loan scenario slots: save/overwrite/cap/corrupt-blob/delete (§4.9.1) | `src/lib/persistence/loanScenarioSlots.test.ts`, `src/features/loan/LoanSection.test.tsx` |
| 10.98 | Loading a slot restores saved inputs and scenario view (§4.9.1) | `src/features/loan/LoanSection.test.tsx` |
| 10.99 | Slot compare rows recomputed from each slot's saved state (§4.9.1) | `src/features/loan/hooks/buildScenarioSlotRows.test.ts`, `src/features/loan/LoanSection.test.tsx` |
| 10.100–101 | Current EMI resolver + keep-EMI override shortens payoff (§4.4.3) | `src/lib/loan/resolveKeepEmi.test.ts`, `src/features/loan/LoanSection.test.tsx` |
| 10.102 | `CURRENT_EMI_TOO_LOW` when contractual EMI ≤ first-month interest (§4.4.3) | `src/lib/loan/resolveKeepEmi.test.ts`, `src/features/loan/LoanSection.test.tsx` |
| 10.103 | Keep-tenure results identical under baseline vs current `emi_basis` (§4.4.3) | `src/lib/loan/resolveKeepEmi.test.ts` |

## Golden contracts

- `src/lib/goldens.test.ts` verifies contract-stable snapshots for:
  - `BASE`
  - `PREPAY_CASH_25L_TENURE`
  - `UE_PF_TO_LOAN`
- Fixture refresh command: `npm run goldens:update`

## UI boundary checks (Phase 3.2)

These tests protect the refactored section boundaries and shell composition:

- `src/features/loan/LoanSection.test.tsx`
- `src/features/debt/DebtSection.test.tsx`
- `src/features/retirement/RetirementSection.test.tsx`
- `src/App.test.tsx`
- `src/components/AppFooter.test.tsx` — §8 / §10.15 latest-push footer metadata

## Manual smoke checklist (Phase 4)

Run `npm run dev` and verify:

1. Loan section renders and scenario select changes schedule rows.
2. Debt section toggles avalanche/snowball and shows low-budget warning path.
3. Retirement scenario select updates yearly timeline heading/content.
4. Footer disclaimer text from SPEC §14 is visible on the main dashboard.
5. Footer shows **Latest push** with commit date and linked short SHA (§8 deploy metadata).

## SEO sign-off (Phases 12–13)

See [`docs/SEO-SIGNOFF.md`](SEO-SIGNOFF.md).

| Step | Command / action |
|------|------------------|
| Static SEO shells | `npm run verify:seo` |
| Browser path + noscript smoke | `npm run test:e2e` (`seo-signoff.spec.ts`) |
| Rich Results (manual) | [Google Rich Results Test](https://search.google.com/test/rich-results) on live `/` and `/debt/` |
| CWV regression | `npm run audit:lighthouse` |
| A11y regression | `npm run audit:a11y` |

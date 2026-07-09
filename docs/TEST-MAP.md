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
| 10.15 | Latest push footer metadata (§8) | `src/components/AppFooter.test.tsx`, `src/lib/buildInfo.test.ts` |
| 10.28 | Release consent persisted (`accept` / `reject`) | `src/lib/notifications/consent.test.ts`, `src/lib/notifications/useReleaseNotifications.test.tsx`, `src/App.test.tsx` |
| 10.29 | New version detection (sha change, first baseline silent) | `src/lib/notifications/versionCheck.test.ts`, `src/lib/notifications/releaseNotifications.test.ts` |
| 10.30 | Notification copy includes short commit id | `src/lib/notifications/browserNotifications.test.ts`, `src/lib/notifications/constants.ts` |
| 10.31 | In-app update strip with reload/dismiss | `src/components/NewVersionBanner.test.tsx`, `src/App.test.tsx`, `src/lib/notifications/useReleaseNotifications.test.tsx` |
| 10.32 | Build emits `version.json` + valid `sw.js` | `scripts/verify-release-deploy.mjs` (CI + `npm run verify:release`) |
| 10.33 | Production `version.json` + `sw.js` reachable | `scripts/verify-production-release.mjs` (`npm run verify:production`) |

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
6. **Release notifications (§4.15):** consent strip appears on first visit; **No thanks** hides it; after simulating a new deploy (`lastSeen` ≠ build sha) the update banner shows **Reload**.
7. **Production smoke (optional):** `npm run verify:production` — fetches live `version.json` and `sw.js`.

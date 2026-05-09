Golden JSON outputs for scenario snapshots per `docs/SPEC.md` §10.

Current goldens:

- `goldens/BASE.json`
- `goldens/PREPAY_CASH_25L_TENURE.json`
- `goldens/UE_PF_TO_LOAN.json`
- `strategy/tier_<a|b|c>_<equity_blend|prepay_heavy|aggressive_prepay>.json` — nine fixtures pinning §4.12 Repayment Strategy Planner against the §15.1 reference tiers (acceptance bullet 23).

Update workflow:

1. Run `npm run goldens:update` to regenerate fixture JSON from the current reference factories.
2. Run `npm run test` and confirm `src/lib/goldens.test.ts` and `src/lib/strategy/goldens.test.ts` pass.
3. Review fixture diffs to ensure they match intentional behaviour changes and cite the related SPEC section (§4.x or §15.1) in commit/PR notes.

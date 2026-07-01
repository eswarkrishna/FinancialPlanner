Golden JSON outputs for scenario snapshots per `docs/SPEC.md` §10.

Current goldens:

- `goldens/BASE.json`
- `goldens/PREPAY_CASH_25L_TENURE.json`
- `goldens/UE_PF_TO_LOAN.json`
- `strategy/tier_<a|b|c>_<equity_blend|prepay_heavy|aggressive_prepay>.json` — nine fixtures pinning §4.12 Repayment Strategy Planner against the §15.1 reference tiers (acceptance bullet 23).
- `game/GAME_*.json` — six fixtures pinning §4.13 Tier P0 game profiles (acceptance bullet 14, §15.2).

US locale (`docs/SPEC-US.md` §10):

- `goldens-us/BASE.json`, `PREPAY_CASH_50K_TENURE.json`, `JL_401K_TO_LOAN.json`
- `strategy-us/tier_<a|b|c>_<equity_blend|prepay_heavy|aggressive_prepay>.json` — nine US strategy fixtures (§15.1)

Update workflow:

1. Run `npm run goldens:update` to regenerate IN fixture JSON from the current reference factories.
2. Run `npm run goldens:update:us` to regenerate US loan + strategy fixtures.
3. Run `npm run test` and confirm golden tests pass (`goldens.test.ts`, `goldensUs.test.ts`, `strategy/goldens.test.ts`, `strategy/goldensUs.test.ts`, `game/goldens.test.ts`).
3. Review fixture diffs to ensure they match intentional behaviour changes and cite the related SPEC section (§4.x or §15.1) in commit/PR notes.

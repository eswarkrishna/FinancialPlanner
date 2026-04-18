Golden JSON outputs for scenario snapshots per `docs/SPEC.md` §10.

Add files such as `BASE.json`, `PREPAY_CASH_25L_TENURE.json` once the simulation engine stabilises.

Current goldens:

- `goldens/BASE.json`
- `goldens/PREPAY_CASH_25L_TENURE.json`
- `goldens/UE_PF_TO_LOAN.json`

Update workflow:

1. Run `npm run goldens:update` to regenerate fixture JSON from the current reference factories.
2. Run `npm run test` and confirm `src/lib/goldens.test.ts` passes.
3. Review fixture diffs to ensure they match intentional behaviour changes and cite the related SPEC section in commit/PR notes.

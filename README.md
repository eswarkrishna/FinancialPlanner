# FinancialPlanner

India-focused **loan payoff simulator** planning tool: reducing-balance loans, prepayment strategies, optional unemployment + staged PF withdrawals, and scenario comparison. Behaviour is defined in **`docs/SPEC.md`** (spec-driven development).

## Quick start

```bash
npm install
npm run dev
```

```bash
npm run test
npm run build
```

## Documentation

| Document | Purpose |
|----------|---------|
| [docs/SPEC.md](docs/SPEC.md) | Full product & engineering specification |
| [AGENTS.md](AGENTS.md) | Instructions for AI coding agents |
| [.cursor/rules/](.cursor/rules/) | Cursor project rules |

## Money rounding (v1 default)

EMI and schedule amounts use **2 decimal places** (paise), **half-up** rounding at each stored step unless the spec’s `rounding_mode` is extended later. Document any change in this README.

## Disclaimer

Educational software only. EPF rules, lender charges, and taxes vary — see §14 in `docs/SPEC.md`.

## Licence

MIT — see [LICENSE](LICENSE).

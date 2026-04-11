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

## Connect to GitHub

`gh` is not required. Use an empty remote repository (no README, no `.gitignore`, no license on GitHub) if you are pushing this history for the first time.

1. On GitHub: **New repository** → name it (e.g. `FinancialPlanner`) → **Create repository** (leave “Initialize” options unchecked).
2. In this folder, set `main` and add the remote (replace `YOUR_USER` and repo name):

```bash
git branch -M main
git remote add origin https://github.com/YOUR_USER/FinancialPlanner.git
git push -u origin main
```

**SSH** (if you use SSH keys with GitHub):

```bash
git branch -M main
git remote add origin git@github.com:YOUR_USER/FinancialPlanner.git
git push -u origin main
```

If GitHub created a default branch with a commit already, either use **GitHub’s import** flow or follow GitHub’s “push an existing repository” instructions (you may need `git pull --rebase origin main` once after adding the remote).

Optional: install the [GitHub CLI](https://cli.github.com/) (`winget install GitHub.cli`) for `gh repo create` and auth helpers.

## Licence

MIT — see [LICENSE](LICENSE).

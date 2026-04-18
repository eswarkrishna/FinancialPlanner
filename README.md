# FinancialPlanner

India-focused **financial planning dashboard** with:

- debt payoff planner (avalanche/snowball + payoff-date simulation)
- retirement planner (projected corpus, inflation assumptions, scenario testing)
- loan payoff simulator (reducing-balance loans, prepayment strategies, optional unemployment + staged PF withdrawals)

Behaviour is defined in **`docs/SPEC.md`** (spec-driven development).

## Quick start

```bash
npm install
npm run dev
```

```bash
npm run test
npm run build
```

```bash
npm run goldens:update
```

## Android app (Capacitor)

This project is configured with Capacitor for Android in the `android` folder.

```bash
npm run android:sync
npm run android:open
```

- `android:sync`: builds web assets and copies them into the Android project
- `android:open`: opens the Android project in Android Studio

To build a debug APK from CLI (Windows):

```bash
npm run android:apk:debug
```

APK output path:

`android/app/build/outputs/apk/debug/app-debug.apk`

## Documentation

| Document | Purpose |
|----------|---------|
| [docs/SPEC.md](docs/SPEC.md) | Full product & engineering specification |
| [docs/TASKS.md](docs/TASKS.md) | Feature delivery checklist (mark tasks done) |
| [docs/TEST-MAP.md](docs/TEST-MAP.md) | SPEC §10 acceptance to tests/smoke mapping |
| [docs/OVERVIEW.md](docs/OVERVIEW.md) | Architecture and doc map (onboarding) |
| [docs/LEARNINGS.md](docs/LEARNINGS.md) | Dated post-feature learnings |
| [docs/research/](docs/research/) | Spikes and research notes |
| [AGENTS.md](AGENTS.md) | Instructions for AI coding agents + Cursor skills index |
| [.cursor/rules/](.cursor/rules/) | Cursor project rules |

## Continuous Integration

GitHub Actions CI runs on pushes to `main` and pull requests:

- `npm run lint`
- `npm run test`
- `npm run build`

## Money rounding (v1 default)

EMI and schedule amounts use **2 decimal places** (paise), **half-up** rounding at each stored step unless the spec’s `rounding_mode` is extended later. Document any change in this README.

## Disclaimer

Educational software only. EPF rules, lender charges, and taxes vary — see §14 in `docs/SPEC.md`.

## Connect to GitHub

`gh` is not required. Use an empty remote repository (no README, no `.gitignore`, no license on GitHub) if you are pushing this history for the first time.

1. On GitHub: **[Create a new repository](https://github.com/new)** → owner **eswarkrishna** → name **`FinancialPlanner`** → **Create repository** (leave “Add a README” unchecked if you already have commits here).
2. This repo is already set up for **`https://github.com/eswarkrishna/FinancialPlanner`**. After the empty repo exists on GitHub, run:

```bash
git push -u origin main
```

**SSH** (if you use SSH keys with GitHub), set the remote once:

```bash
git remote set-url origin git@github.com:eswarkrishna/FinancialPlanner.git
git push -u origin main
```

If GitHub created a default branch with a commit already, either use **GitHub’s import** flow or follow GitHub’s “push an existing repository” instructions (you may need `git pull --rebase origin main` once after adding the remote).

Optional: install the [GitHub CLI](https://cli.github.com/) (`winget install GitHub.cli`) for `gh repo create` and auth helpers.

## Licence

MIT — see [LICENSE](LICENSE).

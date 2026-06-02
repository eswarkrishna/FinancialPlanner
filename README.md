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
| [docs/TASKS.md](docs/TASKS.md) | Feature delivery checklist (mark tasks done) |
| [docs/OVERVIEW.md](docs/OVERVIEW.md) | Architecture and doc map (onboarding) |
| [docs/LEARNINGS.md](docs/LEARNINGS.md) | Dated post-feature learnings |
| [docs/research/](docs/research/) | Spikes and research notes |
| [AGENTS.md](AGENTS.md) | Instructions for AI coding agents + Cursor skills index |
| [.cursor/rules/](.cursor/rules/) | Cursor project rules |

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

## Publish on the internet

### GitHub Pages (free, **public** repository required)

Every push to `main` runs [`.github/workflows/pages.yml`](.github/workflows/pages.yml) and deploys the built SPA.

**Live URL (after enable):** [https://eswarkrishna.github.io/FinancialPlanner/](https://eswarkrishna.github.io/FinancialPlanner/)

GitHub does **not** offer Pages on **private** repos with the free plan. Either:

1. **Make the repo public** (recommended for this open calculator): GitHub → **Settings → General → Danger zone → Change visibility**, or  
   `gh repo edit --visibility public --accept-visibility-change-consequences`
2. Use a **paid** GitHub plan that includes Pages on private repos, or  
3. Use **AWS** below, or connect the repo to [Cloudflare Pages](https://pages.cloudflare.com/) / [Netlify](https://www.netlify.com/) (both work with private repos).

Then: **Settings → Pages → Build and deployment → Source: GitHub Actions**.

Local build for the same base path as production:

```bash
set VITE_BASE=/FinancialPlanner/
npm run build
```

### AWS (optional, custom domain)

For S3 + CloudFront + your own domain, follow [`infra/README.md`](infra/README.md), set GitHub secrets `S3_BUCKET`, `CLOUDFRONT_DISTRIBUTION_ID`, and `AWS_DEPLOY_ROLE_ARN`, then use [`.github/workflows/deploy.yml`](.github/workflows/deploy.yml).

### Google Analytics (optional)

1. Create a [GA4 property](https://analytics.google.com/) and copy the **Measurement ID** (`G-XXXXXXXXXX`).
2. **Production (GitHub Pages):** repo **Settings → Secrets and variables → Actions → New repository secret**  
   Name: `VITE_GA_MEASUREMENT_ID` · Value: your `G-…` id.  
   Redeploy by pushing to `main` or re-running the **GitHub Pages** workflow.
3. **Local:** copy [`.env.example`](.env.example) to `.env.local` and set `VITE_GA_MEASUREMENT_ID=G-…`, then `npm run dev`.

Analytics loads only when that variable is set at build time. Tab switches send virtual page views (`/FinancialPlanner/tab/loan`, etc.). Loan inputs are not transmitted. See footer terms for the privacy note.

## Licence

MIT — see [LICENSE](LICENSE).

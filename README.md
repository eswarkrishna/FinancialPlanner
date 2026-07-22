# FinancialPlanner

![FinancialPlanner loan and prepayment calculators](public/og-image.png)

**Live demo:** [https://eswarkrishna.github.io/FinancialPlanner/](https://eswarkrishna.github.io/FinancialPlanner/)

Spec-driven home-loan simulator for India (with US/UK locales): compare prepayment strategies, model unemployment with staged PF withdrawals, and audit amortisation schedules with bank-style reducing-balance math. Every formula and acceptance test lives in [`docs/SPEC.md`](docs/SPEC.md) so outputs stay reproducible; when we publish bank parity cases they will appear in [`docs/VALIDATION.md`](docs/VALIDATION.md) (Phase 5 wedge).

## Quick start

```bash
npm install
npm run dev
```

```bash
npm run test
npm run test:e2e:full
npm run build
```

## Documentation

| Document | Purpose |
|----------|---------|
| [docs/SPEC.md](docs/SPEC.md) | Full product & engineering specification |
| [CHANGELOG.md](CHANGELOG.md) | User-facing release history (update on every ship) |
| [docs/TASKS.md](docs/TASKS.md) | Feature delivery checklist (mark tasks done) |
| [docs/TASKS-SEO.md](docs/TASKS-SEO.md) | SEO gap-fill phased checklist |
| [docs/SEO-SIGNOFF.md](docs/SEO-SIGNOFF.md) | SEO sign-off & ship (Phases 12–13) |
| [docs/ANALYTICS.md](docs/ANALYTICS.md) | Optional GA4 setup and consent behaviour |
| [docs/VALIDATION.md](docs/VALIDATION.md) | Bank calculator parity cases and methodology |
| [docs/LEARNINGS.md](docs/LEARNINGS.md) | Dated post-feature learnings |
| [docs/research/](docs/research/) | Spikes and research notes |
| [AGENTS.md](AGENTS.md) | Instructions for AI coding agents + Cursor skills index |
| [.cursor/rules/](.cursor/rules/) | Cursor project rules |

## Money rounding (v1 default)

EMI and schedule amounts use **2 decimal places** (paise), **half-up** rounding at each stored step unless the spec’s `rounding_mode` is extended later. Document any change in this README.

## Disclaimer

Educational software only. EPF rules, lender charges, and taxes vary — see §14 in `docs/SPEC.md`.

## Publish on the internet

### GitHub Pages (free, **public** repository required)

Every push to `main` runs [`.github/workflows/pages.yml`](.github/workflows/pages.yml) and deploys the built SPA.

**Live URL (after enable):** [https://eswarkrishna.github.io/FinancialPlanner/](https://eswarkrishna.github.io/FinancialPlanner/)

GitHub does **not** offer Pages on **private** repos with the free plan. Either make the repo public, use a paid plan, deploy via AWS (below), or connect to [Cloudflare Pages](https://pages.cloudflare.com/) / [Netlify](https://www.netlify.com/).

Then: **Settings → Pages → Build and deployment → Source: GitHub Actions**.

Local build for the same base path as production:

```bash
set VITE_BASE=/FinancialPlanner/
npm run build
```

### AWS (optional, custom domain)

For S3 + CloudFront + your own domain, follow [`infra/README.md`](infra/README.md), set GitHub secrets `S3_BUCKET`, `CLOUDFRONT_DISTRIBUTION_ID`, and `AWS_DEPLOY_ROLE_ARN`, then use [`.github/workflows/deploy.yml`](.github/workflows/deploy.yml).

### User feedback

Every page footer includes **Report on GitHub**, which opens a new issue on the repo (`VITE_GITHUB_REPO`, default `eswarkrishna/FinancialPlanner`).

### SEO

Build-time and runtime SEO use `VITE_SITE_URL` (default in `.env.production`: GitHub Pages demo URL). Conventions follow SPEC §8.

- **Titles/descriptions:** keyword-first per-tab titles (`{Keyword} | FinancialPlanner`) and unique 120–160-char descriptions
- **Meta tags:** description, robots (`max-image-preview:large`), theme-color, canonical, Open Graph (`og:site_name`, per-locale `og:locale`, `og:image:alt`), Twitter cards
- **JSON-LD:** `WebApplication` plus `BreadcrumbList` on non-loan tabs
- **Assets:** `public/favicon.svg`, `public/og-image.png`; Inter font self-hosted via `@fontsource/inter`
- **Generated on build:** `dist/robots.txt`, `dist/sitemap.xml`, per-route HTML shells, `dist/404.html` with `noindex`

Run `npm run verify:seo` after build for automated shell checks.

### Android (maintenance-only)

A Capacitor shell exists under `android/` for smoke builds (`npm run cap:sync`). **Web traffic is the priority**; no new native features until the India loan wedge wins. See `docs/OVERVIEW.md` and SPEC §5.2.

## Licence

MIT — see [LICENSE](LICENSE).

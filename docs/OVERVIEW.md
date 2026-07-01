# FinancialPlanner — overview

High-level orientation. **Authoritative product rules:** [`SPEC.md`](SPEC.md) (India / INR) and [`SPEC-US.md`](SPEC-US.md) (United States / USD). **Agent workflow:** [`../AGENTS.md`](../AGENTS.md).

## Problem

Help borrowers **compare loan payoff strategies** (prepayments, tenure vs payment, optional job-loss + retirement-account withdrawal paths) with transparent amortisation numbers, and **compare three named repayment strategies** (equity blend, prepay heavy, aggressive prepay) per **SPEC §4.12** (IN) / **SPEC-US §4.12** (US).

**Locales:** India (implemented) models EPFO-style PF tranches and INR; **US** (specced, not yet implemented) models 401(k) staged distributions, mortgage, and USD — see [`research/2026-07-us-employee-benefits-mapping.md`](research/2026-07-us-employee-benefits-mapping.md).

## Users & personas

See **SPEC §3** (borrower optimiser, stress tester, comparator).

## Architecture

| Area | Role |
|------|------|
| `src/lib/` | Pure finance modules: loan amortisation, debt payoff strategy engine, retirement corpus projection, **repayment strategy planner** (`strategy/`), input shaping, formatting. |
| `src/features/strategy/` | §4.12 household inputs, tier presets, strategy comparison + allocation tables. |
| `src/App.tsx` (and other `features/`) | Dashboard inputs, scenario selection, comparison tables, timeline views. |
| `docs/SPEC.md` | Source of truth for India locale behaviour and acceptance tests. |
| `docs/SPEC-US.md` | Source of truth for US locale (401(k), mortgage, USD). |

**Data flow:** form values → input parse/validation → simulation functions → summary + timeline rows → UI.

```mermaid
flowchart LR
  subgraph ui [UI]
    F[Forms]
    T[Tables]
  end
  subgraph lib [src/lib]
    Z[Zod]
    S[Schedules]
    ST[Strategy §4.12]
  end
  SPEC[(SPEC.md)]
  F --> Z --> S --> T
  F --> Z --> ST --> T
  SPEC -.->|defines| S
  SPEC -.->|defines| ST
```

## Tech stack

Vite, React 19, TypeScript, Zod, Vitest, jsdom (see `package.json`).

## Testing & quality

- **§10** in SPEC lists acceptance-style checks.  
- Unit tests under `src/lib/*.test.ts`.  
- Golden / fixture JSON under `src/test/fixtures/goldens/` (loan snapshots) and `src/test/fixtures/strategy/` (§15.1 tier × strategy); regenerate with `npm run goldens:update`.

```bash
npm run test
npm run build
npm run dev
```

## Hosting

Production hosting is a static SPA on **S3 (private) + CloudFront** with optional ACM/Route 53 for a custom domain. Infra-as-code lives in [`../infra/terraform/`](../infra/terraform/) and the deploy workflow in [`../.github/workflows/deploy.yml`](../.github/workflows/deploy.yml). See [`../infra/README.md`](../infra/README.md) for the apply/teardown loop and the GitHub OIDC setup.

## Related docs

| Doc | Purpose |
|-----|---------|
| [SPEC.md](SPEC.md) | India locale product & engineering specification |
| [SPEC-US.md](SPEC-US.md) | US locale product & engineering specification |
| [TASKS.md](TASKS.md) | Feature delivery checklist (`[ ]` → `[x]`) |
| [LEARNINGS.md](LEARNINGS.md) | Dated post-feature notes |
| [research/README.md](research/README.md) | Spike and research index |
| [../infra/README.md](../infra/README.md) | AWS deploy (S3 + CloudFront) infra-as-code |
| [../AGENTS.md](../AGENTS.md) | Cursor agent + skill index |

## Research

| Doc | Topic |
|-----|--------|
| [2026-07-us-employee-benefits-mapping.md](research/2026-07-us-employee-benefits-mapping.md) | US locale research spike: 401(k)/UI/mortgage/SS desk research + spec recommendations |

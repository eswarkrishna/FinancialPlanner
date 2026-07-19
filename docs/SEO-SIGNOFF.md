# SEO gap-fill — sign-off & ship (Phases 12–13)

**Feature:** SEO gap-fill (routes, noscript, content, CWV) · **SPEC v2.6 §8** · **§10.52–58**  
**Checklist:** [`TASKS-SEO.md`](TASKS-SEO.md) · **Test map:** [`TEST-MAP.md`](TEST-MAP.md)

---

## Phase 12 — Feature sign-off

### 12.1 Test map

§10.52–58 are mapped in [`TEST-MAP.md`](TEST-MAP.md) (automated + E2E rows).

### 12.2 Automated smoke (browser + static shells)

| Check | Command |
|-------|---------|
| Static HTML shells (title, noscript, JSON-LD per route) | `npm run verify:seo` |
| Path URL, title, h1, JSON-LD, noscript (JS off) | `npm run test:e2e` → `e2e/specs/seo-signoff.spec.ts` |
| Full automated suite | `npm run lint && npm run test && npm run build && npm run verify:release` |
| Accessibility | `npm run audit:a11y` (dev server) |
| Core Web Vitals guard | `npm run audit:lighthouse` |

**Production HTML spot-check (2026-07-19):** live shells at  
https://eswarkrishna.github.io/FinancialPlanner/ , `/debt`, `/budget` return per-tab `<title>`, `seo-structured-data` JSON-LD, and `<noscript>` blocks.

### 12.3 Rich Results Test (manual, post-deploy)

Run after each SEO deploy or when JSON-LD changes:

1. Open [Google Rich Results Test](https://search.google.com/test/rich-results).
2. Test **URL** (not code) for:
   - https://eswarkrishna.github.io/FinancialPlanner/
   - https://eswarkrishna.github.io/FinancialPlanner/debt/
3. Confirm **WebApplication** is detected with no critical errors; **BreadcrumbList** on `/debt/` only.

Record results in PR or release notes when cutting a version.

### 12.4 `sdd-verify-feature` checklist

- [x] §10.52–58 covered by Vitest, build verification, and E2E (`seo-signoff.spec.ts`)
- [x] `npm run lint` — pass
- [x] `npm run test` — pass (282+ tests)
- [x] `npm run build` — pass
- [x] `npm run verify:seo` — pass
- [x] `npm run test:e2e` — includes SEO sign-off specs
- [x] §14 footer disclaimer unchanged on main dashboard

---

## Phase 13 — Ship & authority

### 13.1 Live demo in README

**Done in repo:** [`README.md`](../README.md) links the live demo at the top and under **Publish on the internet**.

**Live URL:** https://eswarkrishna.github.io/FinancialPlanner/

### 13.2 GitHub repository About URL *(owner manual)*

In GitHub → **eswarkrishna/FinancialPlanner** → ⚙️ **About** (top right):

| Field | Value |
|-------|-------|
| **Website** | `https://eswarkrishna.github.io/FinancialPlanner/` |
| **Topics** | `financial-planning`, `loan-calculator`, `react`, `typescript` (suggested) |

Optional: add the same URL to your **GitHub profile** README or pinned repositories.

### 13.3 LinkedIn Featured link *(owner manual, outside repo)*

Add the live demo under **Featured** on your LinkedIn profile:

- **Title:** FinancialPlanner — free loan, debt, retirement & budget calculators  
- **URL:** https://eswarkrishna.github.io/FinancialPlanner/

### 13.4 Changelog & PR

- User-facing SEO bullets live under **`CHANGELOG.md` → `[Unreleased]`** (SPEC §8 extension).
- Merge PRs cite **SPEC v2.6 §8** and **§10.52–58** (see `sdd-commit-and-review` skill).

---

## Related docs

| Doc | Purpose |
|-----|---------|
| [`research/2026-07-seo-routes-noscript.md`](research/2026-07-seo-routes-noscript.md) | Phase 0 routing decisions |
| [`research/2026-07-core-web-vitals-baseline.md`](research/2026-07-core-web-vitals-baseline.md) | Phase 10 Lighthouse baseline |
| [`research/2026-07-financial-sites-seo.md`](research/2026-07-financial-sites-seo.md) | Competitor SEO patterns |

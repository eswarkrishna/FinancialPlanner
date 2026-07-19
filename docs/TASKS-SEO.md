# SEO improvement — task checklist

Tasks derived from the **SEO Improvement Spec** (uploaded 2026-07-19). Cross-referenced against current implementation (`src/lib/seo.ts`, `index.html`, `vite.config.ts`, `docs/SPEC.md` §8, `docs/research/2026-07-financial-sites-seo.md`).

**How to use:** mark done with `- [x]`. Follow build order in §4 of the source spec. Ship via `sdd-create-feature` — update `docs/SPEC.md` §8 before behaviour changes.

---

## Feature block

| Field | Value |
|-------|-------|
| **Feature name** | SEO gap-fill (routes, noscript, content, CWV audit) |
| **SPEC sections** | §8 (extend), new §10 acceptance bullets |
| **Branch / PR** | *(not started)* |
| **Started** | 2026-07-19 |

---

## Status summary

| Area | Spec ref | Status |
|------|----------|--------|
| JSON-LD structured data | 1.1 | **Done** — `WebApplication` + `BreadcrumbList` per tab |
| Per-tab titles & meta descriptions | 1.2 | **Done** — keyword-first, unique per tab |
| Clean path routes (`/emi`, `/debt`, …) | 1.2 | **Not done** — still `/?tab=` query params |
| `<noscript>` crawler fallback | 1.3 | **Not done** |
| Static pre-render / SSR | 1.3 | **Deferred** — research Option B |
| `robots.txt` + `sitemap.xml` | 2.1 | **Done** — emitted at build |
| Per-tab `<h1>` heading hierarchy | 2.2 | **Partial** — single site-wide `<h1>` |
| Alt text & ARIA labels | 2.3 | **Partial** — charts/inputs covered; audit needed |
| Contextual internal links | 2.4 | **Not done** |
| Lighthouse / Core Web Vitals gate | 2.5 | **Not done** — sampling exists, no CI gate |
| Explainer copy (100–200 words/tab) | 3.1 | **Not done** |
| Profile backlinks (LinkedIn, README) | 3.2 | **Manual / out of repo** |

---

## Phase 0 — Intake & research

- [ ] **0.1** Confirm **user outcome**: each calculator is discoverable individually in search with rich results and crawlable fallback content.
- [ ] **0.2** Decide **routing strategy**: path routes (`/emi`, `/debt-payoff`, `/retirement`, `/budget`, …) vs keep `/?tab=` (spec allows hash routes; query params already in sitemap). Document trade-off for GitHub Pages SPA (`404.html` fallback).
- [ ] **0.3** Spike if needed: **static pre-render per tab** (`vite-plugin-ssr`, `vite-ssg`, or build-time HTML shells) — research doc Option B; only if noscript is insufficient.
- [ ] **0.4** Link research: extend [`docs/research/2026-07-financial-sites-seo.md`](research/2026-07-financial-sites-seo.md) with path-route + noscript decision.

---

## Phase 1 — Requirements (`docs/SPEC.md`)

- [ ] **1.1** Extend §8 **SEO metadata** with:
  - Path-based tab URLs (or explicit acceptance of query-param canonicals).
  - `<noscript>` fallback block requirements (plain-text per calculator).
  - Per-tab `<h1>` rule (calculator name, not site brand).
  - Internal linking requirement (≥1 contextual link per tab).
  - Explainer content requirement (100–200 unique words per tab).
- [ ] **1.2** Add §10 acceptance tests for new SEO behaviours (noscript present, h1 per tab, internal links, explainer word count).
- [ ] **1.3** Confirm §11 non-goals unchanged (no paid link building, no hreflang, no meta A/B).

---

## Phase 2 — Implementation (by build order)

### 2.1 Per-calculator routes + unique titles/meta *(spec 1.2 — foundational)*

- [x] **2.1a** Unique `<title>` and `<meta name="description">` per tab — `pageTitle()`, `pageDescription()`, `updatePageSeo()`.
- [x] **2.1b** Canonical + OG/Twitter tags update on tab change.
- [ ] **2.1c** Introduce **path routes** (e.g. `/`, `/debt`, `/retirement`, `/strategies`, `/strategic`, `/budget`) with client-side router (or Vite MPA shells).
- [ ] **2.1d** GitHub Pages SPA fallback: `404.html` → `index.html` rewrite preserves path; update `tabPageUrl()` + sitemap URLs.
- [ ] **2.1e** Redirect or canonicalise legacy `/?tab=` URLs to new paths (301 via meta refresh or router replaceState).
- [ ] **2.1f** E2E: direct navigation to each path loads correct tab + correct `document.title`.

### 2.2 JSON-LD structured data *(spec 1.1)*

- [x] **2.2a** `WebApplication` JSON-LD: `name`, `applicationCategory: FinanceApplication`, `offers` price 0, `description`, `featureList`, `publisher.sameAs`.
- [x] **2.2b** `BreadcrumbList` on non-home tabs.
- [x] **2.2c** Injected in `<head>` at build (loan tab) and updated on tab change.
- [ ] **2.2d** Manual smoke: pass [Google Rich Results Test](https://search.google.com/test/rich-results) for home + one sub-tab after path-route change.

### 2.3 Sitemap & robots.txt *(spec 2.1)*

- [x] **2.3a** `robots.txt` generated at build — `Allow: /`, sitemap pointer.
- [x] **2.3b** `sitemap.xml` lists every tab URL with `<lastmod>` from git commit date.
- [ ] **2.3c** Update sitemap entries when path routes land (§2.1).
- [ ] **2.3d** Submit updated sitemap in Google Search Console *(manual, post-deploy)*.

### 2.4 Noscript / pre-render fallback *(spec 1.3)*

- [ ] **2.4a** Add `<noscript>` block in `index.html` (or per-route HTML shells) with plain-text description of each calculator’s purpose.
- [ ] **2.4b** Noscript copy unique per tab if using path shells; otherwise aggregate all calculators on home noscript block.
- [ ] **2.4c** *(Optional spike)* Evaluate build-time static HTML pre-render for landing + tab shells; document go/no-go in research note.

### 2.5 Heading hierarchy *(spec 2.2)*

- [ ] **2.5a** One `<h1>` per tab view — e.g. “Loan EMI Calculator”, “Debt Avalanche vs Snowball Calculator” (use `PLANNER_TABS[].seoTitle` or dedicated `h1` field).
- [ ] **2.5b** Demote current site-wide `<h1>FinancialPlanner</h1>` in `App.tsx` to `<p>` or branded `<span>` (logo text).
- [ ] **2.5c** Audit section headings: no skipped levels (`h1` → `h2` → `h3`); fix any `h3` under missing `h2`.
- [ ] **2.5d** Unit or a11y test: exactly one `h1` per tab panel.

### 2.6 Alt text & ARIA *(spec 2.3)*

- [x] **2.6a** Charts: `aria-label` on `LineChart`, `BarChart`, `PayoffHeatmap`.
- [x] **2.6b** Many form inputs: per-field `aria-label` in debt/budget/loan sections.
- [ ] **2.6c** Run `scripts/a11y-audit.ts` across **all six tabs** (budget tab missing from audit list today).
- [ ] **2.6d** Fix any axe violations for missing labels / colour contrast.
- [ ] **2.6e** Non-decorative images: confirm `og-image.png` alt via meta; add `alt` on any inline `<img>` if introduced.

### 2.7 Internal linking *(spec 2.4)*

- [ ] **2.7a** Add contextual “Related calculators” block per tab (e.g. loan → retirement, debt → budget).
- [ ] **2.7b** Use real `<a href>` path URLs (after §2.1) for crawlability; `onClick` tab switch as progressive enhancement only.
- [ ] **2.7c** At least one contextual internal link per calculator page (acceptance).

### 2.8 Explainer content *(spec 3.1)*

- [ ] **2.8a** Add 100–200 words unique explanatory copy per tab: formula summary + example walkthrough.
- [ ] **2.8b** Place below KPI strip or above inputs (visible without JS for noscript parity).
- [ ] **2.8c** Locale-aware variants optional (IN/US/UK) — start with `en` generic if scope is tight.
- [ ] **2.8d** Test: word count per tab within 100–200 range.

### 2.9 Page speed / Core Web Vitals *(spec 2.5)*

- [x] **2.9a** Runtime `web-vitals` sampling to GA4 (§5.1.2).
- [ ] **2.9b** Run Lighthouse mobile audit on production URL; record LCP, CLS, INP baseline.
- [ ] **2.9c** If LCP ≥ 2.5s or CLS ≥ 0.1: font subsetting, lazy-load heavy tabs, or code-split `GameSection` / charts.
- [ ] **2.9d** Optional CI script: fail build if Lighthouse scores regress (stretch).

---

## Phase 3 — Automated verification

- [x] **3.1** `src/lib/seo.test.ts` — titles, descriptions, JSON-LD, sitemap, robots (§10.45–47).
- [ ] **3.2** Tests for path URLs in `tabPageUrl()` after route migration.
- [ ] **3.3** Tests for per-tab `h1` text (component or DOM snapshot).
- [ ] **3.4** Tests for internal link presence per tab.
- [ ] **3.5** Tests for explainer word-count bounds.
- [ ] **3.6** `npm run lint` + `npm run test` + `npm run build` clean.

---

## Phase 4 — Feature sign-off

- [ ] **4.1** Map new §10 bullets in `docs/TEST-MAP.md`.
- [ ] **4.2** Manual smoke: each path loads correct tab, title, h1, JSON-LD, noscript visible with JS disabled.
- [ ] **4.3** Rich Results Test on deployed build.
- [ ] **4.4** `sdd-verify-feature` checklist complete.

---

## Phase 5 — Ship & authority *(spec 3.2 — manual)*

- [ ] **5.1** Confirm live demo link prominent in `README.md` *(likely already present)*.
- [ ] **5.2** Add site link to GitHub profile / repo About URL.
- [ ] **5.3** Add Featured link on LinkedIn *(manual, outside repo)*.
- [ ] **5.4** `CHANGELOG.md` + PR citing SPEC §8 extension.

---

## Out of scope (this pass)

- Paid link building / guest posts (spec §5).
- Multi-language `hreflang` (spec §5).
- Meta description A/B testing (spec §5).
- FAQPage JSON-LD without visible Q&A (Google deprecated May 2026; see research doc).

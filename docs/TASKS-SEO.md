# SEO improvement — task checklist

Tasks derived from the **SEO Improvement Spec** (uploaded 2026-07-19). Cross-referenced against current implementation (`src/lib/seo.ts`, `index.html`, `vite.config.ts`, `docs/SPEC.md` §8, `docs/research/2026-07-financial-sites-seo.md`).

**How to use:** mark done with `- [x]`. Work phases **in order** — later phases depend on earlier ones. Ship via `sdd-create-feature`; update `docs/SPEC.md` §8 before behaviour changes.

---

## Feature block

| Field | Value |
|-------|-------|
| **Feature name** | SEO gap-fill (routes, noscript, content, CWV audit) |
| **SPEC sections** | §8 (extend), new §10 acceptance bullets |
| **Branch / PR** | `cursor/seo-tasks-checklist-1325` / #55 |
| **Started** | 2026-07-19 |
| **Phase 0 research** | [`docs/research/2026-07-seo-routes-noscript.md`](research/2026-07-seo-routes-noscript.md) |

---

## Phase overview

| Phase | Name | Spec ref | Depends on | Status |
|------:|------|----------|------------|--------|
| 0 | Intake & research | — | — | **Done** |
| 1 | Requirements (SPEC) | — | 0 | **Done** |
| 2 | Per-calculator routes & URLs | 1.2 | 1 | **Done** |
| 3 | Structured data (JSON-LD) | 1.1 | 2 | **Done** |
| 4 | Sitemap & robots.txt | 2.1 | 2 | **Done** |
| 5 | Noscript & crawler fallback | 1.3 | 2 | **Done** |
| 6 | Heading hierarchy | 2.2 | 2 | **Done** |
| 7 | Alt text & ARIA | 2.3 | — | **Partial** |
| 8 | Internal linking | 2.4 | 2, 6 | Not started |
| 9 | Explainer content | 3.1 | 6 | Not started |
| 10 | Page speed & Core Web Vitals | 2.5 | — | **Partial** — sampling only |
| 11 | Automated verification | §10 | 2–10 | **Partial** |
| 12 | Feature sign-off | — | 11 | Not started |
| 13 | Ship & authority (manual) | 3.2 | 12 | Not started |

```mermaid
flowchart LR
  P0[0 Research] --> P1[1 SPEC]
  P1 --> P2[2 Routes]
  P2 --> P3[3 JSON-LD]
  P2 --> P4[4 Sitemap]
  P2 --> P5[5 Noscript]
  P2 --> P6[6 Headings]
  P6 --> P8[8 Links]
  P6 --> P9[9 Content]
  P7[7 A11y] --> P11[11 Tests]
  P8 --> P11
  P9 --> P11
  P10[10 CWV] --> P11
  P3 --> P11
  P4 --> P11
  P5 --> P11
  P11 --> P12[12 Sign-off]
  P12 --> P13[13 Ship]
```

---

## Phase 0 — Intake & research

**Goal:** Lock routing and pre-render decisions before coding.

**Deliverable:** [`docs/research/2026-07-seo-routes-noscript.md`](research/2026-07-seo-routes-noscript.md)

- [x] **0.1** Confirm **user outcome**: each calculator is discoverable individually in search with rich results and crawlable fallback content.
- [x] **0.2** Decide **routing strategy**: **path slugs** (`/`, `/debt`, `/retirement`, `/strategies`, `/strategic`, `/budget`); legacy `/?tab=` redirects; build-time `dist/{slug}/index.html` for GitHub Pages HTTP 200.
- [x] **0.3** Spike **static pre-render**: **deferred** — per-route HTML shells + `<noscript>` instead of vite-ssg/SSR; revisit if GSC indexing flat post-ship.
- [x] **0.4** Extend [`docs/research/2026-07-financial-sites-seo.md`](research/2026-07-financial-sites-seo.md) §8 with path-route + noscript decision; new spike doc linked from research index + `OVERVIEW.md`.

---

## Phase 1 — Requirements (`docs/SPEC.md`)

**Goal:** Encode new SEO behaviours in the spec before implementation.

**Deliverable:** `docs/SPEC.md` v2.6 — §8 extended, §10.52–58, §11 SEO non-goals

- [x] **1.1** Extend §8 **SEO metadata** with:
  - Path-based tab URLs (`/`, `/debt`, `/retirement`, `/strategies`, `/strategic`, `/budget`).
  - `<noscript>` fallback block requirements (plain-text per calculator).
  - Per-tab `<h1>` rule (calculator name, not site brand).
  - Internal linking requirement (≥1 contextual link per tab).
  - Explainer content requirement (100–200 unique words per tab).
- [x] **1.2** Add §10 acceptance tests **52–58** for path URLs, legacy redirect, build shells, noscript, h1, internal links, explainer word count.
- [x] **1.3** Confirm §11 non-goals: paid link building, hreflang, meta A/B, full SSR prerender deferred.

---

## Phase 2 — Per-calculator routes & URLs

**Goal:** Each calculator has its own crawlable URL. **Foundational — unlocks phases 3–6, 8–9.**

| Done | Task |
|:----:|------|
| [x] | **2.1** Unique `<title>` and `<meta name="description">` per tab — `pageTitle()`, `pageDescription()`, `updatePageSeo()`. |
| [x] | **2.2** Canonical + OG/Twitter tags update on tab change. |
| [x] | **2.3** Path routes (`/`, `/debt`, `/retirement`, `/strategies`, `/strategic`, `/budget`) via `getTabFromPathname` / `setTabInUrl`. |
| [x] | **2.4** Build emits `dist/{slug}/index.html` + `dist/404.html`; verified by `verify-release-deploy.mjs`. |
| [x] | **2.5** Legacy `/?tab=` redirects via `redirectLegacyTabQuery()` (UTM params preserved). |
| [x] | **2.6** E2E: `navigation.spec.ts` + `e2e/helpers/page.ts` use path URLs. |

---

## Phase 3 — Structured data (JSON-LD)

**Goal:** Rich results eligibility via valid schema markup. Spec ref: **1.1**.

| Done | Task |
|:----:|------|
| [x] | **3.1** `WebApplication` JSON-LD: `name`, `applicationCategory: FinanceApplication`, `offers` price 0, `description`, `featureList`, `publisher.sameAs`. |
| [x] | **3.2** `BreadcrumbList` on non-home tabs. |
| [x] | **3.3** Injected in `<head>` at build (loan tab) and updated on tab change. |
| [x] | **3.4** JSON-LD `url` fields use path-slug canonicals after Phase 2. |
| [ ] | **3.5** Manual smoke: pass [Google Rich Results Test](https://search.google.com/test/rich-results) for home + one sub-tab on deployed build. |

---

## Phase 4 — Sitemap & robots.txt

**Goal:** Crawlers can discover every calculator page. Spec ref: **2.1**.

| Done | Task |
|:----:|------|
| [x] | **4.1** `robots.txt` generated at build — `Allow: /`, sitemap pointer. |
| [x] | **4.2** `sitemap.xml` lists every tab URL with `<lastmod>` from git commit date. |
| [x] | **4.3** Sitemap entries use path URLs (no `?tab=`). |
| [ ] | **4.4** Submit updated sitemap in Google Search Console *(manual, post-deploy)*. |

---

## Phase 5 — Noscript & crawler fallback

**Goal:** Plain-text content visible to non-JS crawlers. Spec ref: **1.3**.

| Done | Task |
|:----:|------|
| [x] | **5.1** `<noscript>` block in each HTML shell with plain-text calculator description. |
| [x] | **5.2** Per-route noscript copy + sibling calculator links (build-time shells). |
| [ ] | **5.3** *(Optional spike)* Evaluate build-time static HTML pre-render; document go/no-go if indexing gaps persist. *(Deferred per Phase 0.)* |

---

## Phase 6 — Heading hierarchy

**Goal:** One calculator-specific `<h1>` per page; no skipped levels. Spec ref: **2.2**.

| Done | Task |
|:----:|------|
| [x] | **6.1** One `<h1>` per tab view via `TabPageHeading` + `pageHeading()` (`PLANNER_TABS[].seoTitle`). |
| [x] | **6.2** Site brand demoted to `<p class="app-brand-name">` in header (not `<h1>`). |
| [x] | **6.3** Game legend category titles demoted from `<h3>` to `<p>` (no skipped level under `<summary>`). |
| [x] | **6.4** `App.test.tsx` — exactly one `h1` per tab; `e2e/app-shell.spec.ts` updated. |

---

## Phase 7 — Alt text & ARIA

**Goal:** Accessible labels on all interactive and informational elements. Spec ref: **2.3**. *(Can run in parallel with Phase 6.)*

| Done | Task |
|:----:|------|
| [x] | **7.1** Charts: `aria-label` on `LineChart`, `BarChart`, `PayoffHeatmap`. |
| [x] | **7.2** Many form inputs: per-field `aria-label` in debt/budget/loan sections. |
| [ ] | **7.3** Run `scripts/a11y-audit.ts` across **all six tabs** (budget tab missing from audit list today). |
| [ ] | **7.4** Fix any axe violations for missing labels / colour contrast. |
| [ ] | **7.5** Non-decorative images: confirm `og-image.png` alt via meta; add `alt` on any inline `<img>` if introduced. |

---

## Phase 8 — Internal linking

**Goal:** Contextual cross-links between calculators for crawl equity and session depth. Spec ref: **2.4**. *(Requires Phase 2 path URLs.)*

| Done | Task |
|:----:|------|
| [x] | **8.1** `RelatedCalculators` block per tab with intent-based blurbs (`src/lib/tabPageContent.ts`). |
| [x] | **8.2** Real `<a href>` path URLs via `tabPathname()`; SPA `onSelectTab` on click. |
| [x] | **8.3** ≥1 contextual internal link per calculator page — tested in `App.test.tsx` + `tabPageContent.test.ts`. |

---

## Phase 9 — Explainer content

**Goal:** 100–200 words of unique, indexable copy per calculator. Spec ref: **3.1**. *(Requires Phase 6 h1 structure.)*

| Done | Task |
|:----:|------|
| [x] | **9.1** `TAB_EXPLAINERS` in `src/lib/tabPageContent.ts` — formula summary + example per tab. |
| [x] | **9.2** `TabExplainer` below `<h1>`, above calculator inputs (in `App.tsx`). |
| [x] | **9.3** English generic copy (locale variants deferred). |
| [x] | **9.4** `tabPageContent.test.ts` — word count 100–200, uniqueness. |

---

## Phase 10 — Page speed & Core Web Vitals

**Goal:** LCP &lt; 2.5s, CLS &lt; 0.1 on mobile. Spec ref: **2.5**. *(Can run in parallel with Phases 6–9.)*

| Done | Task |
|:----:|------|
| [x] | **10.1** Runtime `web-vitals` sampling to GA4 (§5.1.2). |
| [ ] | **10.2** Run Lighthouse mobile audit on production URL; record LCP, CLS, INP baseline. |
| [ ] | **10.3** If LCP ≥ 2.5s or CLS ≥ 0.1: font subsetting, lazy-load heavy tabs, or code-split `GameSection` / charts. |
| [ ] | **10.4** *(Stretch)* CI script: fail build if Lighthouse scores regress. |

---

## Phase 11 — Automated verification

**Goal:** Bind implementation to §10 acceptance criteria.

| Done | Task |
|:----:|------|
| [x] | **11.1** `src/lib/seo.test.ts` — titles, descriptions, JSON-LD, sitemap, robots (§10.45–47). |
| [ ] | **11.2** Tests for path URLs in `tabPageUrl()` after Phase 2. |
| [ ] | **11.3** Tests for per-tab `h1` text (component or DOM snapshot). |
| [ ] | **11.4** Tests for internal link presence per tab. |
| [ ] | **11.5** Tests for explainer word-count bounds. |
| [ ] | **11.6** `npm run lint` + `npm run test` + `npm run build` clean. |

---

## Phase 12 — Feature sign-off

**Goal:** Manual acceptance before merge.

- [ ] **12.1** Map new §10 bullets in `docs/TEST-MAP.md`.
- [ ] **12.2** Manual smoke: each path loads correct tab, title, h1, JSON-LD, noscript visible with JS disabled.
- [ ] **12.3** Rich Results Test on deployed build.
- [ ] **12.4** `sdd-verify-feature` checklist complete.

---

## Phase 13 — Ship & authority (manual)

**Goal:** Post-deploy distribution and trust signals. Spec ref: **3.2**. *(Outside repo for LinkedIn.)*

- [ ] **13.1** Confirm live demo link prominent in `README.md` *(likely already present)*.
- [ ] **13.2** Add site link to GitHub profile / repo About URL.
- [ ] **13.3** Add Featured link on LinkedIn *(manual, outside repo)*.
- [ ] **13.4** `CHANGELOG.md` + PR citing SPEC §8 extension.

---

## Out of scope (this pass)

- Paid link building / guest posts (spec §5).
- Multi-language `hreflang` (spec §5).
- Meta description A/B testing (spec §5).
- FAQPage JSON-LD without visible Q&A (Google deprecated May 2026; see research doc).

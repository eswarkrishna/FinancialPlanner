# Research: SEO patterns on famous financial sites

**Date:** 2026-07-10 · **Status:** concluded · **Feeds:** `docs/SPEC.md` §8 (SEO metadata), `src/lib/seo.ts`

## 1. Question

What do high-ranking financial calculator sites (NerdWallet, Bankrate, Zillow, Groww/ClearTax-style EMI calculators) do for on-page SEO that FinancialPlanner does not, and which of those practices apply to a client-side SPA on GitHub Pages?

## 2. Constraints

- Pure client-side SPA (no SSR/Next.js — §12 keeps Vite + React; prerendering is out of scope here).
- Tabs are query-param routes (`/?tab=debt`), one `index.html`; meta tags update at runtime, build stamps the defaults.
- Privacy rules §5.1 unchanged; no third-party SEO scripts (§11).

## 3. Findings (what the big sites do)

1. **Keyword-first title tags, brand last.** Pattern: `[Primary keyword] – [Benefit] | Brand`, ≤ ~60 chars. E.g. calculator pages title as “Home Loan EMI Calculator – … | Brand”, not “Brand — Loan”. Our current `FinancialPlanner — Loan` buries the keyword.
2. **Meta descriptions 120–160 chars with a benefit + CTA** (“Free.”, “Compare…”), unique per page. Ours are unique but not tuned for length/CTA.
3. **Calculator-specific structured data.** `WebApplication`/`SoftwareApplication` with `applicationCategory: FinanceApplication`, `featureList`, `isAccessibleForFree`, `inLanguage`, `offers price 0`, `dateModified`. FAQ rich results were deprecated by Google in May 2026 — FAQPage markup is only worth adding alongside real visible Q&A content (not added here).
4. **`BreadcrumbList` site-wide** for entity/hierarchy context (Home → tool). Cheap and still a supported rich result.
5. **Entity/trust signals:** `Organization`/`publisher` with `sameAs` links (GitHub repo for us), since finance is a YMYL category where entity resolution matters for AI search.
6. **`robots` meta `max-image-preview:large`**, `og:site_name`, `og:locale`, `og:image:alt`, `theme-color` — standard head hygiene on all the big sites.
7. **Sitemap `<lastmod>`** from deploy date; sites keep calculators marked fresh.
8. **Core Web Vitals** on calculator pages — we already sample web-vitals (§5.1.2); no change needed.

## 4. Options

- **A. Meta/JSON-LD upgrade only (client-side)** — keyword titles, tuned descriptions, richer JSON-LD (WebApplication + BreadcrumbList + publisher sameAs), head hygiene tags, sitemap lastmod. No architecture change. **Low risk.**
- **B. Prerender static HTML per tab** (vite-ssg / prerender plugin) so crawlers get tab content in first byte. Better for AI-engine citation but changes build architecture and router. **Defer.**
- **C. Next.js migration** (§12 mentions “or Next.js if SEO needed”). Highest cost; not justified yet. **Reject for now.**

## 5. Sources

- Google structured-data guidance 2026: FAQ rich results deprecated May 2026; BreadcrumbList, Organization still supported (getpassionfruit.com, globerunner.com summaries).
- Fintech SEO guides 2026: calculators as “product-as-content”, SoftwareApplication/WebApplication schema with `featureList`, keyword-first ≤60-char titles, 120–160-char descriptions (authorityspecialist.com, thatdevpro.com, ultrascout.ai).
- Live calculator page patterns: keyword-first titles + WebApplication JSON-LD with featureList/`isAccessibleForFree` (calcwise.finance mortgage calculator; Bankrate/Zillow SERP titles).

## 6. Recommendation

Do **Option A** now. Revisit prerendering (Option B) as a separate spike if search impressions stay flat after this lands.

## 7. Spec delta (accepted → SPEC §8 “SEO metadata”, §10.45–47)

- Per-tab keyword-first titles (≤ ~65 chars, brand suffix) and 120–160-char descriptions.
- JSON-LD: `WebApplication` (featureList, isAccessibleForFree, inLanguage, offers, dateModified) + `BreadcrumbList` (Home → tab) + publisher `Organization` with GitHub `sameAs`; updated on tab change.
- Head hygiene: `robots` meta, `og:site_name`, `og:locale`, `og:image:alt`, `theme-color`.
- Sitemap `<lastmod>` from build commit date.

## 8. Follow-up: path routes & noscript (2026-07-19)

Option A (meta/JSON-LD) is **shipped**. Remaining SEO gaps (per uploaded SEO Improvement Spec) are covered in a dedicated spike:

→ **[`2026-07-seo-routes-noscript.md`](2026-07-seo-routes-noscript.md)**

**Decisions (Phase 0 concluded):**

| Topic | Decision |
|-------|----------|
| URL scheme | Path slugs (`/debt`, `/retirement`, …); `/` = loan |
| GitHub Pages | Build-time `dist/{slug}/index.html` shells (HTTP 200) + `404.html` copy |
| Noscript | Per-route `<noscript>` in HTML shells — not a single aggregate block |
| Full prerender | **Deferred** — revisit only if GSC indexing stays flat post-ship |
| Router | Extend existing History API helpers; no `react-router` |

Next step: **Phase 1** — encode §8 spec delta from the follow-up doc, then **Phase 2** implementation.

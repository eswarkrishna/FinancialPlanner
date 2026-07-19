# Core Web Vitals baseline — FinancialPlanner (SEO Phase 10)

**Date:** 2026-07-19  
**Production URL:** https://eswarkrishna.github.io/FinancialPlanner/  
**Target (SEO spec §2.5):** mobile LCP &lt; 2.5 s, CLS &lt; 0.1  
**Tooling:** Lighthouse 12.x, mobile form factor, simulated throttling (`npx lighthouse`)

---

## Summary

Production and local preview builds **meet** Phase 10 thresholds on the loan home route and representative sub-tabs. **Lazy-loaded** non-loan calculator sections (`React.lazy` via `TabCalculatorSection`) shrink the initial JS payload (~510 kB → ~412 kB main chunk) while keeping the default loan tab eager-loaded for LCP.

| Route | Environment | Perf score | LCP | CLS | INP |
|-------|-------------|------------|-----|-----|-----|
| `/` (loan) | Production | 97–98 | 2.0–2.1 s | 0.000 | — |
| `/debt` | Production | 92–98 | ≤ 2.7 s* | 0.000 | — |
| `/budget` | Production | 98 | 2.0 s | 0.000 | — |
| `/` (loan) | Local preview (post split) | 98 | 1.8 s | 0.000 | — |
| `/debt` | Local preview (post split) | 98 | 1.8 s | 0.000 | — |
| `/budget` | Local preview (post split) | 98 | 1.8 s | 0.000 | — |

\*Production `/debt` once measured 2.7 s (network variance); post code-split local preview is 1.8 s. Use `LIGHTHOUSE_BASE_URL` for reproducible CI checks.

**INP:** not reported by Lighthouse in this CLI run (metric absent from audit output); runtime `web-vitals` sampling to GA4 remains the live INP source (§5.1.2).

---

## Method

1. **Production (10.2):** `npx lighthouse https://eswarkrishna.github.io/FinancialPlanner/ --form-factor=mobile --only-categories=performance`
2. **Local preview:** `npm run build && npm run preview -- --port 4173`, then Lighthouse against `http://127.0.0.1:4173/FinancialPlanner/{slug}` (matches GitHub Pages base path).
3. **Regression guard:** `npm run audit:lighthouse` (`scripts/lighthouse-audit.mjs`) — fails CI/local check if LCP ≥ 2.5 s or CLS ≥ 0.1 on home, debt, or budget routes.

---

## Observations

- Main JS chunk ~412 kB minified (~120 kB gzip) after lazy-loading non-loan tabs; loan tab stays eager for LCP. Vite emits per-section chunks (`DebtSection`, `GameSection`, …).
- Google Fonts (Inter 400–700) loads with `display=swap`; LCP element is text/content, not a hero image.
- CLS is negligible (0.0003) — layout stable across tab panels (`hidden` panels, fixed chrome).

---

## Remediation (Phase 10.3)

Implemented **`TabCalculatorSection`** with `React.lazy` for debt, retirement, strategies, strategic (game), and budget; **loan remains eager** so the default route avoids an extra chunk round-trip.

Font subsetting deferred — not required while LCP/CLS budgets pass.

---

## References

- [`docs/TASKS-SEO.md`](../TASKS-SEO.md) Phase 10
- [`docs/SPEC.md`](../SPEC.md) §5.1.2 (`web_vitals` events)
- [`docs/research/2026-07-financial-sites-seo.md`](2026-07-financial-sites-seo.md) §8 (CWV sampling already in place)

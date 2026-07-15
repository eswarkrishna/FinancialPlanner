# Changelog

All notable changes to **FinancialPlanner** are documented here.

Format follows [Keep a Changelog](https://keepachangelog.com/en/1.1.0/).  
Versioning is [Semantic Versioning](https://semver.org/spec/v2.0.0.html) at the **product** level (not necessarily `package.json`).

## How to update

1. Add user-facing bullets under **`[Unreleased]`** while work is in progress.
2. On merge to `main` (or when cutting a release), move those bullets into a dated version section and clear `[Unreleased]` (or leave a placeholder).
3. Group by **Added**, **Changed**, **Fixed**, **Removed**, **Security** — omit empty sections.
4. Link PR numbers where helpful: `(#36)`.
5. Ship checklist: `docs/TASKS.md` Phase 6 · skill `sdd-commit-and-review`.

---

## [Unreleased]

### Added

- **Gap-fill backlog** — [`docs/research/2026-07-gap-fill-competitors.md`](docs/research/2026-07-gap-fill-competitors.md) competitor parity list; SPEC v2.5 ships first slice.
- **Prepayment fee modeling (§4.4.1)** — loan-tab fee type (`none` / flat / % of prepaid principal) with **gross interest saved** and **net savings after fee** on comparison + KPIs.
- **Reduce EMI vs Reduce Tenure panel (§4.4.2)** — side-by-side prepay strategy cards; selecting a card updates the amortisation schedule.

### Changed

- **Production demo online** — GitHub Pages and Deploy workflows restored; SPA is served again at the public demo URL.

### Added

- **Gap-fill backlog** — [`docs/research/2026-07-gap-fill-competitors.md`](docs/research/2026-07-gap-fill-competitors.md) competitor parity list; SPEC v2.5 ships first slice.
- **Prepayment fee modeling (§4.4.1)** — loan-tab fee type (`none` / flat / % of prepaid principal) with **gross interest saved** and **net savings after fee** on comparison + KPIs.
- **Reduce EMI vs Reduce Tenure panel (§4.4.2)** — side-by-side prepay strategy cards; selecting a card updates the amortisation schedule.

### Changed

- **SEO (SPEC §8)** — keyword-first per-tab titles (e.g. “Loan EMI Calculator with Prepayment | FinancialPlanner”), tuned 120–160-char descriptions, richer JSON-LD (`WebApplication` feature list + `BreadcrumbList` per tab + publisher `sameAs`), robots/theme-color/OG head tags, and sitemap `<lastmod>`; patterns from [`docs/research/2026-07-financial-sites-seo.md`](docs/research/2026-07-financial-sites-seo.md).
- **Analytics (§5.1.2)** — when GA is enabled, capture events on load with **no consent banner**; footer terms still disclose GA and link to Google’s opt-out add-on.

### Added

- **Share on Facebook (§5.1.1 / §8)** — footer control opens Facebook’s sharer for the active tab URL (`utm_source=facebook`, `utm_medium=social`) and fires `share_link_facebook`; no Meta Pixel or Facebook SDK.
- **Feature roadmap checklist** — [`docs/FEATURE-ROADMAP.md`](docs/FEATURE-ROADMAP.md) backlog (games P1, UK completion, loan polish, locales, platform); linked from [`docs/OVERVIEW.md`](docs/OVERVIEW.md).
- **Personal budget & investment tracker (§4.16)** — new Budget tab with monthly income/expense categories, 50/30/20 bucket analysis, emergency fund runway KPIs, manual investment holdings with portfolio projection, CSV/JSON export, and locale-specific reference budgets (IN/US/UK).
- Research spike: [`docs/research/2026-07-personal-budgeting-app.md`](docs/research/2026-07-personal-budgeting-app.md).
- E2E smoke for budget tab (`e2e/specs/budget-planner.spec.ts`).
- **Browser automation suite** — Puppeteer E2E smoke tests (`npm run test:e2e`, `npm run test:automation`) covering tab navigation, loan reference scenario, locale switching, persistence, and export controls (SPEC §10 #34–41).
- **Android app (Capacitor)** — native shell wrapping the SPA (`android/`, `npm run cap:sync`, `npm run android:assemble`); §5.2 spec + §10.34–36 acceptance checks.
- Platform helper (`src/lib/platform.ts`) disables web-only release notifications in the native shell.

### Fixed

- Android CI: install JDK 21 before `assembleDebug` (Capacitor 8 requires Java 21; fixes `invalid source release: 21`).

---

## [0.2.0] - 2026-07-09

### Added

- **Calm planner UI redesign** — teal tokens, Inter font, desktop sidebar nav, locale segmented control (IN / US / UK) ([#36](https://github.com/eswarkrishna/FinancialPlanner/pull/36)).
- Loan tab **KPI strip**, collapsible input groups, and **scenario cards** for schedule drill-down.
- Strategies tab KPI strip and strategy comparison summary cards.
- Strategic tab **payoff matrix heatmap** alongside the existing table.
- UI redesign research spike and Figma direction doc (PR [#14](https://github.com/eswarkrishna/FinancialPlanner/pull/14)).
- Release notification **production smoke checks** (`npm run verify:production`) ([#33](https://github.com/eswarkrishna/FinancialPlanner/pull/33)).
- **Tier 2 UK strategy engine** with goldens and P1 game fixtures ([#35](https://github.com/eswarkrishna/FinancialPlanner/pull/35)).

### Changed

- `docs/SPEC.md` §8 — visual design (Calm planner) requirements documented.

---

## [0.1.0] - 2026-07-01

### Added

- **UK locale** (GBP): ERC, job-loss bridge (redundancy / JSA / SMI), ISA/GIA sleeves ([#28](https://github.com/eswarkrishna/FinancialPlanner/pull/28)).
- **US locale v1.1/v1.2**: 401(k) job-loss modelling, PMI, HSA bridge, employment presets, Rule of 55, vesting.
- **Tier 1 backlog**: analytics consent, P1 game profiles, session summary ([#34](https://github.com/eswarkrishna/FinancialPlanner/pull/34)).
- **Browser release notifications** when a new deploy is available (§4.15) ([#32](https://github.com/eswarkrishna/FinancialPlanner/pull/32)).
- **WCAG 2.1 AA** accessibility fixes across tabs ([#30](https://github.com/eswarkrishna/FinancialPlanner/pull/30)).
- **Analytics** Tier 1–2: named GA4 events, consent banner, copy-tab link, helpful feedback (§5.1) ([#29](https://github.com/eswarkrishna/FinancialPlanner/pull/29), [#22](https://github.com/eswarkrishna/FinancialPlanner/pull/22)).
- **CSV/JSON export** for debt, retirement, and strategy tabs ([#23](https://github.com/eswarkrishna/FinancialPlanner/pull/23)).
- **Loan persistence** and scenario JSON import/export (§4.9) ([#24](https://github.com/eswarkrishna/FinancialPlanner/pull/24)).
- Schedule **charts**, dark mode, tab keyboard navigation.
- **SEO**: meta tags, sitemap, tab URLs, dynamic page titles.
- **GitHub Pages** continuous deploy on push to `main`.
- **Google Analytics 4** (optional, `VITE_GA_MEASUREMENT_ID`).
- Footer **“Latest push”** git commit metadata.
- **Strategic tab** legend and plain-English payoff labels.

### Fixed

- Loan persistence, import guards, cashflow runaway, scenario labels ([#27](https://github.com/eswarkrishna/FinancialPlanner/pull/27)).
- UK cashflow funding and model parity.
- US 401(k) simulation bugs across loan and strategy paths.
- Cashflow shortfall, game BN oracle, SWR default, BASE salary sweep ([#21](https://github.com/eswarkrishna/FinancialPlanner/pull/21)).

### Changed

- SPEC bumped through v1.9–v2.0; parallel **SPEC-US** and **SPEC-UK** locale specs added.

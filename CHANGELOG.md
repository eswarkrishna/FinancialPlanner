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

- **Android app (Capacitor)** — native shell wrapping the SPA (`android/`, `npm run cap:sync`, `npm run android:assemble`); §5.2 spec + §10.34–36 acceptance checks.
- Platform helper (`src/lib/platform.ts`) disables web-only release notifications in the native shell.

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

# UI redesign — Figma direction research spike

**Date:** 2026-07-01  
**Status:** Recommendation ready for product/design review  
**Question:** What UI direction and Figma resources should FinancialPlanner use for a redesign that fits a **scenario-comparison financial planner** (not a neobank)?  
**Constraints:** SPEC §5 (a11y, validation), §8 UI minimums, §14 disclaimer visibility; offline-first SPA; five tabs + IN/US locale; dense numeric tables must remain readable; no backend.

**Related:** [`docs/SPEC.md`](../SPEC.md) §8 · [`docs/SPEC-US.md`](../SPEC-US.md) §8 · [`docs/OVERVIEW.md`](../OVERVIEW.md) · Current styles: `src/index.css`

---

## 1. Executive summary

| Decision | Recommendation |
|----------|----------------|
| **Primary visual direction** | **Option A — “Calm planner”** (KPI-first, soft cards, one accent) |
| **Figma starting kit** | [Paperpillar Finance Dashboard](https://www.figma.com/community/file/1401087188287685262/finance-dashboard-ui-kit-by-paperpillar) + [Financy](https://www.figma.com/community/file/1357072393691339649/financy-personal-finances-dashboard) for free baseline |
| **Component system (if coding)** | shadcn/ui Figma + optional Tailwind adoption (Phase 2) |
| **First screens to design** | **Loan tab** (IN reference), then **Strategies** tab |
| **Layout pattern** | Sidebar nav (desktop) + KPI strip + two-column inputs / comparison; mobile stacked KPIs + horizontal scroll tables |
| **Do not copy wholesale** | Full neobank kits (Finio/Moniex page flows) — wrong mental model for amortisation oracle |

**Bottom line:** Redesign around **scenario comparison as hero**, not transaction lists. Borrow **cards, typography, and chart shells** from finance Figma kits; invent **planner-specific** patterns for scenario chips, warning callouts, and game payoff matrices.

---

## 2. Current UI assessment (as-is)

### 2.1 Stack

| Layer | Today |
|-------|--------|
| Framework | React 19 + Vite |
| Styling | Plain CSS (`src/index.css`), CSS variables |
| Components | Native `<input>`, `<select>`, `<table>` — no component library |
| Charts | SVG line charts in `ScheduleChart.tsx` |
| Shell | Sticky header, horizontal tab bar, `.card` sections |

### 2.2 Strengths

- Accessible skip link, sticky header, responsive tab scroll
- Clear tab separation maps 1:1 to SPEC modules (Loan, Debt, Retirement, Strategies, Strategic)
- Locale switcher with confirm-on-change (SPEC-US §8)
- Warning codes surfaced in Loan tab (`MORTGAGE_DEFAULT_RISK`, etc.)

### 2.3 Gaps vs product intent

| Gap | Impact |
|-----|--------|
| **Form-first layout** | Comparison scenarios feel secondary to long input grids |
| **Single long `<select>` for scenarios** | Hard to scan 10+ scenario IDs (Loan tab) |
| **Wide comparison tables** | Poor mobile UX; no column prioritization |
| **Generic fintech palette** | Blue/gray `#1d4ed8` / `#e2e8f0` — functional but not differentiated |
| **No design tokens doc** | Figma ↔ code drift risk on redesign |
| **Strategic tab** | Matrix/table UI underuses game module (heatmap opportunity per SPEC §4.13.9) |

---

## 3. Product constraints (from SPEC)

| Requirement | UI implication |
|-------------|----------------|
| §14 disclaimer | Footer + in-context copy on stress scenarios (job loss / PF / 401(k) fiction) |
| §5 a11y | Labels on controls, keyboard focus, sufficient contrast |
| §8 minimum screens | Five tabs; comparison tables; export actions |
| Reactive recalc | No “Submit” — inputs update models immediately; avoid modal-heavy flows |
| IN + US parity | Same shell; locale-specific labels (EMI vs mortgage payment, PF vs 401(k)) |
| Educational tone | Not investment advice; warnings visible, not tooltip-only |

**Non-goals for UI v1 redesign:** OAuth, accounts, bank linking, dark-mode-only launch, native mobile app shell (Capacitor exists but out of scope for this spike).

---

## 4. Information architecture (target)

### 4.1 Recommended shell

```text
┌──────────────────────────────────────────────────────────────┐
│ Brand   [Locale IN ▼ US]              [Load reference ▼]      │
├──────────┬───────────────────────────────────────────────────┤
│ ● Loan   │  KPI strip: Payoff · Total interest · Δ vs BASE    │
│   Multi-debt│              · Min cash · Warnings count        │
│   Retirement│  ┌─────────────────┐ ┌──────────────────────┐ │
│   Strategies│  │ Grouped inputs  │ │ Scenario comparison  │ │
│   Strategic │  │ (collapsible)   │ │ (cards or datagrid)  │ │
│            │  └─────────────────┘ └──────────────────────┘ │
│            │  Chart area (principal / interest / cash)       │
│            │  Schedule table (expandable / paginated)        │
└──────────┴───────────────────────────────────────────────────┘
```

### 4.2 Input grouping (Loan tab)

| Group | Fields (examples) |
|-------|-------------------|
| **Loan terms** | Principal, rate, tenure, start date |
| **Assets** | Cash, PF/401(k), gold/brokerage, deferral/match |
| **Cashflow** | Living expense, income, UI benefit (US W-2) |
| **Stress test** | Unemployment/job-loss toggle, tranche destinations |
| **Advanced (US)** | PMI, HSA, employment type, staged prepay |

Use **disclosure panels** (expanded: Loan terms + Assets; collapsed: Advanced).

### 4.3 Scenario selection pattern

Replace scenario `<select>` with:

| Option | Pros | Cons |
|--------|------|------|
| **A — Scenario cards** | Scannable; room for subtitle (“50L prepay, keep EMI”) | More vertical space |
| **B — Segmented control + dropdown** | Compact | Still hides detail |
| **C — Data table with row select** | Familiar for power users | Weak on mobile |

**Recommendation:** **A for default**, **C for “compare all” mode** on desktop.

### 4.4 Tab-specific UI notes

| Tab | Hero element | Borrow from kits |
|-----|--------------|------------------|
| Loan | Scenario comparison + schedule chart | KPI cards, line chart |
| Multi-debt | Payoff timeline + strategy toggle | Progress lists, debt cards |
| Retirement | Funded ratio + SS-adjusted (US) | Goal rings, scenario pills |
| Strategies | 3-column strategy comparison | Comparison cards, bar deltas |
| Strategic | Payoff matrix heatmap | Heatmap / grid (custom) |

---

## 5. Visual direction options

### Option A — Calm planner (recommended)

- Light neutral background, white cards, single accent (teal `#0d9488` or indigo `#4f46e5`)
- Large KPI numerals (tabular figures), muted captions
- Soft shadows, 12–16px radius (close to current `--radius: 12px`)
- Works for IN and US; avoids “Silicon Valley neobank” cliché

**Pros:** Readable numbers, trustworthy, low implementation risk  
**Cons:** Less visually distinctive in marketing screenshots

### Option B — Pro spreadsheet

- Dense tables, monospace or tabular nums, minimal color
- Accent only for deltas (interest saved, warnings)
- Sidebar nav always visible

**Pros:** Best for power users and wide comparison tables  
**Cons:** Can feel intimidating to casual borrowers

### Option C — Consumer fintech

- Bold hero metrics, pill badges, illustrations
- Strong brand color blocks

**Pros:** Polished marketing appeal  
**Cons:** Hard to keep amortisation tables legible; higher design lift

**Recommendation:** **Option A** primary, borrow **table density** from Option B for comparison views.

---

## 6. Figma Community resources

Use as **component libraries** — remap to FinancialPlanner tabs; do not ship kit page flows verbatim.

### 6.1 Best fit (planner / dashboard)

| Resource | Why | Link |
|----------|-----|------|
| **Paperpillar Finance Dashboard** | Minimal KPI cards, charts, clean type; tagged “planner” | https://www.figma.com/community/file/1401087188287685262/finance-dashboard-ui-kit-by-paperpillar |
| **Financy** | Free personal finance dashboard, auto-layout | https://www.figma.com/community/file/1357072393691339649/financy-personal-finances-dashboard |
| **Finebank** | Financial management cards, goals, expense breakdown | https://www.figma.com/community/file/1227525441534506928/finebank-financial-management-dashboard-ui-kits |

### 6.2 Fuller systems (shell + responsive)

| Resource | Why | Link |
|----------|-----|------|
| **Moniex** | Desktop/tablet/mobile, variables, 14 pages — good **app shell** reference | https://www.figma.com/community/file/1602551005936261560/moniex-finance-management-admin-dashboard-ui-design |
| **Finio** | 75+ screens — borrow forms/settings only | https://www.figma.com/community/file/1630429575368996122/finio-finance-dashboard-ui-kit |

### 6.3 Design systems (tokens + primitives)

| Resource | Use for |
|----------|---------|
| **shadcn/ui** (Figma community search) | Tabs, inputs, tables, dialogs — maps to React if adopted |
| **Material 3 Design Kit** | Form patterns, a11y baseline |
| **Stripe-style dashboard community files** | Data-dense tables, KPI typography |

Search: https://www.figma.com/community/search?model_type=files&q=shadcn

---

## 7. Design tokens (proposed)

Align Figma variables with CSS custom properties for handoff.

| Token | Current (`index.css`) | Proposed (Calm planner) |
|-------|----------------------|-------------------------|
| `--bg` | `#e2e8f0` | `#f1f5f9` (slate-100) |
| `--card` | `#ffffff` | `#ffffff` |
| `--text` | `#0f172a` | `#0f172a` |
| `--text-muted` | `#475569` | `#64748b` |
| `--accent` | `#1d4ed8` | `#0d9488` (teal-600) or keep blue |
| `--danger` | `#b91c1c` | `#dc2626` |
| `--radius` | `12px` | `12px` / `8px` inputs |
| `--font-sans` | Segoe UI stack | `Inter`, system-ui |
| `--font-mono` | — | `ui-monospace` for money columns |

**Typography:** `font-variant-numeric: tabular-nums` on all money cells (CSS already benefits from this).

**Dark mode:** Defer to Phase 2; spec does not require it.

---

## 8. Component mapping (Figma → app)

| UI need | Figma source pattern | Code target (future) |
|---------|---------------------|----------------------|
| KPI strip | Paperpillar stat cards | New `KpiStrip.tsx` in `features/loan/` |
| Grouped inputs | Moniex form sections | Collapsible `FormSection.tsx` |
| Scenario cards | Custom (Financy card grid) | Replace scenario `<select>` |
| Comparison table | Stripe-style / shadcn Table | Enhance `ScenarioTable.tsx` |
| Warnings | Alert / callout component | Map `WARNING_LABELS` to alert UI |
| Schedule chart | Kit line chart styling | Restyle `ScheduleChart.tsx` SVG |
| Game matrix | Custom heatmap | New `PayoffHeatmap.tsx` in `features/game/` |
| Locale switch | Segmented control | Replace `<select>` in `App.tsx` header |

---

## 9. Responsive behaviour

| Breakpoint | Layout |
|------------|--------|
| **≥1024px** | Sidebar nav + two-column main (inputs left, comparison right) |
| **768–1023px** | Top tabs + stacked sections |
| **<768px** | Horizontal tab scroll (keep); KPI stack; tables `overflow-x: auto` or card-per-row |

**Critical:** Amortisation tables may always horizontal-scroll on mobile — acceptable if KPIs and scenario summary are visible without scroll.

---

## 10. Phased delivery

| Phase | Scope | Outcome |
|-------|--------|---------|
| **P0 — Design** | Figma: Loan (IN) + Strategies frames; token page | Approved mockups |
| **P1 — Shell** | New header, sidebar/tabs, KPI strip, cards | Visual refresh without logic change |
| **P2 — Loan + Strategies** | Scenario cards, grouped inputs, table styling | Biggest UX win |
| **P3 — Remaining tabs** | Debt, Retirement, Strategic heatmap | Parity |
| **P4 — Optional stack** | shadcn + Tailwind vs extended CSS | Team preference |

**Do not** redesign all five tabs in one PR — spec-driven workflow prefers incremental, test-backed slices.

---

## 11. What not to do

- Adopt a **full neobank onboarding** flow (login, KYC) — out of product scope
- Hide **§14 disclaimer** or job-loss fiction warnings for aesthetics
- Replace comparison tables with charts only — users need audit trail numbers
- Locale-specific **separate Figma files** — one system, token swap for IN/US labels
- Block recalc behind “Apply” buttons — breaks reactive model

---

## 12. Recommendation summary

| # | Decision |
|---|----------|
| 1 | Visual direction: **Calm planner (Option A)** |
| 2 | Start Figma from **Paperpillar + Financy**; shell reference **Moniex** |
| 3 | IA: **KPI strip + grouped inputs + scenario cards + chart/table** |
| 4 | Design **Loan** and **Strategies** first |
| 5 | Code path: **CSS token refresh first**; evaluate **shadcn/Tailwind** in P4 |
| 6 | Add **game heatmap** in Strategic tab (spec-aligned, no kit copy-paste) |

---

## 13. Spec delta (when design is accepted)

Apply via **`sdd-spec-change-first`** before implementation:

### `docs/SPEC.md` §8 (and mirror SPEC-US §8)

- [ ] Document **target layout**: sidebar or top tabs; KPI summary row on Loan and Strategies tabs
- [ ] **Scenario selection** UI: cards or table row select (not exclusive `<select>`)
- [ ] **Input groups** with collapsible Advanced (stress test, staged prepay)
- [ ] **Strategic tab**: payoff matrix heatmap or equivalent visual (§4.13.9 export still supported)
- [ ] **Design tokens** reference (`docs/research/2026-07-ui-redesign-figma-direction.md` §7)

### `docs/SPEC.md` §5 (NFR)

- [ ] Tabular numerals for currency columns
- [ ] Mobile: KPI visible without horizontal scroll; tables may scroll

### No spec change required

- Domain logic, scenarios, goldens — UI-only refresh

---

## 14. Sources

| # | Resource | URL |
|---|----------|-----|
| 1 | Paperpillar Finance Dashboard UI Kit | https://www.figma.com/community/file/1401087188287685262/finance-dashboard-ui-kit-by-paperpillar |
| 2 | Financy Personal Finances Dashboard | https://www.figma.com/community/file/1357072393691339649/financy-personal-finances-dashboard |
| 3 | Finebank Financial Management UI Kits | https://www.figma.com/community/file/1227525441534506928/finebank-financial-management-dashboard-ui-kits |
| 4 | Moniex Finance Management Dashboard | https://www.figma.com/community/file/1602551005936261560/moniex-finance-management-admin-dashboard-ui-design |
| 5 | Finio Finance Dashboard UI Kit | https://www.figma.com/community/file/1630429575368996122/finio-finance-dashboard-ui-kit |
| 6 | shadcn/ui Figma (community search) | https://www.figma.com/community/search?model_type=files&q=shadcn |
| 7 | Current app styles | `src/index.css` |
| 8 | Product UI minimums | `docs/SPEC.md` §8, `docs/SPEC-US.md` §8 |

---

**End of research spike**

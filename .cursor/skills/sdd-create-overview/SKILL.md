---
name: sdd-create-overview
description: Maintains a high-level product and architecture overview for FinancialPlanner. Use when onboarding, summarising the codebase for stakeholders, refreshing docs/OVERVIEW.md, or when the user asks for system overview, architecture summary, or big-picture documentation.
---

# Create overview

## Primary artifact

- **`docs/OVERVIEW.md`** — single entry point: **problem**, **users**, **key flows**, **module map**, **tech stack**, pointers to **`docs/SPEC.md`**, **`AGENTS.md`**, skills.

## Content checklist

- **Product:** One paragraph + link to SPEC §1–§3.  
- **Architecture:** `src/lib` (pure finance) vs `src` UI; data flow inputs → simulation → tables/export.  
- **Mermaid (optional):** one small diagram (flow or layers) if it clarifies multi-step simulation.  
- **Testing:** Where §10 lives; `npm run test` / fixtures.  
- **Ops:** `npm run dev` / `build`; no backend for v1 (SPEC §5).  
- **Research & learning:** Short lists linking to **`docs/research/*`** and latest **`docs/LEARNINGS.md`** themes.

## Maintenance

- Update **OVERVIEW** when public behaviour or stack changes materially.  
- Do not duplicate SPEC prose—**summarise and link** § sections.

## Examples

- After adding unemployment cashflow: add flow bullet + link §4.8.  
- After new package (e.g. TanStack Table): update stack + why.

---
name: sdd-spec-change-first
description: Edits product requirements before implementation in FinancialPlanner. Use when the user asks to add or change features, behaviour, scenarios, acceptance criteria, glossary, or non-goals; when docs/SPEC.md must be updated; or when resolving ambiguity between code and spec.
---

# Spec change first (SDD)

## When to use

Any request that **changes what the product should do** (not only how code is written). Implementation must follow the spec, not the reverse.

## Workflow

1. Open **`docs/SPEC.md`** and identify sections to change (§4–§15). Prefer **small, numbered edits** that stay consistent with the rest of the document.
2. Update **acceptance criteria** in §10 when behaviour changes; add bullets rather than vague prose.
3. If scope is excluded, add or reinforce **§11 Non-Goals** instead of implementing silently.
4. If behaviour is underspecified, add a bullet under **§13 Open Questions** or resolve it explicitly in the relevant §4 subsection.
5. **Bump** the spec **Version** line at the top of the product spec block (e.g. 1.0 → 1.1) when behaviour or acceptance tests change materially.
6. Only after the spec reflects the decision: implement in code and tests (use **`sdd-verify-with-tests`** and domain **`spec-driven-financial-planner`**).

## Checklist before coding

- [ ] SPEC section(s) edited and internally consistent  
- [ ] §10 updated if new numbers or scenarios are required  
- [ ] §11 checked so scope is not accidentally expanded  

## Examples

- User: “Add floating rate” → update §4.1 / §11 / §12 first, then code.  
- User: “Prepay at month 6” → confirm §4.4 / scenario table in §4.6, then presets + tests.

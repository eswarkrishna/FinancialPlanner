---
name: sdd-research-spike
description: Creates structured research notes before or during uncertain FinancialPlanner work. Use for spikes, comparing libraries or algorithms, EPFO/lender behaviour desk research (non-legal), literature links, or when the user asks for investigation doc, options analysis, or RFC notes.
---

# Research spike

## Output path

Create **`docs/research/YYYY-MM-short-slug.md`** (kebab or snake slug; one topic per file). See **`docs/research/README.md`** for folder conventions.

## Document structure

1. **Question** — What decision or spec gap are we answering?  
2. **Constraints** — SPEC §, offline-first, privacy, non-goals §11.  
3. **Options** — A / B / C with pros/cons (numeric examples if loan math).  
4. **Sources** — Links, doc names, calculator screenshots described in text (no binary blobs in git unless user requests).  
5. **Recommendation** — Clear pick or “needs product call”.  
6. **Spec delta** — Bullets to paste into **`docs/SPEC.md`** if recommendation is accepted (then **`sdd-spec-change-first`**).

## Rules

- **Not legal/tax advice** — label external rules as “verify with …”.  
- If research **changes** product behaviour, SPEC must change before **`sdd-implement-from-spec`**.

## When done

- Link the research file from **`docs/OVERVIEW.md`** “Research” list or from a LEARNINGS entry.

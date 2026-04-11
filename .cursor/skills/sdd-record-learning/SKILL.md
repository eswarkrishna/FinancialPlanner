---
name: sdd-record-learning
description: Records post-implementation learning, surprises, and follow-ups for FinancialPlanner. Use after a feature ships, a bug is fixed, a spike concludes, or when the user asks for retro notes, ADRs, lessons learned, or knowledge capture.
---

# Record learning

## Where to write

- **`docs/LEARNINGS.md`** — dated **reverse-chronological** entries (newest first).  
- Optional: **`docs/research/`** for long-form spikes (see **`sdd-research-spike`**).

## Entry template (keep each entry short)

```markdown
## YYYY-MM-DD — short title

- **Context:** (spec §, PR, issue)
- **What we learned:** (1–3 bullets)
- **Action:** (spec edit, test, issue link, or none)
```

## What to capture

- Spec ambiguities discovered and how resolved (link §).  
- Rounding / numeric edge cases.  
- **False starts** and what not to repeat.  
- Follow-up **§13 Open Questions** if still partially open.

## After writing

- If learning implies a **policy** change, migrate summary into **`docs/SPEC.md`** or **`docs/OVERVIEW.md`** and trim duplicate prose from LEARNINGS.

# Learnings — FinancialPlanner

Short, dated notes after features, incidents, or spikes. Newest first.

---

## 2026-05-09 — Repayment Strategy Planner v1.7

- **Context:** SPEC §4.12, §15.1; `src/lib/strategy/` and `src/features/strategy/`; nine strategy golden fixtures under `src/test/fixtures/strategy/`.
- **What we learned:** The planner models post-loan redirection of **full** `EMI + extra` into an equity sleeve for the remainder of the horizon. In real life, users should top up emergency funds, insurance, and discretionary buffers before auto-diverting every rupee to markets; the engine is a projection tool, not an autopilot.
- **Action:** Keep §14 disclaimer and UI hints honest; if we add a “post-loan allocation split” later, track it in SPEC §13 / §4.12 rather than silently changing assumptions.

---

## Template (copy for new entry)

```markdown
## YYYY-MM-DD — title

- **Context:** SPEC §x / PR / issue
- **What we learned:**
- **Action:**
```

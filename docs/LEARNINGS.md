# Learnings — FinancialPlanner

Short, dated notes after features, incidents, or spikes. Newest first.

---

## 2026-07-10 — Analytics without consent banner

- **Context:** SPEC §5.1.2 / §8 / §10.23 — product owner asked to capture GA without an in-app permission prompt.
- **What we learned:** Consent was only a UI gate around `initAnalytics()`; Tier 1–2 events already fire once initialized. Removing the banner means bootstrap on load when `VITE_GA_MEASUREMENT_ID` is set; footer opt-out disclosure remains the user control.
- **Action:** Ignore legacy `financial-planner-analytics-consent` localStorage; do not reintroduce an accept/reject strip without a SPEC revision.

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

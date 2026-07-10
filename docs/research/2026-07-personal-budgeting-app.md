# Personal budgeting & investment tracker — research spike

**Date:** 2026-07-10  
**Status:** Recommendation ready for spec  
**Question:** What should a **client-side personal budget & investment tracker** include when integrated into FinancialPlanner, and what should remain out of scope?  
**Constraints:** SPEC §11 non-goals (no bank linking, no tax advice); offline-first SPA; IN/US/UK locale parity; reactive recalc; educational disclaimer (§14).

**Related:** [`docs/SPEC.md`](../SPEC.md) §4.8 (loan cashflow), §4.10–§4.11 (debt/retirement), [`2026-07-ui-redesign-figma-direction.md`](2026-07-ui-redesign-figma-direction.md)

---

## 1. Executive summary

| Decision | Recommendation |
|----------|----------------|
| **Product shape** | New **Budget** tab — monthly zero-based planner + investment sleeve tracker |
| **Framework** | **50/30/20** needs/wants/savings bucket analysis on user-entered categories |
| **Investment tracking** | Manual holdings (value + monthly contribution + expected return); project portfolio over horizon |
| **Emergency fund** | Cash balance ÷ monthly expenses → runway months; warn below 3 |
| **Bank sync** | **Out of scope** (§11) — manual entry only, JSON/CSV export |
| **AI categorization** | **Out of scope** v1 — user assigns bucket per expense row |
| **Parity** | Same engine; locale scales reference amounts (INR / USD / GBP) |

**Bottom line:** Deliver a **planner-grade budget module** aligned with existing debt/retirement tabs — KPI strip, editable category tables, bar/line charts, persistence, export — not a neobank transaction feed.

---

## 2. Industry patterns (desk research)

### 2.1 Core budgeting methods

| Method | Description | Fit for FinancialPlanner |
|--------|-------------|--------------------------|
| **50/30/20** | 50% needs, 30% wants, 20% savings/debt | High — simple KPI comparison, widely cited ([Investopedia](https://www.investopedia.com/ask/answers/022916/what-502030-budget-rule.asp)) |
| **Zero-based** | Income − all planned expenses = 0 | Medium — show net cash flow + deficit warning |
| **Envelope / YNAB-style** | Category caps with rollover | Low v1 — needs transaction ledger; defer |
| **Pay yourself first** | Savings before discretionary | Covered via savings bucket + investment contributions |

### 2.2 Investment tracking expectations (2026 apps)

Leading apps (Monarch, Quicken Simplifi, Wallet by BudgetBakers) offer:

- Net worth / portfolio value dashboard  
- Holdings by asset class  
- Contribution tracking  
- Simple growth projection  

**Not in scope v1:** live market quotes, tax-lot accounting, rebalancing automation, crypto exchange sync ([Forbes Advisor 2026 roundup](https://www.forbes.com/financial-services/best-budgeting-apps-2/)).

### 2.3 Privacy & architecture

[Cognitive Future 2026 guidance](https://cognitivefuture.ai/best-ai-tools-for-personal-finance/) recommends:

- One system of record with CSV/JSON export  
- No opaque cloud account linking for privacy-conscious users  
- Clear separation of budgeting vs investing vs debt payoff  

FinancialPlanner already satisfies this with `localStorage` persistence and export helpers.

---

## 3. Options considered

| Option | Pros | Cons |
|--------|------|------|
| **A — Extend loan §4.8 cashflow** | Reuses fields | Too narrow; no investment sleeve; buried in loan tab |
| **B — New §4.16 Budget tab** | Clear IA; mirrors debt/retirement | New surface area |
| **C — Merge with Strategies §4.12** | Shared household income fields | Confuses allocation vs monthly budget |
| **D — Standalone app** | Clean slate | Breaks “one planner” UX; duplicate shell |

**Recommendation:** **Option B** — dedicated Budget tab with cross-links in UI copy to Loan (EMI), Multi-debt, and Retirement tabs.

---

## 4. Numeric example (IN reference)

| Line | Amount (₹) | Bucket |
|------|-----------|--------|
| Salary | 1,50,000 | income |
| Freelance | 25,000 | income |
| Rent + EMI + groceries | 95,000 | need |
| Dining + entertainment | 20,000 | want |
| SIP + extra debt | 25,000 | savings |
| **Net cash flow** | **35,000** | — |
| **Savings rate** | **20%** | target met |

Emergency fund ₹1,50,000 ÷ ₹1,40,000 expenses ≈ **1.1 months** → `LOW_EMERGENCY_FUND` warning.

Portfolio: ₹13,00,000 across equity/debt/gold with ₹20k/mo contributions; 12-month projection at blended ~10% nominal.

---

## 5. Spec delta (accepted → §4.16)

- Add **§4.16 Personal budget & investment tracker** with inputs, 50/30/20 analysis, investment projection, warnings, export, persistence.  
- Add **§10** acceptance bullets for budget math, golden fixture, E2E tab smoke.  
- Update **§8** screens list to include Budget tab.  
- Update **§11** to note bank linking remains non-goal.  
- Bump spec version to **2.2**.

---

## 6. UI direction

Follow **Calm planner** tokens (`src/index.css`): KPI strip (income, expenses, net flow, savings rate), collapsible income/expense tables, investment holdings table, 50/30/20 comparison bar chart, portfolio projection line chart, export row matching debt/retirement pattern.

---

## 7. Sources

- [50/30/20 rule — Investopedia](https://www.investopedia.com/ask/answers/022916/what-502030-budget-rule.asp)  
- [50-30-20 budgeting — UNFCU](https://www.unfcu.org/financial-wellness/50-30-20-rule/)  
- [Best budgeting apps 2026 — Forbes Advisor](https://www.forbes.com/financial-services/best-budgeting-apps-2/)  
- [AI personal finance tools 2026 — Cognitive Future](https://cognitivefuture.ai/best-ai-tools-for-personal-finance/)

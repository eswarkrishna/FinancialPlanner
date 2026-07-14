# FinancialPlanner — Gap-Fill Spec

**Source app:** https://eswarkrishna.github.io/FinancialPlanner/
**Current scope:** Loan EMI calculator with prepayment, debt payoff, retirement, and budget calculators for India, US, and UK.
**Purpose of this doc:** Define the remaining features to close the gap with established competitors (NerdWallet, Bankrate, BankBazaar, CalculatorSoup) and add India-specific depth.

---

## 1. EMI / Loan Calculator Enhancements

### 1.1 Payment timing toggle
- **What:** Add "Payment due in advance" vs. "Payment due in arrears" option.
- **Why:** Advance = first installment due at loan start; arrears = first installment due one period later. Changes total interest slightly. Competitor: CalculatorSoup.
- **Acceptance criteria:**
  - Radio/toggle input, default = "arrears" (standard for most loans).
  - Amortization schedule and total interest recalculate correctly for both modes.

### 1.2 Prepayment fee modeling
- **What:** Optional input for prepayment/foreclosure fee (flat amount or % of prepaid principal).
- **Why:** Banks often charge a fee on prepayment; without it, "interest saved" overstates the real benefit. Competitor: BankBazaar.
- **Acceptance criteria:**
  - Input field: fee type (flat / %) + value.
  - Output: "Net savings after prepayment fee" alongside "Gross interest saved."

### 1.3 Prepayment strategy comparison view
- **What:** Side-by-side comparison of "Reduce EMI" vs. "Reduce Tenure" strategies.
- **Acceptance criteria:**
  - Table or chart showing: new EMI, new tenure, total interest paid, total interest saved for each strategy.
  - User can toggle which strategy is "selected" to see it reflected in the amortization schedule.

### 1.4 Amortization schedule export
- **What:** Download full amortization schedule as CSV and/or PDF.
- **Acceptance criteria:**
  - Button on schedule view.
  - CSV includes: period, payment date, principal, interest, remaining balance.

---

## 2. Retirement Calculator Enhancements

### 2.1 Inflation adjustment
- **What:** Toggle to show projections in real (inflation-adjusted) vs. nominal terms.
- **Why:** Most common gap in DIY retirement tools; without it, projected corpus looks misleadingly large.
- **Acceptance criteria:**
  - Input: expected annual inflation rate (default 6% for India, 3% for US/UK).
  - Output clearly labeled "Nominal" vs. "Real (today's value)."

### 2.2 Withdrawal / drawdown phase
- **What:** After retirement age, model monthly withdrawal against remaining corpus + continued growth, to show how long the corpus lasts.
- **Acceptance criteria:**
  - Input: expected monthly withdrawal, expected post-retirement return rate.
  - Output: age/year at which corpus depletes (or "lasts indefinitely" if withdrawal < growth).

---

## 3. India-Specific Instrument Calculators (New)

Add as new calculator tabs/pages. Priority order based on search volume:

| Calculator | Key Inputs | Key Output |
|---|---|---|
| **PPF (Public Provident Fund)** | Annual contribution, current interest rate, years | Maturity value, total interest earned |
| **SIP (Systematic Investment Plan)** | Monthly investment, expected annual return, duration | Maturity value, total invested vs. gains |
| **Sukanya Samriddhi Yojana** | Annual contribution, girl child's age | Maturity value at age 21 |
| **Gratuity** | Last drawn salary, years of service | Gratuity amount payable |
| **Lumpsum investment** | Principal, rate, duration | Future value |

- **Acceptance criteria (all above):** Follow existing app's calculator UI pattern (inputs on left/top, results + chart on right/bottom). Use current government-notified rates as defaults where applicable, with a note to verify against the latest official rate.

---

## 4. Budget Calculator Enhancements

### 4.1 Category-based monthly/yearly view
- **What:** Break down income/expenses by category with a monthly and yearly toggle.
- **Acceptance criteria:** Bar or pie chart by category; yearly view aggregates 12 months.

### 4.2 Savings rate tracker
- **What:** Show savings rate (% of income saved) with a simple visual indicator (e.g., color-coded: red <10%, yellow 10–20%, green >20%).

---

## 5. Cross-Cutting / Platform Improvements

### 5.1 Currency & locale formatting
- **What:** Ensure number formatting (lakhs/crores for India vs. thousands/millions for US/UK) and currency symbol switch automatically with country selection.
- **Acceptance criteria:** Selecting "India" formats large numbers as ₹12,34,567; selecting "US"/"UK" formats as $1,234,567 / £1,234,567.

### 5.2 Scenario save/compare (local storage, no backend)
- **What:** Let users save up to 3–5 named scenarios per calculator in browser localStorage, and compare them side by side.
- **Acceptance criteria:** Save, load, delete, and compare actions; data persists across sessions on the same browser.

### 5.3 Tax-aware effective interest rate (loan calculators)
- **What:** Optional toggle to show effective interest rate after applicable tax deduction (e.g., India Section 80C/24(b) on home loans, US mortgage interest deduction).
- **Acceptance criteria:** Input: tax bracket %. Output: "Effective post-tax interest rate."

### 5.4 SEO / structured data
- **What:** Add JSON-LD structured data (`SoftwareApplication` or `WebApplication` schema) to each calculator page.
- **Acceptance criteria:** Valid schema, testable via Google's Rich Results Test.

### 5.5 README / architecture notes
- **What:** Document stack choices, state management approach, and calculator formulas used, in the repo README.
- **Why:** Useful for portfolio/interview context, not just end users.

---

## 6. Suggested Build Order

1. Prepayment fee modeling (1.2) + strategy comparison (1.3) — highest impact, extends existing feature.
2. Inflation adjustment for retirement (2.1).
3. Currency/locale formatting fix (5.1) — foundational, affects all calculators.
4. Amortization CSV export (1.4).
5. SIP + PPF calculators (3) — highest search-volume new additions.
6. Scenario save/compare (5.2).
7. Remaining India instruments, withdrawal phase, budget enhancements, SEO/README polish.

---

## 7. Out of Scope (for this pass)

- User accounts / backend persistence (localStorage is sufficient for now).
- Live bank rate integration (would require external API + maintenance).
- Multi-language UI (not currently requested).

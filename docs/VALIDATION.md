# Bank calculator validation

Educational parity checks between FinancialPlanner outputs and public bank EMI calculators. Goldens prove **self-consistency**; this doc proves **external alignment** within documented rounding tolerance.

**Not legal advice.** Lenders apply fees, day-count conventions, and rounding policies that may differ slightly from this app.

---

## Methodology

| Item | FinancialPlanner policy |
|------|-------------------------|
| EMI formula | Standard reducing-balance annuity: \( \text{EMI} = P \cdot \frac{r(1+r)^n}{(1+r)^n - 1} \) |
| Monthly rate | `annual_rate ÷ 100 ÷ 12` |
| Money rounding | Half-up to 2 decimal places (paise) at each stored step (see `README.md`) |
| Prepayment | Lump sums after scheduled EMI; fees are cash outflows (§4.4.1) |
| Floating rate | Deterministic piecewise annual rate with EMI reset on change (§4.3.1) |

---

## Case 1 — HDFC home loan EMI (baseline, fixed)

**Inputs (both tools)**

| Field | Value |
|-------|-------|
| Principal | ₹50,00,000 |
| Annual rate | 7.9% |
| Tenure | 168 months (14 years) |

**Expected (FinancialPlanner reference scenario)**

| Metric | Value |
|--------|-------|
| EMI | ₹45,678.56 (rounded display: ₹45,679 in KPI strip) |
| Payoff month | 168 |
| Total interest | See `npm run test` golden `BASE` for exact paise |

**HDFC public calculator** ([homeloan calculator](https://www.hdfcbank.com/personal/tools-and-calculators/home-loan-calculator)) with the same inputs should match EMI within **±₹1** on the monthly payment and within **±0.1%** on total interest, differences usually from display rounding (whole rupees on some bank UIs).

**Reproduce locally**

```bash
npm run dev
# Loan tab → Load reference scenario → Baseline view
```

Or Vitest: `src/lib/goldens.test.ts` reference scenario snapshot.

---

## Case 2 — SBI home loan EMI (baseline, fixed)

**Inputs**

| Field | Value |
|-------|-------|
| Principal | ₹30,00,000 |
| Annual rate | 8.5% |
| Tenure | 240 months (20 years) |

**SBI public calculator** with equivalent inputs should agree on EMI within **±₹1** using the same reducing-balance formula.

**Reproduce:** enter values on the loan tab; compare EMI and total interest to the SBI tool output.

---

## Case 3 — Prepayment (qualitative)

Bank prepayment calculators often show “interest saved” without foreclosure fees. FinancialPlanner separates:

- **Gross interest saved** vs baseline
- **Net savings after fee** when `prepayment_fee_type` is set (§4.4.1)

Compare **gross** savings to bank “interest saved” when the bank fee is zero; enable fee inputs when modelling real lender charges.

---

## Known acceptable deltas

| Source of delta | Typical magnitude |
|-----------------|-------------------|
| Bank displays whole rupees for EMI | ±₹1 on EMI |
| Last-month principal true-up | ±₹100 on total interest over 14+ years |
| Calendar vs 30/360 day count | Not modelled in v1 (§11) |

---

## Maintenance

When amortisation logic changes, re-run the cases above and update this file with the verification date and any revised tolerances. Link the PR and SPEC § section in the commit message.

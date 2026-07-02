import { roundInr } from "../money";
import { nominalMonthlyRateFromAnnualPercent } from "../rates/nominalMonthly";
import { addMonthsToIsoDate } from "../shared/dateIso";
import { BALANCE_EPSILON_INR } from "../shared/constants";

export type DebtStrategy = "avalanche" | "snowball";

export interface DebtInput {
  id: string;
  name: string;
  balance_inr: number;
  apr_pct: number;
  minimum_payment_inr: number;
}

export interface DebtMonthRow {
  month: number;
  opening_total_inr: number;
  interest_inr: number;
  payment_inr: number;
  closing_total_inr: number;
  focus_debt_name: string | null;
}

export interface DebtSimulationSummary {
  payoff_months: number;
  payoff_date_iso: string | null;
  total_interest_inr: number;
  total_paid_inr: number;
  is_paid_off: boolean;
}

export interface DebtSimulationResult {
  strategy: DebtStrategy;
  rows: DebtMonthRow[];
  summary: DebtSimulationSummary;
  warning?: string;
}

interface SimDebt {
  id: string;
  name: string;
  balance_inr: number;
  apr_pct: number;
  minimum_payment_inr: number;
}

function pickFocusDebt(active: SimDebt[], strategy: DebtStrategy): SimDebt | null {
  if (active.length === 0) {
    return null;
  }
  if (strategy === "avalanche") {
    return [...active].sort((a, b) => {
      if (b.apr_pct !== a.apr_pct) return b.apr_pct - a.apr_pct;
      return b.balance_inr - a.balance_inr;
    })[0] ?? null;
  }
  return [...active].sort((a, b) => {
    if (a.balance_inr !== b.balance_inr) return a.balance_inr - b.balance_inr;
    return b.apr_pct - a.apr_pct;
  })[0] ?? null;
}

export function simulateDebtPayoff(
  debts: DebtInput[],
  monthlyBudgetInr: number,
  startDateIso: string,
  strategy: DebtStrategy,
): DebtSimulationResult {
  const normalizedDebts: SimDebt[] = debts
    .filter((d) => d.balance_inr > 0)
    .map((d) => ({
      id: d.id,
      name: d.name.trim() || "Debt",
      balance_inr: roundInr(Math.max(0, d.balance_inr)),
      apr_pct: Math.max(0, d.apr_pct),
      minimum_payment_inr: roundInr(Math.max(0, d.minimum_payment_inr)),
    }));

  if (normalizedDebts.length === 0) {
    return {
      strategy,
      rows: [],
      summary: {
        payoff_months: 0,
        payoff_date_iso: addMonthsToIsoDate(startDateIso, 0),
        total_interest_inr: 0,
        total_paid_inr: 0,
        is_paid_off: true,
      },
      warning: "Add at least one debt with a positive balance.",
    };
  }

  const monthlyBudget = roundInr(Math.max(0, monthlyBudgetInr));
  const minimumDue = roundInr(
    normalizedDebts.reduce((sum, debt) => sum + debt.minimum_payment_inr, 0),
  );
  if (monthlyBudget < minimumDue) {
    return {
      strategy,
      rows: [],
      summary: {
        payoff_months: 0,
        payoff_date_iso: null,
        total_interest_inr: 0,
        total_paid_inr: 0,
        is_paid_off: false,
      },
      warning:
        "Monthly budget is below total minimum payments. Increase budget to simulate payoff.",
    };
  }

  const rows: DebtMonthRow[] = [];
  let totalInterest = 0;
  let totalPaid = 0;
  let month = 0;
  const cap = 1200;

  while (
    normalizedDebts.some((debt) => debt.balance_inr > BALANCE_EPSILON_INR) &&
    month < cap
  ) {
    month += 1;
    const openingTotal = roundInr(
      normalizedDebts.reduce((sum, debt) => sum + debt.balance_inr, 0),
    );

    let interestForMonth = 0;
    for (const debt of normalizedDebts) {
      if (debt.balance_inr <= BALANCE_EPSILON_INR) continue;
      const monthlyRate = nominalMonthlyRateFromAnnualPercent(debt.apr_pct);
      const interest = roundInr(debt.balance_inr * monthlyRate);
      debt.balance_inr = roundInr(debt.balance_inr + interest);
      interestForMonth = roundInr(interestForMonth + interest);
    }

    let available = monthlyBudget;
    for (const debt of normalizedDebts) {
      if (debt.balance_inr <= BALANCE_EPSILON_INR) continue;
      const minimumPayment = roundInr(
        Math.min(debt.minimum_payment_inr, debt.balance_inr),
      );
      debt.balance_inr = roundInr(debt.balance_inr - minimumPayment);
      available = roundInr(available - minimumPayment);
      totalPaid = roundInr(totalPaid + minimumPayment);
    }

    const activeDebts = () =>
      normalizedDebts.filter((debt) => debt.balance_inr > BALANCE_EPSILON_INR);
    let focus = pickFocusDebt(activeDebts(), strategy);
    while (available > BALANCE_EPSILON_INR && focus) {
      const extra = roundInr(Math.min(available, focus.balance_inr));
      focus.balance_inr = roundInr(focus.balance_inr - extra);
      available = roundInr(available - extra);
      totalPaid = roundInr(totalPaid + extra);
      focus = pickFocusDebt(activeDebts(), strategy);
    }

    totalInterest = roundInr(totalInterest + interestForMonth);
    const closingTotal = roundInr(
      normalizedDebts.reduce((sum, debt) => sum + Math.max(0, debt.balance_inr), 0),
    );
    rows.push({
      month,
      opening_total_inr: openingTotal,
      interest_inr: interestForMonth,
      payment_inr: roundInr(monthlyBudget - available),
      closing_total_inr: closingTotal,
      focus_debt_name: pickFocusDebt(activeDebts(), strategy)?.name ?? null,
    });
  }

  const isPaidOff = normalizedDebts.every(
    (debt) => debt.balance_inr <= BALANCE_EPSILON_INR,
  );

  let totalInterestOut = totalInterest;
  let totalPaidOut = totalPaid;
  const tailWarnings: string[] = [];

  if (!Number.isFinite(totalInterestOut) || !Number.isFinite(totalPaidOut)) {
    totalInterestOut = 0;
    totalPaidOut = Number.isFinite(totalPaid) ? roundInr(totalPaid) : 0;
    tailWarnings.push(
      "Totals were reset after extreme interest accrual—usually APR or balances vs payments are inconsistent. Check each debt row.",
    );
  } else {
    totalInterestOut = roundInr(totalInterestOut);
    totalPaidOut = roundInr(totalPaidOut);
  }

  if (!isPaidOff) {
    tailWarnings.push(
      "Simulation horizon reached before all debts were paid off.",
    );
  }

  return {
    strategy,
    rows,
    summary: {
      payoff_months: rows.length,
      payoff_date_iso: isPaidOff ? addMonthsToIsoDate(startDateIso, rows.length) : null,
      total_interest_inr: totalInterestOut,
      total_paid_inr: totalPaidOut,
      is_paid_off: isPaidOff,
    },
    warning: tailWarnings.length > 0 ? tailWarnings.join(" ") : undefined,
  };
}

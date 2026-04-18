import { computeEmi, monthlyRateFromAnnualPercent } from "./emi";
import { roundInr } from "../money";
import { BALANCE_EPSILON_INR } from "../shared/constants";

export interface ScheduleRow {
  month: number;
  opening_inr: number;
  interest_inr: number;
  principal_inr: number;
  prepayment_inr: number;
  closing_inr: number;
  payment_inr: number;
  emi_inr: number;
}

export interface ScheduleTotals {
  total_paid_inr: number;
  total_interest_inr: number;
  total_prepayments_inr: number;
  payoff_month: number;
}

export interface TimedPrepaymentEvent {
  month: number;
  amount_inr: number;
}

function pushRow(
  rows: ScheduleRow[],
  m: number,
  opening: number,
  interest: number,
  principal: number,
  prepay: number,
  closing: number,
  emiShown: number,
) {
  const payment = roundInr(interest + principal + prepay);
  rows.push({
    month: m,
    opening_inr: opening,
    interest_inr: interest,
    principal_inr: principal,
    prepayment_inr: prepay,
    closing_inr: closing,
    payment_inr: payment,
    emi_inr: emiShown,
  });
}

/** Baseline: no prepayment, EMI fixed for full tenure; last month clears residual. Spec §4.3. */
export function baselineSchedule(
  principalInr: number,
  annualPercent: number,
  tenureMonths: number,
): { rows: ScheduleRow[]; totals: ScheduleTotals; emi_inr: number } {
  const emi = computeEmi(principalInr, annualPercent, tenureMonths);
  const r = monthlyRateFromAnnualPercent(annualPercent);
  const rows: ScheduleRow[] = [];
  let balance = roundInr(principalInr);
  let totalInterest = 0;
  let totalPaid = 0;

  for (let m = 1; m <= tenureMonths; m++) {
    const opening = balance;
    const interest = roundInr(opening * r);
    const isLast = m === tenureMonths;
    const principal = isLast
      ? opening
      : roundInr(Math.min(opening, emi - interest));
    const payment = roundInr(interest + principal);
    balance = roundInr(opening - principal);
    pushRow(rows, m, opening, interest, principal, 0, balance, emi);
    totalInterest += interest;
    totalPaid += payment;
  }

  return {
    emi_inr: emi,
    rows,
    totals: {
      total_paid_inr: roundInr(totalPaid),
      total_interest_inr: roundInr(totalInterest),
      total_prepayments_inr: 0,
      payoff_month: rows.length,
    },
  };
}

/**
 * Prepay at end of month `prepayMonth` (1-based), after EMI.
 * Exactly `tenureMonths` calendar months; EMI each month from current balance and
 * `tenureMonths - m + 1` remaining (recompute_emi_keep_tenure). Spec §4.4.
 */
export function schedulePrepayKeepTenure(
  principalInr: number,
  annualPercent: number,
  tenureMonths: number,
  prepayMonth: number,
  prepaymentInr: number,
  monthlyExtraInr = 0,
): { rows: ScheduleRow[]; totals: ScheduleTotals } {
  const r = monthlyRateFromAnnualPercent(annualPercent);
  const rows: ScheduleRow[] = [];
  let balance = roundInr(principalInr);
  let totalInterest = 0;
  let totalPaid = 0;
  let totalPrepay = 0;
  const monthlyExtra = Math.max(0, monthlyExtraInr);

  for (let m = 1; m <= tenureMonths; m++) {
    if (balance <= BALANCE_EPSILON_INR) {
      break;
    }
    const opening = balance;
    const rem = tenureMonths - m + 1;
    const emi = computeEmi(opening, annualPercent, rem);
    const interest = roundInr(opening * r);
    const isLast = m === tenureMonths;
    const principal = isLast
      ? opening
      : roundInr(Math.min(opening, emi - interest));
    const payEmi = roundInr(interest + principal);
    balance = roundInr(opening - principal);

    let prepay = 0;
    if (m === prepayMonth && prepaymentInr > 0) {
      prepay = roundInr(Math.min(prepaymentInr, balance));
      balance = roundInr(balance - prepay);
      totalPrepay += prepay;
    }

    let extra = 0;
    if (monthlyExtra > 0 && balance > BALANCE_EPSILON_INR) {
      extra = roundInr(Math.min(monthlyExtra, balance));
      balance = roundInr(balance - extra);
      totalPrepay += extra;
    }

    const prepayShown = roundInr(prepay + extra);
    pushRow(rows, m, opening, interest, principal, prepayShown, balance, emi);
    totalInterest += interest;
    totalPaid += roundInr(payEmi + prepayShown);
  }

  return {
    rows,
    totals: {
      total_paid_inr: roundInr(totalPaid),
      total_interest_inr: roundInr(totalInterest),
      total_prepayments_inr: roundInr(totalPrepay),
      payoff_month: rows.length,
    },
  };
}

/**
 * Fixed EMI from original loan; prepay after EMI on `prepayMonth`. Run until closed. Spec §4.4 policy 1.
 */
export function schedulePrepayKeepEmi(
  principalInr: number,
  annualPercent: number,
  tenureMonths: number,
  prepayMonth: number,
  prepaymentInr: number,
): { rows: ScheduleRow[]; totals: ScheduleTotals; emi_inr: number } {
  const emi0 = computeEmi(principalInr, annualPercent, tenureMonths);
  const r = monthlyRateFromAnnualPercent(annualPercent);
  const rows: ScheduleRow[] = [];
  let balance = roundInr(principalInr);
  let totalInterest = 0;
  let totalPaid = 0;
  let totalPrepay = 0;
  let m = 0;
  const cap = tenureMonths * 4;

  while (balance > BALANCE_EPSILON_INR && m < cap) {
    m++;
    const opening = balance;
    const interest = roundInr(opening * r);
    const principal = roundInr(Math.min(opening, emi0 - interest));
    let prepay = 0;

    balance = roundInr(opening - principal);
    if (m === prepayMonth && prepaymentInr > 0) {
      prepay = roundInr(Math.min(prepaymentInr, balance));
      balance = roundInr(balance - prepay);
      totalPrepay += prepay;
    }

    pushRow(rows, m, opening, interest, principal, prepay, balance, emi0);
    totalInterest += interest;
    totalPaid += roundInr(interest + principal + prepay);
    if (balance <= BALANCE_EPSILON_INR) break;
  }

  return {
    emi_inr: emi0,
    rows,
    totals: {
      total_paid_inr: roundInr(totalPaid),
      total_interest_inr: roundInr(totalInterest),
      total_prepayments_inr: roundInr(totalPrepay),
      payoff_month: rows.length,
    },
  };
}

/**
 * Fixed baseline EMI each month; after scheduled principal (and optional one-time prepay on a given month),
 * apply **monthlyExtraInr** toward remaining principal (§4.5 order: interest → EMI principal → lump → recurring extra).
 */
export function scheduleFixedEmiWithMonthlyExtra(
  principalInr: number,
  annualPercent: number,
  tenureMonths: number,
  monthlyExtraInr: number,
  oneTimePrepay?: { month: number; amount: number },
): { rows: ScheduleRow[]; totals: ScheduleTotals; emi_inr: number } {
  const emi0 = computeEmi(principalInr, annualPercent, tenureMonths);
  const r = monthlyRateFromAnnualPercent(annualPercent);
  const rows: ScheduleRow[] = [];
  let balance = roundInr(principalInr);
  let totalInterest = 0;
  let totalPaid = 0;
  let totalPrepay = 0;
  let m = 0;
  const cap = tenureMonths * 8;
  const extra = Math.max(0, monthlyExtraInr);

  while (balance > BALANCE_EPSILON_INR && m < cap) {
    m++;
    const opening = balance;
    const interest = roundInr(opening * r);
    const principal = roundInr(Math.min(opening, emi0 - interest));
    balance = roundInr(opening - principal);

    let lump = 0;
    if (oneTimePrepay && m === oneTimePrepay.month && oneTimePrepay.amount > 0) {
      lump = roundInr(Math.min(oneTimePrepay.amount, balance));
      balance = roundInr(balance - lump);
      totalPrepay += lump;
    }

    let monthExtra = 0;
    if (extra > 0 && balance > BALANCE_EPSILON_INR) {
      monthExtra = roundInr(Math.min(extra, balance));
      balance = roundInr(balance - monthExtra);
      totalPrepay += monthExtra;
    }

    const prepayShown = roundInr(lump + monthExtra);
    pushRow(rows, m, opening, interest, principal, prepayShown, balance, emi0);
    totalInterest += interest;
    totalPaid += roundInr(interest + principal + prepayShown);
    if (balance <= BALANCE_EPSILON_INR) break;
  }

  return {
    emi_inr: emi0,
    rows,
    totals: {
      total_paid_inr: roundInr(totalPaid),
      total_interest_inr: roundInr(totalInterest),
      total_prepayments_inr: roundInr(totalPrepay),
      payoff_month: rows.length,
    },
  };
}

/**
 * Fixed baseline EMI each month with one or more timed prepayments applied after EMI.
 * Useful for unemployment PF tranches (SPEC §4.7) where month 1 and month 12 prepays are scheduled.
 */
export function scheduleTimedPrepaysKeepEmi(
  principalInr: number,
  annualPercent: number,
  tenureMonths: number,
  prepaymentEvents: TimedPrepaymentEvent[],
  monthlyExtraInr = 0,
): { rows: ScheduleRow[]; totals: ScheduleTotals; emi_inr: number } {
  const emi0 = computeEmi(principalInr, annualPercent, tenureMonths);
  const r = monthlyRateFromAnnualPercent(annualPercent);
  const rows: ScheduleRow[] = [];
  let balance = roundInr(principalInr);
  let totalInterest = 0;
  let totalPaid = 0;
  let totalPrepay = 0;
  let m = 0;
  const cap = tenureMonths * 8;
  const monthlyExtra = Math.max(0, monthlyExtraInr);

  const monthlyPrepay = new Map<number, number>();
  for (const event of prepaymentEvents) {
    if (event.month < 1 || event.amount_inr <= 0) continue;
    const existing = monthlyPrepay.get(event.month) ?? 0;
    monthlyPrepay.set(event.month, roundInr(existing + event.amount_inr));
  }

  while (balance > BALANCE_EPSILON_INR && m < cap) {
    m++;
    const opening = balance;
    const interest = roundInr(opening * r);
    const principal = roundInr(Math.min(opening, emi0 - interest));
    balance = roundInr(opening - principal);

    let prepay = 0;
    const configuredForMonth = monthlyPrepay.get(m) ?? 0;
    if (configuredForMonth > 0 && balance > BALANCE_EPSILON_INR) {
      prepay = roundInr(Math.min(configuredForMonth, balance));
      balance = roundInr(balance - prepay);
      totalPrepay += prepay;
    }

    let monthExtra = 0;
    if (monthlyExtra > 0 && balance > BALANCE_EPSILON_INR) {
      monthExtra = roundInr(Math.min(monthlyExtra, balance));
      balance = roundInr(balance - monthExtra);
      totalPrepay += monthExtra;
    }

    const prepayShown = roundInr(prepay + monthExtra);
    pushRow(rows, m, opening, interest, principal, prepayShown, balance, emi0);
    totalInterest += interest;
    totalPaid += roundInr(interest + principal + prepayShown);
    if (balance <= BALANCE_EPSILON_INR) break;
  }

  return {
    emi_inr: emi0,
    rows,
    totals: {
      total_paid_inr: roundInr(totalPaid),
      total_interest_inr: roundInr(totalInterest),
      total_prepayments_inr: roundInr(totalPrepay),
      payoff_month: rows.length,
    },
  };
}

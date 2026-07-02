import { computeEmi, monthlyRateFromAnnualPercent } from "./emi";
import type { ScheduleRow, ScheduleTotals, TimedPrepaymentEvent } from "./amortisation";
import { roundInr } from "../money";
import { BALANCE_EPSILON_INR } from "../shared/constants";
import { trancheMonthsFromStart } from "../shared/trancheMonths";
import { computePfUnemploymentWithdrawalPlan } from "../pf/unemployment";

export type PfTrancheDestination = "loan_prepay" | "cash_buffer" | "split";

export interface CashflowScheduleRow extends ScheduleRow {
  cash_balance_inr: number;
  events: string[];
}

export interface CashflowSimInput {
  principal_inr: number;
  annual_interest_rate: number;
  tenure_months: number;
  cash_inr: number;
  monthly_income_inr: number;
  monthly_living_expense_inr: number;
  monthly_extra_to_loan_inr: number;
  unemployment_enabled: boolean;
  unemployment_start_month: number;
  pf_corpus_inr: number;
  pf_annual_interest_rate_pct: number;
  monthly_pf_addition_inr: number;
  pf_tranche1_destination?: PfTrancheDestination;
  pf_tranche2_destination?: PfTrancheDestination;
  pf_tranche1_loan_fraction?: number;
  pf_tranche2_loan_fraction?: number;
  extra_prepayments?: TimedPrepaymentEvent[];
}

export interface CashflowSimResult {
  rows: CashflowScheduleRow[];
  totals: ScheduleTotals;
  emi_inr: number;
  min_cash_balance_inr: number;
  warnings: string[];
}

function loanFractionFromDestination(
  destination: PfTrancheDestination,
  loanFraction?: number,
): number {
  if (destination === "loan_prepay") return 1;
  if (destination === "cash_buffer") return 0;
  return Math.min(1, Math.max(0, loanFraction ?? 0.5));
}

function pushCashflowRow(
  rows: CashflowScheduleRow[],
  m: number,
  opening: number,
  interest: number,
  principal: number,
  prepay: number,
  closing: number,
  emiShown: number,
  cashBalance: number,
  events: string[],
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
    cash_balance_inr: roundInr(cashBalance),
    events: [...events],
  });
}

/**
 * Month-by-month loan + cash simulation (SPEC §4.8).
 * Order: income/living → interest → EMI from cash → PF tranches → extra prepay/monthly extra.
 */
export function simulateCashflowSchedule(input: CashflowSimInput): CashflowSimResult {
  const emi0 = computeEmi(
    input.principal_inr,
    input.annual_interest_rate,
    input.tenure_months,
  );
  const r = monthlyRateFromAnnualPercent(input.annual_interest_rate);
  const rows: CashflowScheduleRow[] = [];
  let balance = roundInr(input.principal_inr);
  let cashBalance = roundInr(input.cash_inr);
  let totalInterest = 0;
  let totalPaid = 0;
  let totalPrepay = 0;
  let minCash = cashBalance;
  const warnings: string[] = [];
  let m = 0;
  const cap = input.tenure_months * 8;
  const monthlyExtra = Math.max(0, input.monthly_extra_to_loan_inr);
  const uStart = input.unemployment_enabled
    ? Math.max(1, input.unemployment_start_month)
    : null;

  const pfPlan = computePfUnemploymentWithdrawalPlan(
    input.pf_corpus_inr,
    input.pf_annual_interest_rate_pct,
    input.monthly_pf_addition_inr,
  );
  const trancheMonths =
    uStart !== null ? trancheMonthsFromStart(uStart) : null;
  const tranche1Month = trancheMonths?.tranche1Month ?? null;
  const tranche2Month = trancheMonths?.tranche2Month ?? null;
  const dest1 = input.pf_tranche1_destination ?? "cash_buffer";
  const dest2 = input.pf_tranche2_destination ?? "loan_prepay";
  const frac1 = loanFractionFromDestination(dest1, input.pf_tranche1_loan_fraction);
  const frac2 = loanFractionFromDestination(dest2, input.pf_tranche2_loan_fraction);

  const monthlyPrepay = new Map<number, number>();
  for (const event of input.extra_prepayments ?? []) {
    if (event.month < 1 || event.amount_inr <= 0) continue;
    const existing = monthlyPrepay.get(event.month) ?? 0;
    monthlyPrepay.set(event.month, roundInr(existing + event.amount_inr));
  }

  if (
    input.unemployment_enabled &&
    input.cash_inr <= 0 &&
    input.monthly_income_inr <= 0 &&
    emi0 > 0
  ) {
    warnings.push("EMI_DEFAULT_RISK");
  }

  while (balance > BALANCE_EPSILON_INR && m < cap) {
    m++;
    const events: string[] = [];

    if (input.monthly_income_inr > 0) {
      cashBalance = roundInr(cashBalance + input.monthly_income_inr);
      events.push(`income:+${input.monthly_income_inr}`);
    }
    if (input.monthly_living_expense_inr > 0) {
      cashBalance = roundInr(cashBalance - input.monthly_living_expense_inr);
      events.push(`living:-${input.monthly_living_expense_inr}`);
    }

    const opening = balance;
    const interest = roundInr(opening * r);
    const principal = roundInr(
      Math.max(0, Math.min(opening, emi0 - interest)),
    );
    const emiDue = roundInr(interest + principal);

    let interestPaid = 0;
    let principalPaid = 0;

    const applyEmiPayment = (amount: number) => {
      if (amount <= 0) return;
      const interestRemaining = roundInr(Math.max(0, interest - interestPaid));
      const toInterest = roundInr(Math.min(amount, interestRemaining));
      const remainder = roundInr(amount - toInterest);
      const principalRemaining = roundInr(Math.max(0, principal - principalPaid));
      const toPrincipal = roundInr(Math.min(remainder, principalRemaining));
      interestPaid = roundInr(interestPaid + toInterest);
      principalPaid = roundInr(principalPaid + toPrincipal);
    };

    if (cashBalance >= emiDue) {
      cashBalance = roundInr(cashBalance - emiDue);
      applyEmiPayment(emiDue);
    } else if (emiDue > 0) {
      events.push("emi_shortfall");
      applyEmiPayment(Math.max(0, cashBalance));
      cashBalance = 0;
      if (!warnings.includes("CASH_SHORTFALL")) {
        warnings.push("CASH_SHORTFALL");
      }
    }

    balance = roundInr(opening + interest - interestPaid - principalPaid);

    let prepay = 0;

    const applyPfTranche = (amount: number, frac: number, label: string) => {
      if (amount <= 0) return;
      const toLoan = roundInr(amount * frac);
      const toCash = roundInr(amount - toLoan);
      if (toCash > 0) {
        cashBalance = roundInr(cashBalance + toCash);
        events.push(`${label}:cash:+${toCash}`);
      }
      if (toLoan > 0 && balance > BALANCE_EPSILON_INR) {
        const applied = roundInr(Math.min(toLoan, balance));
        prepay = roundInr(prepay + applied);
        balance = roundInr(balance - applied);
        totalPrepay += applied;
        events.push(`${label}:loan:+${applied}`);
      }
    };

    if (tranche1Month !== null && m === tranche1Month) {
      applyPfTranche(pfPlan.tranche1_inr, frac1, "pf_tranche1");
    }
    if (tranche2Month !== null && m === tranche2Month) {
      applyPfTranche(pfPlan.tranche2_inr, frac2, "pf_tranche2");
    }

    const configuredForMonth = monthlyPrepay.get(m) ?? 0;
    if (configuredForMonth > 0 && balance > BALANCE_EPSILON_INR) {
      const applied = roundInr(
        Math.min(configuredForMonth, balance, cashBalance),
      );
      if (applied > 0) {
        prepay = roundInr(prepay + applied);
        balance = roundInr(balance - applied);
        totalPrepay += applied;
        cashBalance = roundInr(cashBalance - applied);
        events.push(`scheduled_prepay:+${applied}`);
      }
    }

    if (monthlyExtra > 0 && balance > BALANCE_EPSILON_INR && cashBalance > 0) {
      const extra = roundInr(Math.min(monthlyExtra, balance, cashBalance));
      if (extra > 0) {
        prepay = roundInr(prepay + extra);
        balance = roundInr(balance - extra);
        totalPrepay += extra;
        cashBalance = roundInr(cashBalance - extra);
        events.push(`monthly_extra:+${extra}`);
      }
    }

    pushCashflowRow(
      rows,
      m,
      opening,
      interestPaid,
      principalPaid,
      prepay,
      balance,
      emi0,
      cashBalance,
      events,
    );
    totalInterest += interestPaid;
    totalPaid += roundInr(interestPaid + principalPaid + prepay);
    minCash = Math.min(minCash, cashBalance);
    if (balance <= BALANCE_EPSILON_INR) break;
  }

  const loanPaidOff = balance <= BALANCE_EPSILON_INR;

  return {
    emi_inr: emi0,
    rows,
    totals: {
      total_paid_inr: roundInr(totalPaid),
      total_interest_inr: roundInr(totalInterest),
      total_prepayments_inr: roundInr(totalPrepay),
      payoff_month: loanPaidOff ? rows.length : 0,
    },
    min_cash_balance_inr: roundInr(minCash),
    warnings,
  };
}

/** UE_PF_TO_LOAN preset: both PF tranches 100% to loan prepay (SPEC §4.7). */
export function simulateUePfToLoanCashflow(
  input: Omit<
    CashflowSimInput,
    | "unemployment_enabled"
    | "pf_tranche1_destination"
    | "pf_tranche2_destination"
    | "pf_tranche1_loan_fraction"
    | "pf_tranche2_loan_fraction"
  >,
): CashflowSimResult {
  return simulateCashflowSchedule({
    ...input,
    unemployment_enabled: true,
    pf_tranche1_destination: "loan_prepay",
    pf_tranche2_destination: "loan_prepay",
  });
}

/** UE_PF_BRIDGE preset: tranche 1 to cash buffer, tranche 2 split 50/50 default. */
export function simulateUePfBridgeCashflow(
  input: Omit<
    CashflowSimInput,
    | "unemployment_enabled"
    | "pf_tranche1_destination"
    | "pf_tranche2_destination"
    | "pf_tranche1_loan_fraction"
    | "pf_tranche2_loan_fraction"
  >,
): CashflowSimResult {
  return simulateCashflowSchedule({
    ...input,
    unemployment_enabled: true,
    pf_tranche1_destination: "cash_buffer",
    pf_tranche2_destination: "split",
    pf_tranche2_loan_fraction: 0.5,
  });
}

/** UE_DELAY_PREPAY preset: tranche 1 to cash, tranche 2 100% loan (SPEC §4.7). */
export function simulateUeDelayPrepayCashflow(
  input: Omit<
    CashflowSimInput,
    | "unemployment_enabled"
    | "pf_tranche1_destination"
    | "pf_tranche2_destination"
    | "pf_tranche1_loan_fraction"
    | "pf_tranche2_loan_fraction"
  >,
): CashflowSimResult {
  return simulateCashflowSchedule({
    ...input,
    unemployment_enabled: true,
    pf_tranche1_destination: "cash_buffer",
    pf_tranche2_destination: "loan_prepay",
  });
}

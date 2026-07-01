import { computeEmi, monthlyRateFromAnnualPercent } from "./emi";
import type { ScheduleRow, ScheduleTotals, TimedPrepaymentEvent } from "./amortisation";
import { roundUsd } from "../money";
import { BALANCE_EPSILON_INR } from "../shared/constants";
import {
  computeEarlyWithdrawalCost,
  computeK401JobLossWithdrawalPlan,
} from "../k401/jobLoss";

export type K401TrancheDestination = "loan_prepay" | "cash_buffer" | "split";

export interface UsCashflowScheduleRow extends ScheduleRow {
  cash_balance_inr: number;
  events: string[];
}

export interface UsCashflowSimInput {
  principal_inr: number;
  annual_interest_rate: number;
  tenure_months: number;
  cash_inr: number;
  monthly_income_inr: number;
  monthly_living_expense_inr: number;
  monthly_extra_to_loan_inr: number;
  monthly_uib_inr: number;
  job_loss_enabled: boolean;
  job_loss_start_month: number;
  k401_balance_inr: number;
  vested_fraction_pct: number;
  early_withdrawal_tax_withholding_pct: number;
  pmi_monthly_inr?: number;
  pmi_active?: boolean;
  hsa_balance_inr?: number;
  monthly_health_premium_inr?: number;
  k401_tranche1_destination?: K401TrancheDestination;
  k401_tranche2_destination?: K401TrancheDestination;
  k401_tranche1_loan_fraction?: number;
  k401_tranche2_loan_fraction?: number;
  extra_prepayments?: TimedPrepaymentEvent[];
}

export interface UsCashflowSimResult {
  rows: UsCashflowScheduleRow[];
  totals: ScheduleTotals;
  emi_inr: number;
  min_cash_balance_inr: number;
  total_early_withdrawal_penalty_inr: number;
  warnings: string[];
}

const BALANCE_EPS = BALANCE_EPSILON_INR;

function loanFractionFromDestination(
  destination: K401TrancheDestination,
  loanFraction?: number,
): number {
  if (destination === "loan_prepay") return 1;
  if (destination === "cash_buffer") return 0;
  return Math.min(1, Math.max(0, loanFraction ?? 0.5));
}

function pushRow(
  rows: UsCashflowScheduleRow[],
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
  const payment = roundUsd(interest + principal + prepay);
  rows.push({
    month: m,
    opening_inr: opening,
    interest_inr: interest,
    principal_inr: principal,
    prepayment_inr: prepay,
    closing_inr: closing,
    payment_inr: payment,
    emi_inr: emiShown,
    cash_balance_inr: roundUsd(cashBalance),
    events: [...events],
  });
}

/**
 * SPEC-US §4.8 — month-by-month mortgage + cash + 401(k) job-loss tranches.
 */
export function simulateUsCashflowSchedule(
  input: UsCashflowSimInput,
): UsCashflowSimResult {
  const emi0 = computeEmi(
    input.principal_inr,
    input.annual_interest_rate,
    input.tenure_months,
  );
  const r = monthlyRateFromAnnualPercent(input.annual_interest_rate);
  const rows: UsCashflowScheduleRow[] = [];
  let balance = roundUsd(input.principal_inr);
  let cashBalance = roundUsd(input.cash_inr);
  let totalInterest = 0;
  let totalPaid = 0;
  let totalPrepay = 0;
  let totalPenalty = 0;
  let minCash = cashBalance;
  const warnings: string[] = [];
  let m = 0;
  const cap = input.tenure_months * 8;
  const monthlyExtra = Math.max(0, input.monthly_extra_to_loan_inr);
  const uStart = input.job_loss_enabled
    ? Math.max(1, input.job_loss_start_month)
    : null;

  const k401Plan = computeK401JobLossWithdrawalPlan(
    input.k401_balance_inr,
    input.vested_fraction_pct,
  );
  const tranche1Month = uStart;
  const tranche2Month = uStart !== null ? uStart + 11 : null;
  const dest1 = input.k401_tranche1_destination ?? "cash_buffer";
  const dest2 = input.k401_tranche2_destination ?? "loan_prepay";
  const frac1 = loanFractionFromDestination(dest1, input.k401_tranche1_loan_fraction);
  const frac2 = loanFractionFromDestination(dest2, input.k401_tranche2_loan_fraction);
  const withholdingPct = input.early_withdrawal_tax_withholding_pct;
  const pmiMonthly =
    input.pmi_active !== false ? Math.max(0, input.pmi_monthly_inr ?? 0) : 0;
  let hsaBalance = roundUsd(Math.max(0, input.hsa_balance_inr ?? 0));
  const healthPremiumMonthly = Math.max(0, input.monthly_health_premium_inr ?? 0);

  const monthlyPrepay = new Map<number, number>();
  for (const event of input.extra_prepayments ?? []) {
    if (event.month < 1 || event.amount_inr <= 0) continue;
    const existing = monthlyPrepay.get(event.month) ?? 0;
    monthlyPrepay.set(event.month, roundUsd(existing + event.amount_inr));
  }

  if (
    input.job_loss_enabled &&
    input.cash_inr <= 0 &&
    input.monthly_income_inr <= 0 &&
    input.monthly_uib_inr <= 0 &&
    emi0 > 0
  ) {
    warnings.push("MORTGAGE_DEFAULT_RISK");
  }

  while (balance > BALANCE_EPS && m < cap) {
    m++;
    const events: string[] = [];
    const inJobLoss =
      uStart !== null && m >= uStart;

    if (input.monthly_income_inr > 0) {
      cashBalance = roundUsd(cashBalance + input.monthly_income_inr);
      events.push(`income:+${input.monthly_income_inr}`);
    }
    if (inJobLoss && input.monthly_uib_inr > 0) {
      cashBalance = roundUsd(cashBalance + input.monthly_uib_inr);
      events.push(`uib:+${input.monthly_uib_inr}`);
    }
    if (input.monthly_living_expense_inr > 0) {
      cashBalance = roundUsd(cashBalance - input.monthly_living_expense_inr);
      events.push(`living:-${input.monthly_living_expense_inr}`);
    }
    if (pmiMonthly > 0) {
      cashBalance = roundUsd(cashBalance - pmiMonthly);
      events.push(`pmi:-${pmiMonthly}`);
    }
    if (inJobLoss && healthPremiumMonthly > 0) {
      const fromHsa = roundUsd(Math.min(hsaBalance, healthPremiumMonthly));
      hsaBalance = roundUsd(hsaBalance - fromHsa);
      const fromCash = roundUsd(healthPremiumMonthly - fromHsa);
      if (fromHsa > 0) {
        events.push(`hsa:premium:${fromHsa}`);
      }
      if (fromCash > 0) {
        cashBalance = roundUsd(cashBalance - fromCash);
        events.push(`health_premium:cash:${fromCash}`);
      }
    }

    const opening = balance;
    const interest = roundUsd(opening * r);
    const principal = roundUsd(Math.min(opening, emi0 - interest));
    const emiDue = roundUsd(interest + principal);

    if (cashBalance >= emiDue) {
      cashBalance = roundUsd(cashBalance - emiDue);
    } else if (emiDue > 0) {
      events.push("payment_shortfall");
      if (cashBalance > 0) cashBalance = 0;
      if (!warnings.includes("CASH_SHORTFALL")) warnings.push("CASH_SHORTFALL");
      if (!warnings.includes("MORTGAGE_DEFAULT_RISK")) {
        warnings.push("MORTGAGE_DEFAULT_RISK");
      }
    }

    balance = roundUsd(opening - principal);
    let prepay = 0;

    const applyK401Tranche = (
      gross: number,
      frac: number,
      label: string,
    ) => {
      if (gross <= 0) return;
      const toLoanGross = roundUsd(gross * frac);
      const toCashGross = roundUsd(gross - toLoanGross);

      if (toCashGross > 0) {
        const cost = computeEarlyWithdrawalCost(toCashGross, withholdingPct);
        totalPenalty = roundUsd(totalPenalty + cost.penalty_usd);
        cashBalance = roundUsd(cashBalance + cost.net_to_cash_usd);
        events.push(
          `${label}:cash:gross=${toCashGross},penalty=${cost.penalty_usd},net=${cost.net_to_cash_usd}`,
        );
      }
      if (toLoanGross > 0 && balance > BALANCE_EPS) {
        const cost = computeEarlyWithdrawalCost(toLoanGross, withholdingPct);
        totalPenalty = roundUsd(totalPenalty + cost.penalty_usd);
        const applied = roundUsd(Math.min(toLoanGross, balance));
        prepay = roundUsd(prepay + applied);
        balance = roundUsd(balance - applied);
        totalPrepay += applied;
        events.push(
          `${label}:loan:gross=${toLoanGross},penalty=${cost.penalty_usd},applied=${applied}`,
        );
      }
    };

    if (tranche1Month !== null && m === tranche1Month) {
      applyK401Tranche(k401Plan.tranche1_gross_usd, frac1, "k401_tranche1");
    }
    if (tranche2Month !== null && m === tranche2Month) {
      applyK401Tranche(k401Plan.tranche2_gross_usd, frac2, "k401_tranche2");
    }

    const configuredForMonth = monthlyPrepay.get(m) ?? 0;
    if (configuredForMonth > 0 && balance > BALANCE_EPS) {
      const applied = roundUsd(Math.min(configuredForMonth, balance));
      prepay = roundUsd(prepay + applied);
      balance = roundUsd(balance - applied);
      totalPrepay += applied;
      events.push(`scheduled_prepay:+${applied}`);
    }

    if (monthlyExtra > 0 && balance > BALANCE_EPS) {
      const extra = roundUsd(Math.min(monthlyExtra, balance));
      prepay = roundUsd(prepay + extra);
      balance = roundUsd(balance - extra);
      totalPrepay += extra;
    }

    pushRow(
      rows,
      m,
      opening,
      interest,
      principal,
      prepay,
      balance,
      emi0,
      cashBalance,
      events,
    );
    totalInterest += interest;
    totalPaid += roundUsd(interest + principal + prepay);
    minCash = Math.min(minCash, cashBalance);
    if (balance <= BALANCE_EPS) break;
  }

  if (totalPenalty > 0 && !warnings.includes("EARLY_401K_WITHDRAWAL")) {
    warnings.push("EARLY_401K_WITHDRAWAL");
  }

  return {
    emi_inr: emi0,
    rows,
    totals: {
      total_paid_inr: roundUsd(totalPaid),
      total_interest_inr: roundUsd(totalInterest),
      total_prepayments_inr: roundUsd(totalPrepay),
      payoff_month: rows.length,
    },
    min_cash_balance_inr: roundUsd(minCash),
    total_early_withdrawal_penalty_inr: totalPenalty,
    warnings,
  };
}

export function simulateJl401kToLoanCashflow(
  input: Omit<
    UsCashflowSimInput,
    | "job_loss_enabled"
    | "k401_tranche1_destination"
    | "k401_tranche2_destination"
    | "k401_tranche1_loan_fraction"
    | "k401_tranche2_loan_fraction"
  >,
): UsCashflowSimResult {
  return simulateUsCashflowSchedule({
    ...input,
    job_loss_enabled: true,
    k401_tranche1_destination: "loan_prepay",
    k401_tranche2_destination: "loan_prepay",
  });
}

export function simulateJl401kBridgeCashflow(
  input: Omit<
    UsCashflowSimInput,
    | "job_loss_enabled"
    | "k401_tranche1_destination"
    | "k401_tranche2_destination"
    | "k401_tranche1_loan_fraction"
    | "k401_tranche2_loan_fraction"
  >,
): UsCashflowSimResult {
  return simulateUsCashflowSchedule({
    ...input,
    job_loss_enabled: true,
    k401_tranche1_destination: "cash_buffer",
    k401_tranche2_destination: "split",
    k401_tranche2_loan_fraction: 0.5,
  });
}

export function simulateJlDelayPrepayCashflow(
  input: Omit<
    UsCashflowSimInput,
    | "job_loss_enabled"
    | "k401_tranche1_destination"
    | "k401_tranche2_destination"
    | "k401_tranche1_loan_fraction"
    | "k401_tranche2_loan_fraction"
  >,
): UsCashflowSimResult {
  return simulateUsCashflowSchedule({
    ...input,
    job_loss_enabled: true,
    k401_tranche1_destination: "cash_buffer",
    k401_tranche2_destination: "loan_prepay",
  });
}

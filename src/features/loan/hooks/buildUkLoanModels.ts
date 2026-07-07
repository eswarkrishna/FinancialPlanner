import {
  simulateJlRedundancyBridge,
  simulateJlRedundancyToLoan,
  simulateJlSmiSafetyNet,
  simulateUkBaseline,
  simulateUkCashflowSchedule,
  simulateUkPrepayKeepTenure,
  type UkCashflowSimResult,
} from "../../../lib/loan/cashflowUk";
import type { LoanInput } from "../../../lib/schemas/index";
import type { PrepaySource } from "../../../lib/loan/scenarioViews";
import { ukCashflowBaseInput } from "./loanModelHelpers";
import type { BuiltLoanModels } from "./buildLoanModels";
import { computeAutoEnrolmentMonthly } from "../../../lib/pension/autoEnrolment";
import { computeK401JobLossWithdrawalPlan } from "../../../lib/k401/index";

function asBaseShape(result: UkCashflowSimResult) {
  return {
    emi_inr: result.emi_inr,
    rows: result.rows,
    totals: result.totals,
    min_cash_balance_inr: result.min_cash_balance_inr,
    warnings: result.warnings,
  };
}

function ukPrepayAmount(v: LoanInput, prepaySource: PrepaySource): number {
  if (prepaySource === "cash") return v.cash_inr;
  if (prepaySource === "isa") return v.isa_balance_inr;
  if (prepaySource === "gia") return v.gia_balance_inr;
  return 0;
}

export function buildUkLoanModels(
  v: LoanInput,
  prepaySource: PrepaySource,
  stagedEvents: { month: number; amount_inr: number }[],
): BuiltLoanModels {
  const x = v.monthly_cash_to_loan_inr;
  const salaryRecurring = v.monthly_salary_inr;
  const recurringToLoan = x + salaryRecurring;
  const ercConfig = {
    overpayment_allowance_pct: v.overpayment_allowance_pct,
    erc_pct: v.erc_pct,
  };
  const ukBase = () => ukCashflowBaseInput(v, recurringToLoan);

  const base = asBaseShape(
    simulateUkBaseline(
      v.principal_inr,
      v.annual_interest_rate,
      v.tenure_months,
      ercConfig,
    ),
  );

  const baseSalarySweep =
    salaryRecurring > 0
      ? asBaseShape(
          simulateUkCashflowSchedule({
            ...ukBase(),
            monthly_salary_extra_inr: salaryRecurring,
            monthly_extra_to_loan_inr: x,
          }),
        )
      : null;

  const oneTimePrepayInr = ukPrepayAmount(v, prepaySource);
  const canPrepay = oneTimePrepayInr > 0;

  const prepayTenure = canPrepay
    ? asBaseShape(
        simulateUkPrepayKeepTenure(
          v.principal_inr,
          v.annual_interest_rate,
          v.tenure_months,
          1,
          oneTimePrepayInr,
          salaryRecurring,
          ercConfig,
          {
            cash_inr: v.cash_inr,
            isa_balance_inr: v.isa_balance_inr,
            gia_balance_inr: v.gia_balance_inr,
            gia_cost_basis_inr: v.gia_cost_basis_inr || v.gia_balance_inr,
            cgt_rate_pct: v.cgt_rate_pct,
            cgt_annual_exempt_inr: v.cgt_annual_exempt_inr,
          },
        ),
      )
    : null;

  const prepayEmi = canPrepay
    ? asBaseShape(
        simulateUkCashflowSchedule({
          ...ukBase(),
          extra_prepayments: [{ month: 1, amount_inr: oneTimePrepayInr }],
        }),
      )
    : null;

  const baseInflow =
    x > 0
      ? asBaseShape(
          simulateUkCashflowSchedule({
            ...ukBase(),
            monthly_extra_to_loan_inr: x,
            monthly_salary_extra_inr: 0,
          }),
        )
      : null;

  const prepayEmiInflow =
    canPrepay && x > 0
      ? asBaseShape(
          simulateUkCashflowSchedule({
            ...ukBase(),
            extra_prepayments: [{ month: 1, amount_inr: oneTimePrepayInr }],
            monthly_extra_to_loan_inr: x,
          }),
        )
      : null;

  const cashflowNoPf =
    v.cash_inr > 0 || x > 0
      ? asBaseShape(
          simulateUkCashflowSchedule({
            ...ukBase(),
            extra_prepayments:
              v.cash_inr > 0 ? [{ month: 1, amount_inr: v.cash_inr }] : [],
          }),
        )
      : null;

  const cashflowPlusPf =
    v.cash_inr > 0 && v.redundancy_payment_inr > 0
      ? asBaseShape(
          simulateUkCashflowSchedule({
            ...ukBase(),
            extra_prepayments:
              v.cash_inr > 0 ? [{ month: 1, amount_inr: v.cash_inr }] : [],
            apply_redundancy_event: true,
            redundancy_destination: "loan_prepay",
          }),
        )
      : null;

  const uePfToLoan =
    v.redundancy_payment_inr > 0 || v.unemployment_mode
      ? v.unemployment_mode
        ? asBaseShape(simulateJlRedundancyToLoan(ukBase()))
        : asBaseShape(
            simulateUkCashflowSchedule({
              ...ukBase(),
              job_loss_enabled: false,
              apply_redundancy_event: true,
              monthly_jsa_inr: 0,
              smi_enabled: false,
              redundancy_destination: "loan_prepay",
              extra_prepayments: [],
            }),
          )
      : null;

  const uePfBridge =
    v.unemployment_mode && v.redundancy_payment_inr > 0
      ? asBaseShape(simulateJlRedundancyBridge(ukBase()))
      : null;

  const ueDelayPrepay =
    v.unemployment_mode
      ? asBaseShape(simulateJlSmiSafetyNet(ukBase()))
      : null;

  const stagedPrepay =
    stagedEvents.length > 0
      ? asBaseShape(
          simulateUkCashflowSchedule({
            ...ukBase(),
            extra_prepayments: stagedEvents,
          }),
        )
      : null;

  const ae = computeAutoEnrolmentMonthly(
    v.annual_salary_inr,
    v.employee_pension_pct,
    v.employer_pension_pct,
    v.employment_type !== "self_employed",
  );

  return {
    v,
    base,
    baseSalarySweep,
    prepayTenure,
    prepayEmi,
    baseInflow,
    prepayEmiInflow,
    cashflowNoPf,
    cashflowPlusPf,
    uePfToLoan,
    uePfBridge,
    ueDelayPrepay,
    stagedPrepay,
    canPrepay,
    monthlyExtra: x,
    salaryRecurring,
    prepaySource,
    effectiveLiquidInr: v.isa_balance_inr + v.gia_balance_inr,
    k401Plan: computeK401JobLossWithdrawalPlan(0, 0),
    monthly401kWithMatch: ae.employee_monthly_gbp + ae.employer_monthly_gbp,
  };
}

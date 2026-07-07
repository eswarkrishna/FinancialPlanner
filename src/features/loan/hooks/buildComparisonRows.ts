import { formatMoney } from "../../../lib/locale/formatMoney";
import type { Locale } from "../../../lib/locale/types";
import type { BuiltLoanModels } from "./buildLoanModels";
import {
  isCashflowResult,
  pfTrancheToLoanLabel,
  prepaySourceComparisonWord,
} from "./loanModelHelpers";
import type { ComparisonRow } from "./loanModelTypes";

export function buildComparisonRows(
  models: BuiltLoanModels,
  baseInterest: number,
  stagedEventCount: number,
  locale: Locale,
): ComparisonRow[] {
  const baseM = models.base.totals.payoff_month;
  const row = (
    id: string,
    label: string,
    payoffMonth: number,
    totalInterest: number,
    totalPaid: number,
    minCashBalance?: number,
  ): ComparisonRow => ({
    id,
    label,
    payoffMonth,
    totalInterest,
    totalPaid,
    deltaVsBaseMonths: baseM - payoffMonth,
    deltaInterestVsBase: baseInterest - totalInterest,
    minCashBalance,
  });

  const rows: ComparisonRow[] = [
    row(
      "BASE",
      "BASE",
      models.base.totals.payoff_month,
      models.base.totals.total_interest_inr,
      models.base.totals.total_paid_inr,
    ),
  ];
  if (models.baseSalarySweep) {
    rows.push(
      row(
        "BASE_SALARY_SWEEP",
        `BASE + ${formatMoney(models.salaryRecurring, locale)}/mo salary sweep`,
        models.baseSalarySweep.totals.payoff_month,
        models.baseSalarySweep.totals.total_interest_inr,
        models.baseSalarySweep.totals.total_paid_inr,
      ),
    );
  }
  if (models.baseInflow) {
    rows.push(
      row(
        "BASE_INFLOW",
        `BASE + ${formatMoney(models.monthlyExtra, locale)}/mo to loan`,
        models.baseInflow.totals.payoff_month,
        models.baseInflow.totals.total_interest_inr,
        models.baseInflow.totals.total_paid_inr,
      ),
    );
  }
  if (models.prepayTenure) {
    rows.push(
      row(
        "PREPAY_TENURE",
        `Prepay from ${prepaySourceComparisonWord(models.prepaySource, locale)} + keep tenure`,
        models.prepayTenure.totals.payoff_month,
        models.prepayTenure.totals.total_interest_inr,
        models.prepayTenure.totals.total_paid_inr,
      ),
    );
  }
  if (models.prepayEmi) {
    rows.push(
      row(
        "PREPAY_EMI",
        `Prepay from ${prepaySourceComparisonWord(models.prepaySource, locale)} + keep EMI`,
        models.prepayEmi.totals.payoff_month,
        models.prepayEmi.totals.total_interest_inr,
        models.prepayEmi.totals.total_paid_inr,
      ),
    );
  }
  if (models.prepayEmiInflow) {
    rows.push(
      row(
        "PREPAY_EMI_INFLOW",
        `Prepay from ${prepaySourceComparisonWord(models.prepaySource, locale)} + keep EMI + ${formatMoney(models.monthlyExtra, locale)}/mo`,
        models.prepayEmiInflow.totals.payoff_month,
        models.prepayEmiInflow.totals.total_interest_inr,
        models.prepayEmiInflow.totals.total_paid_inr,
      ),
    );
  }
  if (models.cashflowNoPf) {
    rows.push(
      row(
        "CASHFLOW_NO_PF",
        "Cash prepay (month 1) + monthly cashflow",
        models.cashflowNoPf.totals.payoff_month,
        models.cashflowNoPf.totals.total_interest_inr,
        models.cashflowNoPf.totals.total_paid_inr,
      ),
    );
  }
  if (models.cashflowPlusPf) {
    rows.push(
      row(
        "CASHFLOW_PLUS_PF",
        locale === "US"
          ? "Cash + monthly cashflow + 401(k) tranches"
          : "Cash + monthly cashflow + PF tranches",
        models.cashflowPlusPf.totals.payoff_month,
        models.cashflowPlusPf.totals.total_interest_inr,
        models.cashflowPlusPf.totals.total_paid_inr,
      ),
    );
  }
  if (models.uePfToLoan) {
    const ue = models.uePfToLoan;
    let minCash: number | undefined;
    if (isCashflowResult(ue)) {
      minCash = ue.min_cash_balance_inr;
    }
    const startMonth = models.v.unemployment_start_month;
    rows.push(
      row(
        "UE_PF_TO_LOAN",
        pfTrancheToLoanLabel(locale, startMonth, models.v.unemployment_mode),
        ue.totals.payoff_month,
        ue.totals.total_interest_inr,
        ue.totals.total_paid_inr,
        minCash,
      ),
    );
  }
  if (models.uePfBridge) {
    rows.push(
      row(
        "UE_PF_BRIDGE",
        locale === "US"
          ? "JL 401(k) bridge (tranche 1 → cash, tranche 2 split)"
          : "UE PF bridge (tranche 1 → cash, tranche 2 split)",
        models.uePfBridge.totals.payoff_month,
        models.uePfBridge.totals.total_interest_inr,
        models.uePfBridge.totals.total_paid_inr,
        models.uePfBridge.min_cash_balance_inr,
      ),
    );
  }
  if (models.ueDelayPrepay) {
    rows.push(
      row(
        "UE_DELAY_PREPAY",
        locale === "US"
          ? "JL delay prepay (tranche 1 → cash, tranche 2 → loan)"
          : "UE delay prepay (tranche 1 → cash, tranche 2 → loan)",
        models.ueDelayPrepay.totals.payoff_month,
        models.ueDelayPrepay.totals.total_interest_inr,
        models.ueDelayPrepay.totals.total_paid_inr,
        models.ueDelayPrepay.min_cash_balance_inr,
      ),
    );
  }
  if (models.stagedPrepay) {
    rows.push(
      row(
        "STAGED_PREPAY",
        `Custom staged prepay (${stagedEventCount} event${stagedEventCount === 1 ? "" : "s"})`,
        models.stagedPrepay.totals.payoff_month,
        models.stagedPrepay.totals.total_interest_inr,
        models.stagedPrepay.totals.total_paid_inr,
      ),
    );
  }
  return rows;
}

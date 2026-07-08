import type { Locale } from "../../../lib/locale/types";
import { MAX_SCHEDULE_DISPLAY_ROWS } from "../../../lib/shared/constants";
import type { BuiltLoanModels } from "./buildLoanModels";
import { isCashflowResult } from "./loanModelHelpers";
import type { ScenarioView, ScheduleBundle } from "./loanModelTypes";

function capScheduleBundle(bundle: ScheduleBundle): ScheduleBundle {
  if (bundle.rows.length <= MAX_SCHEDULE_DISPLAY_ROWS) {
    return bundle;
  }
  const warnings = [...(bundle.warnings ?? []), "SCHEDULE_TRUNCATED"];
  return {
    ...bundle,
    rows: bundle.rows.slice(0, MAX_SCHEDULE_DISPLAY_ROWS),
    cashBalances: bundle.cashBalances?.slice(0, MAX_SCHEDULE_DISPLAY_ROWS),
    warnings,
  };
}

export function resolveActiveBundle(
  models: BuiltLoanModels,
  scenarioView: ScenarioView,
  locale: Locale,
): ScheduleBundle | null {
  if (scenarioView === "BASE") {
    return capScheduleBundle({ rows: models.base.rows, totals: models.base.totals });
  }
  if (scenarioView === "BASE_SALARY_SWEEP" && models.baseSalarySweep) {
    return capScheduleBundle({
      rows: models.baseSalarySweep.rows,
      totals: models.baseSalarySweep.totals,
    });
  }
  if (scenarioView === "PREPAY_TENURE" && models.prepayTenure) {
    if (isCashflowResult(models.prepayTenure)) {
      return capScheduleBundle({
        rows: models.prepayTenure.rows,
        totals: models.prepayTenure.totals,
        cashBalances: models.prepayTenure.rows.map((r) => r.cash_balance_inr),
        warnings: models.prepayTenure.warnings,
      });
    }
    const warnings =
      locale === "US" && models.prepaySource === "pf" && models.canPrepay
        ? ["EARLY_401K_WITHDRAWAL"]
        : undefined;
    return capScheduleBundle({
      rows: models.prepayTenure.rows,
      totals: models.prepayTenure.totals,
      warnings,
    });
  }
  if (scenarioView === "PREPAY_EMI" && models.prepayEmi) {
    if (isCashflowResult(models.prepayEmi)) {
      return capScheduleBundle({
        rows: models.prepayEmi.rows,
        totals: models.prepayEmi.totals,
        cashBalances: models.prepayEmi.rows.map((r) => r.cash_balance_inr),
        warnings: models.prepayEmi.warnings,
      });
    }
    return capScheduleBundle({
      rows: models.prepayEmi.rows,
      totals: models.prepayEmi.totals,
    });
  }
  if (scenarioView === "BASE_INFLOW" && models.baseInflow) {
    return capScheduleBundle({
      rows: models.baseInflow.rows,
      totals: models.baseInflow.totals,
    });
  }
  if (scenarioView === "PREPAY_EMI_INFLOW" && models.prepayEmiInflow) {
    if (isCashflowResult(models.prepayEmiInflow)) {
      return capScheduleBundle({
        rows: models.prepayEmiInflow.rows,
        totals: models.prepayEmiInflow.totals,
        cashBalances: models.prepayEmiInflow.rows.map((r) => r.cash_balance_inr),
        warnings: models.prepayEmiInflow.warnings,
      });
    }
    return capScheduleBundle({
      rows: models.prepayEmiInflow.rows,
      totals: models.prepayEmiInflow.totals,
    });
  }
  if (scenarioView === "CASHFLOW_NO_PF" && models.cashflowNoPf) {
    return capScheduleBundle({
      rows: models.cashflowNoPf.rows,
      totals: models.cashflowNoPf.totals,
    });
  }
  if (scenarioView === "CASHFLOW_PLUS_PF" && models.cashflowPlusPf) {
    if (isCashflowResult(models.cashflowPlusPf)) {
      return capScheduleBundle({
        rows: models.cashflowPlusPf.rows,
        totals: models.cashflowPlusPf.totals,
        cashBalances: models.cashflowPlusPf.rows.map((r) => r.cash_balance_inr),
        warnings: models.cashflowPlusPf.warnings,
      });
    }
    return capScheduleBundle({
      rows: models.cashflowPlusPf.rows,
      totals: models.cashflowPlusPf.totals,
    });
  }
  if (scenarioView === "UE_PF_TO_LOAN" && models.uePfToLoan) {
    if (isCashflowResult(models.uePfToLoan)) {
      return capScheduleBundle({
        rows: models.uePfToLoan.rows,
        totals: models.uePfToLoan.totals,
        cashBalances: models.uePfToLoan.rows.map((r) => r.cash_balance_inr),
        warnings: models.uePfToLoan.warnings,
      });
    }
    return capScheduleBundle({
      rows: models.uePfToLoan.rows,
      totals: models.uePfToLoan.totals,
    });
  }
  if (scenarioView === "UE_PF_BRIDGE" && models.uePfBridge) {
    return capScheduleBundle({
      rows: models.uePfBridge.rows,
      totals: models.uePfBridge.totals,
      cashBalances: models.uePfBridge.rows.map((r) => r.cash_balance_inr),
      warnings: models.uePfBridge.warnings,
    });
  }
  if (scenarioView === "UE_DELAY_PREPAY" && models.ueDelayPrepay) {
    return capScheduleBundle({
      rows: models.ueDelayPrepay.rows,
      totals: models.ueDelayPrepay.totals,
      cashBalances: models.ueDelayPrepay.rows.map((r) => r.cash_balance_inr),
      warnings: models.ueDelayPrepay.warnings,
    });
  }
  if (scenarioView === "STAGED_PREPAY" && models.stagedPrepay) {
    return capScheduleBundle({
      rows: models.stagedPrepay.rows,
      totals: models.stagedPrepay.totals,
    });
  }
  return capScheduleBundle({ rows: models.base.rows, totals: models.base.totals });
}

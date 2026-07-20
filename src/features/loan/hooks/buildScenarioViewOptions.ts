import type { Locale } from "../../../lib/locale/types";
import type { PrepaySource, ScenarioView } from "../../../lib/loan/scenarioViews";
import type { BuiltLoanModels } from "./buildLoanModels";
import { pfTrancheToLoanLabel, prepaySourceScheduleLabel } from "./loanModelHelpers";

export type ScenarioViewOption = {
  value: ScenarioView;
  label: string;
  subtitle: string;
};

export function buildScenarioViewOptions(
  models: BuiltLoanModels,
  prepaySource: PrepaySource,
  locale: Locale,
  unemploymentOn: boolean,
  unemploymentStartMonth: number,
): ScenarioViewOption[] {
  const isUs = locale === "US";
  const sourceLabel = prepaySourceScheduleLabel(prepaySource, locale);
  const options: ScenarioViewOption[] = [
    {
      value: "BASE",
      label: "Baseline",
      subtitle: "No one-time prepay",
    },
  ];

  if (models.baseSalarySweep) {
    options.push({
      value: "BASE_SALARY_SWEEP",
      label: "Salary sweep",
      subtitle: "Baseline + monthly salary sweep",
    });
  }
  if (models.baseInflow) {
    options.push({
      value: "BASE_INFLOW",
      label: "Monthly cashflow",
      subtitle: "Baseline + monthly cash to loan",
    });
  }
  if (models.canPrepay && models.prepayTenure) {
    options.push({
      value: "PREPAY_TENURE",
      label: "Prepay + tenure",
      subtitle: `One-time prepay (${sourceLabel}) + keep tenure`,
    });
  }
  if (models.canPrepay && models.prepayEmi) {
    options.push({
      value: "PREPAY_EMI",
      label: "Prepay + EMI",
      subtitle: `One-time prepay (${sourceLabel}) + keep EMI`,
    });
  }
  if (models.prepayEmiInflow) {
    options.push({
      value: "PREPAY_EMI_INFLOW",
      label: "Prepay + inflow",
      subtitle: `One-time prepay (${sourceLabel}) + EMI + monthly cashflow`,
    });
  }
  if (models.cashflowNoPf) {
    options.push({
      value: "CASHFLOW_NO_PF",
      label: "Cash-only prepay",
      subtitle: "Cash prepay + monthly cashflow",
    });
  }
  if (models.cashflowPlusPf) {
    options.push({
      value: "CASHFLOW_PLUS_PF",
      label: isUs ? "Cash + 401(k)" : "Cash + PF",
      subtitle: isUs
        ? "Cash + monthly cashflow + 401(k) tranches"
        : "Cash + monthly cashflow + PF tranches",
    });
  }
  if (models.uePfToLoan) {
    options.push({
      value: "UE_PF_TO_LOAN",
      label: "Job loss → loan",
      subtitle: pfTrancheToLoanLabel(locale, unemploymentStartMonth, unemploymentOn),
    });
  }
  if (models.uePfBridge) {
    options.push({
      value: "UE_PF_BRIDGE",
      label: isUs ? "401(k) bridge" : "PF bridge",
      subtitle: isUs ? "Job loss: 401(k) bridge" : "Unemployment: PF bridge",
    });
  }
  if (models.ueDelayPrepay) {
    options.push({
      value: "UE_DELAY_PREPAY",
      label: "Delay prepay",
      subtitle: isUs ? "Job loss: delay prepay" : "Unemployment: delay prepay",
    });
  }
  if (models.stagedPrepay) {
    options.push({
      value: "STAGED_PREPAY",
      label: "Staged prepay",
      subtitle: "Custom staged prepay schedule",
    });
  }

  return options;
}

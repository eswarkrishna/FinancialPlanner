import type { Locale } from "../../../lib/locale/types";
import type { ScenarioView } from "../../../lib/loan/scenarioViews";
import { parseRateChanges } from "../../../lib/loan/rateChanges";
import { parseStagedPrepays } from "../../../lib/loan/stagedPrepays";
import type { LoanScenarioSlot } from "../../../lib/persistence/loanScenarioSlots";
import { buildLoanModels } from "./buildLoanModels";
import { scenarioViewIsAvailable } from "./loanModelHelpers";
import { effectiveLiquidForLocale, parseLoanForm } from "./parseLoanForm";
import { resolveActiveBundle } from "./resolveActiveBundle";

/** One row of the §4.9.1 scenario slot compare table. */
export type ScenarioSlotCompareRow = {
  id: string;
  name: string;
  scenarioLabel: string;
  valid: boolean;
  emi: number;
  payoffMonth: number;
  totalInterest: number;
  totalPaid: number;
};

/** User-facing scenario names (internal IDs stay out of the UI). */
export function scenarioSlotLabel(view: ScenarioView, locale: Locale): string {
  const isUs = locale === "US";
  switch (view) {
    case "BASE":
      return "Baseline";
    case "BASE_SALARY_SWEEP":
      return "Salary sweep";
    case "BASE_INFLOW":
      return "Monthly cashflow";
    case "PREPAY_TENURE":
      return "Prepay + tenure";
    case "PREPAY_EMI":
      return "Prepay + EMI";
    case "PREPAY_EMI_INFLOW":
      return "Prepay + inflow";
    case "CASHFLOW_NO_PF":
      return "Cash-only prepay";
    case "CASHFLOW_PLUS_PF":
      return isUs ? "Cash + 401(k)" : "Cash + PF";
    case "UE_PF_TO_LOAN":
      return "Job loss → loan";
    case "UE_PF_BRIDGE":
      return isUs ? "401(k) bridge" : "PF bridge";
    case "UE_DELAY_PREPAY":
      return "Delay prepay";
    case "STAGED_PREPAY":
      return "Staged prepay";
  }
}

/**
 * Recompute one saved slot with its own inputs and scenario view (§4.9.1).
 * Slots whose inputs no longer parse produce an invalid row instead of numbers.
 */
export function buildScenarioSlotRow(
  slot: LoanScenarioSlot,
  locale: Locale,
): ScenarioSlotCompareRow {
  const invalid: ScenarioSlotCompareRow = {
    id: slot.id,
    name: slot.name,
    scenarioLabel: scenarioSlotLabel(slot.state.scenarioView, locale),
    valid: false,
    emi: 0,
    payoffMonth: 0,
    totalInterest: 0,
    totalPaid: 0,
  };

  const parsed = parseLoanForm(slot.state.inputs);
  if (!parsed.success) return invalid;

  const models = buildLoanModels(
    parsed.data,
    slot.state.prepaySource,
    effectiveLiquidForLocale(parsed.data, locale),
    parseStagedPrepays(slot.state.stagedPrepays),
    locale,
    parseRateChanges(slot.state.rateChanges),
  );
  // Mirror the live UI: when the saved view has no bundle after recompute,
  // fall back to Baseline for the label AND the totals together.
  const effectiveView = scenarioViewIsAvailable(slot.state.scenarioView, models)
    ? slot.state.scenarioView
    : "BASE";
  const bundle = resolveActiveBundle(models, effectiveView, locale);
  if (!bundle) return invalid;

  return {
    ...invalid,
    scenarioLabel: scenarioSlotLabel(effectiveView, locale),
    valid: true,
    emi: models.base.emi_inr,
    payoffMonth: bundle.totals.payoff_month,
    totalInterest: bundle.totals.total_interest_inr,
    totalPaid: bundle.totals.total_paid_inr,
  };
}

export function buildScenarioSlotRows(
  slots: LoanScenarioSlot[],
  locale: Locale,
): ScenarioSlotCompareRow[] {
  return slots.map((slot) => buildScenarioSlotRow(slot, locale));
}

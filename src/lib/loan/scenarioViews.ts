export type ScenarioView =
  | "BASE"
  | "BASE_SALARY_SWEEP"
  | "PREPAY_TENURE"
  | "PREPAY_EMI"
  | "BASE_INFLOW"
  | "PREPAY_EMI_INFLOW"
  | "CASHFLOW_NO_PF"
  | "CASHFLOW_PLUS_PF"
  | "UE_PF_TO_LOAN"
  | "UE_PF_BRIDGE"
  | "UE_DELAY_PREPAY"
  | "STAGED_PREPAY";

export type PrepaySource = "cash" | "pf" | "gold";

export const SCENARIO_LABELS: Record<ScenarioView, string> = {
  BASE: "BASE",
  BASE_SALARY_SWEEP: "BASE_PLUS_SALARY_SWEEP",
  PREPAY_TENURE: "PREPAY_TENURE",
  PREPAY_EMI: "PREPAY_EMI",
  BASE_INFLOW: "BASE_PLUS_MONTHLY_INFLOW",
  PREPAY_EMI_INFLOW: "PREPAY_EMI_PLUS_MONTHLY_INFLOW",
  CASHFLOW_NO_PF: "CASHFLOW_NO_PF",
  CASHFLOW_PLUS_PF: "CASHFLOW_PLUS_PF",
  UE_PF_TO_LOAN: "UE_PF_TO_LOAN",
  UE_PF_BRIDGE: "UE_PF_BRIDGE",
  UE_DELAY_PREPAY: "UE_DELAY_PREPAY",
  STAGED_PREPAY: "STAGED_PREPAY",
};

export const SCENARIO_ID_TO_VIEW: Record<string, ScenarioView> = Object.fromEntries(
  Object.entries(SCENARIO_LABELS).map(([view, id]) => [id, view as ScenarioView]),
) as Record<string, ScenarioView>;

export function parsePrepaySource(value: unknown): PrepaySource {
  if (value === "pf" || value === "gold") return value;
  return "cash";
}

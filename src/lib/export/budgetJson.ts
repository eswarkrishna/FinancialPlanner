import type { BudgetAnalysisResult, BudgetInput } from "../budget/types";

export interface BudgetExportPayload {
  exported_at: string;
  locale?: "IN" | "US" | "UK";
  inputs: BudgetInput;
  summary: BudgetAnalysisResult["summary"];
  investment_projection: {
    projected_total_inr: number;
    total_contributions_inr: number;
    total_growth_inr: number;
  };
  allocations: BudgetAnalysisResult["allocations"];
}

export function budgetResultToJson(payload: BudgetExportPayload): string {
  return JSON.stringify(payload, null, 2);
}

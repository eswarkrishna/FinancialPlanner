import type { BudgetAnalysisResult, BudgetInput } from "../budget/types";
import { escapeCsvCell } from "./csvEscape";

export function budgetSummaryToCsv(
  input: BudgetInput,
  analysis: BudgetAnalysisResult,
): string {
  const { summary } = analysis;
  const lines = [
    "section,label,value_inr",
    `summary,Total income,${summary.total_income_inr}`,
    `summary,Total expenses,${summary.total_expenses_inr}`,
    `summary,Net cash flow,${summary.net_cash_flow_inr}`,
    `summary,Savings rate pct,${summary.savings_rate_pct}`,
    `summary,Emergency fund months,${summary.emergency_fund_months}`,
    `bucket,Needs,${summary.bucket_analysis.needs_inr}`,
    `bucket,Wants,${summary.bucket_analysis.wants_inr}`,
    `bucket,Savings bucket,${summary.bucket_analysis.savings_bucket_inr}`,
  ];

  for (const row of input.income_lines) {
    lines.push(`income,${escapeCsvCell(row.name)},${row.amount_inr}`);
  }
  for (const row of input.expense_lines) {
    lines.push(
      `expense,${escapeCsvCell(row.name)},${row.amount_inr},${row.bucket ?? ""}`,
    );
  }

  return `${lines.join("\n")}\n`;
}

export type BudgetBucket = "need" | "want" | "savings";

export type BudgetLineKind = "income" | "expense";

export type InvestmentAssetClass = "equity" | "debt" | "gold" | "cash" | "other";

export type BudgetWarningCode =
  | "BUDGET_DEFICIT"
  | "LOW_EMERGENCY_FUND"
  | "NEEDS_OVER_50"
  | "LOW_SAVINGS_RATE";

export interface BudgetLineItem {
  id: string;
  name: string;
  kind: BudgetLineKind;
  amount_inr: number;
  bucket?: BudgetBucket;
}

export interface InvestmentHolding {
  id: string;
  name: string;
  asset_class: InvestmentAssetClass;
  current_value_inr: number;
  monthly_contribution_inr: number;
  expected_return_pct: number;
}

export interface BudgetInput {
  month_label: string;
  income_lines: BudgetLineItem[];
  expense_lines: BudgetLineItem[];
  investments: InvestmentHolding[];
  emergency_fund_inr: number;
  projection_months: number;
}

export interface BucketAnalysis {
  needs_inr: number;
  wants_inr: number;
  savings_bucket_inr: number;
  needs_pct: number;
  wants_pct: number;
  savings_bucket_pct: number;
  target_needs_pct: number;
  target_wants_pct: number;
  target_savings_pct: number;
}

export interface BudgetSummary {
  total_income_inr: number;
  total_expenses_inr: number;
  net_cash_flow_inr: number;
  savings_rate_pct: number;
  emergency_fund_months: number;
  bucket_analysis: BucketAnalysis;
  investment_portfolio_inr: number;
  monthly_investment_contributions_inr: number;
  warnings: BudgetWarningCode[];
}

export interface InvestmentProjectionRow {
  month: number;
  total_value_inr: number;
}

export interface InvestmentProjection {
  rows: InvestmentProjectionRow[];
  projected_total_inr: number;
  total_contributions_inr: number;
  total_growth_inr: number;
}

export interface AssetClassAllocation {
  asset_class: InvestmentAssetClass;
  value_inr: number;
  share_pct: number;
}

export interface BudgetAnalysisResult {
  summary: BudgetSummary;
  investment_projection: InvestmentProjection;
  allocations: AssetClassAllocation[];
}

import { roundInr } from "../money";
import { nominalMonthlyRateFromAnnualPercent } from "../rates/nominalMonthly";
import { BUDGET_TARGETS } from "./constants";
import type {
  AssetClassAllocation,
  BudgetAnalysisResult,
  BudgetInput,
  BudgetLineItem,
  BudgetSummary,
  BudgetWarningCode,
  InvestmentHolding,
  InvestmentProjection,
} from "./types";

function sumLines(lines: BudgetLineItem[]): number {
  return roundInr(lines.reduce((total, line) => total + Math.max(0, line.amount_inr), 0));
}

function sumByBucket(
  lines: BudgetLineItem[],
  bucket: "need" | "want" | "savings",
): number {
  return roundInr(
    lines
      .filter((line) => line.kind === "expense" && line.bucket === bucket)
      .reduce((total, line) => total + Math.max(0, line.amount_inr), 0),
  );
}

function pctOfIncome(amount: number, income: number): number {
  if (income <= 0) return 0;
  return roundInr((amount / income) * 100 * 10) / 10;
}

function buildWarnings(
  summary: Pick<
    BudgetSummary,
    | "net_cash_flow_inr"
    | "savings_rate_pct"
    | "emergency_fund_months"
    | "total_income_inr"
    | "total_expenses_inr"
  > & {
    needs_pct: number;
  },
): BudgetWarningCode[] {
  const warnings: BudgetWarningCode[] = [];
  if (summary.net_cash_flow_inr < 0) {
    warnings.push("BUDGET_DEFICIT");
  }
  if (summary.total_expenses_inr > 0 && summary.emergency_fund_months < 3) {
    warnings.push("LOW_EMERGENCY_FUND");
  }
  if (summary.total_income_inr > 0 && summary.needs_pct > BUDGET_TARGETS.needs_pct) {
    warnings.push("NEEDS_OVER_50");
  }
  if (summary.total_income_inr > 0 && summary.savings_rate_pct < 10) {
    warnings.push("LOW_SAVINGS_RATE");
  }
  return warnings;
}

export function projectInvestments(
  holdings: InvestmentHolding[],
  projectionMonths: number,
): InvestmentProjection {
  const months = Math.max(0, Math.floor(projectionMonths));
  const normalized = holdings.map((holding) => ({
    value_inr: roundInr(Math.max(0, holding.current_value_inr)),
    monthly_contribution_inr: roundInr(Math.max(0, holding.monthly_contribution_inr)),
    monthly_rate: nominalMonthlyRateFromAnnualPercent(Math.max(0, holding.expected_return_pct)),
  }));

  const startValue = roundInr(normalized.reduce((total, h) => total + h.value_inr, 0));
  const rows = [{ month: 0, total_value_inr: startValue }];
  let running = normalized.map((h) => ({ ...h }));

  for (let month = 1; month <= months; month += 1) {
    running = running.map((holding) => {
      const contributed = holding.value_inr + holding.monthly_contribution_inr;
      return {
        ...holding,
        value_inr: roundInr(contributed * (1 + holding.monthly_rate)),
      };
    });
    rows.push({
      month,
      total_value_inr: roundInr(running.reduce((total, h) => total + h.value_inr, 0)),
    });
  }

  const projectedTotal = rows[rows.length - 1]?.total_value_inr ?? startValue;
  const totalContributions = roundInr(
    normalized.reduce((total, h) => total + h.monthly_contribution_inr * months, 0),
  );
  const totalGrowth = roundInr(projectedTotal - startValue - totalContributions);

  return {
    rows,
    projected_total_inr: projectedTotal,
    total_contributions_inr: totalContributions,
    total_growth_inr: totalGrowth,
  };
}

export function buildAssetAllocations(holdings: InvestmentHolding[]): AssetClassAllocation[] {
  const totals = new Map<string, number>();
  for (const holding of holdings) {
    const value = Math.max(0, holding.current_value_inr);
    totals.set(holding.asset_class, (totals.get(holding.asset_class) ?? 0) + value);
  }
  const portfolio = roundInr([...totals.values()].reduce((sum, value) => sum + value, 0));
  if (portfolio <= 0) return [];

  return [...totals.entries()]
    .map(([asset_class, value_inr]) => ({
      asset_class: asset_class as AssetClassAllocation["asset_class"],
      value_inr: roundInr(value_inr),
      share_pct: roundInr((value_inr / portfolio) * 100 * 10) / 10,
    }))
    .sort((a, b) => b.value_inr - a.value_inr);
}

export function analyzeBudget(input: BudgetInput): BudgetAnalysisResult {
  const totalIncome = sumLines(input.income_lines);
  const totalExpenses = sumLines(input.expense_lines);
  const netCashFlow = roundInr(totalIncome - totalExpenses);
  const savingsRate =
    totalIncome > 0 ? pctOfIncome(Math.max(0, netCashFlow), totalIncome) : 0;

  const needsInr = sumByBucket(input.expense_lines, "need");
  const wantsInr = sumByBucket(input.expense_lines, "want");
  const savingsBucketInr = sumByBucket(input.expense_lines, "savings");

  const needsPct = pctOfIncome(needsInr, totalIncome);
  const wantsPct = pctOfIncome(wantsInr, totalIncome);
  const savingsBucketPct = pctOfIncome(savingsBucketInr, totalIncome);

  const emergencyFundMonths =
    totalExpenses > 0
      ? roundInr((Math.max(0, input.emergency_fund_inr) / totalExpenses) * 10) / 10
      : 0;

  const investmentPortfolio = roundInr(
    input.investments.reduce((total, h) => total + Math.max(0, h.current_value_inr), 0),
  );
  const monthlyContributions = roundInr(
    input.investments.reduce((total, h) => total + Math.max(0, h.monthly_contribution_inr), 0),
  );

  const warnings = buildWarnings({
    net_cash_flow_inr: netCashFlow,
    savings_rate_pct: savingsRate,
    emergency_fund_months: emergencyFundMonths,
    total_income_inr: totalIncome,
    total_expenses_inr: totalExpenses,
    needs_pct: needsPct,
  });

  const summary: BudgetSummary = {
    total_income_inr: totalIncome,
    total_expenses_inr: totalExpenses,
    net_cash_flow_inr: netCashFlow,
    savings_rate_pct: savingsRate,
    emergency_fund_months: emergencyFundMonths,
    bucket_analysis: {
      needs_inr: needsInr,
      wants_inr: wantsInr,
      savings_bucket_inr: savingsBucketInr,
      needs_pct: needsPct,
      wants_pct: wantsPct,
      savings_bucket_pct: savingsBucketPct,
      target_needs_pct: BUDGET_TARGETS.needs_pct,
      target_wants_pct: BUDGET_TARGETS.wants_pct,
      target_savings_pct: BUDGET_TARGETS.savings_pct,
    },
    investment_portfolio_inr: investmentPortfolio,
    monthly_investment_contributions_inr: monthlyContributions,
    warnings,
  };

  const projectionMonths = Math.max(0, Math.floor(input.projection_months || 12));
  const investment_projection = projectInvestments(input.investments, projectionMonths);
  const allocations = buildAssetAllocations(input.investments);

  return {
    summary,
    investment_projection,
    allocations,
  };
}

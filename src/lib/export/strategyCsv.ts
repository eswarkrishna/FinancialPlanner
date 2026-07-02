import type { StrategyResult } from "../strategy/types";

function escapeCsvCell(value: string | number): string {
  const s = String(value);
  if (/[",\n\r]/.test(s)) {
    return `"${s.replace(/"/g, '""')}"`;
  }
  return s;
}

/** Serialize strategy comparison rows to CSV (SPEC §4.12). */
export function strategyComparisonToCsv(results: StrategyResult[]): string {
  const headers = [
    "strategy_id",
    "loan_close_month",
    "total_interest_inr",
    "interest_saved_vs_base_inr",
    "equity_corpus_at_horizon_inr",
    "net_worth_at_horizon_inr",
    "min_living_budget_inr",
    "one_time_prepay_inr",
    "equity_lump_inr",
    "monthly_extra_principal_inr",
    "monthly_sip_inr",
    "cash_buffer_remaining_inr",
    "equity_corpus_at_horizon_post_tax_inr",
    "pf_corpus_at_horizon_inr",
    "warnings",
  ];

  const lines = [headers.join(",")];
  results.forEach((row) => {
    const cells: (string | number)[] = [
      row.strategy_id,
      row.loan_close_month,
      row.total_interest_inr,
      row.interest_saved_vs_base_inr,
      row.equity_corpus_at_horizon_inr,
      row.net_worth_at_horizon_inr,
      row.min_living_budget_inr,
      row.one_time_prepay_inr,
      row.equity_lump_inr,
      row.monthly_extra_principal_inr,
      row.monthly_sip_inr,
      row.cash_buffer_remaining_inr,
      row.equity_corpus_at_horizon_post_tax_inr,
      row.pf_corpus_at_horizon_inr,
      row.warnings.join(";"),
    ];
    lines.push(cells.map(escapeCsvCell).join(","));
  });
  return lines.join("\n");
}

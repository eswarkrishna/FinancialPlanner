/** JSON export payload for debt payoff planner (SPEC §4.10). */
export interface DebtExportPayload {
  exported_at: string;
  start_date: string;
  monthly_budget_inr: number;
  debts: {
    id: string;
    name: string;
    balance_inr: number;
    apr_pct: number;
    minimum_payment_inr: number;
  }[];
  strategies: Record<
    string,
    {
      summary: {
        payoff_months: number;
        payoff_date_iso: string | null;
        total_interest_inr: number;
        total_paid_inr: number;
        is_paid_off: boolean;
      };
      warning?: string;
    }
  >;
  active_strategy: string;
}

export function debtResultToJson(payload: DebtExportPayload): string {
  return JSON.stringify(payload, null, 2);
}

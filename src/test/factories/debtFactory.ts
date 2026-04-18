import { type DebtInput } from "../../lib/debt";

export function makeReferenceDebts(
  overrides: Partial<DebtInput>[] = [],
): DebtInput[] {
  const base: DebtInput[] = [
    {
      id: "card",
      name: "Credit Card",
      balance_inr: 150_000,
      apr_pct: 36,
      minimum_payment_inr: 8_000,
    },
    {
      id: "pl",
      name: "Personal Loan",
      balance_inr: 450_000,
      apr_pct: 16,
      minimum_payment_inr: 12_000,
    },
    {
      id: "consumer",
      name: "Consumer Durable",
      balance_inr: 80_000,
      apr_pct: 14,
      minimum_payment_inr: 4_000,
    },
  ];

  return base.map((debt, index) => ({ ...debt, ...(overrides[index] ?? {}) }));
}

import { useMemo, useState } from "react";
import {
  simulateDebtPayoff,
  type DebtInput,
  type DebtStrategy,
} from "../../../lib/debtPlanner";

type DebtFormRow = {
  id: string;
  name: string;
  balance_inr: string;
  apr_pct: string;
  minimum_payment_inr: string;
};

function parseNumber(value: string): number {
  const n = Number(value);
  return Number.isFinite(n) ? n : 0;
}

export function useDebtPlanner() {
  const [startDateIso, setStartDateIso] = useState("2026-04-01");
  const [monthlyBudgetInr, setMonthlyBudgetInr] = useState("40000");
  const [selectedDebtStrategy, setSelectedDebtStrategy] = useState<DebtStrategy>(
    "avalanche",
  );
  const [debtRows, setDebtRows] = useState<DebtFormRow[]>([
    {
      id: "card",
      name: "Credit Card",
      balance_inr: "150000",
      apr_pct: "36",
      minimum_payment_inr: "8000",
    },
    {
      id: "pl",
      name: "Personal Loan",
      balance_inr: "450000",
      apr_pct: "16",
      minimum_payment_inr: "12000",
    },
    {
      id: "consumer",
      name: "Consumer Durable",
      balance_inr: "80000",
      apr_pct: "14",
      minimum_payment_inr: "4000",
    },
  ]);

  const debtInputs = useMemo((): DebtInput[] => {
    return debtRows.map((row) => ({
      id: row.id,
      name: row.name,
      balance_inr: Math.max(0, parseNumber(row.balance_inr)),
      apr_pct: Math.max(0, parseNumber(row.apr_pct)),
      minimum_payment_inr: Math.max(0, parseNumber(row.minimum_payment_inr)),
    }));
  }, [debtRows]);

  const debtModels = useMemo(() => {
    const budget = Math.max(0, parseNumber(monthlyBudgetInr));
    const avalanche = simulateDebtPayoff(
      debtInputs,
      budget,
      startDateIso,
      "avalanche",
    );
    const snowball = simulateDebtPayoff(debtInputs, budget, startDateIso, "snowball");
    return { avalanche, snowball };
  }, [debtInputs, monthlyBudgetInr, startDateIso]);

  const activeDebtModel =
    selectedDebtStrategy === "avalanche"
      ? debtModels.avalanche
      : debtModels.snowball;

  function setDebtField(
    debtId: string,
    key: keyof DebtFormRow,
    value: string,
  ): void {
    setDebtRows((prev) =>
      prev.map((row) => (row.id === debtId ? { ...row, [key]: value } : row)),
    );
  }

  function addDebt(): void {
    setDebtRows((prev) => [
      ...prev,
      {
        id: `debt-${Date.now()}`,
        name: `Debt ${prev.length + 1}`,
        balance_inr: "0",
        apr_pct: "12",
        minimum_payment_inr: "0",
      },
    ]);
  }

  function removeDebt(debtId: string): void {
    setDebtRows((prev) => prev.filter((row) => row.id !== debtId));
  }

  return {
    startDateIso,
    setStartDateIso,
    monthlyBudgetInr,
    setMonthlyBudgetInr,
    selectedDebtStrategy,
    setSelectedDebtStrategy,
    debtRows,
    setDebtField,
    addDebt,
    removeDebt,
    debtModels,
    activeDebtModel,
  };
}

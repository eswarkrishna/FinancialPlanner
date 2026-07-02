import { useEffect, useMemo, useRef, useState } from "react";
import {
  simulateDebtPayoff,
  type DebtInput,
  type DebtStrategy,
} from "../../../lib/debt/index";
import { useLocale } from "../../locale/LocaleContext";

type DebtFormRow = {
  id: string;
  name: string;
  balance_inr: string;
  apr_pct: string;
  minimum_payment_inr: string;
};

const INITIAL_DEBT_ROWS: DebtFormRow[] = [
  {
    id: "debt-1",
    name: "",
    balance_inr: "",
    apr_pct: "",
    minimum_payment_inr: "",
  },
];

function parseNumber(value: string): number {
  const n = Number(value);
  return Number.isFinite(n) ? n : 0;
}

export function useDebtPlanner() {
  const { localeEpoch } = useLocale();
  const [startDateIso, setStartDateIso] = useState("");
  const [monthlyBudgetInr, setMonthlyBudgetInr] = useState("");
  const [selectedDebtStrategy, setSelectedDebtStrategy] = useState<DebtStrategy>(
    "avalanche",
  );
  const [debtRows, setDebtRows] = useState<DebtFormRow[]>(INITIAL_DEBT_ROWS);

  const prevLocaleEpochRef = useRef(localeEpoch);
  useEffect(() => {
    if (prevLocaleEpochRef.current === localeEpoch) return;
    prevLocaleEpochRef.current = localeEpoch;
    setStartDateIso("");
    setMonthlyBudgetInr("");
    setSelectedDebtStrategy("avalanche");
    setDebtRows(INITIAL_DEBT_ROWS.map((row) => ({ ...row, id: `debt-${Date.now()}` })));
  }, [localeEpoch]);

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
        name: "",
        balance_inr: "",
        apr_pct: "",
        minimum_payment_inr: "",
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

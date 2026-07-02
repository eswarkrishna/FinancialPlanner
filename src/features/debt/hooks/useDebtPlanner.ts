import { useEffect, useMemo, useRef, useState } from "react";
import {
  simulateDebtPayoff,
  type DebtInput,
  type DebtStrategy,
} from "../../../lib/debt/index";
import {
  downloadTextFile,
  debtResultToJson,
  debtTimelineToCsv,
} from "../../../lib/export";
import {
  trackDebtAdd,
  trackDebtExportJson,
  trackDebtExportTimelineCsv,
  trackDebtRemove,
  trackDebtStrategyChange,
} from "../../../lib/analytics";
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
  const { locale, localeEpoch } = useLocale();
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

  const debtExportReady = activeDebtModel.rows.length > 0;

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
    trackDebtAdd(debtRows.length + 1);
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
    const nextCount = debtRows.filter((row) => row.id !== debtId).length;
    trackDebtRemove(nextCount);
    setDebtRows((prev) => prev.filter((row) => row.id !== debtId));
  }

  function selectDebtStrategy(strategy: DebtStrategy): void {
    setSelectedDebtStrategy(strategy);
    trackDebtStrategyChange(strategy);
  }

  function exportDebtTimelineCsv(): void {
    if (!debtExportReady) return;
    const csv = debtTimelineToCsv(activeDebtModel.rows, {
      startDateIso: startDateIso || undefined,
    });
    downloadTextFile(
      `debt-timeline-${selectedDebtStrategy}.csv`,
      csv,
      "text/csv;charset=utf-8",
    );
    trackDebtExportTimelineCsv(selectedDebtStrategy, locale);
  }

  function exportDebtJson(): void {
    if (!debtExportReady) return;
    const budget = Math.max(0, parseNumber(monthlyBudgetInr));
    const json = debtResultToJson({
      exported_at: new Date().toISOString(),
      start_date: startDateIso,
      monthly_budget_inr: budget,
      debts: debtInputs.map((d) => ({
        id: d.id,
        name: d.name,
        balance_inr: d.balance_inr,
        apr_pct: d.apr_pct,
        minimum_payment_inr: d.minimum_payment_inr,
      })),
      strategies: {
        avalanche: {
          summary: debtModels.avalanche.summary,
          warning: debtModels.avalanche.warning,
        },
        snowball: {
          summary: debtModels.snowball.summary,
          warning: debtModels.snowball.warning,
        },
      },
      active_strategy: selectedDebtStrategy,
    });
    downloadTextFile(
      `debt-planner-${selectedDebtStrategy}.json`,
      json,
      "application/json;charset=utf-8",
    );
    trackDebtExportJson(selectedDebtStrategy, locale);
  }

  return {
    startDateIso,
    setStartDateIso,
    monthlyBudgetInr,
    setMonthlyBudgetInr,
    selectedDebtStrategy,
    setSelectedDebtStrategy: selectDebtStrategy,
    debtRows,
    setDebtField,
    addDebt,
    removeDebt,
    debtModels,
    activeDebtModel,
    debtExportReady,
    exportDebtTimelineCsv,
    exportDebtJson,
  };
}

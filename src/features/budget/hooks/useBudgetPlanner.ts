import { useEffect, useMemo, useRef, useState } from "react";
import {
  analyzeBudget,
  type BudgetBucket,
  type BudgetInput,
  type InvestmentAssetClass,
} from "../../../lib/budget";
import {
  budgetResultToJson,
  budgetSummaryToCsv,
  downloadTextFile,
  ImportFileTooLargeError,
  parseBudgetImportJson,
  readImportTextFile,
} from "../../../lib/export";
import {
  readBudgetFormState,
  writeBudgetFormState,
  type BudgetFormPersistedState,
  type BudgetLinePersisted,
  type InvestmentLinePersisted,
} from "../../../lib/persistence/budgetFormState";
import {
  trackBudgetExportJson,
  trackBudgetExportSummaryCsv,
} from "../../../lib/analytics";
import { readStoredLocale, referenceBudgetForLocale, useLocale } from "../../locale/LocaleContext";

function parseNumber(value: string): number {
  const n = Number(value);
  return Number.isFinite(n) ? n : 0;
}

function budgetInputToForm(input: BudgetInput): Omit<BudgetFormPersistedState, "version" | "locale"> {
  return {
    month_label: input.month_label,
    income_lines: input.income_lines.map((line) => ({
      id: line.id,
      name: line.name,
      amount_inr: String(line.amount_inr),
    })),
    expense_lines: input.expense_lines.map((line) => ({
      id: line.id,
      name: line.name,
      amount_inr: String(line.amount_inr),
      bucket: line.bucket ?? "need",
    })),
    investments: input.investments.map((holding) => ({
      id: holding.id,
      name: holding.name,
      asset_class: holding.asset_class,
      current_value_inr: String(holding.current_value_inr),
      monthly_contribution_inr: String(holding.monthly_contribution_inr),
      expected_return_pct: String(holding.expected_return_pct),
    })),
    emergency_fund_inr: String(input.emergency_fund_inr),
    projection_months: String(input.projection_months),
  };
}

function referenceFormForLocale(
  locale: import("../../../lib/locale/types").Locale,
): BudgetFormPersistedState {
  return {
    version: 1,
    locale,
    ...budgetInputToForm(referenceBudgetForLocale(locale)),
  };
}

function formFromPersisted(locale: import("../../../lib/locale/types").Locale) {
  const stored = readBudgetFormState(locale);
  if (stored) return stored;
  return referenceFormForLocale(locale);
}

function nextId(prefix: string): string {
  return `${prefix}-${Date.now().toString(36)}`;
}

const WARNING_LABELS: Record<string, string> = {
  BUDGET_DEFICIT: "Expenses exceed income — adjust categories or increase income.",
  LOW_EMERGENCY_FUND: "Emergency fund covers fewer than 3 months of expenses.",
  NEEDS_OVER_50: "Needs exceed 50% of income (50/30/20 guideline).",
  LOW_SAVINGS_RATE: "Savings rate is below 10% of income.",
};

export function useBudgetPlanner() {
  const { locale, localeEpoch } = useLocale();
  const [form, setForm] = useState(() => formFromPersisted(readStoredLocale()));
  const [importError, setImportError] = useState<string | null>(null);

  const prevLocaleEpochRef = useRef(localeEpoch);
  useEffect(() => {
    if (prevLocaleEpochRef.current === localeEpoch) return;
    prevLocaleEpochRef.current = localeEpoch;
    setForm(referenceFormForLocale(locale));
    setImportError(null);
  }, [locale, localeEpoch]);

  useEffect(() => {
    writeBudgetFormState({ ...form, version: 1, locale });
  }, [form, locale]);

  const budgetInput = useMemo((): BudgetInput => {
    return {
      month_label: form.month_label,
      income_lines: form.income_lines.map((line) => ({
        id: line.id,
        name: line.name,
        kind: "income",
        amount_inr: Math.max(0, parseNumber(line.amount_inr)),
      })),
      expense_lines: form.expense_lines.map((line) => ({
        id: line.id,
        name: line.name,
        kind: "expense",
        amount_inr: Math.max(0, parseNumber(line.amount_inr)),
        bucket: line.bucket ?? "need",
      })),
      investments: form.investments.map((holding) => ({
        id: holding.id,
        name: holding.name,
        asset_class: holding.asset_class,
        current_value_inr: Math.max(0, parseNumber(holding.current_value_inr)),
        monthly_contribution_inr: Math.max(0, parseNumber(holding.monthly_contribution_inr)),
        expected_return_pct: Math.max(0, parseNumber(holding.expected_return_pct)),
      })),
      emergency_fund_inr: Math.max(0, parseNumber(form.emergency_fund_inr)),
      projection_months: Math.max(0, Math.floor(parseNumber(form.projection_months) || 12)),
    };
  }, [form]);

  const analysis = useMemo(() => analyzeBudget(budgetInput), [budgetInput]);

  function setMonthLabel(value: string) {
    setForm((prev) => ({ ...prev, month_label: value }));
  }

  function setEmergencyFund(value: string) {
    setForm((prev) => ({ ...prev, emergency_fund_inr: value }));
  }

  function setProjectionMonths(value: string) {
    setForm((prev) => ({ ...prev, projection_months: value }));
  }

  function setIncomeField(id: string, field: keyof BudgetLinePersisted, value: string) {
    setForm((prev) => ({
      ...prev,
      income_lines: prev.income_lines.map((line) =>
        line.id === id ? { ...line, [field]: value } : line,
      ),
    }));
  }

  function setExpenseField(
    id: string,
    field: keyof BudgetLinePersisted,
    value: string | BudgetBucket,
  ) {
    setForm((prev) => ({
      ...prev,
      expense_lines: prev.expense_lines.map((line) =>
        line.id === id ? { ...line, [field]: value } : line,
      ),
    }));
  }

  function setInvestmentField(
    id: string,
    field: keyof InvestmentLinePersisted,
    value: string,
  ) {
    setForm((prev) => ({
      ...prev,
      investments: prev.investments.map((holding) =>
        holding.id === id ? { ...holding, [field]: value } : holding,
      ),
    }));
  }

  function addIncomeLine() {
    setForm((prev) => ({
      ...prev,
      income_lines: [
        ...prev.income_lines,
        { id: nextId("inc"), name: "New income", amount_inr: "" },
      ],
    }));
  }

  function removeIncomeLine(id: string) {
    setForm((prev) => ({
      ...prev,
      income_lines:
        prev.income_lines.length > 1
          ? prev.income_lines.filter((line) => line.id !== id)
          : prev.income_lines,
    }));
  }

  function addExpenseLine() {
    setForm((prev) => ({
      ...prev,
      expense_lines: [
        ...prev.expense_lines,
        { id: nextId("exp"), name: "New expense", amount_inr: "", bucket: "need" },
      ],
    }));
  }

  function removeExpenseLine(id: string) {
    setForm((prev) => ({
      ...prev,
      expense_lines:
        prev.expense_lines.length > 1
          ? prev.expense_lines.filter((line) => line.id !== id)
          : prev.expense_lines,
    }));
  }

  function addInvestment() {
    setForm((prev) => ({
      ...prev,
      investments: [
        ...prev.investments,
        {
          id: nextId("inv"),
          name: "New holding",
          asset_class: "equity" as InvestmentAssetClass,
          current_value_inr: "",
          monthly_contribution_inr: "",
          expected_return_pct: "8",
        },
      ],
    }));
  }

  function removeInvestment(id: string) {
    setForm((prev) => ({
      ...prev,
      investments: prev.investments.filter((holding) => holding.id !== id),
    }));
  }

  function loadReferenceBudget() {
    setForm(referenceFormForLocale(locale));
    setImportError(null);
  }

  function exportBudgetSummaryCsv() {
    const csv = budgetSummaryToCsv(budgetInput, analysis);
    downloadTextFile("budget-summary.csv", csv, "text/csv");
    trackBudgetExportSummaryCsv(locale);
  }

  function exportBudgetJson() {
    const json = budgetResultToJson({
      exported_at: new Date().toISOString(),
      locale,
      inputs: budgetInput,
      summary: analysis.summary,
      investment_projection: {
        projected_total_inr: analysis.investment_projection.projected_total_inr,
        total_contributions_inr: analysis.investment_projection.total_contributions_inr,
        total_growth_inr: analysis.investment_projection.total_growth_inr,
      },
      allocations: analysis.allocations,
    });
    downloadTextFile("budget-planner.json", json, "application/json");
    trackBudgetExportJson(locale);
  }

  async function importBudgetJson(file: File) {
    setImportError(null);
    try {
      const text = await readImportTextFile(file);
      const outcome = parseBudgetImportJson(text, locale);
      if (!outcome.success) {
        setImportError(outcome.message);
        return;
      }
      setForm({ version: 1, locale, ...outcome.form });
    } catch (error: unknown) {
      setImportError(
        error instanceof ImportFileTooLargeError
          ? error.message
          : "Could not read the selected file.",
      );
    }
  }

  const warningMessages = analysis.summary.warnings.map(
    (code) => WARNING_LABELS[code] ?? code,
  );

  return {
    form,
    budgetInput,
    analysis,
    warningMessages,
    importError,
    setMonthLabel,
    setEmergencyFund,
    setProjectionMonths,
    setIncomeField,
    setExpenseField,
    setInvestmentField,
    addIncomeLine,
    removeIncomeLine,
    addExpenseLine,
    removeExpenseLine,
    addInvestment,
    removeInvestment,
    loadReferenceBudget,
    exportBudgetSummaryCsv,
    exportBudgetJson,
    importBudgetJson,
  };
}

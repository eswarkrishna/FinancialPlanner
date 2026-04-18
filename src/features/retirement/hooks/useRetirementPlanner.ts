import { type ChangeEvent, useMemo, useState } from "react";
import {
  buildRetirementScenarios,
  type RetirementInput,
} from "../../../lib/retirement";

type RetirementFormState = {
  current_corpus_inr: string;
  monthly_contribution_inr: string;
  annual_return_pct: string;
  inflation_pct: string;
  years_to_retirement: string;
  annual_expense_today_inr: string;
  safe_withdrawal_rate_pct: string;
};

function parseNumber(value: string): number {
  const n = Number(value);
  return Number.isFinite(n) ? n : 0;
}

function formatPercent(value: number): string {
  return `${(value * 100).toFixed(1)}%`;
}

export function useRetirementPlanner() {
  const [retirementInputs, setRetirementInputs] = useState<RetirementFormState>({
    current_corpus_inr: "1200000",
    monthly_contribution_inr: "30000",
    annual_return_pct: "10",
    inflation_pct: "6",
    years_to_retirement: "20",
    annual_expense_today_inr: "900000",
    safe_withdrawal_rate_pct: "4",
  });
  const [selectedRetirementScenario, setSelectedRetirementScenario] =
    useState("base");

  const retirementBaseInput = useMemo((): RetirementInput => {
    return {
      current_corpus_inr: Math.max(
        0,
        parseNumber(retirementInputs.current_corpus_inr),
      ),
      monthly_contribution_inr: Math.max(
        0,
        parseNumber(retirementInputs.monthly_contribution_inr),
      ),
      annual_return_pct: Math.max(
        0,
        parseNumber(retirementInputs.annual_return_pct),
      ),
      inflation_pct: Math.max(0, parseNumber(retirementInputs.inflation_pct)),
      years_to_retirement: Math.max(
        1,
        Math.floor(parseNumber(retirementInputs.years_to_retirement)),
      ),
      annual_expense_today_inr: Math.max(
        0,
        parseNumber(retirementInputs.annual_expense_today_inr),
      ),
      safe_withdrawal_rate_pct: Math.max(
        0.1,
        parseNumber(retirementInputs.safe_withdrawal_rate_pct),
      ),
    };
  }, [retirementInputs]);

  const retirementScenarios = useMemo(() => {
    return buildRetirementScenarios(retirementBaseInput);
  }, [retirementBaseInput]);

  const activeRetirementScenario =
    retirementScenarios.find(
      (scenario) => scenario.id === selectedRetirementScenario,
    ) ?? retirementScenarios[0];

  function setRetirementField(
    key: keyof RetirementFormState,
    event: ChangeEvent<HTMLInputElement>,
  ): void {
    const value = event.target.value;
    setRetirementInputs((prev) => ({ ...prev, [key]: value }));
  }

  return {
    retirementInputs,
    selectedRetirementScenario,
    setSelectedRetirementScenario,
    retirementScenarios,
    activeRetirementScenario,
    setRetirementField,
    formatPercent,
  };
}

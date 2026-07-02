import { type ChangeEvent, useEffect, useMemo, useRef, useState } from "react";
import {
  buildRetirementScenarios,
  DEFAULT_SAFE_WITHDRAWAL_RATE_PCT,
  REFERENCE_RETIREMENT_FORM_IN,
  REFERENCE_RETIREMENT_FORM_US,
  type RetirementInput,
} from "../../../lib/retirement/index";
import {
  referenceRetirementFormForLocale,
  useLocale,
} from "../../locale/LocaleContext";

type RetirementFormState = {
  current_corpus_inr: string;
  monthly_contribution_inr: string;
  annual_return_pct: string;
  inflation_pct: string;
  years_to_retirement: string;
  annual_expense_today_inr: string;
  safe_withdrawal_rate_pct: string;
  expected_social_security_monthly_inr: string;
};

function parseNumber(value: string): number {
  const n = Number(value);
  return Number.isFinite(n) ? n : 0;
}

function formatPercent(value: number): string {
  return `${(value * 100).toFixed(1)}%`;
}

export function useRetirementPlanner() {
  const { locale, localeEpoch } = useLocale();
  const [retirementInputs, setRetirementInputs] = useState<RetirementFormState>(
    REFERENCE_RETIREMENT_FORM_IN,
  );
  const [selectedRetirementScenario, setSelectedRetirementScenario] =
    useState("base");

  const prevLocaleEpochRef = useRef(localeEpoch);
  useEffect(() => {
    if (prevLocaleEpochRef.current === localeEpoch) return;
    prevLocaleEpochRef.current = localeEpoch;
    setRetirementInputs(referenceRetirementFormForLocale(locale));
    setSelectedRetirementScenario("base");
  }, [locale, localeEpoch]);

  const yearsInvalid = useMemo(() => {
    const raw = retirementInputs.years_to_retirement.trim();
    if (raw === "") return true;
    const years = Math.floor(parseNumber(raw));
    return years < 1;
  }, [retirementInputs.years_to_retirement]);

  const retirementBaseInput = useMemo((): RetirementInput | null => {
    if (yearsInvalid) return null;
    const swrRaw = retirementInputs.safe_withdrawal_rate_pct.trim();
    const swr =
      swrRaw === ""
        ? DEFAULT_SAFE_WITHDRAWAL_RATE_PCT
        : Math.max(0.1, parseNumber(swrRaw));
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
      safe_withdrawal_rate_pct: swr,
      expected_social_security_monthly_inr: Math.max(
        0,
        parseNumber(retirementInputs.expected_social_security_monthly_inr),
      ),
    };
  }, [retirementInputs, yearsInvalid]);

  const retirementScenarios = useMemo(() => {
    if (!retirementBaseInput) return [];
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
    retirementBaseInput,
    setRetirementField,
    formatPercent,
    yearsInvalid,
  };
}

export {
  REFERENCE_RETIREMENT_FORM_IN,
  REFERENCE_RETIREMENT_FORM_US,
};

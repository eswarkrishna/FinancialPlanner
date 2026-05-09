import { useMemo, useState } from "react";
import { simulateAllStrategies } from "../../../lib/strategy/simulate";
import {
  STRATEGY_TIER_PRESETS,
  type StrategyInputs,
  type StrategyTierPreset,
} from "../../../lib/strategy/types";

type StrategyFormState = {
  principal_inr: string;
  annual_interest_rate: string;
  tenure_months: string;
  cash_inr: string;
  pf_corpus_inr: string;
  pf_annual_interest_rate_pct: string;
  monthly_pf_addition_inr: string;
  monthly_take_home_inr: string;
  monthly_living_expense_inr: string;
  extra_monthly_income_inr: string;
  emergency_months_buffer: string;
  expected_equity_return_pct: string;
  horizon_months: string;
  repayment_pct_of_take_home: string;
  extra_income_post_tax: boolean;
  marginal_tax_rate_pct: string;
  tax_regime: "old" | "new";
};

const DEFAULT_FORM: StrategyFormState = {
  principal_inr: "3600000",
  annual_interest_rate: "7.9",
  tenure_months: "98",
  cash_inr: "2000000",
  pf_corpus_inr: "2620000",
  pf_annual_interest_rate_pct: "8.25",
  monthly_pf_addition_inr: "0",
  monthly_take_home_inr: "300000",
  monthly_living_expense_inr: "80000",
  extra_monthly_income_inr: "17000",
  emergency_months_buffer: "6",
  expected_equity_return_pct: "11",
  horizon_months: "98",
  repayment_pct_of_take_home: "90",
  extra_income_post_tax: true,
  marginal_tax_rate_pct: "0",
  tax_regime: "new",
};

function parseNumber(value: string): number {
  const n = Number(value);
  return Number.isFinite(n) ? n : 0;
}

function buildInputs(form: StrategyFormState): StrategyInputs {
  return {
    principal_inr: Math.max(0, parseNumber(form.principal_inr)),
    annual_interest_rate: Math.max(0, parseNumber(form.annual_interest_rate)),
    tenure_months: Math.max(1, Math.floor(parseNumber(form.tenure_months))),
    cash_inr: Math.max(0, parseNumber(form.cash_inr)),
    pf_corpus_inr: Math.max(0, parseNumber(form.pf_corpus_inr)),
    pf_annual_interest_rate_pct: Math.max(
      0,
      parseNumber(form.pf_annual_interest_rate_pct),
    ),
    monthly_pf_addition_inr: Math.max(0, parseNumber(form.monthly_pf_addition_inr)),
    monthly_take_home_inr: Math.max(0, parseNumber(form.monthly_take_home_inr)),
    monthly_living_expense_inr: Math.max(
      0,
      parseNumber(form.monthly_living_expense_inr),
    ),
    extra_monthly_income_inr: Math.max(
      0,
      parseNumber(form.extra_monthly_income_inr),
    ),
    extra_income_post_tax: form.extra_income_post_tax,
    marginal_tax_rate_pct: Math.max(0, parseNumber(form.marginal_tax_rate_pct)),
    emergency_months_buffer: Math.max(
      0,
      Math.floor(parseNumber(form.emergency_months_buffer)),
    ),
    expected_equity_return_pct: Math.max(
      0,
      parseNumber(form.expected_equity_return_pct),
    ),
    horizon_months: Math.max(1, Math.floor(parseNumber(form.horizon_months))),
    repayment_pct_of_take_home: Math.max(
      0,
      parseNumber(form.repayment_pct_of_take_home),
    ),
  };
}

export function useStrategyPlanner() {
  const [form, setForm] = useState<StrategyFormState>(DEFAULT_FORM);

  const inputs = useMemo(() => buildInputs(form), [form]);
  const results = useMemo(() => simulateAllStrategies(inputs), [inputs]);

  function setField<K extends keyof StrategyFormState>(
    key: K,
    value: StrategyFormState[K],
  ): void {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  function applyTierPreset(preset: StrategyTierPreset): void {
    setForm((prev) => ({
      ...prev,
      monthly_take_home_inr: String(preset.monthly_take_home_inr),
    }));
  }

  return {
    form,
    setField,
    inputs,
    results,
    tierPresets: STRATEGY_TIER_PRESETS,
    applyTierPreset,
  };
}

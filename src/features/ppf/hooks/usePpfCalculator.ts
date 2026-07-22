import { type ChangeEvent, useEffect, useMemo, useRef, useState } from "react";
import {
  PPF_MAX_ANNUAL_CONTRIBUTION_INR,
  PPF_MIN_ANNUAL_CONTRIBUTION_INR,
  PPF_MIN_ACCOUNT_YEARS,
  projectPpfMaturity,
  REFERENCE_PPF_FORM,
  type PpfInput,
  type PpfWarningCode,
} from "../../../lib/ppf";
import { downloadTextFile, ppfResultToJson, ppfTimelineToCsv } from "../../../lib/export";
import { readPpfFormState, writePpfFormState } from "../../../lib/persistence/ppfFormState";
import { readStoredLocale, useLocale } from "../../locale/LocaleContext";

type PpfFormState = {
  opening_balance_inr: string;
  annual_contribution_inr: string;
  interest_rate_pct: string;
  years: string;
};

const WARNING_MESSAGES: Record<PpfWarningCode, string> = {
  PPF_BELOW_MIN: `Annual contribution is below the usual ₹${PPF_MIN_ANNUAL_CONTRIBUTION_INR} minimum.`,
  PPF_ABOVE_MAX: `Annual contribution exceeds the usual ₹${PPF_MAX_ANNUAL_CONTRIBUTION_INR.toLocaleString("en-IN")} limit.`,
  PPF_INVALID_YEARS: "Enter at least 1 year to run the projection.",
};

function parseNumber(value: string): number {
  const n = Number(value);
  return Number.isFinite(n) ? n : 0;
}

function formFromPersisted(): PpfFormState {
  const stored = readPpfFormState(readStoredLocale());
  if (stored) {
    return {
      opening_balance_inr: stored.opening_balance_inr,
      annual_contribution_inr: stored.annual_contribution_inr,
      interest_rate_pct: stored.interest_rate_pct,
      years: stored.years,
    };
  }
  return REFERENCE_PPF_FORM;
}

export function usePpfCalculator() {
  const { locale, localeEpoch } = useLocale();
  const [form, setForm] = useState<PpfFormState>(() => formFromPersisted());

  const prevLocaleEpochRef = useRef(localeEpoch);
  useEffect(() => {
    if (prevLocaleEpochRef.current === localeEpoch) return;
    prevLocaleEpochRef.current = localeEpoch;
    setForm(formFromPersisted());
  }, [locale, localeEpoch]);

  useEffect(() => {
    writePpfFormState({
      version: 1,
      locale,
      ...form,
    });
  }, [locale, form]);

  const input: PpfInput = useMemo(
    () => ({
      opening_balance_inr: parseNumber(form.opening_balance_inr),
      annual_contribution_inr: parseNumber(form.annual_contribution_inr),
      interest_rate_pct: parseNumber(form.interest_rate_pct),
      years: parseNumber(form.years),
    }),
    [form],
  );

  const projection = useMemo(() => projectPpfMaturity(input), [input]);
  const yearsInvalid = Math.floor(input.years) < 1;

  const warningMessages = projection.warnings.map((code) => WARNING_MESSAGES[code]);

  function setField(field: keyof PpfFormState, event: ChangeEvent<HTMLInputElement>) {
    setForm((prev) => ({ ...prev, [field]: event.target.value }));
  }

  function exportPpfTimelineCsv() {
    const csv = ppfTimelineToCsv(projection.yearly);
    downloadTextFile("ppf-timeline.csv", csv, "text/csv");
  }

  function exportPpfJson() {
    const json = ppfResultToJson({
      exported_at: new Date().toISOString(),
      locale,
      inputs: input,
      projection,
    });
    downloadTextFile("ppf-calculator.json", json, "application/json");
  }

  return {
    form,
    input,
    projection,
    yearsInvalid,
    warningMessages,
    setField,
    exportPpfTimelineCsv,
    exportPpfJson,
    minAccountYears: PPF_MIN_ACCOUNT_YEARS,
  };
}

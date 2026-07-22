import { type ChangeEvent, useEffect, useMemo, useRef, useState } from "react";
import {
  projectSsyMaturity,
  REFERENCE_SSY_FORM,
  SSY_MAX_ANNUAL_CONTRIBUTION_INR,
  SSY_MAX_DEPOSIT_YEARS,
  SSY_MAX_GIRL_AGE_AT_OPENING,
  SSY_MATURITY_AGE_YEARS,
  SSY_MIN_ANNUAL_CONTRIBUTION_INR,
  type SsyInput,
  type SsyWarningCode,
} from "../../../lib/ssy";
import { downloadTextFile, ssyResultToJson, ssyTimelineToCsv } from "../../../lib/export";
import { readSsyFormState, writeSsyFormState } from "../../../lib/persistence/ssyFormState";
import { readStoredLocale, useLocale } from "../../locale/LocaleContext";

type SsyFormState = {
  annual_contribution_inr: string;
  girl_age_years: string;
  interest_rate_pct: string;
};

const WARNING_MESSAGES: Record<SsyWarningCode, string> = {
  SSY_BELOW_MIN: `Annual contribution is below the usual ₹${SSY_MIN_ANNUAL_CONTRIBUTION_INR} minimum.`,
  SSY_ABOVE_MAX: `Annual contribution exceeds the usual ₹${SSY_MAX_ANNUAL_CONTRIBUTION_INR.toLocaleString("en-IN")} limit.`,
  SSY_AGE_ABOVE_MAX: `SSY accounts can only be opened when the girl child is age ${SSY_MAX_GIRL_AGE_AT_OPENING} or younger.`,
  SSY_INVALID_AGE: `Enter a valid girl's age below ${SSY_MATURITY_AGE_YEARS} so maturity can be projected.`,
};

function parseNumber(value: string): number {
  const n = Number(value);
  return Number.isFinite(n) ? n : 0;
}

function formFromPersisted(): SsyFormState {
  const stored = readSsyFormState(readStoredLocale());
  if (stored) {
    return {
      annual_contribution_inr: stored.annual_contribution_inr,
      girl_age_years: stored.girl_age_years,
      interest_rate_pct: stored.interest_rate_pct,
    };
  }
  return REFERENCE_SSY_FORM;
}

export function useSsyCalculator() {
  const { locale, localeEpoch } = useLocale();
  const [form, setForm] = useState<SsyFormState>(() => formFromPersisted());

  const prevLocaleEpochRef = useRef(localeEpoch);
  useEffect(() => {
    if (prevLocaleEpochRef.current === localeEpoch) return;
    prevLocaleEpochRef.current = localeEpoch;
    setForm(formFromPersisted());
  }, [locale, localeEpoch]);

  useEffect(() => {
    writeSsyFormState({
      version: 1,
      locale,
      ...form,
    });
  }, [locale, form]);

  const input: SsyInput = useMemo(
    () => ({
      annual_contribution_inr: parseNumber(form.annual_contribution_inr),
      girl_age_years: parseNumber(form.girl_age_years),
      interest_rate_pct: parseNumber(form.interest_rate_pct),
    }),
    [form],
  );

  const projection = useMemo(() => projectSsyMaturity(input), [input]);
  const ageInvalid = projection.warnings.includes("SSY_INVALID_AGE");

  const warningMessages = projection.warnings.map((code) => WARNING_MESSAGES[code]);

  function setField(field: keyof SsyFormState, event: ChangeEvent<HTMLInputElement>) {
    setForm((prev) => ({ ...prev, [field]: event.target.value }));
  }

  function exportSsyTimelineCsv() {
    const csv = ssyTimelineToCsv(projection.yearly);
    downloadTextFile("ssy-timeline.csv", csv, "text/csv");
  }

  function exportSsyJson() {
    const json = ssyResultToJson({
      exported_at: new Date().toISOString(),
      locale,
      inputs: input,
      projection,
    });
    downloadTextFile("ssy-calculator.json", json, "application/json");
  }

  return {
    form,
    input,
    projection,
    ageInvalid,
    warningMessages,
    setField,
    exportSsyTimelineCsv,
    exportSsyJson,
    maturityAgeYears: SSY_MATURITY_AGE_YEARS,
    maxDepositYears: SSY_MAX_DEPOSIT_YEARS,
  };
}

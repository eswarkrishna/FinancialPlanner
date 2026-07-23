import { type ChangeEvent, useEffect, useMemo, useRef, useState } from "react";
import {
  projectLumpsumGrowth,
  REFERENCE_LUMPSUM_FORM,
  type LumpsumInput,
  type LumpsumWarningCode,
} from "../../../lib/lumpsum";
import { downloadTextFile, lumpsumResultToJson, lumpsumTimelineToCsv } from "../../../lib/export";
import {
  readLumpsumFormState,
  writeLumpsumFormState,
} from "../../../lib/persistence/lumpsumFormState";
import { readStoredLocale, useLocale } from "../../locale/LocaleContext";

type LumpsumFormState = {
  principal_inr: string;
  expected_annual_return_pct: string;
  years: string;
};

const WARNING_MESSAGES: Record<LumpsumWarningCode, string> = {
  LUMPSUM_INVALID_YEARS: "Enter at least 1 year to run the projection.",
  LUMPSUM_NO_PRINCIPAL: "Enter a principal amount greater than zero.",
};

function parseNumber(value: string): number {
  const n = Number(value);
  return Number.isFinite(n) ? n : 0;
}

function formFromPersisted(): LumpsumFormState {
  const stored = readLumpsumFormState(readStoredLocale());
  if (stored) {
    return {
      principal_inr: stored.principal_inr,
      expected_annual_return_pct: stored.expected_annual_return_pct,
      years: stored.years,
    };
  }
  return REFERENCE_LUMPSUM_FORM;
}

export function useLumpsumCalculator() {
  const { locale, localeEpoch } = useLocale();
  const [form, setForm] = useState<LumpsumFormState>(() => formFromPersisted());

  const prevLocaleEpochRef = useRef(localeEpoch);
  useEffect(() => {
    if (prevLocaleEpochRef.current === localeEpoch) return;
    prevLocaleEpochRef.current = localeEpoch;
    setForm(formFromPersisted());
  }, [locale, localeEpoch]);

  useEffect(() => {
    writeLumpsumFormState({
      version: 1,
      locale,
      ...form,
    });
  }, [locale, form]);

  const input: LumpsumInput = useMemo(
    () => ({
      principal_inr: parseNumber(form.principal_inr),
      expected_annual_return_pct: parseNumber(form.expected_annual_return_pct),
      years: parseNumber(form.years),
    }),
    [form],
  );

  const projection = useMemo(() => projectLumpsumGrowth(input), [input]);
  const yearsInvalid = Math.floor(input.years) < 1;
  const principalInvalid = input.principal_inr <= 0;

  const warningMessages = projection.warnings.map((code) => WARNING_MESSAGES[code]);

  function setField(field: keyof LumpsumFormState, event: ChangeEvent<HTMLInputElement>) {
    setForm((prev) => ({ ...prev, [field]: event.target.value }));
  }

  function setCurrencyField(field: keyof LumpsumFormState, value: string) {
    setForm((prev) => ({ ...prev, [field]: value }));
  }

  function exportLumpsumTimelineCsv() {
    const csv = lumpsumTimelineToCsv(projection.yearly);
    downloadTextFile("lumpsum-timeline.csv", csv, "text/csv");
  }

  function exportLumpsumJson() {
    const json = lumpsumResultToJson({
      exported_at: new Date().toISOString(),
      locale,
      inputs: input,
      projection,
    });
    downloadTextFile("lumpsum-calculator.json", json, "application/json");
  }

  return {
    form,
    input,
    projection,
    yearsInvalid,
    principalInvalid,
    inputsInvalid: yearsInvalid || principalInvalid,
    warningMessages,
    setField,
    setCurrencyField,
    exportLumpsumTimelineCsv,
    exportLumpsumJson,
  };
}

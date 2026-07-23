import { type ChangeEvent, useEffect, useMemo, useRef, useState } from "react";
import {
  GRATUITY_MIN_SERVICE_YEARS,
  projectGratuityPayout,
  REFERENCE_GRATUITY_FORM,
  type GratuityInput,
  type GratuityWarningCode,
} from "../../../lib/gratuity";
import { downloadTextFile, gratuityResultToJson } from "../../../lib/export";
import {
  readGratuityFormState,
  writeGratuityFormState,
} from "../../../lib/persistence/gratuityFormState";
import { readStoredLocale, useLocale } from "../../locale/LocaleContext";

type GratuityFormState = {
  last_drawn_salary_inr: string;
  years_of_service: string;
};

const WARNING_MESSAGES: Record<GratuityWarningCode, string> = {
  GRATUITY_BELOW_MIN_YEARS: `Gratuity is usually payable only after ${GRATUITY_MIN_SERVICE_YEARS} years of continuous service.`,
  GRATUITY_CAPPED: "Calculated amount exceeds the statutory cap — payable amount is capped.",
};

function parseNumber(value: string): number {
  const n = Number(value);
  return Number.isFinite(n) ? n : 0;
}

function formFromPersisted(): GratuityFormState {
  const stored = readGratuityFormState(readStoredLocale());
  if (stored) {
    return {
      last_drawn_salary_inr: stored.last_drawn_salary_inr,
      years_of_service: stored.years_of_service,
    };
  }
  return REFERENCE_GRATUITY_FORM;
}

export function useGratuityCalculator() {
  const { locale, localeEpoch } = useLocale();
  const [form, setForm] = useState<GratuityFormState>(() => formFromPersisted());

  const prevLocaleEpochRef = useRef(localeEpoch);
  useEffect(() => {
    if (prevLocaleEpochRef.current === localeEpoch) return;
    prevLocaleEpochRef.current = localeEpoch;
    setForm(formFromPersisted());
  }, [locale, localeEpoch]);

  useEffect(() => {
    writeGratuityFormState({
      version: 1,
      locale,
      ...form,
    });
  }, [locale, form]);

  const input: GratuityInput = useMemo(
    () => ({
      last_drawn_salary_inr: parseNumber(form.last_drawn_salary_inr),
      years_of_service: parseNumber(form.years_of_service),
    }),
    [form],
  );

  const projection = useMemo(() => projectGratuityPayout(input), [input]);
  const warningMessages = projection.warnings.map((code) => WARNING_MESSAGES[code]);

  function setField(field: keyof GratuityFormState, event: ChangeEvent<HTMLInputElement>) {
    setForm((prev) => ({ ...prev, [field]: event.target.value }));
  }

  function exportGratuityJson() {
    const json = gratuityResultToJson({
      exported_at: new Date().toISOString(),
      locale,
      inputs: input,
      projection,
    });
    downloadTextFile("gratuity-calculator.json", json, "application/json");
  }

  return {
    form,
    input,
    projection,
    warningMessages,
    setField,
    exportGratuityJson,
    minServiceYears: GRATUITY_MIN_SERVICE_YEARS,
  };
}

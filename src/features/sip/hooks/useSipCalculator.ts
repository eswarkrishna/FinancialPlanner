import { type ChangeEvent, useEffect, useMemo, useRef, useState } from "react";
import {
  projectSipMaturity,
  REFERENCE_SIP_FORM,
  type SipInput,
  type SipWarningCode,
} from "../../../lib/sip";
import { downloadTextFile, sipResultToJson, sipTimelineToCsv } from "../../../lib/export";
import { readSipFormState, writeSipFormState } from "../../../lib/persistence/sipFormState";
import { readStoredLocale, useLocale } from "../../locale/LocaleContext";

type SipFormState = {
  opening_balance_inr: string;
  monthly_investment_inr: string;
  expected_annual_return_pct: string;
  years: string;
};

const WARNING_MESSAGES: Record<SipWarningCode, string> = {
  SIP_INVALID_YEARS: "Enter at least 1 year to run the projection.",
  SIP_NO_CONTRIBUTION: "Enter a monthly SIP amount or an opening balance to project growth.",
};

function parseNumber(value: string): number {
  const n = Number(value);
  return Number.isFinite(n) ? n : 0;
}

function formFromPersisted(): SipFormState {
  const stored = readSipFormState(readStoredLocale());
  if (stored) {
    return {
      opening_balance_inr: stored.opening_balance_inr,
      monthly_investment_inr: stored.monthly_investment_inr,
      expected_annual_return_pct: stored.expected_annual_return_pct,
      years: stored.years,
    };
  }
  return REFERENCE_SIP_FORM;
}

export function useSipCalculator() {
  const { locale, localeEpoch } = useLocale();
  const [form, setForm] = useState<SipFormState>(() => formFromPersisted());

  const prevLocaleEpochRef = useRef(localeEpoch);
  useEffect(() => {
    if (prevLocaleEpochRef.current === localeEpoch) return;
    prevLocaleEpochRef.current = localeEpoch;
    setForm(formFromPersisted());
  }, [locale, localeEpoch]);

  useEffect(() => {
    writeSipFormState({
      version: 1,
      locale,
      ...form,
    });
  }, [locale, form]);

  const input: SipInput = useMemo(
    () => ({
      opening_balance_inr: parseNumber(form.opening_balance_inr),
      monthly_investment_inr: parseNumber(form.monthly_investment_inr),
      expected_annual_return_pct: parseNumber(form.expected_annual_return_pct),
      years: parseNumber(form.years),
    }),
    [form],
  );

  const projection = useMemo(() => projectSipMaturity(input), [input]);
  const yearsInvalid = Math.floor(input.years) < 1;

  const warningMessages = projection.warnings.map((code) => WARNING_MESSAGES[code]);

  function setField(field: keyof SipFormState, event: ChangeEvent<HTMLInputElement>) {
    setForm((prev) => ({ ...prev, [field]: event.target.value }));
  }

  function exportSipTimelineCsv() {
    const csv = sipTimelineToCsv(projection.yearly);
    downloadTextFile("sip-timeline.csv", csv, "text/csv");
  }

  function exportSipJson() {
    const json = sipResultToJson({
      exported_at: new Date().toISOString(),
      locale,
      inputs: input,
      projection,
    });
    downloadTextFile("sip-calculator.json", json, "application/json");
  }

  return {
    form,
    projection,
    yearsInvalid,
    warningMessages,
    setField,
    exportSipTimelineCsv,
    exportSipJson,
  };
}

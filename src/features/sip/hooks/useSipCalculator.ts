import { useCallback, useMemo, useState } from "react";
import type { SipMonthRow } from "../../../lib/sip/project";
import { projectSip } from "../../../lib/sip/project";

export const DEFAULT_SIP_FORM = {
  monthly_investment_inr: "10000",
  annual_return_pct: "12",
  duration_years: "10",
};

export function useSipCalculator() {
  const [form, setForm] = useState(DEFAULT_SIP_FORM);

  const projection = useMemo(() => {
    const monthly = Number(form.monthly_investment_inr) || 0;
    const years = Number(form.duration_years) || 0;
    const rate = Number(form.annual_return_pct) || 0;
    if (monthly <= 0 || years <= 0) return null;
    return projectSip({
      monthly_investment_inr: monthly,
      annual_return_pct: rate,
      duration_months: Math.floor(years * 12),
    });
  }, [form]);

  const setField = useCallback((key: keyof typeof DEFAULT_SIP_FORM, value: string) => {
    setForm((prev) => ({ ...prev, [key]: value }));
  }, []);

  const chartPoints = useMemo(() => {
    if (!projection) return [];
    return projection.monthly
      .filter((_: SipMonthRow, i: number) => i % Math.max(1, Math.floor(projection.monthly.length / 24)) === 0 || i === projection.monthly.length - 1)
      .map((row: SipMonthRow) => ({ month: row.month, value_inr: row.corpus_inr }));
  }, [projection]);

  return { form, setField, projection, chartPoints };
}

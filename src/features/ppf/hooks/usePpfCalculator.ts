import { useCallback, useMemo, useState } from "react";
import { projectPpf, type PpfYearRow } from "../../../lib/ppf/project";
import { DEFAULT_PPF_ANNUAL_RATE_PCT } from "../../../lib/ppf/constants";

export const DEFAULT_PPF_FORM = {
  opening_balance_inr: "0",
  annual_contribution_inr: "150000",
  annual_interest_rate_pct: String(DEFAULT_PPF_ANNUAL_RATE_PCT),
  duration_years: "15",
};

export function usePpfCalculator() {
  const [form, setForm] = useState(DEFAULT_PPF_FORM);

  const projection = useMemo(() => {
    const years = Number(form.duration_years) || 0;
    if (years <= 0) return null;
    return projectPpf({
      opening_balance_inr: Number(form.opening_balance_inr) || 0,
      annual_contribution_inr: Number(form.annual_contribution_inr) || 0,
      annual_interest_rate_pct: Number(form.annual_interest_rate_pct) || 0,
      duration_years: years,
    });
  }, [form]);

  const setField = useCallback((key: keyof typeof DEFAULT_PPF_FORM, value: string) => {
    setForm((prev) => ({ ...prev, [key]: value }));
  }, []);

  const chartPoints = useMemo(() => {
    if (!projection) return [];
    return projection.yearly.map((row: PpfYearRow) => ({
      month: row.year,
      value_inr: row.closing_balance_inr,
    }));
  }, [projection]);

  return { form, setField, projection, chartPoints };
}

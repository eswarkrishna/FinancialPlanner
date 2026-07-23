import { formatMoneyFinite, formatMoneyKpi } from "../../lib/locale/formatMoney";
import { AlertCallout } from "../../components/AlertCallout";
import { KpiStrip } from "../../components/KpiStrip";
import { useLocale } from "../locale/LocaleContext";
import { useGratuityCalculator } from "./hooks/useGratuityCalculator";

export function GratuitySection() {
  const { locale } = useLocale();
  const money = (value: number) => formatMoneyFinite(value, locale);
  const moneyKpi = (value: number) => formatMoneyKpi(value, locale);
  const isIndia = locale === "IN";
  const { form, projection, warningMessages, setField, exportGratuityJson, minServiceYears } =
    useGratuityCalculator();

  const kpiItems = [
    {
      id: "payable",
      label: "Gratuity payable",
      value: moneyKpi(projection.gratuity_payable_inr),
      tone: "positive" as const,
    },
    {
      id: "raw",
      label: "Formula amount",
      value: moneyKpi(projection.raw_gratuity_inr),
    },
    {
      id: "years",
      label: "Years of service",
      value: form.years_of_service || "0",
    },
  ];

  return (
    <>
      <KpiStrip items={kpiItems} ariaLabel="Gratuity key metrics" />

      {warningMessages.length > 0 && (
        <AlertCallout title="Gratuity warnings" messages={warningMessages} tone="warning" />
      )}

      {!isIndia && (
        <AlertCallout
          title="India-specific benefit"
          messages={[
            "Gratuity under the Payment of Gratuity Act applies to eligible employees in India. Amounts are shown in INR for illustration.",
          ]}
          tone="warning"
        />
      )}

      <section className="card">
        <div className="schedule-head">
          <h2>Gratuity calculator</h2>
          <div className="actions inline-actions">
            <button type="button" className="btn secondary btn-sm" onClick={exportGratuityJson}>
              Export JSON
            </button>
          </div>
        </div>
        <p className="hint trust-note">
          <strong>Methodology:</strong> statutory formula (last drawn monthly salary × 15 × years of
          service) ÷ 26, rounded half-up to paise; capped at the notified maximum. Salary should
          include basic plus dearness allowance. Tax exemption limits are not modelled.
        </p>
        <p className="hint">
          Gratuity is generally payable after {minServiceYears} years of continuous service under the
          Payment of Gratuity Act. Verify eligibility with your employer or HR policy.
        </p>
        <div className="form-grid">
          <label>
            Last drawn monthly salary (INR)
            <input
              inputMode="decimal"
              value={form.last_drawn_salary_inr}
              onChange={(event) => setField("last_drawn_salary_inr", event)}
            />
          </label>
          <label>
            Years of service
            <input
              inputMode="decimal"
              value={form.years_of_service}
              onChange={(event) => setField("years_of_service", event)}
            />
          </label>
        </div>
        {projection.is_capped && (
          <p className="hint">
            Uncapped formula amount: {money(projection.raw_gratuity_inr)} — statutory cap applied.
          </p>
        )}
      </section>
    </>
  );
}

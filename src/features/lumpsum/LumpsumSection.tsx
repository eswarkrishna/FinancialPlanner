import { formatMoneyFinite, formatMoneyKpi } from "../../lib/locale/formatMoney";
import { buildRetirementCorpusCurve } from "../../lib/loan/chartData";
import { AlertCallout } from "../../components/AlertCallout";
import { CurrencyField } from "../../components/CurrencyField";
import { KpiStrip } from "../../components/KpiStrip";
import { LineChart } from "../../components/LineChart";
import { TableWrap } from "../../components/TableWrap";
import { useLocale } from "../locale/LocaleContext";
import { useLumpsumCalculator } from "./hooks/useLumpsumCalculator";

export function LumpsumSection() {
  const { locale } = useLocale();
  const money = (value: number) => formatMoneyFinite(value, locale);
  const moneyKpi = (value: number) => formatMoneyKpi(value, locale);
  const currencyLabel = locale === "US" ? "USD" : locale === "UK" ? "GBP" : "INR";
  const {
    form,
    projection,
    inputsInvalid,
    warningMessages,
    setField,
    setCurrencyField,
    exportLumpsumTimelineCsv,
    exportLumpsumJson,
  } = useLumpsumCalculator();

  const kpiItems = [
    {
      id: "maturity",
      label: "Future value",
      value: moneyKpi(projection.maturity_value_inr),
      tone: "positive" as const,
    },
    {
      id: "principal",
      label: "Principal invested",
      value: moneyKpi(projection.principal_inr),
    },
    {
      id: "gains",
      label: "Total gains",
      value: moneyKpi(projection.total_gains_inr),
      tone: "positive" as const,
    },
  ];

  const chartPoints = buildRetirementCorpusCurve(
    projection.yearly.map((row) => ({
      year: row.year,
      corpus_nominal_inr: row.closing_inr,
      corpus_real_inr: row.closing_inr,
    })),
  );

  return (
    <>
      {!inputsInvalid && <KpiStrip items={kpiItems} ariaLabel="Lumpsum key metrics" />}

      {warningMessages.length > 0 && (
        <AlertCallout title="Lumpsum warnings" messages={warningMessages} tone="warning" />
      )}

      <section className="card">
        <div className="schedule-head">
          <h2>Lumpsum calculator</h2>
          <div className="actions inline-actions">
            <button
              type="button"
              className="btn secondary btn-sm"
              onClick={exportLumpsumTimelineCsv}
              disabled={inputsInvalid || projection.yearly.length === 0}
            >
              Export CSV
            </button>
            <button
              type="button"
              className="btn secondary btn-sm"
              onClick={exportLumpsumJson}
              disabled={inputsInvalid}
            >
              Export JSON
            </button>
          </div>
        </div>
        <p className="hint trust-note">
          <strong>Methodology:</strong> one-time principal invested at the start, interest compounded
          once per year at your entered rate. Returns are illustrative — not a forecast. Taxes,
          expense ratios, and exit loads are not modelled.
        </p>
        <p className="hint">
          Pair with the <strong>SIP</strong> tab for monthly instalments, or <strong>PPF</strong> /
          <strong> SSY</strong> for government-backed savings. Compare against the{" "}
          <strong>Retirement</strong> tab for longer corpus targets.
        </p>
        <div className="form-grid">
          <CurrencyField
            label={`Principal (${currencyLabel})`}
            value={form.principal_inr}
            onChange={(value) => setCurrencyField("principal_inr", value)}
            locale={locale}
          />
          <label>
            Expected annual return (%)
            <input
              inputMode="decimal"
              value={form.expected_annual_return_pct}
              onChange={(event) => setField("expected_annual_return_pct", event)}
            />
          </label>
          <label>
            Years to grow
            <input
              inputMode="numeric"
              value={form.years}
              onChange={(event) => setField("years", event)}
            />
          </label>
        </div>
        {inputsInvalid && (
          <p className="hint warning">
            Enter a principal greater than zero and at least 1 year to run the projection.
          </p>
        )}
      </section>

      {!inputsInvalid && projection.yearly.length > 0 && (
        <>
          <section className="card">
            <h2>Balance growth</h2>
            <LineChart
              title="Lumpsum balance growth"
              points={chartPoints}
              stroke="#0d9488"
              xLabel="Year"
              yLabel="Balance"
              locale={locale}
            />
          </section>

          <section className="card">
            <h2>Yearly timeline</h2>
            <TableWrap label="Lumpsum yearly timeline">
              <table>
                <thead>
                  <tr>
                    <th scope="col">Year</th>
                    <th scope="col">Opening</th>
                    <th scope="col">Interest</th>
                    <th scope="col">Closing</th>
                  </tr>
                </thead>
                <tbody>
                  {projection.yearly.map((row) => (
                    <tr key={row.year}>
                      <td>{row.year}</td>
                      <td>{money(row.opening_inr)}</td>
                      <td>{money(row.interest_inr)}</td>
                      <td>{money(row.closing_inr)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </TableWrap>
          </section>
        </>
      )}
    </>
  );
}

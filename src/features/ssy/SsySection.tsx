import { formatMoneyFinite, formatMoneyKpi } from "../../lib/locale/formatMoney";
import { buildRetirementCorpusCurve } from "../../lib/loan/chartData";
import { AlertCallout } from "../../components/AlertCallout";
import { KpiStrip } from "../../components/KpiStrip";
import { LineChart } from "../../components/LineChart";
import { TableWrap } from "../../components/TableWrap";
import { useLocale } from "../locale/LocaleContext";
import { useSsyCalculator } from "./hooks/useSsyCalculator";

export function SsySection() {
  const { locale } = useLocale();
  const money = (value: number) => formatMoneyFinite(value, locale);
  const moneyKpi = (value: number) => formatMoneyKpi(value, locale);
  const isIndia = locale === "IN";
  const {
    form,
    projection,
    ageInvalid,
    warningMessages,
    setField,
    exportSsyTimelineCsv,
    exportSsyJson,
    maturityAgeYears,
    maxDepositYears,
  } = useSsyCalculator();

  const kpiItems = [
    {
      id: "maturity",
      label: "Maturity at age 21",
      value: moneyKpi(projection.maturity_value_inr),
      tone: "positive" as const,
    },
    {
      id: "contributed",
      label: "Total contributed",
      value: moneyKpi(projection.total_contributed_inr),
    },
    {
      id: "interest",
      label: "Total interest",
      value: moneyKpi(projection.total_interest_inr),
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
      <KpiStrip items={kpiItems} ariaLabel="SSY key metrics" />

      {warningMessages.length > 0 && (
        <AlertCallout title="SSY warnings" messages={warningMessages} tone="warning" />
      )}

      {!isIndia && (
        <AlertCallout
          title="India-specific instrument"
          messages={[
            "Sukanya Samriddhi Yojana (SSY) is a government-backed savings scheme for Indian residents with a girl child. Amounts are shown in INR for illustration.",
          ]}
          tone="warning"
        />
      )}

      <section className="card">
        <div className="schedule-head">
          <h2>SSY maturity calculator</h2>
          <div className="actions inline-actions">
            <button
              type="button"
              className="btn secondary btn-sm"
              onClick={exportSsyTimelineCsv}
              disabled={ageInvalid || projection.yearly.length === 0}
            >
              Export CSV
            </button>
            <button type="button" className="btn secondary btn-sm" onClick={exportSsyJson}>
              Export JSON
            </button>
          </div>
        </div>
        <p className="hint trust-note">
          <strong>Methodology:</strong> annual contribution at the start of each deposit year,
          interest compounded once per year at your entered rate. Deposits stop after{" "}
          {maxDepositYears} years; interest continues until the girl child reaches age{" "}
          {maturityAgeYears}. Verify the latest government-notified rate on NSC or India Post before
          planning.
        </p>
        <p className="hint">
          SSY accounts mature when the girl child turns {maturityAgeYears}. Accounts can be opened
          until she is age 10. Section 80C tax benefits and partial withdrawal rules are not
          modelled — pair with the <strong>PPF</strong> tab for other government savings.
        </p>
        <div className="form-grid">
          <label>
            Annual contribution (INR)
            <input
              inputMode="decimal"
              value={form.annual_contribution_inr}
              onChange={(event) => setField("annual_contribution_inr", event)}
            />
          </label>
          <label>
            Girl child&apos;s age (years)
            <input
              inputMode="numeric"
              value={form.girl_age_years}
              onChange={(event) => setField("girl_age_years", event)}
            />
          </label>
          <label>
            Interest rate (% p.a.)
            <input
              inputMode="decimal"
              value={form.interest_rate_pct}
              onChange={(event) => setField("interest_rate_pct", event)}
            />
          </label>
        </div>
        {!ageInvalid && (
          <p className="hint">
            Maturity in {projection.years_to_maturity} years (age {maturityAgeYears}) with deposits
            for {projection.deposit_years} years.
          </p>
        )}
        {ageInvalid && (
          <p className="hint warning">
            Enter a girl&apos;s age below {maturityAgeYears} to project maturity at age{" "}
            {maturityAgeYears}.
          </p>
        )}
      </section>

      {!ageInvalid && projection.yearly.length > 0 && (
        <>
          <section className="card">
            <h2>Balance growth</h2>
            <LineChart
              title="SSY balance growth"
              points={chartPoints}
              stroke="#0d9488"
              xLabel="Year"
              yLabel="Balance"
              locale={locale}
            />
          </section>

          <section className="card">
            <h2>Yearly timeline</h2>
            <TableWrap label="SSY yearly timeline">
              <table>
                <thead>
                  <tr>
                    <th scope="col">Year</th>
                    <th scope="col">Girl&apos;s age</th>
                    <th scope="col">Opening</th>
                    <th scope="col">Contribution</th>
                    <th scope="col">Interest</th>
                    <th scope="col">Closing</th>
                  </tr>
                </thead>
                <tbody>
                  {projection.yearly.map((row) => (
                    <tr key={row.year}>
                      <td>{row.year}</td>
                      <td>{row.girl_age}</td>
                      <td>{money(row.opening_inr)}</td>
                      <td>{money(row.contribution_inr)}</td>
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

import { formatMoneyFinite } from "../../lib/locale/formatMoney";
import { type DebtStrategy } from "../../lib/debt";
import { buildDebtBalanceCurve } from "../../lib/loan/chartData";
import { LineChart } from "../../components/LineChart";
import { useLocale } from "../locale/LocaleContext";
import { useDebtPlanner } from "./hooks/useDebtPlanner";

export function DebtSection() {
  const { locale } = useLocale();
  const money = (value: number) => formatMoneyFinite(value, locale);
  const currencyLabel = locale === "US" ? "USD" : "INR";
  const {
    startDateIso,
    setStartDateIso,
    monthlyBudgetInr,
    setMonthlyBudgetInr,
    selectedDebtStrategy,
    setSelectedDebtStrategy,
    debtRows,
    setDebtField,
    addDebt,
    removeDebt,
    debtModels,
    activeDebtModel,
    debtExportReady,
    exportDebtTimelineCsv,
    exportDebtJson,
  } = useDebtPlanner();

  return (
    <>
      <section className="card">
        <h2>Debt payoff planner</h2>
        <div className="form-grid">
          <label>
            Start date
            <input
              type="date"
              value={startDateIso}
              onChange={(event) => setStartDateIso(event.target.value)}
            />
          </label>
          <label>
            Monthly debt budget ({currencyLabel})
            <input
              inputMode="decimal"
              value={monthlyBudgetInr}
              onChange={(event) => setMonthlyBudgetInr(event.target.value)}
            />
          </label>
          <label>
            Schedule view
            <select
              value={selectedDebtStrategy}
              onChange={(event) =>
                setSelectedDebtStrategy(event.target.value as DebtStrategy)
              }
            >
              <option value="avalanche">Avalanche</option>
              <option value="snowball">Snowball</option>
            </select>
          </label>
        </div>

        <div className="table-wrap comparison debt-input-table">
          <table>
            <thead>
              <tr>
                <th>Debt</th>
                <th>Balance ({currencyLabel})</th>
                <th>APR (%)</th>
                <th>Minimum payment ({currencyLabel})</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {debtRows.map((row) => (
                <tr key={row.id}>
                  <td>
                    <input
                      aria-label={`Debt name for ${row.id}`}
                      value={row.name}
                      onChange={(event) =>
                        setDebtField(row.id, "name", event.target.value)
                      }
                    />
                  </td>
                  <td>
                    <input
                      inputMode="decimal"
                      aria-label={`Balance for ${row.id}`}
                      value={row.balance_inr}
                      onChange={(event) =>
                        setDebtField(row.id, "balance_inr", event.target.value)
                      }
                    />
                  </td>
                  <td>
                    <input
                      inputMode="decimal"
                      aria-label={`APR for ${row.id}`}
                      value={row.apr_pct}
                      onChange={(event) =>
                        setDebtField(row.id, "apr_pct", event.target.value)
                      }
                    />
                  </td>
                  <td>
                    <input
                      inputMode="decimal"
                      aria-label={`Minimum payment for ${row.id}`}
                      value={row.minimum_payment_inr}
                      onChange={(event) =>
                        setDebtField(row.id, "minimum_payment_inr", event.target.value)
                      }
                    />
                  </td>
                  <td>
                    <button
                      type="button"
                      className="btn secondary"
                      onClick={() => removeDebt(row.id)}
                    >
                      Remove
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="actions">
          <button type="button" className="btn secondary" onClick={addDebt}>
            Add debt
          </button>
        </div>
        <p className="hint">
          Enter each debt on one row: <strong>name</strong>, then{" "}
          <strong>balance</strong>, <strong>APR</strong>, <strong>minimum</strong>. If
          columns are misaligned, totals can explode—comparison uses safe formatting (—)
          when numbers are not finite.
        </p>
        {activeDebtModel.warning && (
          <p className="hint warning">{activeDebtModel.warning}</p>
        )}
      </section>

      <section className="card">
        <h2>Debt strategy comparison</h2>
        <div className="table-wrap comparison">
          <table>
            <thead>
              <tr>
                <th>Strategy</th>
                <th>Payoff months</th>
                <th>Payoff date</th>
                <th>Total interest</th>
                <th>Total paid</th>
              </tr>
            </thead>
            <tbody>
              {[debtModels.avalanche, debtModels.snowball].map((model) => (
                <tr key={model.strategy}>
                  <td>{model.strategy === "avalanche" ? "Avalanche" : "Snowball"}</td>
                  <td>{model.summary.is_paid_off ? model.summary.payoff_months : "—"}</td>
                  <td>{model.summary.payoff_date_iso ?? "—"}</td>
                  <td>{money(model.summary.total_interest_inr)}</td>
                  <td>{money(model.summary.total_paid_inr)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <section className="card">
        <div className="schedule-head">
          <h2>Debt payoff timeline ({selectedDebtStrategy})</h2>
          {debtExportReady && (
            <div className="actions inline-actions">
              <button
                type="button"
                className="btn secondary btn-sm"
                onClick={exportDebtTimelineCsv}
              >
                Export CSV
              </button>
              <button
                type="button"
                className="btn secondary btn-sm"
                onClick={exportDebtJson}
              >
                Export JSON
              </button>
            </div>
          )}
        </div>
        {activeDebtModel.rows.length > 0 && (
          <LineChart
            title="Total debt balance over time"
            points={buildDebtBalanceCurve(activeDebtModel.rows)}
            stroke="#0d9488"
            yLabel="Balance"
            locale={locale}
          />
        )}
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Month</th>
                <th>Opening debt</th>
                <th>Interest</th>
                <th>Payment</th>
                <th>Closing debt</th>
                <th>Next focus</th>
              </tr>
            </thead>
            <tbody>
              {activeDebtModel.rows.map((row) => (
                <tr key={row.month}>
                  <td>{row.month}</td>
                  <td>{money(row.opening_total_inr)}</td>
                  <td>{money(row.interest_inr)}</td>
                  <td>{money(row.payment_inr)}</td>
                  <td>{money(row.closing_total_inr)}</td>
                  <td>{row.focus_debt_name ?? "Paid off"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </>
  );
}

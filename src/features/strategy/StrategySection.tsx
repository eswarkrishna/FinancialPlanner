import { formatMoney, formatMoneyKpi } from "../../lib/locale/formatMoney";
import type { StrategyResult, StrategyWarning } from "../../lib/strategy/types";
import type { Locale } from "../../lib/locale/types";
import { BarChart } from "../../components/BarChart";
import { KpiStrip, type KpiItem } from "../../components/KpiStrip";
import { TableWrap } from "../../components/TableWrap";
import { useStrategyPlanner } from "./hooks/useStrategyPlanner";

const STRATEGY_LABELS: Record<StrategyResult["strategy_id"], string> = {
  STRATEGY_EQUITY_BLEND: "Equity blend",
  STRATEGY_PREPAY_HEAVY: "Prepay heavy",
  STRATEGY_AGGRESSIVE_PREPAY: "Aggressive prepay",
};

function warningCopy(locale: Locale): Record<StrategyWarning, string> {
  return {
    EMERGENCY_FUND_SHORTFALL:
      "Cash below emergency-fund floor; deployable set to 0.",
    FRAGILE_CASH_FLOW: "EMI exceeds 50% of take-home; cash flow is fragile.",
    BELOW_SUBSISTENCE:
      locale === "US"
        ? "Living budget under $2,000/month — too tight."
        : locale === "UK"
          ? "Living budget under £1,500/month — too tight."
          : "Living budget under ₹15,000/month — too tight.",
    AGGRESSIVE_PCT_INVALID: "Repayment pct outside 0–100; clamped.",
    HORIZON_TOO_SHORT: "Horizon ends before loan close; redirection skipped.",
    TAX_SIMPLIFIED:
      locale === "UK"
        ? "GIA post-tax uses flat CGT rate and a single annual exemption."
        : "Post-tax brokerage corpus uses a flat LTCG rate; short-term gains are not modeled.",
    ERC_ALLOWANCE_EXCEEDED:
      "Overpayment exceeded the fee-free allowance (no ERC charged in this model).",
  };
}

export function StrategySection() {
  const {
    form,
    setField,
    results,
    strategyFormReady,
    tierPresets,
    applyTierPreset,
    locale,
    exportStrategyComparisonCsv,
    exportStrategyJson,
    importStrategyJson,
    importError,
  } = useStrategyPlanner();
  const money = (value: number) => formatMoney(value, locale);
  const moneyKpi = (value: number) => formatMoneyKpi(value, locale);
  const isUs = locale === "US";
  const currencyLabel = isUs ? "USD" : "INR";
  const warnings = warningCopy(locale);

  const kpiItems: KpiItem[] =
    strategyFormReady && results.length > 0
      ? [
          {
            id: "horizon",
            label: "Horizon",
            value: `${form.horizon_months} mo`,
          },
          {
            id: "best-nw",
            label: "Best net worth",
            value: moneyKpi(
              Math.max(...results.map((row) => row.net_worth_at_horizon_inr)),
            ),
            tone: "positive",
          },
          {
            id: "interest-saved",
            label: "Max interest saved",
            value: moneyKpi(
              Math.max(...results.map((row) => row.interest_saved_vs_base_inr)),
            ),
          },
          {
            id: "warnings",
            label: "Warnings",
            value: String(results.reduce((sum, row) => sum + row.warnings.length, 0)),
            tone: results.some((row) => row.warnings.length > 0) ? "warning" : "default",
          },
        ]
      : [];

  return (
    <>
      {kpiItems.length > 0 ? (
        <KpiStrip items={kpiItems} ariaLabel="Strategy comparison summary" />
      ) : null}

      <section className="card">
        <h2>Repayment strategies</h2>
        <p className="hint">
          Compare three allocation approaches — <strong>Equity blend</strong>,{" "}
          <strong>Prepay heavy</strong>, and <strong>Aggressive prepay</strong> — over the
          loan horizon. Uses the same amortisation engine as the Loan tab and monthly
          compounding for an illustrative equity sleeve.
        </p>

        <p className="hint">
          Tier shortcuts only fill <strong>Take-home</strong>; enter loan and household
          fields separately.
        </p>

        <p className="hint">
          <strong>Take-home</strong> here is monthly cash after tax that reaches your bank—it
          feeds emergency-buffer math, deployable cash, and aggressive % repayment. It does{" "}
          <strong>not</strong> replace <strong>Monthly salary</strong> on the{" "}
          <strong>Loan</strong> tab, which only adds recurring principal to the loan model.
        </p>

        <div className="actions" role="group" aria-label="Take-home tier presets">
          {tierPresets.map((preset) => (
            <button
              type="button"
              key={preset.id}
              className="btn secondary"
              onClick={() => applyTierPreset(preset)}
            >
              {preset.label}
            </button>
          ))}
        </div>

        <div className="form-grid">
          <label>
            Principal ({currencyLabel})
            <input
              inputMode="decimal"
              value={form.principal_inr}
              onChange={(e) => setField("principal_inr", e.target.value)}
            />
          </label>
          <label>
            Annual rate (%)
            <input
              inputMode="decimal"
              value={form.annual_interest_rate}
              onChange={(e) => setField("annual_interest_rate", e.target.value)}
            />
          </label>
          <label>
            Tenure (months)
            <input
              inputMode="numeric"
              value={form.tenure_months}
              onChange={(e) => setField("tenure_months", e.target.value)}
            />
          </label>
          <label>
            Cash ({currencyLabel})
            <input
              inputMode="decimal"
              value={form.cash_inr}
              onChange={(e) => setField("cash_inr", e.target.value)}
            />
          </label>
          <label>
            {isUs ? "401(k) corpus (USD)" : "PF corpus (INR)"}
            <input
              inputMode="decimal"
              value={form.pf_corpus_inr}
              onChange={(e) => setField("pf_corpus_inr", e.target.value)}
            />
          </label>
          <label>
            {isUs ? "401(k) annual return (%)" : "PF annual rate (%)"}
            <input
              inputMode="decimal"
              value={form.pf_annual_interest_rate_pct}
              onChange={(e) =>
                setField("pf_annual_interest_rate_pct", e.target.value)
              }
            />
          </label>
          <label>
            {isUs ? "Monthly 401(k) deferral (USD)" : "Monthly PF addition (INR)"}
            <input
              inputMode="decimal"
              value={form.monthly_pf_addition_inr}
              onChange={(e) => setField("monthly_pf_addition_inr", e.target.value)}
            />
          </label>
          <label>
            Take-home ({currencyLabel}/mo)
            <input
              inputMode="decimal"
              value={form.monthly_take_home_inr}
              onChange={(e) => setField("monthly_take_home_inr", e.target.value)}
            />
          </label>
          <label>
            Living expense ({currencyLabel}/mo)
            <input
              inputMode="decimal"
              value={form.monthly_living_expense_inr}
              onChange={(e) => setField("monthly_living_expense_inr", e.target.value)}
            />
          </label>
          <label>
            Extra income ({currencyLabel}/mo)
            <input
              inputMode="decimal"
              value={form.extra_monthly_income_inr}
              onChange={(e) => setField("extra_monthly_income_inr", e.target.value)}
            />
          </label>
          <label>
            Extra is post-tax?
            <select
              value={
                form.extra_income_post_tax === null
                  ? ""
                  : form.extra_income_post_tax
                    ? "yes"
                    : "no"
              }
              onChange={(e) => {
                const v = e.target.value;
                setField(
                  "extra_income_post_tax",
                  v === "" ? null : v === "yes",
                );
              }}
            >
              <option value="">—</option>
              <option value="yes">Yes</option>
              <option value="no">No</option>
            </select>
          </label>
          <label>
            Marginal tax (%)
            <input
              inputMode="decimal"
              value={form.marginal_tax_rate_pct}
              onChange={(e) => setField("marginal_tax_rate_pct", e.target.value)}
              disabled={form.extra_income_post_tax === true}
            />
          </label>
          <p className="hint hint-span">
            <strong>Extra is post-tax?</strong> If left as —, the planner treats extra income
            like <strong>No</strong> (gross): your marginal tax % reduces it before allocation.
            Choose <strong>Yes</strong> only when the extra income amount is already net of tax.
          </p>
          <label>
            Emergency buffer (months)
            <input
              inputMode="numeric"
              value={form.emergency_months_buffer}
              onChange={(e) => setField("emergency_months_buffer", e.target.value)}
            />
          </label>
          <label>
            Expected equity return (%)
            <input
              inputMode="decimal"
              value={form.expected_equity_return_pct}
              onChange={(e) =>
                setField("expected_equity_return_pct", e.target.value)
              }
            />
          </label>
          <label>
            Horizon (months)
            <input
              inputMode="numeric"
              value={form.horizon_months}
              onChange={(e) => setField("horizon_months", e.target.value)}
            />
          </label>
          <label>
            Aggressive repayment (% of take-home)
            <input
              inputMode="decimal"
              value={form.repayment_pct_of_take_home}
              onChange={(e) =>
                setField("repayment_pct_of_take_home", e.target.value)
              }
            />
          </label>
        </div>
      </section>

      <section className="card">
        <div className="schedule-head">
          <h2>Strategy comparison</h2>
          {strategyFormReady && (
            <div className="actions inline-actions">
              <label className="btn secondary btn-sm">
                Import JSON
                <input
                  type="file"
                  accept="application/json,.json"
                  hidden
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) importStrategyJson(file);
                    e.target.value = "";
                  }}
                />
              </label>
              <button
                type="button"
                className="btn secondary btn-sm"
                onClick={exportStrategyComparisonCsv}
              >
                Export CSV
              </button>
              <button
                type="button"
                className="btn secondary btn-sm"
                onClick={exportStrategyJson}
              >
                Export JSON
              </button>
            </div>
          )}
        </div>
        {importError ? <p className="error">{importError}</p> : null}
        <p className="hint">
          Net worth at horizon = equity corpus + cash buffer + PF − loan balance.
          Projections use the same rounding rules as the rest of the dashboard.
        </p>
        {!strategyFormReady && (
          <p className="hint">
            Enter principal, annual rate, tenure, and horizon to compare strategies.
          </p>
        )}
        {strategyFormReady && results.length > 0 && (
          <>
            <div className="strategy-cards" aria-label="Strategy comparison cards">
              {results.map((row) => (
                <article key={row.strategy_id} className="strategy-card">
                  <h3>{STRATEGY_LABELS[row.strategy_id]}</h3>
                  <dl>
                    <div>
                      <dt>Net worth at horizon</dt>
                      <dd>{money(row.net_worth_at_horizon_inr)}</dd>
                    </div>
                    <div>
                      <dt>Interest saved</dt>
                      <dd>{money(row.interest_saved_vs_base_inr)}</dd>
                    </div>
                    <div>
                      <dt>Loan close</dt>
                      <dd>{row.loan_close_month} mo</dd>
                    </div>
                  </dl>
                </article>
              ))}
            </div>
            <BarChart
            title="Net worth at horizon by strategy"
            yLabel="Net worth"
            locale={locale}
            items={results.map((row, index) => ({
              id: row.strategy_id,
              label: STRATEGY_LABELS[row.strategy_id],
              value_inr: row.net_worth_at_horizon_inr,
              color: ["#0d9488", "#0f766e", "#b45309"][index % 3]!,
            }))}
          />
          </>
        )}
        <TableWrap label="Strategy comparison results" className="comparison">
          <table>
            <thead>
              <tr>
                <th>Strategy</th>
                <th>Loan close (mo)</th>
                <th>Total interest</th>
                <th>Interest saved</th>
                <th>Equity at horizon</th>
                <th>Net worth at horizon</th>
                <th>Min living budget</th>
                <th>Warnings</th>
              </tr>
            </thead>
            <tbody>
              {!strategyFormReady ? (
                <tr>
                  <td colSpan={8}>
                    <span className="hint">
                      No rows yet — fill the loan and horizon fields above.
                    </span>
                  </td>
                </tr>
              ) : null}
              {results.map((row) => (
                <tr key={row.strategy_id}>
                  <td>{STRATEGY_LABELS[row.strategy_id]}</td>
                  <td>{row.loan_close_month}</td>
                  <td>{money(row.total_interest_inr)}</td>
                  <td>{money(row.interest_saved_vs_base_inr)}</td>
                  <td>{money(row.equity_corpus_at_horizon_inr)}</td>
                  <td>{money(row.net_worth_at_horizon_inr)}</td>
                  <td>{money(row.min_living_budget_inr)}</td>
                  <td>
                    {row.warnings.length === 0
                      ? "—"
                      : row.warnings
                          .map((w) => warnings[w] ?? w)
                          .join(" ")}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </TableWrap>
      </section>

      <section className="card">
        <h2>Allocation breakdown</h2>
        {!strategyFormReady && (
          <p className="hint">
            Enter principal, annual rate, tenure, and horizon to see allocations.
          </p>
        )}
        <TableWrap label="Strategy allocation breakdown" className="comparison">
          <table>
            <thead>
              <tr>
                <th>Strategy</th>
                <th>One-time prepay</th>
                <th>Equity lump (mo 1)</th>
                <th>Monthly extra principal</th>
                <th>Monthly SIP</th>
                <th>Cash buffer kept</th>
                <th>Equity post-tax</th>
                <th>PF at horizon</th>
              </tr>
            </thead>
            <tbody>
              {!strategyFormReady ? (
                <tr>
                  <td colSpan={8}>
                    <span className="hint">No rows yet — fill the loan and horizon fields above.</span>
                  </td>
                </tr>
              ) : null}
              {results.map((row) => (
                <tr key={row.strategy_id}>
                  <td>{STRATEGY_LABELS[row.strategy_id]}</td>
                  <td>{money(row.one_time_prepay_inr)}</td>
                  <td>{money(row.equity_lump_inr)}</td>
                  <td>{money(row.monthly_extra_principal_inr)}</td>
                  <td>{money(row.monthly_sip_inr)}</td>
                  <td>{money(row.cash_buffer_remaining_inr)}</td>
                  <td>{money(row.equity_corpus_at_horizon_post_tax_inr)}</td>
                  <td>{money(row.pf_corpus_at_horizon_inr)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </TableWrap>
      </section>
    </>
  );
}

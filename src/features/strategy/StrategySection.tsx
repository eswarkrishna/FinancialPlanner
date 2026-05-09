import { formatInr } from "../../lib/formatInr";
import type { StrategyResult, StrategyWarning } from "../../lib/strategy/types";
import { useStrategyPlanner } from "./hooks/useStrategyPlanner";

const STRATEGY_LABELS: Record<StrategyResult["strategy_id"], string> = {
  STRATEGY_EQUITY_BLEND: "Equity blend",
  STRATEGY_PREPAY_HEAVY: "Prepay heavy",
  STRATEGY_AGGRESSIVE_PREPAY: "Aggressive prepay",
};

const WARNING_COPY: Record<StrategyWarning, string> = {
  EMERGENCY_FUND_SHORTFALL:
    "Cash below emergency-fund floor; deployable set to 0.",
  FRAGILE_CASH_FLOW: "EMI exceeds 50% of take-home; cash flow is fragile.",
  BELOW_SUBSISTENCE: "Living budget under ₹15,000/month — too tight.",
  AGGRESSIVE_PCT_INVALID: "Repayment pct outside 0–100; clamped.",
  HORIZON_TOO_SHORT: "Horizon ends before loan close; redirection skipped.",
};

export function StrategySection() {
  const { form, setField, results, tierPresets, applyTierPreset } =
    useStrategyPlanner();

  return (
    <>
      <section className="card">
        <h2>Repayment strategy planner (SPEC §4.12)</h2>
        <p className="hint">
          Compare three named allocation strategies — <strong>Equity blend</strong>,{" "}
          <strong>Prepay heavy</strong>, and <strong>Aggressive prepay</strong> — over
          the loan horizon. Reuses §4.5 amortisation and §4.11 corpus projection.
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
            Principal (INR)
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
            Cash (INR)
            <input
              inputMode="decimal"
              value={form.cash_inr}
              onChange={(e) => setField("cash_inr", e.target.value)}
            />
          </label>
          <label>
            PF corpus (INR)
            <input
              inputMode="decimal"
              value={form.pf_corpus_inr}
              onChange={(e) => setField("pf_corpus_inr", e.target.value)}
            />
          </label>
          <label>
            PF annual rate (%)
            <input
              inputMode="decimal"
              value={form.pf_annual_interest_rate_pct}
              onChange={(e) =>
                setField("pf_annual_interest_rate_pct", e.target.value)
              }
            />
          </label>
          <label>
            Monthly PF addition (INR)
            <input
              inputMode="decimal"
              value={form.monthly_pf_addition_inr}
              onChange={(e) => setField("monthly_pf_addition_inr", e.target.value)}
            />
          </label>
          <label>
            Take-home (INR/mo)
            <input
              inputMode="decimal"
              value={form.monthly_take_home_inr}
              onChange={(e) => setField("monthly_take_home_inr", e.target.value)}
            />
          </label>
          <label>
            Living expense (INR/mo)
            <input
              inputMode="decimal"
              value={form.monthly_living_expense_inr}
              onChange={(e) => setField("monthly_living_expense_inr", e.target.value)}
            />
          </label>
          <label>
            Extra income (INR/mo)
            <input
              inputMode="decimal"
              value={form.extra_monthly_income_inr}
              onChange={(e) => setField("extra_monthly_income_inr", e.target.value)}
            />
          </label>
          <label>
            Extra is post-tax?
            <select
              value={form.extra_income_post_tax ? "yes" : "no"}
              onChange={(e) =>
                setField("extra_income_post_tax", e.target.value === "yes")
              }
            >
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
              disabled={form.extra_income_post_tax}
            />
          </label>
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
          <label>
            Tax regime (display)
            <select
              value={form.tax_regime}
              onChange={(e) =>
                setField("tax_regime", e.target.value as "old" | "new")
              }
            >
              <option value="new">New</option>
              <option value="old">Old</option>
            </select>
          </label>
        </div>
      </section>

      <section className="card">
        <h2>Strategy comparison</h2>
        <p className="hint">
          Net worth at horizon = equity corpus + cash buffer + PF − loan balance.
          Amounts compounded per SPEC §4.12.3.
        </p>
        <div className="table-wrap comparison">
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
              {results.map((row) => (
                <tr key={row.strategy_id}>
                  <td>{STRATEGY_LABELS[row.strategy_id]}</td>
                  <td>{row.loan_close_month}</td>
                  <td>{formatInr(row.total_interest_inr)}</td>
                  <td>{formatInr(row.interest_saved_vs_base_inr)}</td>
                  <td>{formatInr(row.equity_corpus_at_horizon_inr)}</td>
                  <td>{formatInr(row.net_worth_at_horizon_inr)}</td>
                  <td>{formatInr(row.min_living_budget_inr)}</td>
                  <td>
                    {row.warnings.length === 0
                      ? "—"
                      : row.warnings
                          .map((w) => WARNING_COPY[w] ?? w)
                          .join(" ")}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <section className="card">
        <h2>Allocation breakdown</h2>
        <div className="table-wrap comparison">
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
              {results.map((row) => (
                <tr key={row.strategy_id}>
                  <td>{STRATEGY_LABELS[row.strategy_id]}</td>
                  <td>{formatInr(row.one_time_prepay_inr)}</td>
                  <td>{formatInr(row.equity_lump_inr)}</td>
                  <td>{formatInr(row.monthly_extra_principal_inr)}</td>
                  <td>{formatInr(row.monthly_sip_inr)}</td>
                  <td>{formatInr(row.cash_buffer_remaining_inr)}</td>
                  <td>{formatInr(row.equity_corpus_at_horizon_post_tax_inr)}</td>
                  <td>{formatInr(row.pf_corpus_at_horizon_inr)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </>
  );
}

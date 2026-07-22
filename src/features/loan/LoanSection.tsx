import { useRef } from "react";
import { AlertCallout } from "../../components/AlertCallout";
import { CurrencyField } from "../../components/CurrencyField";
import { FormSection } from "../../components/FormSection";
import { formatMoney } from "../../lib/locale/formatMoney";
import { trackLoanPrepaySourceChange, trackLoanScenarioViewChange } from "../../lib/analytics";
import { useLocale } from "../locale/LocaleContext";
import { TableWrap } from "../../components/TableWrap";
import { LoanKpiStrip } from "./components/LoanKpiStrip";
import { PrepayStrategyCompare } from "./components/PrepayStrategyCompare";
import { ScenarioCardPicker } from "./components/ScenarioCardPicker";
import { ScheduleChart } from "./components/ScheduleChart";
import { ScenarioTable } from "./components/ScenarioTable";
import { StagedPrepayEditor } from "./components/StagedPrepayEditor";
import { RateChangesEditor } from "./components/RateChangesEditor";
import { buildScenarioViewOptions } from "./hooks/buildScenarioViewOptions";
import {
  type PrepaySource,
  prepaySourceHintLabel,
  useLoanModels,
} from "./hooks/useLoanModels";

const WARNING_LABELS: Record<string, string> = {
  EMI_DEFAULT_RISK: "EMI default risk: no cash or income while unemployment is on.",
  MORTGAGE_DEFAULT_RISK:
    "Mortgage default risk: no cash, UI, or income while job loss mode is on.",
  CASH_SHORTFALL: "Cash shortfall: payment could not be fully funded from cash balance.",
  EARLY_401K_WITHDRAWAL:
    "Early 401(k) withdrawal costs (penalty/withholding) apply in this scenario.",
  LOAN_NOT_PAID_OFF:
    "Loan balance remains after the simulation horizon; payoff month is not reached.",
  SCHEDULE_TRUNCATED:
    "Schedule table shows the first 600 months only; totals reflect the full simulation.",
  ERC_ALLOWANCE_EXCEEDED: "Overpayment exceeded the fee-free allowance (no ERC charged).",
  JSA_WINDOW_ENDED: "JSA window ended; cash flow may still be negative.",
  SMI_IS_A_LOAN: "SMI credits accrue as a repayable loan secured on your home.",
};

export function LoanSection() {
  const { locale } = useLocale();
  const money = (value: number) => formatMoney(value, locale);
  const isUs = locale === "US";
  const isUk = locale === "UK";
  const {
    inputs,
    setField,
    setBoolField,
    loadReference,
    importScenarioJson,
    importError,
    parsed,
    models,
    comparisonRows,
    prepayStrategyCompare,
    withdrawalPlan,
    activeRows,
    activeCashBalances,
    activeWarnings,
    principalCurve,
    interestCurve,
    scenarioView,
    setScenarioView,
    prepaySource,
    setPrepaySource,
    effectiveLiquidInr,
    stagedPrepays,
    addStagedPrepay,
    removeStagedPrepay,
    updateStagedPrepay,
    rateChanges,
    addRateChange,
    removeRateChange,
    updateRateChange,
    exportScheduleCsv,
    exportScenarioJson,
  } = useLoanModels();

  const importInputRef = useRef<HTMLInputElement>(null);

  const goldHaircutOn = inputs.gold_haircut_enabled === "true";
  const unemploymentOn = inputs.unemployment_mode === "true";
  const currencyLabel = isUk ? "GBP" : isUs ? "USD" : "INR";

  const tranche1 =
    withdrawalPlan && "tranche1_gross_usd" in withdrawalPlan
      ? withdrawalPlan.tranche1_gross_usd
      : withdrawalPlan && "tranche1_inr" in withdrawalPlan
        ? withdrawalPlan.tranche1_inr
        : 0;
  const tranche2 =
    withdrawalPlan && "tranche2_gross_usd" in withdrawalPlan
      ? withdrawalPlan.tranche2_gross_usd
      : withdrawalPlan && "tranche2_inr" in withdrawalPlan
        ? withdrawalPlan.tranche2_inr
        : 0;

  const scenarioViewOptions =
    models &&
    buildScenarioViewOptions(
      models,
      prepaySource,
      locale,
      unemploymentOn,
      Number(inputs.unemployment_start_month) || 1,
    );

  const emiLabel = isUk || isUs ? "Mortgage payment" : "EMI";

  return (
    <>
      {models && (
        <LoanKpiStrip
          locale={locale}
          scenarioView={scenarioView}
          comparisonRows={comparisonRows}
          activeWarnings={activeWarnings}
          emiLabel={emiLabel}
          emiValue={models.base.emi_inr}
        />
      )}

      <section className="card">
        <h2>Loan &amp; assets</h2>
        <FormSection title="Loan terms">
        <p className="loan-trust-note">
          Your data never leaves your browser — inputs are stored in localStorage on
          this device only.
        </p>
        <p className="loan-methodology-note">
          Reducing-balance EMI; monthly rate = annual ÷ 12; amounts rounded half-up to
          2 decimals (paise) per step.
        </p>
        <div className="form-grid">
          <CurrencyField
            label={`Principal (${currencyLabel})`}
            value={inputs.principal_inr}
            onChange={(value) => setField("principal_inr", value)}
            locale={locale}
          />
          <label>
            Annual interest (%)
            <input
              inputMode="decimal"
              value={inputs.annual_interest_rate}
              onChange={(e) => setField("annual_interest_rate", e.target.value)}
            />
          </label>
          <label>
            Rate type
            <select
              value={inputs.rate_type === "floating" ? "floating" : "fixed"}
              onChange={(e) => setField("rate_type", e.target.value)}
            >
              <option value="fixed">Fixed</option>
              <option value="floating">Floating</option>
            </select>
          </label>
          <label>
            Tenure (months)
            <input
              inputMode="numeric"
              value={inputs.tenure_months}
              onChange={(e) => setField("tenure_months", e.target.value)}
            />
          </label>
          <label>
            Start date (optional)
            <input
              type="date"
              value={inputs.start_date}
              onChange={(e) => setField("start_date", e.target.value)}
            />
          </label>
          <CurrencyField
            label={`Monthly ${isUs || isUk ? "payment" : "cash"} to loan (${currencyLabel})`}
            value={inputs.monthly_cash_to_loan_inr}
            onChange={(value) => setField("monthly_cash_to_loan_inr", value)}
            locale={locale}
            hint="Extra principal after each month's scheduled EMI (monthly-inflow scenarios only)."
          />
          <label>
            Prepayment fee type
            <select
              value={inputs.prepayment_fee_type || "none"}
              onChange={(e) => setField("prepayment_fee_type", e.target.value)}
            >
              <option value="none">None</option>
              <option value="flat">Flat amount</option>
              <option value="percent">Percent of prepaid principal</option>
            </select>
          </label>
          {inputs.prepayment_fee_type === "flat" && (
            <label>
              Prepayment fee ({currencyLabel})
              <input
                inputMode="decimal"
                value={inputs.prepayment_fee_inr}
                onChange={(e) => setField("prepayment_fee_inr", e.target.value)}
              />
            </label>
          )}
          {inputs.prepayment_fee_type === "percent" && (
            <label>
              Prepayment fee (%)
              <input
                inputMode="decimal"
                value={inputs.prepayment_fee_pct}
                onChange={(e) => setField("prepayment_fee_pct", e.target.value)}
              />
            </label>
          )}
        </div>
        {inputs.rate_type === "floating" ? (
          <RateChangesEditor
            entries={rateChanges}
            onAdd={addRateChange}
            onRemove={removeRateChange}
            onChange={updateRateChange}
          />
        ) : null}
        </FormSection>

        <FormSection title="Assets &amp; income">
        <div className="form-grid">
          <CurrencyField
            label={`Cash (${currencyLabel})`}
            value={inputs.cash_inr}
            onChange={(value) => setField("cash_inr", value)}
            locale={locale}
          />
          <CurrencyField
            label={`Monthly salary (${currencyLabel})`}
            value={inputs.monthly_salary_inr}
            onChange={(value) => setField("monthly_salary_inr", value)}
            locale={locale}
            hint="Routed as extra principal in salary-sweep and prepay scenarios, not in the baseline row."
          />
          {isUk ? (
            <>
              <label>
                Employment type
                <select
                  value={inputs.employment_type}
                  onChange={(e) => setField("employment_type", e.target.value)}
                >
                  <option value="w2">PAYE employee</option>
                  <option value="self_employed">Self-employed</option>
                </select>
              </label>
              <label>
                Annual salary (GBP)
                <input
                  inputMode="decimal"
                  value={inputs.annual_salary_inr}
                  onChange={(e) => setField("annual_salary_inr", e.target.value)}
                />
              </label>
              <label>
                ISA balance (GBP)
                <input
                  inputMode="decimal"
                  value={inputs.isa_balance_inr}
                  onChange={(e) => setField("isa_balance_inr", e.target.value)}
                />
              </label>
              <label>
                GIA balance (GBP)
                <input
                  inputMode="decimal"
                  value={inputs.gia_balance_inr}
                  onChange={(e) => setField("gia_balance_inr", e.target.value)}
                />
              </label>
              <label>
                GIA cost basis (GBP)
                <input
                  inputMode="decimal"
                  value={inputs.gia_cost_basis_inr}
                  onChange={(e) => setField("gia_cost_basis_inr", e.target.value)}
                />
              </label>
              <label>
                Pension pot (GBP, projection-only)
                <input
                  inputMode="decimal"
                  value={inputs.pf_corpus_inr}
                  onChange={(e) => setField("pf_corpus_inr", e.target.value)}
                />
              </label>
              <label>
                Overpayment allowance (%/yr)
                <input
                  inputMode="decimal"
                  value={inputs.overpayment_allowance_pct}
                  onChange={(e) => setField("overpayment_allowance_pct", e.target.value)}
                />
              </label>
              <label>
                ERC on excess (%)
                <input
                  inputMode="decimal"
                  value={inputs.erc_pct}
                  onChange={(e) => setField("erc_pct", e.target.value)}
                />
              </label>
              {models && models.monthly401kWithMatch > 0 && (
                <p className="field-hint">
                  Auto-enrolment (employee + employer):{" "}
                  {money(models.monthly401kWithMatch)}/mo
                </p>
              )}
            </>
          ) : isUs ? (
            <>
              <label>
                Employment type
                <select
                  value={inputs.employment_type}
                  onChange={(e) => setField("employment_type", e.target.value)}
                >
                  <option value="w2">W-2 employee</option>
                  <option value="self_employed">Self-employed / 1099</option>
                </select>
              </label>
              <label>
                Annual salary (USD)
                <input
                  inputMode="decimal"
                  value={inputs.annual_salary_inr}
                  onChange={(e) => setField("annual_salary_inr", e.target.value)}
                />
              </label>
              <label>
                PMI monthly (USD)
                <input
                  inputMode="decimal"
                  value={inputs.pmi_monthly_inr}
                  onChange={(e) => setField("pmi_monthly_inr", e.target.value)}
                />
              </label>
              <label className="checkbox-label">
                <input
                  type="checkbox"
                  checked={inputs.pmi_active === "true"}
                  onChange={(e) => setBoolField("pmi_active", e.target.checked)}
                />
                PMI active
              </label>
            </>
          ) : null}
          {!isUk && (
          <label>
            {isUs ? "401(k) vested balance (USD)" : "PF corpus (INR)"}
            <input
              inputMode="decimal"
              value={inputs.pf_corpus_inr}
              onChange={(e) => setField("pf_corpus_inr", e.target.value)}
            />
          </label>
          )}
          {isUs ? (
            <>
              <label>
                Vested (%)
                <input
                  inputMode="decimal"
                  value={inputs.vested_fraction_pct}
                  onChange={(e) => setField("vested_fraction_pct", e.target.value)}
                />
              </label>
              <label>
                Monthly 401(k) deferral (USD)
                <input
                  inputMode="decimal"
                  value={inputs.monthly_pf_addition_inr}
                  onChange={(e) => setField("monthly_pf_addition_inr", e.target.value)}
                />
              </label>
              {models && models.monthly401kWithMatch > models.v.monthly_pf_addition_inr && (
                <p className="field-hint">
                  Total monthly 401(k) incl. employer match:{" "}
                  {money(models.monthly401kWithMatch)}
                </p>
              )}
              <label>
                Vesting schedule
                <select
                  value={inputs.vesting_schedule}
                  onChange={(e) => setField("vesting_schedule", e.target.value)}
                >
                  <option value="immediate">Immediate (100%)</option>
                  <option value="cliff_3">3-year cliff</option>
                  <option value="graded_6">6-year graded</option>
                </select>
              </label>
              {inputs.vesting_schedule !== "immediate" && (
                <label>
                  Years of service
                  <input
                    inputMode="decimal"
                    value={inputs.years_of_service}
                    onChange={(e) => setField("years_of_service", e.target.value)}
                  />
                </label>
              )}
              <label>
                401(k) loan balance (USD)
                <input
                  inputMode="decimal"
                  value={inputs.k401_loan_balance_inr}
                  onChange={(e) => setField("k401_loan_balance_inr", e.target.value)}
                />
              </label>
              <label className="checkbox-label">
                <input
                  type="checkbox"
                  checked={inputs.rule_of_55_eligible === "true"}
                  onChange={(e) => setBoolField("rule_of_55_eligible", e.target.checked)}
                />
                Rule of 55 eligible (no 10% penalty)
              </label>
              {inputs.rule_of_55_eligible === "true" && (
                <label>
                  Separation age
                  <input
                    inputMode="numeric"
                    value={inputs.separation_age}
                    onChange={(e) => setField("separation_age", e.target.value)}
                  />
                </label>
              )}
              <label className="checkbox-label">
                <input
                  type="checkbox"
                  checked={inputs.secure2_emergency_1k === "true"}
                  onChange={(e) => setBoolField("secure2_emergency_1k", e.target.checked)}
                />
                SECURE 2.0 emergency $1k (job-loss start)
              </label>
            </>
          ) : (
            <>
              <label>
                PF annual interest (%)
                <input
                  inputMode="decimal"
                  value={inputs.pf_annual_interest_rate_pct}
                  onChange={(e) =>
                    setField("pf_annual_interest_rate_pct", e.target.value)
                  }
                />
              </label>
              <label>
                Monthly PF addition (INR)
                <input
                  inputMode="decimal"
                  value={inputs.monthly_pf_addition_inr}
                  onChange={(e) =>
                    setField("monthly_pf_addition_inr", e.target.value)
                  }
                />
              </label>
            </>
          )}
          {!isUk && (
          <>
          <label>
            {isUs ? "Brokerage liquid (USD)" : "Gold liquid (INR)"}
            <input
              inputMode="decimal"
              value={inputs.gold_liquid_inr}
              onChange={(e) => setField("gold_liquid_inr", e.target.value)}
            />
          </label>
          <label className="checkbox-label">
            <input
              type="checkbox"
              checked={goldHaircutOn}
              onChange={(e) => setBoolField("gold_haircut_enabled", e.target.checked)}
            />
            {isUs ? "Apply brokerage haircut" : "Apply gold haircut"}
          </label>
          {goldHaircutOn && (
            <label>
              {isUs ? "Brokerage haircut (%)" : "Gold haircut (%)"}
              <input
                inputMode="decimal"
                value={inputs.gold_haircut_pct}
                onChange={(e) => setField("gold_haircut_pct", e.target.value)}
              />
            </label>
          )}
          </>
          )}
        </div>
        </FormSection>

        <FormSection
          title={isUk ? "Job loss & cashflow" : isUs ? "Job loss & cashflow" : "Unemployment & cashflow"}
          defaultOpen={unemploymentOn}
        >
        <p className="field-hint field-hint--section">
          {isUk
            ? "Model a simplified job-loss bridge: living costs, replacement income, and optional UK benefits."
            : isUs
              ? "Model a simplified job-loss period: living costs, UI, and optional 401(k) / HSA draws."
              : "Model unemployment: living costs, replacement income, and optional PF tranche withdrawals."}
        </p>
        <div className="form-grid">
          <label className="checkbox-label">
            <input
              type="checkbox"
              checked={unemploymentOn}
              onChange={(e) => setBoolField("unemployment_mode", e.target.checked)}
            />
            {isUk ? "Job loss mode" : isUs ? "Job loss mode" : "Unemployment mode"}
          </label>
          {unemploymentOn && (
            <>
              <label>
                {isUk ? "Job loss start month" : isUs ? "Job loss start month" : "Unemployment start month"}
                <input
                  inputMode="numeric"
                  value={inputs.unemployment_start_month}
                  onChange={(e) => setField("unemployment_start_month", e.target.value)}
                />
              </label>
              <label>
                Monthly living expense ({currencyLabel})
                <input
                  inputMode="decimal"
                  value={inputs.monthly_living_expense_inr}
                  onChange={(e) => setField("monthly_living_expense_inr", e.target.value)}
                />
              </label>
              <label>
                Monthly income ({currencyLabel})
                <input
                  inputMode="decimal"
                  value={inputs.monthly_income_inr}
                  onChange={(e) => setField("monthly_income_inr", e.target.value)}
                />
              </label>
              {isUk && (
                <>
                  <label>
                    Redundancy payment gross (GBP)
                    <input
                      inputMode="decimal"
                      value={inputs.redundancy_payment_inr}
                      onChange={(e) => setField("redundancy_payment_inr", e.target.value)}
                    />
                  </label>
                  <label>
                    Marginal tax rate (%)
                    <input
                      inputMode="decimal"
                      value={inputs.marginal_tax_rate_pct}
                      onChange={(e) => setField("marginal_tax_rate_pct", e.target.value)}
                    />
                  </label>
                  <label>
                    Monthly JSA (GBP)
                    <input
                      inputMode="decimal"
                      value={inputs.monthly_uib_inr}
                      onChange={(e) => setField("monthly_uib_inr", e.target.value)}
                    />
                  </label>
                  <label>
                    JSA duration (months)
                    <input
                      inputMode="numeric"
                      value={inputs.jsa_duration_months}
                      onChange={(e) => setField("jsa_duration_months", e.target.value)}
                    />
                  </label>
                  <label className="checkbox-label">
                    <input
                      type="checkbox"
                      checked={inputs.smi_enabled === "true"}
                      onChange={(e) => setBoolField("smi_enabled", e.target.checked)}
                    />
                    Enable SMI safety net
                  </label>
                </>
              )}
              {isUs && inputs.employment_type !== "self_employed" && (
                <label>
                  Monthly UI benefit (USD)
                  <input
                    inputMode="decimal"
                    value={inputs.monthly_uib_inr}
                    onChange={(e) => setField("monthly_uib_inr", e.target.value)}
                  />
                </label>
              )}
              {isUs && (
                <>
                  <label>
                    HSA balance (USD)
                    <input
                      inputMode="decimal"
                      value={inputs.hsa_balance_inr}
                      onChange={(e) => setField("hsa_balance_inr", e.target.value)}
                    />
                  </label>
                  <label>
                    Monthly health premium (USD)
                    <input
                      inputMode="decimal"
                      value={inputs.monthly_health_premium_inr}
                      onChange={(e) =>
                        setField("monthly_health_premium_inr", e.target.value)
                      }
                    />
                  </label>
                </>
              )}
            </>
          )}
        </div>

        {isUk && unemploymentOn && (
          <p className="hint">
            Simplified job-loss scenario — not a benefits entitlement calculation.
            Pension pot is never drawn before NMPA. Draw order: cash → ISA → GIA.
          </p>
        )}

        {isUs && unemploymentOn && (
          <p className="hint">
            Simplified job-loss scenario — not IRS hardship or plan rules. Early 401(k)
            withdrawals model a 10% penalty plus federal withholding.
          </p>
        )}
        </FormSection>

        <p className="hint">
          <strong>{isUk ? "ISA/GIA" : isUs ? "Brokerage liquid" : "Gold liquid"}</strong> can be the
          one-time prepay source{!isUk && "; enable haircut to model liquidation discount"}.
          {!isUk && goldHaircutOn && models && (
            <>
              {" "}
              Effective {isUs ? "brokerage" : "gold"} after haircut:{" "}
              <strong>{money(effectiveLiquidInr)}</strong>.
            </>
          )}
        </p>
        <div className="actions">
          <button type="button" className="btn secondary" onClick={loadReference}>
            Load reference scenario
          </button>
          <button
            type="button"
            className="btn secondary"
            onClick={() => importInputRef.current?.click()}
          >
            Import scenario JSON
          </button>
          <input
            ref={importInputRef}
            type="file"
            accept="application/json,.json"
            className="import-file-input"
            style={{ display: "none" }}
            aria-label="Import loan scenario JSON file"
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) importScenarioJson(file);
              e.target.value = "";
            }}
          />
        </div>
        {importError && (
          <ul className="errors" aria-live="assertive">
            <li>{importError}</li>
          </ul>
        )}
        {!parsed.success && (
          <ul className="errors" aria-live="assertive">
            {parsed.error.issues.map((issue) => (
              <li key={issue.path.join(".")}>{issue.message}</li>
            ))}
          </ul>
        )}
      </section>

      {models && (
        <div className="planner-layout">
          <section className="card">
            <StagedPrepayEditor
              entries={stagedPrepays}
              currencyLabel={currencyLabel}
              onAdd={addStagedPrepay}
              onRemove={removeStagedPrepay}
              onChange={updateStagedPrepay}
            />
          </section>

          <section className="card">
            <h2>Loan scenario comparison</h2>
            <p className="hint">
              One-time prepay scenarios use{" "}
              <strong>{prepaySourceHintLabel(models.prepaySource, locale)}</strong> at end
              of month 1. Monthly-inflow column uses your{" "}
              <strong>Monthly cash to loan</strong> value (salary sweep is listed
              separately). Net savings subtracts any prepayment fee from gross
              interest saved.
            </p>
            <label className="inline">
              One-time prepay source{" "}
              <select
                value={prepaySource}
                onChange={(e) => {
                  const next = e.target.value as PrepaySource;
                  setPrepaySource(next);
                  trackLoanPrepaySourceChange(next, locale);
                }}
              >
                <option value="cash">Cash</option>
                {isUk ? (
                  <>
                    <option value="isa">ISA</option>
                    <option value="gia">GIA</option>
                  </>
                ) : (
                  <>
                    <option value="pf">{isUs ? "401(k) account" : "PF account"}</option>
                    <option value="gold">
                      {isUs ? "Brokerage (liquid)" : "Gold (liquid)"}
                    </option>
                  </>
                )}
              </select>
            </label>
            <TableWrap label="Loan scenario comparison" className="comparison">
              <table>
                <thead>
                  <tr>
                    <th>Scenario</th>
                    <th>Payoff (months)</th>
                    <th>Months saved vs baseline</th>
                    <th>Total interest</th>
                    <th>Gross interest saved</th>
                    <th>Fees</th>
                    <th>Net savings after fee</th>
                    <th>Min cash</th>
                    <th>Total paid</th>
                  </tr>
                </thead>
                <tbody>
                  {comparisonRows.map((row) => (
                    <tr key={row.id}>
                      <td>{row.label}</td>
                      <td>{row.payoffMonth > 0 ? row.payoffMonth : "—"}</td>
                      <td>
                        {row.deltaVsBaseMonths === 0
                          ? "—"
                          : `${row.deltaVsBaseMonths} mo`}
                      </td>
                      <td>{money(row.totalInterest)}</td>
                      <td>
                        {row.grossInterestSaved === 0
                          ? "—"
                          : money(row.grossInterestSaved)}
                      </td>
                      <td>
                        {row.prepaymentFees === 0 ? "—" : money(row.prepaymentFees)}
                      </td>
                      <td>
                        {row.grossInterestSaved === 0 && row.prepaymentFees === 0
                          ? "—"
                          : money(row.netSavingsAfterFee)}
                      </td>
                      <td>
                        {row.minCashBalance !== undefined
                          ? money(row.minCashBalance)
                          : "—"}
                      </td>
                      <td>{money(row.totalPaid)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </TableWrap>
          </section>
        </div>
      )}

      {models && prepayStrategyCompare && (
        <PrepayStrategyCompare
          locale={locale}
          rows={prepayStrategyCompare}
          selectedView={scenarioView}
          emiLabel={emiLabel}
          onSelect={(view) => {
            setScenarioView(view);
            trackLoanScenarioViewChange(view, locale);
          }}
        />
      )}

      {models && (
        <>
          <section className="card">
            <h2>Loan baseline summary</h2>
            <dl className="kpi">
              <div>
                <dt>{isUk || isUs ? "Mortgage payment" : "EMI"}</dt>
                <dd>{money(models.base.emi_inr)}</dd>
              </div>
              <div>
                <dt>Total interest</dt>
                <dd>{money(models.base.totals.total_interest_inr)}</dd>
              </div>
              <div>
                <dt>Liquid assets</dt>
                <dd>
                  {money(
                    isUk
                      ? models.v.cash_inr +
                          models.v.isa_balance_inr +
                          models.v.gia_balance_inr
                      : models.v.cash_inr +
                          models.v.pf_corpus_inr +
                          (goldHaircutOn ? effectiveLiquidInr : models.v.gold_liquid_inr),
                  )}
                </dd>
              </div>
              {withdrawalPlan && !isUk && (
                <>
                  <div>
                    <dt>
                      {isUs ? "401(k) tranche (month 1)" : "PF tranche (month 1)"}
                    </dt>
                    <dd>{money(tranche1)}</dd>
                  </div>
                  <div>
                    <dt>
                      {isUs ? "401(k) tranche (month 12)" : "PF tranche (month 12)"}
                    </dt>
                    <dd>{money(tranche2)}</dd>
                  </div>
                </>
              )}
            </dl>
          </section>

          <section className="card">
            <div className="schedule-head">
              <h2>Loan amortisation schedule</h2>
              <div className="schedule-head-actions">
                <div className="actions inline-actions">
                  <button type="button" className="btn secondary btn-sm" onClick={exportScheduleCsv}>
                    Export CSV
                  </button>
                  <button type="button" className="btn secondary btn-sm" onClick={exportScenarioJson}>
                    Export JSON
                  </button>
                </div>
              </div>
            </div>

            {scenarioViewOptions && (
              <ScenarioCardPicker
                options={scenarioViewOptions}
                value={scenarioView}
                onChange={(next) => {
                  setScenarioView(next);
                  trackLoanScenarioViewChange(next, locale);
                }}
              />
            )}

            <AlertCallout
              messages={activeWarnings.map((w) => WARNING_LABELS[w] ?? w)}
            />

            <div className="chart-grid">
              <ScheduleChart
                title="Remaining principal"
                points={principalCurve}
                stroke="#2563eb"
                yLabel={currencyLabel}
                locale={locale}
              />
              <ScheduleChart
                title="Cumulative interest"
                points={interestCurve}
                stroke="#dc2626"
                yLabel={currencyLabel}
                locale={locale}
              />
            </div>

            <ScenarioTable
              rows={activeRows}
              cashBalances={activeCashBalances}
              startDateIso={models.v.start_date}
              locale={locale}
            />
          </section>
        </>
      )}
    </>
  );
}

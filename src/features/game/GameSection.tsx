import { formatMoney } from "../../lib/locale/formatMoney";
import type { GameProfileId } from "../../lib/game";
import { GameLegendPanel } from "./GameLegendPanel";
import { PayoffHeatmap } from "./components/PayoffHeatmap";
import { TableWrap } from "../../components/TableWrap";
import {
  describeGameProfile,
  describeWarning,
  formatProfileReadable,
  formatProfileWithCodes,
} from "./gameLegend";
import { useGamePlanner } from "./hooks/useGamePlanner";

export function GameSection() {
  const {
    profileId,
    setProfileId,
    prepaymentFeeInr,
    setPrepaymentFeeInr,
    parsed,
    result,
    profiles,
    exportGameJson,
    locale,
  } = useGamePlanner();

  const money = (value: number) => formatMoney(value, locale);
  const currencyLabel = locale === "US" ? "USD" : "INR";
  const activeProfile = describeGameProfile(profileId);

  return (
    <div className="game-section">
      <section className="card">
        <h2>Strategic scenarios</h2>
        <p className="hint">
          Model how your prepay choices interact with a lender fee, household split, or
          unemployment timing. Payoffs use the same amortisation engine as the Loan tab.
          Opponent behaviour is <strong>assumed</strong>, not predicted.
        </p>
        <div className="form-grid">
          <label>
            Game profile
            <select
              value={profileId}
              onChange={(e) => setProfileId(e.target.value as GameProfileId)}
            >
              {profiles.map((id) => {
                const meta = describeGameProfile(id);
                return (
                  <option key={id} value={id}>
                    {meta ? meta.label : id}
                  </option>
                );
              })}
            </select>
          </label>
          <label>
            Prepayment fee ({currencyLabel})
            <input
              inputMode="decimal"
              value={prepaymentFeeInr}
              onChange={(e) => setPrepaymentFeeInr(e.target.value)}
            />
          </label>
        </div>
        {activeProfile && (
          <p className="hint">
            <strong>{activeProfile.label}:</strong> {activeProfile.meaning}
          </p>
        )}
        {!parsed.success && (
          <ul className="errors" aria-live="assertive">
            {parsed.error.issues.map((i) => (
              <li key={i.path.join(".")}>{i.message}</li>
            ))}
          </ul>
        )}
      </section>

      <GameLegendPanel locale={locale} />

      {result && (
        <>
          {result.warnings.length > 0 && (
            <section className="card">
              <h2>Warnings</h2>
              <ul className="game-warning-list">
                {result.warnings.map((w) => {
                  const meta = describeWarning(w);
                  return (
                    <li key={w}>
                      <strong>{meta?.label ?? w}</strong>
                      {meta ? ` — ${meta.meaning}` : null}
                    </li>
                  );
                })}
              </ul>
            </section>
          )}

          <section className="card">
            <div className="schedule-head">
              <h2>Payoff matrix</h2>
              <div className="actions inline-actions">
                <button type="button" className="btn secondary btn-sm" onClick={exportGameJson}>
                  Export JSON
                </button>
              </div>
            </div>
            <p className="hint">
              {result.payoff_matrix.length} payoff combinations in this matrix.
            </p>
            <PayoffHeatmap cells={result.payoff_matrix} locale={locale} />
            <TableWrap label="Strategic payoff matrix" className="comparison">
              <table>
                <thead>
                  <tr>
                    <th>Actions (plain English)</th>
                    <th>Codes</th>
                    <th>Borrower (B)</th>
                    <th>Other (L or H)</th>
                  </tr>
                </thead>
                <tbody>
                  {result.payoff_matrix.map((cell) => {
                    const { readable, codes } = formatProfileWithCodes(
                      cell.action_profile,
                    );
                    return (
                      <tr key={cell.cell_key}>
                        <td>{readable}</td>
                        <td className="game-codes-cell">
                          <code className="game-codes">{codes || "—"}</code>
                        </td>
                        <td>{money(cell.payoffs.B ?? 0)}</td>
                        <td>
                          {cell.payoffs.L !== undefined
                            ? money(cell.payoffs.L)
                            : cell.payoffs.H !== undefined
                              ? money(cell.payoffs.H)
                              : "—"}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </TableWrap>
          </section>

          <section className="card">
            <h2>Recommendation</h2>
            <p className="hint">
              Stable outcomes (equilibrium) or best cautious move (max-min) for this
              profile. See the legend above for code meanings.
            </p>
            {result.equilibria.length > 0 ? (
              <ul className="game-recommendation-list">
                {result.equilibria.map((eq) => {
                  const { readable, codes } = formatProfileWithCodes(
                    eq.action_profile,
                  );
                  const key = eq.action_profile
                    ? JSON.stringify(eq.action_profile)
                    : readable;
                  return (
                    <li key={key}>
                      <span className="game-rec-readable">{readable}</span>
                      <span className="game-rec-meta">
                        {" "}
                        — B: {money(eq.payoffs.B ?? 0)}
                        {eq.payoffs.L !== undefined &&
                          ` · L: ${money(eq.payoffs.L)}`}
                        {codes ? (
                          <>
                            {" "}
                            <code className="game-codes">({codes})</code>
                          </>
                        ) : null}
                      </span>
                    </li>
                  );
                })}
              </ul>
            ) : (
              <p className="hint">No pure equilibrium found for this profile.</p>
            )}
            {result.recommended_b_action && (
              <p className="game-suggested">
                <strong>Suggested borrower move:</strong>{" "}
                {formatProfileReadable(result.recommended_b_action)}
                {(() => {
                  const { codes } = formatProfileWithCodes(
                    result.recommended_b_action,
                  );
                  return codes ? (
                    <>
                      {" "}
                      <code className="game-codes">({codes})</code>
                    </>
                  ) : null;
                })()}
              </p>
            )}
          </section>
        </>
      )}

      <p className="hint">
        Educational planning only. Lender and household responses are modelled from discrete
        assumptions, not live market data.
      </p>
    </div>
  );
}

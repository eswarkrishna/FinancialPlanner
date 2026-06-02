import { formatInr } from "../../lib/formatInr";
import type { GameActionProfile } from "../../lib/game";
import { useGamePlanner } from "./hooks/useGamePlanner";

function formatProfile(profile: GameActionProfile): string {
  const parts: string[] = [];
  if (profile.b_lump) parts.push(profile.b_lump);
  if (profile.b_policy) parts.push(profile.b_policy);
  if (profile.b_extra) parts.push(profile.b_extra);
  if (profile.l_fee) parts.push(profile.l_fee);
  if (profile.h_split) parts.push(profile.h_split);
  if (profile.n_employment) parts.push(profile.n_employment);
  if (profile.n_pf_route) parts.push(profile.n_pf_route);
  return parts.join(" · ") || "—";
}

export function GameSection() {
  const {
    profileId,
    setProfileId,
    prepaymentFeeInr,
    setPrepaymentFeeInr,
    parsed,
    result,
    profiles,
  } = useGamePlanner();

  return (
    <div className="game-section">
      <section className="card">
        <h2>Strategic scenarios (SPEC §4.13)</h2>
        <p className="hint">
          Payoffs use the same amortisation engine as the Loan tab. Opponent behaviour is
          assumed, not predicted.
        </p>
        <div className="form-grid">
          <label>
            Game profile
            <select
              value={profileId}
              onChange={(e) => setProfileId(e.target.value as typeof profileId)}
            >
              {profiles.map((id) => (
                <option key={id} value={id}>
                  {id}
                </option>
              ))}
            </select>
          </label>
          <label>
            Prepayment fee (INR)
            <input
              inputMode="decimal"
              value={prepaymentFeeInr}
              onChange={(e) => setPrepaymentFeeInr(e.target.value)}
            />
          </label>
        </div>
        {!parsed.success && (
          <ul className="errors">
            {parsed.error.issues.map((i) => (
              <li key={i.path.join(".")}>{i.message}</li>
            ))}
          </ul>
        )}
      </section>

      {result && (
        <>
          {result.warnings.length > 0 && (
            <section className="card">
              <ul className="errors">
                {result.warnings.map((w) => (
                  <li key={w}>{w}</li>
                ))}
              </ul>
            </section>
          )}

          <section className="card">
            <h2>Payoff matrix</h2>
            <p className="hint">
              {result.payoff_matrix.length} cells · scenarios:{" "}
              {result.underlying_scenario_ids.join(", ")}
            </p>
            <div className="table-wrap comparison">
              <table>
                <thead>
                  <tr>
                    <th>Actions</th>
                    <th>Borrower (B)</th>
                    <th>Other</th>
                  </tr>
                </thead>
                <tbody>
                  {result.payoff_matrix.map((cell) => (
                    <tr key={cell.cell_key}>
                      <td>{formatProfile(cell.action_profile)}</td>
                      <td>{formatInr(cell.payoffs.B ?? 0)}</td>
                      <td>
                        {cell.payoffs.L !== undefined
                          ? formatInr(cell.payoffs.L)
                          : cell.payoffs.H !== undefined
                            ? formatInr(cell.payoffs.H)
                            : "—"}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>

          <section className="card">
            <h2>Recommendation</h2>
            {result.equilibria.length > 0 ? (
              <ul>
                {result.equilibria.map((eq, i) => (
                  <li key={i}>
                    {formatProfile(eq.action_profile)} — B:{" "}
                    {formatInr(eq.payoffs.B ?? 0)}
                    {eq.payoffs.L !== undefined && ` · L: ${formatInr(eq.payoffs.L)}`}
                  </li>
                ))}
              </ul>
            ) : (
              <p className="hint">No pure equilibrium found for this profile.</p>
            )}
            {result.recommended_b_action && (
              <p>
                <strong>Suggested borrower move:</strong>{" "}
                {formatProfile(result.recommended_b_action)}
              </p>
            )}
          </section>
        </>
      )}

      <p className="hint">
        Educational planning only. Lender and household responses are modelled from discrete
        assumptions, not live market data (SPEC §14).
      </p>
    </div>
  );
}

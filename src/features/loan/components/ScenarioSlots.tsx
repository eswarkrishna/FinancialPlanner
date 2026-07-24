import { useState } from "react";
import { formatMoney } from "../../../lib/locale/formatMoney";
import type { Locale } from "../../../lib/locale/types";
import { MAX_LOAN_SCENARIO_SLOTS } from "../../../lib/persistence/loanScenarioSlots";
import { TableWrap } from "../../../components/TableWrap";
import type { ScenarioSlotCompareRow } from "../hooks/buildScenarioSlotRows";

interface ScenarioSlotsProps {
  locale: Locale;
  rows: ScenarioSlotCompareRow[];
  currentRow: ScenarioSlotCompareRow;
  slotError: string | null;
  emiLabel: string;
  onSave: (name: string) => boolean;
  onLoad: (id: string) => void;
  onDelete: (id: string) => void;
}

export function ScenarioSlots({
  locale,
  rows,
  currentRow,
  slotError,
  emiLabel,
  onSave,
  onLoad,
  onDelete,
}: ScenarioSlotsProps) {
  const [name, setName] = useState("");
  const money = (value: number) => formatMoney(value, locale);

  function handleSave() {
    if (onSave(name)) setName("");
  }

  return (
    <section className="card">
      <div className="schedule-head">
        <h2>Saved scenarios</h2>
        <div className="actions inline-actions">
          <input
            type="text"
            value={name}
            maxLength={40}
            placeholder="e.g. Prepay in March"
            aria-label="Scenario name"
            onChange={(event) => setName(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === "Enter") handleSave();
            }}
          />
          <button type="button" className="btn secondary btn-sm" onClick={handleSave}>
            Save current
          </button>
        </div>
      </div>
      <p className="hint">
        Save up to {MAX_LOAN_SCENARIO_SLOTS} named scenarios and compare them side by
        side. Saved scenarios stay in your browser only.
      </p>
      {slotError ? <p className="error">{slotError}</p> : null}
      {rows.length === 0 ? (
        <p className="hint">
          No saved scenarios yet — set up the loan, then save it under a name to
          compare against other setups.
        </p>
      ) : (
        <TableWrap label="Saved scenario comparison" className="comparison">
          <table>
            <thead>
              <tr>
                <th>Scenario</th>
                <th>View</th>
                <th>{emiLabel}</th>
                <th>Payoff month</th>
                <th>Total interest</th>
                <th>Total paid</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td>
                  <strong>{currentRow.name}</strong>
                </td>
                <td>{currentRow.scenarioLabel}</td>
                <td>{money(currentRow.emi)}</td>
                <td>{currentRow.payoffMonth}</td>
                <td>{money(currentRow.totalInterest)}</td>
                <td>{money(currentRow.totalPaid)}</td>
                <td>—</td>
              </tr>
              {rows.map((row) => (
                <tr key={row.id}>
                  <td>{row.name}</td>
                  <td>{row.scenarioLabel}</td>
                  {row.valid ? (
                    <>
                      <td>{money(row.emi)}</td>
                      <td>{row.payoffMonth}</td>
                      <td>{money(row.totalInterest)}</td>
                      <td>{money(row.totalPaid)}</td>
                    </>
                  ) : (
                    <td colSpan={4}>Saved inputs are no longer valid.</td>
                  )}
                  <td>
                    <div className="actions inline-actions">
                      <button
                        type="button"
                        className="btn secondary btn-sm"
                        aria-label={`Load scenario ${row.name}`}
                        onClick={() => onLoad(row.id)}
                      >
                        Load
                      </button>
                      <button
                        type="button"
                        className="btn secondary btn-sm"
                        aria-label={`Delete scenario ${row.name}`}
                        onClick={() => onDelete(row.id)}
                      >
                        Delete
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </TableWrap>
      )}
    </section>
  );
}

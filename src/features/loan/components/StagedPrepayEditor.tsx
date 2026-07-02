import type { StagedPrepayEntry } from "../../../lib/loan/stagedPrepays";

interface StagedPrepayEditorProps {
  entries: StagedPrepayEntry[];
  currencyLabel?: string;
  onAdd: () => void;
  onRemove: (id: string) => void;
  onChange: (id: string, field: "month" | "amount_inr", value: string) => void;
}

export function StagedPrepayEditor({
  entries,
  currencyLabel = "INR",
  onAdd,
  onRemove,
  onChange,
}: StagedPrepayEditorProps) {
  return (
    <div className="staged-prepay">
      <h3>Custom staged prepayments</h3>
      <p className="hint">
        Add one or more lump-sum prepayments at specific months (SPEC §4.6{" "}
        <code>STAGED_PREPAY</code>). Policy: keep original EMI.
      </p>
      {entries.length === 0 ? (
        <p className="hint">No staged prepayments yet.</p>
      ) : (
        <div className="table-wrap comparison staged-prepay-table">
          <table>
            <thead>
              <tr>
                <th>Month</th>
                <th>Amount ({currencyLabel})</th>
                <th />
              </tr>
            </thead>
            <tbody>
              {entries.map((entry) => (
                <tr key={entry.id}>
                  <td>
                    <input
                      inputMode="numeric"
                      aria-label={`Prepay month for row ${entry.id}`}
                      value={entry.month}
                      onChange={(e) => onChange(entry.id, "month", e.target.value)}
                    />
                  </td>
                  <td>
                    <input
                      inputMode="decimal"
                      aria-label={`Prepay amount for row ${entry.id}`}
                      value={entry.amount_inr}
                      onChange={(e) => onChange(entry.id, "amount_inr", e.target.value)}
                    />
                  </td>
                  <td>
                    <button
                      type="button"
                      className="btn secondary btn-sm"
                      onClick={() => onRemove(entry.id)}
                    >
                      Remove
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      <div className="actions">
        <button type="button" className="btn secondary" onClick={onAdd}>
          Add prepayment
        </button>
      </div>
    </div>
  );
}

export type { StagedPrepayEntry };

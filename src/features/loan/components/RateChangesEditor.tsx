import type { RateChangeEntry } from "../../../lib/loan/rateChanges";
import { TableWrap } from "../../../components/TableWrap";

interface RateChangesEditorProps {
  entries: RateChangeEntry[];
  onAdd: () => void;
  onRemove: (id: string) => void;
  onChange: (id: string, field: "month" | "annual_rate", value: string) => void;
}

export function RateChangesEditor({
  entries,
  onAdd,
  onRemove,
  onChange,
}: RateChangesEditorProps) {
  return (
    <div className="rate-changes">
      <h3>Rate reset schedule</h3>
      <p className="hint">
        Add future rate changes (month 2 onward). EMI recalculates at each reset with
        the remaining tenure.
      </p>
      {entries.length === 0 ? (
        <p className="hint">No rate changes yet — only the initial rate applies.</p>
      ) : (
        <TableWrap label="Floating rate reset rows" className="comparison rate-changes-table">
          <table>
            <thead>
              <tr>
                <th>From month</th>
                <th>New annual rate (%)</th>
                <th scope="col">
                  <span className="visually-hidden">Actions</span>
                </th>
              </tr>
            </thead>
            <tbody>
              {entries.map((entry) => (
                <tr key={entry.id}>
                  <td>
                    <input
                      inputMode="numeric"
                      aria-label={`Rate change month for row ${entry.id}`}
                      value={entry.month}
                      onChange={(e) => onChange(entry.id, "month", e.target.value)}
                    />
                  </td>
                  <td>
                    <input
                      inputMode="decimal"
                      aria-label={`New annual rate for row ${entry.id}`}
                      value={entry.annual_rate}
                      onChange={(e) => onChange(entry.id, "annual_rate", e.target.value)}
                    />
                  </td>
                  <td>
                    <button type="button" onClick={() => onRemove(entry.id)}>
                      Remove
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </TableWrap>
      )}
      <button type="button" className="secondary" onClick={onAdd}>
        Add rate change
      </button>
    </div>
  );
}

import { useMemo, useState } from "react";
import {
  deleteNamedScenarioSlot,
  newScenarioSlotId,
  readNamedScenarioSlots,
  upsertNamedScenarioSlot,
  type NamedScenarioSlot,
} from "../lib/persistence/namedScenarioSlots";

interface NamedScenarioSlotsProps<T> {
  tab: string;
  locale: string;
  /** Build payload from current form state */
  buildPayload: () => T;
  /** Apply saved payload to form */
  applyPayload: (payload: T) => void;
  /** Optional KPI labels for compare table */
  buildSummary?: () => Record<string, string>;
  compareFields?: { key: string; label: string }[];
}

export function NamedScenarioSlots<T>({
  tab,
  locale,
  buildPayload,
  applyPayload,
  buildSummary,
  compareFields = [],
}: NamedScenarioSlotsProps<T>) {
  const [slots, setSlots] = useState<NamedScenarioSlot<T>[]>(() =>
    readNamedScenarioSlots<T>(tab, locale as "IN" | "US" | "UK"),
  );
  const [name, setName] = useState("");
  const [compareIds, setCompareIds] = useState<string[]>([]);
  const [message, setMessage] = useState<string | null>(null);

  const compareSlots = useMemo(
    () => slots.filter((slot) => compareIds.includes(slot.id)),
    [slots, compareIds],
  );

  function refresh(next: NamedScenarioSlot<T>[]) {
    setSlots(next);
  }

  function saveSlot() {
    const trimmed = name.trim();
    if (!trimmed) {
      setMessage("Enter a name for this scenario.");
      return;
    }
    const slot: NamedScenarioSlot<T> = {
      id: newScenarioSlotId(),
      name: trimmed,
      savedAt: new Date().toISOString(),
      locale: locale as "IN" | "US" | "UK",
      payload: buildPayload(),
      summary: buildSummary?.(),
    };
    const next = upsertNamedScenarioSlot(tab, locale as "IN" | "US" | "UK", slot);
    refresh(next);
    setName("");
    setMessage(`Saved “${trimmed}”.`);
  }

  function loadSlot(slot: NamedScenarioSlot<T>) {
    applyPayload(slot.payload);
    setMessage(`Loaded “${slot.name}”.`);
  }

  function removeSlot(id: string) {
    const next = deleteNamedScenarioSlot<T>(tab, locale as "IN" | "US" | "UK", id);
    refresh(next);
    setCompareIds((prev) => prev.filter((entry) => entry !== id));
  }

  function toggleCompare(id: string) {
    setCompareIds((prev) => {
      if (prev.includes(id)) return prev.filter((entry) => entry !== id);
      if (prev.length >= 3) return prev;
      return [...prev, id];
    });
  }

  return (
    <section className="card named-scenario-slots">
      <h2>Saved scenarios</h2>
      <p className="hint">
        Save up to 5 named snapshots in this browser. Select up to 3 to compare side by side.
      </p>

      <div className="named-scenario-save-row">
        <label className="named-scenario-name-label">
          Scenario name
          <input
            type="text"
            value={name}
            placeholder="e.g. HDFC 50L @ 7.9%"
            onChange={(e) => setName(e.target.value)}
            maxLength={48}
          />
        </label>
        <button type="button" className="btn secondary btn-sm" onClick={saveSlot}>
          Save current
        </button>
      </div>

      {message ? <p className="hint named-scenario-message">{message}</p> : null}

      {slots.length === 0 ? (
        <p className="hint">No saved scenarios yet.</p>
      ) : (
        <ul className="named-scenario-list">
          {slots.map((slot) => (
            <li key={slot.id} className="named-scenario-item">
              <div className="named-scenario-item-main">
                <strong>{slot.name}</strong>
                <span className="hint">
                  {new Date(slot.savedAt).toLocaleDateString()}
                </span>
              </div>
              <div className="inline-actions">
                <button type="button" className="btn secondary btn-sm" onClick={() => loadSlot(slot)}>
                  Load
                </button>
                <label className="named-scenario-compare-check">
                  <input
                    type="checkbox"
                    checked={compareIds.includes(slot.id)}
                    onChange={() => toggleCompare(slot.id)}
                  />
                  Compare
                </label>
                <button
                  type="button"
                  className="btn secondary btn-sm"
                  onClick={() => removeSlot(slot.id)}
                >
                  Delete
                </button>
              </div>
            </li>
          ))}
        </ul>
      )}

      {compareSlots.length >= 2 && compareFields.length > 0 ? (
        <div className="named-scenario-compare">
          <h3>Compare selected</h3>
          <table>
            <thead>
              <tr>
                <th>Metric</th>
                {compareSlots.map((slot) => (
                  <th key={slot.id}>{slot.name}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {compareFields.map((field) => (
                <tr key={field.key}>
                  <td>{field.label}</td>
                  {compareSlots.map((slot) => (
                    <td key={slot.id}>{slot.summary?.[field.key] ?? "—"}</td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : null}
    </section>
  );
}

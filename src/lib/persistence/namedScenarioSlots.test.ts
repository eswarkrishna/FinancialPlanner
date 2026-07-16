import { describe, expect, it, beforeEach } from "vitest";
import {
  deleteNamedScenarioSlot,
  readNamedScenarioSlots,
  upsertNamedScenarioSlot,
  MAX_NAMED_SCENARIO_SLOTS,
} from "./namedScenarioSlots";

describe("namedScenarioSlots", () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it("saves and reads slots per tab and locale", () => {
    upsertNamedScenarioSlot("loan", "IN", {
      id: "a",
      name: "Test",
      savedAt: "2026-01-01",
      locale: "IN",
      payload: { principal: 1 },
    });
    const slots = readNamedScenarioSlots<{ principal: number }>("loan", "IN");
    expect(slots).toHaveLength(1);
    expect(slots[0]!.payload.principal).toBe(1);
  });

  it("caps slots at MAX_NAMED_SCENARIO_SLOTS", () => {
    for (let i = 0; i < MAX_NAMED_SCENARIO_SLOTS + 2; i += 1) {
      upsertNamedScenarioSlot("loan", "IN", {
        id: `id-${i}`,
        name: `Slot ${i}`,
        savedAt: "2026-01-01",
        locale: "IN",
        payload: i,
      });
    }
    expect(readNamedScenarioSlots("loan", "IN")).toHaveLength(MAX_NAMED_SCENARIO_SLOTS);
  });

  it("deletes a slot by id", () => {
    upsertNamedScenarioSlot("loan", "IN", {
      id: "keep",
      name: "Keep",
      savedAt: "2026-01-01",
      locale: "IN",
      payload: 1,
    });
    upsertNamedScenarioSlot("loan", "IN", {
      id: "drop",
      name: "Drop",
      savedAt: "2026-01-01",
      locale: "IN",
      payload: 2,
    });
    deleteNamedScenarioSlot("loan", "IN", "drop");
    const ids = readNamedScenarioSlots("loan", "IN").map((s) => s.id);
    expect(ids).toEqual(["keep"]);
  });
});

import { describe, expect, it } from "vitest";
import { addMonthsToIsoDate, formatIsoDateLocal, parseIsoDateLocal } from "./dateIso";

describe("dateIso", () => {
  it("parses YYYY-MM-DD without UTC day shift", () => {
    const dt = parseIsoDateLocal("2026-01-15");
    expect(dt).not.toBeNull();
    expect(formatIsoDateLocal(dt!)).toBe("2026-01-15");
  });

  it("adds months in local calendar space", () => {
    expect(addMonthsToIsoDate("2026-01-15", 1)).toBe("2026-02-15");
    expect(addMonthsToIsoDate("2026-01-15", 12)).toBe("2027-01-15");
  });
});

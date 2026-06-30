import { describe, expect, it } from "vitest";
import { formatInr, formatInrFinite } from "./formatInr";

describe("formatInrFinite", () => {
  it("formats normal amounts like formatInr", () => {
    expect(formatInrFinite(100)).toBe(formatInr(100));
  });

  it("renders em dash for non-finite numbers", () => {
    expect(formatInrFinite(Number.NaN)).toBe("—");
    expect(formatInrFinite(Number.POSITIVE_INFINITY)).toBe("—");
    expect(formatInrFinite(Number.NEGATIVE_INFINITY)).toBe("—");
  });
});

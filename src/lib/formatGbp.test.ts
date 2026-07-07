import { describe, expect, it } from "vitest";
import { formatGbp } from "./formatGbp";

describe("formatGbp", () => {
  it("formats GBP with en-GB locale", () => {
    expect(formatGbp(1234.5)).toMatch(/£/);
    expect(formatGbp(1234.5)).toContain("1,234");
  });
});

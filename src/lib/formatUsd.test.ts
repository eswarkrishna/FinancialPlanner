import { describe, expect, it } from "vitest";
import { formatUsd } from "./formatUsd";

describe("formatUsd", () => {
  it("formats USD with dollar sign", () => {
    expect(formatUsd(400_000)).toMatch(/\$400,000/);
  });
});

import { describe, expect, it } from "vitest";
import { formatMoneyEcho } from "./formatMoneyEcho";

describe("formatMoneyEcho", () => {
  it("formats INR with lakh suffix", () => {
    expect(formatMoneyEcho(5_000_000, "IN")).toBe("₹50,00,000 · 50 lakh");
  });

  it("formats INR with crore suffix", () => {
    expect(formatMoneyEcho(25_000_000, "IN")).toBe("₹2,50,00,000 · 2.5 crore");
  });

  it("returns null for zero or non-finite values", () => {
    expect(formatMoneyEcho(0, "IN")).toBeNull();
    expect(formatMoneyEcho(Number.NaN, "US")).toBeNull();
  });

  it("formats USD without lakh suffix", () => {
    expect(formatMoneyEcho(500_000, "US")).toBe("$500,000");
  });
});

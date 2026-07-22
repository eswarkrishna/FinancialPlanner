import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import { CurrencyField } from "./CurrencyField";

describe("CurrencyField", () => {
  it("shows formatted echo for INR principal", () => {
    render(
      <CurrencyField
        label="Principal (INR)"
        value="5000000"
        onChange={() => {}}
        locale="IN"
      />,
    );

    expect(screen.getByText("₹50,00,000 · 50 lakh")).toBeInTheDocument();
  });

  it("shows field hint when provided", () => {
    render(
      <CurrencyField
        label="Cash (INR)"
        value="1000"
        onChange={() => {}}
        locale="IN"
        hint="Liquid balance available for prepay."
      />,
    );

    expect(screen.getByText("Liquid balance available for prepay.")).toBeInTheDocument();
  });
});

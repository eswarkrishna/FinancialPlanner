import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { StrategySection } from "./StrategySection";

describe("StrategySection", () => {
  it("renders the strategy planner with comparison + allocation tables", () => {
    render(<StrategySection />);
    expect(
      screen.getByRole("heading", { name: "Repayment strategies" }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("heading", { name: "Strategy comparison" }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("heading", { name: "Allocation breakdown" }),
    ).toBeInTheDocument();
  });

  it("applies Tier C preset and surfaces the subsistence warning", () => {
    render(<StrategySection />);
    fireEvent.click(screen.getByRole("button", { name: /Tier C/ }));
    expect(
      (screen.getByLabelText("Take-home (INR/mo)") as HTMLInputElement).value,
    ).toBe("100000");
    expect(
      screen.getAllByText(/Living budget under ₹15,000\/month/i).length,
    ).toBeGreaterThan(0);
  });
});

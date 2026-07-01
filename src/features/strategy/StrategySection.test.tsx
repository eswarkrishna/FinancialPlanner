import { fireEvent, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { renderWithLocale } from "../../test/renderWithLocale";
import { StrategySection } from "./StrategySection";

function fillStrategyBaseline(): void {
  fireEvent.change(screen.getByLabelText("Principal (INR)"), {
    target: { value: "3600000" },
  });
  fireEvent.change(screen.getByLabelText("Annual rate (%)"), {
    target: { value: "7.9" },
  });
  fireEvent.change(screen.getByLabelText("Tenure (months)"), {
    target: { value: "98" },
  });
  fireEvent.change(screen.getByLabelText("Cash (INR)"), {
    target: { value: "2000000" },
  });
  fireEvent.change(screen.getByLabelText("PF corpus (INR)"), {
    target: { value: "2620000" },
  });
  fireEvent.change(screen.getByLabelText("Living expense (INR/mo)"), {
    target: { value: "80000" },
  });
  fireEvent.change(screen.getByLabelText("Horizon (months)"), {
    target: { value: "98" },
  });
  fireEvent.change(screen.getByLabelText("Aggressive repayment (% of take-home)"), {
    target: { value: "90" },
  });
}

describe("StrategySection", () => {
  it("renders the strategy planner with comparison + allocation tables", () => {
    renderWithLocale(<StrategySection />);
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
    renderWithLocale(<StrategySection />);
    fillStrategyBaseline();
    fireEvent.click(screen.getByRole("button", { name: /Tier C/ }));
    expect(
      (screen.getByLabelText("Take-home (INR/mo)") as HTMLInputElement).value,
    ).toBe("100000");
    expect(
      screen.getAllByText(/Living budget under ₹15,000\/month/i).length,
    ).toBeGreaterThan(0);
  });
});

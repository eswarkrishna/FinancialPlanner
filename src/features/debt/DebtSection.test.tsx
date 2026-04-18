import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { DebtSection } from "./DebtSection";

describe("DebtSection", () => {
  it("switches timeline heading when strategy changes", () => {
    render(<DebtSection />);

    fireEvent.change(screen.getByLabelText("Schedule view"), {
      target: { value: "snowball" },
    });

    expect(
      screen.getByRole("heading", { name: "Debt payoff timeline (snowball)" }),
    ).toBeInTheDocument();
  });

  it("shows warning when budget is below minimum dues", () => {
    render(<DebtSection />);

    fireEvent.change(screen.getByLabelText("Monthly debt budget (INR)"), {
      target: { value: "100" },
    });

    expect(
      screen.getByText(
        "Monthly budget is below total minimum payments. Increase budget to simulate payoff.",
      ),
    ).toBeInTheDocument();
  });
});

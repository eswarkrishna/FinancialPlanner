import { fireEvent, screen, within } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { renderWithLocale } from "../../test/renderWithLocale";
import { DebtSection } from "./DebtSection";

describe("DebtSection", () => {
  it("switches timeline heading when strategy changes", () => {
    renderWithLocale(<DebtSection />);

    fireEvent.change(screen.getByLabelText("Schedule view"), {
      target: { value: "snowball" },
    });

    expect(
      screen.getByRole("heading", { name: "Debt payoff timeline (snowball)" }),
    ).toBeInTheDocument();
  });

  it("shows warning when budget is below minimum dues", () => {
    renderWithLocale(<DebtSection />);

    const firstDebtRow = screen.getAllByRole("row")[1];
    const rowInputs = within(firstDebtRow).getAllByRole("textbox");
    fireEvent.change(rowInputs[1], { target: { value: "150000" } });
    fireEvent.change(rowInputs[2], { target: { value: "36" } });
    fireEvent.change(rowInputs[3], { target: { value: "8000" } });

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

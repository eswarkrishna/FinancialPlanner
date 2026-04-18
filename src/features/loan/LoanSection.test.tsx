import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { LoanSection } from "./LoanSection";

describe("LoanSection", () => {
  it("renders baseline loan UI and comparison table", () => {
    render(<LoanSection />);

    expect(screen.getByRole("heading", { name: "Loan & assets" })).toBeInTheDocument();
    expect(
      screen.getByRole("heading", { name: "Loan scenario comparison" }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("heading", { name: "Loan amortisation schedule" }),
    ).toBeInTheDocument();
  });

  it("updates one-time prepay source labels when switching to PF", () => {
    render(<LoanSection />);

    fireEvent.change(screen.getByLabelText("One-time prepay source"), {
      target: { value: "pf" },
    });

    expect(screen.getByText("Prepay from PF + keep EMI")).toBeInTheDocument();
    expect(
      screen.getByRole("option", { name: /One-time prepay \(PF\) \+ keep EMI/ }),
    ).toBeInTheDocument();
  });
});

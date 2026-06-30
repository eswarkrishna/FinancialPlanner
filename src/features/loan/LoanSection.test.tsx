import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it } from "vitest";
import { LoanSection } from "./LoanSection";

describe("LoanSection", () => {
  it("starts without comparison tables until reference scenario is loaded", async () => {
    const user = userEvent.setup();
    render(<LoanSection />);

    expect(screen.getByRole("heading", { name: "Loan & assets" })).toBeInTheDocument();
    expect(
      screen.queryByRole("heading", { name: "Loan scenario comparison" }),
    ).not.toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: /Load reference scenario/i }));

    expect(
      screen.getByRole("heading", { name: "Loan scenario comparison" }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("heading", { name: "Loan amortisation schedule" }),
    ).toBeInTheDocument();
  });

  it("updates one-time prepay source labels when switching to PF", async () => {
    const user = userEvent.setup();
    render(<LoanSection />);

    await user.click(screen.getByRole("button", { name: /Load reference scenario/i }));

    fireEvent.change(screen.getByLabelText("One-time prepay source"), {
      target: { value: "pf" },
    });

    expect(screen.getByText("Prepay from PF + keep EMI")).toBeInTheDocument();
    expect(
      screen.getByRole("option", { name: /One-time prepay \(PF\) \+ keep EMI/ }),
    ).toBeInTheDocument();
  });

  it("updates one-time prepay source labels when switching to gold", async () => {
    const user = userEvent.setup();
    render(<LoanSection />);

    await user.click(screen.getByRole("button", { name: /Load reference scenario/i }));

    fireEvent.change(screen.getByLabelText("One-time prepay source"), {
      target: { value: "gold" },
    });

    expect(screen.getByText("Prepay from gold + keep EMI")).toBeInTheDocument();
    expect(
      screen.getByRole("option", { name: /One-time prepay \(Gold\) \+ keep EMI/ }),
    ).toBeInTheDocument();
  });

  it("resets amortisation schedule view when prepay scenarios disappear", async () => {
    const user = userEvent.setup();
    render(<LoanSection />);
    await user.click(screen.getByRole("button", { name: /Load reference scenario/i }));

    const comboBoxes = screen.getAllByRole("combobox");
    expect(comboBoxes.length).toBeGreaterThanOrEqual(2);
    const scheduleSelect = comboBoxes[1]!;

    fireEvent.change(scheduleSelect, { target: { value: "PREPAY_TENURE" } });
    expect(scheduleSelect).toHaveValue("PREPAY_TENURE");

    fireEvent.change(screen.getByLabelText("One-time prepay source"), {
      target: { value: "gold" },
    });
    fireEvent.change(screen.getByLabelText(/Gold liquid/i), {
      target: { value: "" },
    });

    await waitFor(() => {
      const updated = screen.getAllByRole("combobox")[1];
      expect(updated).toHaveValue("BASE");
    });
  });
});

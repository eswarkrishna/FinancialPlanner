import { renderWithLocale } from "../../test/renderWithLocale";
import { fireEvent, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it } from "vitest";
import { LOAN_FORM_STORAGE_KEY } from "../../lib/persistence/loanFormState";
import { LoanSection } from "./LoanSection";

describe("LoanSection", () => {
  beforeEach(() => {
    localStorage.removeItem(LOAN_FORM_STORAGE_KEY);
  });
  it("starts without comparison tables until reference scenario is loaded", async () => {
    const user = userEvent.setup();
    renderWithLocale(<LoanSection />);

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
    renderWithLocale(<LoanSection />);

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
    renderWithLocale(<LoanSection />);

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
    renderWithLocale(<LoanSection />);
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

  it("shows BASE payoff at full tenure when reference scenario is loaded", async () => {
    const user = userEvent.setup();
    renderWithLocale(<LoanSection />);

    await user.click(screen.getByRole("button", { name: /Load reference scenario/i }));

    expect(screen.getByText("BASE", { selector: "td" })).toBeInTheDocument();
    const comparisonTable = screen
      .getByRole("heading", { name: "Loan scenario comparison" })
      .closest("section")!
      .querySelector("tbody")!;
    const baseRow = comparisonTable.querySelector("tr")!;
    expect(baseRow).toHaveTextContent("168");
    expect(screen.getByText(/BASE \+ .*salary sweep/i)).toBeInTheDocument();
    expect(screen.getByRole("option", { name: /Baseline \+ monthly salary sweep/i })).toBeInTheDocument();
  });
});

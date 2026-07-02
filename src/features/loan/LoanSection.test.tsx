import { renderWithLocale } from "../../test/renderWithLocale";
import { fireEvent, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it } from "vitest";
import { scenarioToJson } from "../../lib/export/scenarioJson";
import {
  LOAN_FORM_STORAGE_KEY,
  readLoanFormState,
} from "../../lib/persistence/loanFormState";
import { REFERENCE_SCENARIO_IN } from "../../lib/locale/constants";
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

  it("persists edited inputs across remount (§10 #19)", async () => {
    const user = userEvent.setup();
    const view = renderWithLocale(<LoanSection />);
    await user.click(screen.getByRole("button", { name: /Load reference scenario/i }));

    fireEvent.change(screen.getByLabelText("Principal (INR)"), {
      target: { value: "6000000" },
    });

    await waitFor(() => {
      expect(readLoanFormState("IN")?.inputs.principal_inr).toBe("6000000");
    });

    view.unmount();
    renderWithLocale(<LoanSection />);

    expect(screen.getByLabelText("Principal (INR)")).toHaveValue("6000000");
  });

  it("imports exported scenario JSON (§10 #20)", async () => {
    const user = userEvent.setup();
    renderWithLocale(<LoanSection />);

    const payload = {
      exported_at: "2026-01-01T00:00:00.000Z",
      scenario_id: "BASE",
      scenario_label: "BASE",
      inputs: { ...REFERENCE_SCENARIO_IN, prepay_source: "cash" },
      totals: {
        payoff_month: 168,
        total_interest_inr: 1,
        total_paid_inr: 2,
      },
    };
    const file = new File([scenarioToJson(payload)], "loan-scenario-base.json", {
      type: "application/json",
    });

    await user.click(screen.getByRole("button", { name: /Import scenario JSON/i }));
    const input = document.querySelector('input[type="file"]') as HTMLInputElement;
    await user.upload(input, file);

    await waitFor(() => {
      expect(screen.getByLabelText("Principal (INR)")).toHaveValue(
        String(REFERENCE_SCENARIO_IN.principal_inr),
      );
    });
    expect(
      screen.getByRole("heading", { name: "Loan scenario comparison" }),
    ).toBeInTheDocument();
  });

  it("shows import error for invalid JSON without mutating form (§10 #21)", async () => {
    const user = userEvent.setup();
    renderWithLocale(<LoanSection />);

    const file = new File(["not json"], "bad.json", { type: "application/json" });
    await user.click(screen.getByRole("button", { name: /Import scenario JSON/i }));
    const input = document.querySelector('input[type="file"]') as HTMLInputElement;
    await user.upload(input, file);

    expect(await screen.findByText(/Invalid JSON file/i)).toBeInTheDocument();
    expect(screen.getByLabelText("Principal (INR)")).toHaveValue("");
  });
});

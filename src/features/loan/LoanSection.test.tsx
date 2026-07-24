import { renderWithLocale } from "../../test/renderWithLocale";
import { fireEvent, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it } from "vitest";
import { scenarioToJson } from "../../lib/export/scenarioJson";
import {
  clearLoanFormState,
  readLoanFormState,
} from "../../lib/persistence/loanFormState";
import { REFERENCE_SCENARIO_IN } from "../../lib/locale/constants";
import { LoanSection } from "./LoanSection";

describe("LoanSection", () => {
  beforeEach(() => {
    clearLoanFormState();
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
      screen.getByRole("heading", { name: "Reduce EMI vs Reduce Tenure" }),
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
      screen.getByRole("radio", { name: /Prepay \+ EMI: One-time prepay \(PF\) \+ keep EMI/i }),
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
      screen.getByRole("radio", { name: /Prepay \+ EMI: One-time prepay \(Gold\) \+ keep EMI/i }),
    ).toBeInTheDocument();
  });

  it("resets amortisation schedule view when prepay scenarios disappear", async () => {
    const user = userEvent.setup();
    renderWithLocale(<LoanSection />);
    await user.click(screen.getByRole("button", { name: /Load reference scenario/i }));

    const prepayTenureCard = screen.getByRole("radio", {
      name: /Prepay \+ tenure: One-time prepay/i,
    });
    await user.click(prepayTenureCard);
    expect(prepayTenureCard).toHaveAttribute("aria-checked", "true");

    fireEvent.change(screen.getByLabelText("One-time prepay source"), {
      target: { value: "gold" },
    });
    fireEvent.change(screen.getByLabelText(/Gold liquid/i), {
      target: { value: "" },
    });

    await waitFor(() => {
      const baselineCard = screen.getByRole("radio", {
        name: /Baseline: No one-time prepay/i,
      });
      expect(baselineCard).toHaveAttribute("aria-checked", "true");
    });
  });

  it("shows BASE payoff at full tenure when reference scenario is loaded", async () => {
    const user = userEvent.setup();
    renderWithLocale(<LoanSection />);

    await user.click(screen.getByRole("button", { name: /Load reference scenario/i }));

    expect(screen.getByText("Baseline", { selector: "td" })).toBeInTheDocument();
    const comparisonTable = screen
      .getByRole("heading", { name: "Loan scenario comparison" })
      .closest("section")!
      .querySelector("tbody")!;
    const baseRow = comparisonTable.querySelector("tr")!;
    expect(baseRow).toHaveTextContent("168");
    expect(screen.getAllByText(/Baseline \+ .*salary sweep/i).length).toBeGreaterThan(0);
    expect(
      screen.getByRole("radio", { name: /Salary sweep: Baseline \+ monthly salary sweep/i }),
    ).toBeInTheDocument();
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

  it("selecting Reduce Tenure strategy updates schedule view (§10.51)", async () => {
    const user = userEvent.setup();
    renderWithLocale(<LoanSection />);
    await user.click(screen.getByRole("button", { name: /Load reference scenario/i }));

    const reduceTenure = screen.getByRole("button", {
      name: /Keep your EMI — loan ends sooner/i,
    });
    await user.click(reduceTenure);
    expect(reduceTenure).toHaveAttribute("aria-pressed", "true");

    const scheduleCard = screen.getByRole("radio", {
      name: /Prepay \+ EMI: One-time prepay/i,
    });
    expect(scheduleCard).toHaveAttribute("aria-checked", "true");
  });

  it("applies flat prepayment fee to net savings KPI (§10.48)", async () => {
    const user = userEvent.setup();
    renderWithLocale(<LoanSection />);
    await user.click(screen.getByRole("button", { name: /Load reference scenario/i }));

    fireEvent.change(screen.getByLabelText("Prepayment fee type"), {
      target: { value: "flat" },
    });
    fireEvent.change(screen.getByLabelText(/Prepayment fee \(INR\)/), {
      target: { value: "25000" },
    });

    await user.click(
      screen.getByRole("button", { name: /Keep your EMI — loan ends sooner/i }),
    );

    expect(screen.getAllByText("Net savings after fee").length).toBeGreaterThan(0);
    expect(screen.getAllByText("Gross interest saved").length).toBeGreaterThan(0);
  });

  it("saves a named scenario slot and shows it in the compare table (§10.97, §10.99)", async () => {
    localStorage.clear();
    const user = userEvent.setup();
    renderWithLocale(<LoanSection />);
    await user.click(screen.getByRole("button", { name: /Load reference scenario/i }));

    await user.type(screen.getByLabelText("Scenario name"), "Reference plan");
    await user.click(screen.getByRole("button", { name: "Save current" }));

    const table = within(screen.getByRole("region", { name: "Saved scenario comparison" }));
    expect(table.getByText("Current inputs")).toBeInTheDocument();
    const slotRow = table.getByText("Reference plan").closest("tr");
    expect(slotRow).not.toBeNull();
    // §10.99: slot recomputed from its own saved state — reference payoff month 168.
    expect(within(slotRow!).getByText("168")).toBeInTheDocument();
    expect(within(slotRow!).getByText("₹49,282.45")).toBeInTheDocument();
  });

  it("loads a saved slot to restore inputs and scenario view (§10.98)", async () => {
    localStorage.clear();
    const user = userEvent.setup();
    renderWithLocale(<LoanSection />);
    await user.click(screen.getByRole("button", { name: /Load reference scenario/i }));

    await user.type(screen.getByLabelText("Scenario name"), "Before edit");
    await user.click(screen.getByRole("button", { name: "Save current" }));

    fireEvent.change(screen.getByLabelText("Principal (INR)"), {
      target: { value: "6000000" },
    });
    expect(screen.getByLabelText("Principal (INR)")).toHaveValue("6000000");

    await user.click(screen.getByRole("button", { name: "Load scenario Before edit" }));
    expect(screen.getByLabelText("Principal (INR)")).toHaveValue("5000000");
  });

  it("keeps saved slots usable for recovery when current inputs are invalid (§4.9.1)", async () => {
    localStorage.clear();
    const user = userEvent.setup();
    renderWithLocale(<LoanSection />);
    await user.click(screen.getByRole("button", { name: /Load reference scenario/i }));

    await user.type(screen.getByLabelText("Scenario name"), "Recovery point");
    await user.click(screen.getByRole("button", { name: "Save current" }));

    // Break the form: empty principal → live models are gone.
    fireEvent.change(screen.getByLabelText("Principal (INR)"), {
      target: { value: "" },
    });
    expect(
      screen.queryByRole("heading", { name: "Loan scenario comparison" }),
    ).not.toBeInTheDocument();

    // Saved scenarios card still renders; save is disabled, load still works.
    expect(screen.getByRole("button", { name: "Save current" })).toBeDisabled();
    const table = within(screen.getByRole("region", { name: "Saved scenario comparison" }));
    expect(table.queryByText("Current inputs")).not.toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "Load scenario Recovery point" }));
    expect(screen.getByLabelText("Principal (INR)")).toHaveValue("5000000");
    expect(
      screen.getByRole("heading", { name: "Loan scenario comparison" }),
    ).toBeInTheDocument();
  });

  it("deletes a saved slot and rejects saves beyond the slot cap (§10.97)", async () => {
    localStorage.clear();
    const user = userEvent.setup();
    renderWithLocale(<LoanSection />);
    await user.click(screen.getByRole("button", { name: /Load reference scenario/i }));

    const nameInput = screen.getByLabelText("Scenario name");
    for (let i = 1; i <= 5; i += 1) {
      await user.clear(nameInput);
      await user.type(nameInput, `Plan ${i}`);
      await user.click(screen.getByRole("button", { name: "Save current" }));
    }

    await user.clear(nameInput);
    await user.type(nameInput, "Plan 6");
    await user.click(screen.getByRole("button", { name: "Save current" }));
    expect(
      screen.getByText(/All 5 slots are used/),
    ).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "Delete scenario Plan 1" }));
    expect(screen.queryByText("Plan 1")).not.toBeInTheDocument();
  });
});

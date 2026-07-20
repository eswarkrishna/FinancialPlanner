import { renderWithLocale } from "../../test/renderWithLocale";
import { fireEvent, screen, waitFor } from "@testing-library/react";
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
    expect(screen.getByText(/BASE \+ .*salary sweep/i)).toBeInTheDocument();
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
});

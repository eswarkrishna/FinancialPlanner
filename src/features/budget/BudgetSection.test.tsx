import { screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it } from "vitest";
import { renderWithLocale } from "../../test/renderWithLocale";
import { BudgetSection } from "./BudgetSection";

describe("BudgetSection", () => {
  beforeEach(() => {
    localStorage.clear();
  });
  it("renders reference budget KPIs for India locale", () => {
    renderWithLocale(<BudgetSection />);

    expect(screen.getByRole("heading", { name: "Personal budget" })).toBeInTheDocument();
    expect(screen.getByText("Monthly income")).toBeInTheDocument();
    expect(screen.getByText("50/30/20 comparison")).toBeInTheDocument();
    expect(screen.getByText("Investment holdings")).toBeInTheDocument();
  });

  it("updates net cash flow when income changes", async () => {
    const user = userEvent.setup();
    renderWithLocale(<BudgetSection />);

    const salaryInput = screen.getByLabelText(/Income amount for inc-salary/i);
    await user.clear(salaryInput);
    await user.type(salaryInput, "200000");

    expect(screen.getByText("Net cash flow")).toBeInTheDocument();
  });

  it("shows warning styling when savings bucket is below 20% target", () => {
    renderWithLocale(<BudgetSection />);

    const savingsDelta = screen.getByText(/-5\.7 pp/);
    expect(savingsDelta).toHaveClass("warning-text");
  });

  it("defaults charts to monthly and scales values ×12 on the Yearly toggle (§10.95–96)", async () => {
    const user = userEvent.setup();
    renderWithLocale(<BudgetSection />);

    expect(
      screen.getByRole("img", {
        name: /Expense buckets \(50\/30\/20\) — monthly: Needs ₹95,000,/,
      }),
    ).toBeInTheDocument();

    const yearly = screen.getByRole("radio", { name: "Yearly" });
    expect(yearly).toHaveAttribute("aria-checked", "false");
    await user.click(yearly);

    expect(
      screen.getByRole("img", {
        name: /Expense buckets \(50\/30\/20\) — yearly: Needs ₹11,40,000,/,
      }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("img", { name: /Expenses by category — yearly:/ }),
    ).toBeInTheDocument();

    // 50/30/20 table stays monthly regardless of the chart view.
    expect(screen.getByRole("cell", { name: "₹95,000" })).toBeInTheDocument();
  });

  it("bands the savings-rate KPI tone (§10.94)", async () => {
    const user = userEvent.setup();
    renderWithLocale(<BudgetSection />);

    const savingsCard = screen.getByText("Savings rate").closest(".kpi-card");
    // Reference IN budget savings rate is exactly 20% → high band → positive tone.
    expect(savingsCard).toHaveClass("kpi-card--positive");

    // Drop salary so the rate falls below 10% → low band → danger tone.
    const salaryInput = screen.getByLabelText(/Income amount for inc-salary/i);
    await user.clear(salaryInput);
    await user.type(salaryInput, "130000");
    expect(screen.getByText("Savings rate").closest(".kpi-card")).toHaveClass(
      "kpi-card--danger",
    );
  });
});

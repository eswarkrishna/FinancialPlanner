import { screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it } from "vitest";
import { renderWithLocale } from "../../test/renderWithLocale";
import { BudgetSection } from "./BudgetSection";

describe("BudgetSection", () => {
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
});

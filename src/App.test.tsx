import { screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it } from "vitest";
import { renderWithLocale } from "./test/renderWithLocale";
import { App } from "./App";

describe("App shell composition", () => {
  it("renders tab navigation and shows only the loan planner by default", () => {
    renderWithLocale(<App />);

    expect(screen.getByRole("heading", { name: "FinancialPlanner" })).toBeInTheDocument();
    expect(screen.getByRole("tab", { name: "Loan" })).toHaveAttribute(
      "aria-selected",
      "true",
    );
    expect(screen.getByRole("heading", { name: "Loan & assets" })).toBeInTheDocument();
    expect(
      screen.queryByRole("heading", { name: "Debt payoff planner" }),
    ).not.toBeInTheDocument();
    expect(
      screen.getByText(/Educational planning only\. EPF withdrawal eligibility/),
    ).toBeInTheDocument();
    expect(screen.getByText("Terms and conditions")).toBeInTheDocument();
  });

  it("switches planners via tabs", async () => {
    const user = userEvent.setup();
    renderWithLocale(<App />);

    await user.click(screen.getByRole("tab", { name: "Multi-debt" }));
    expect(screen.getByRole("heading", { name: "Debt payoff planner" })).toBeInTheDocument();
    expect(screen.queryByRole("heading", { name: "Loan & assets" })).not.toBeInTheDocument();

    await user.click(screen.getByRole("tab", { name: "Retirement" }));
    expect(screen.getByRole("heading", { name: "Retirement planner" })).toBeInTheDocument();

    await user.click(screen.getByRole("tab", { name: "Strategies" }));
    expect(screen.getByRole("heading", { name: "Repayment strategies" })).toBeInTheDocument();

    await user.click(screen.getByRole("tab", { name: "Strategic" }));
    expect(
      screen.getByRole("heading", { name: "Strategic scenarios" }),
    ).toBeInTheDocument();
  });
});

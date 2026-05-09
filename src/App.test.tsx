import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { App } from "./App";

describe("App shell composition", () => {
  it("renders all planner sections with footer disclaimer", () => {
    render(<App />);

    expect(
      screen.getByRole("heading", { name: "FinancialPlanner Dashboard" }),
    ).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Loan & assets" })).toBeInTheDocument();
    expect(
      screen.getByRole("heading", { name: "Debt payoff planner" }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("heading", { name: "Retirement planner" }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("heading", {
        name: /Repayment strategy planner/,
      }),
    ).toBeInTheDocument();
    expect(
      screen.getByText(/Educational planning only\. EPF withdrawal eligibility/),
    ).toBeInTheDocument();
  });
});

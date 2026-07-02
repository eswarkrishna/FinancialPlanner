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
    expect(window.location.search).toBe("?tab=debt");
    expect(document.title).toBe("FinancialPlanner — Multi-debt");

    await user.click(screen.getByRole("tab", { name: "Retirement" }));
    expect(screen.getByRole("heading", { name: "Retirement planner" })).toBeInTheDocument();
    expect(window.location.search).toBe("?tab=retirement");

    await user.click(screen.getByRole("tab", { name: "Strategies" }));
    expect(screen.getByRole("heading", { name: "Repayment strategies" })).toBeInTheDocument();

    await user.click(screen.getByRole("tab", { name: "Strategic" }));
    expect(
      screen.getByRole("heading", { name: "Strategic scenarios" }),
    ).toBeInTheDocument();

    await user.click(screen.getByRole("tab", { name: "Loan" }));
    expect(window.location.search).toBe("");
    expect(document.title).toBe("FinancialPlanner — Loan");
  });

  it("opens the tab from the URL query param", () => {
    window.history.replaceState({}, "", "/?tab=strategies");
    renderWithLocale(<App />);

    expect(screen.getByRole("tab", { name: "Strategies" })).toHaveAttribute(
      "aria-selected",
      "true",
    );
    expect(screen.getByRole("heading", { name: "Repayment strategies" })).toBeInTheDocument();
  });

  it("normalizes ?tab=loan to the canonical loan URL", () => {
    window.history.replaceState({}, "", "/?tab=loan");
    renderWithLocale(<App />);

    expect(screen.getByRole("tab", { name: "Loan" })).toHaveAttribute(
      "aria-selected",
      "true",
    );
    expect(window.location.search).toBe("");
  });
});

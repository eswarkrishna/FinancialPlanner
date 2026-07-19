import { screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { renderWithLocale } from "./test/renderWithLocale";
import { App } from "./App";
import {
  LAST_SEEN_COMMIT_SHA_KEY,
  RELEASE_CONSENT_LEAD,
  RELEASE_NOTIFICATION_CONSENT_KEY,
} from "./lib/notifications/constants";
import * as buildInfo from "./lib/buildInfo";

function mockNotificationApi() {
  class MockNotification {
    static permission: NotificationPermission = "default";
    static requestPermission = vi.fn(async () => "granted" as NotificationPermission);
  }
  Object.defineProperty(window, "Notification", {
    configurable: true,
    writable: true,
    value: MockNotification,
  });
}

describe("App shell composition", () => {
  it("renders tab navigation and shows only the loan planner by default", () => {
    renderWithLocale(<App />);

    expect(document.querySelector(".app-brand-name")).toHaveTextContent("FinancialPlanner");
    expect(
      screen.getByRole("heading", { level: 1, name: "Loan EMI Calculator with Prepayment" }),
    ).toBeInTheDocument();
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

  it("has exactly one h1 matching the active tab keyword (§10.56)", async () => {
    const user = userEvent.setup();
    renderWithLocale(<App />);

    const tabHeadings: Array<{ tab: string; h1: string }> = [
      { tab: "Loan", h1: "Loan EMI Calculator with Prepayment" },
      { tab: "Multi-debt", h1: "Debt Avalanche vs Snowball Calculator" },
      { tab: "Retirement", h1: "Retirement Corpus & SIP Calculator" },
      { tab: "Strategies", h1: "Loan Repayment Strategy Comparison" },
      { tab: "Strategic", h1: "Loan Payoff Game Theory Explorer" },
      { tab: "Budget", h1: "Budget Planner with 50/30/20 Rule" },
    ];

    for (const { tab, h1 } of tabHeadings) {
      await user.click(screen.getByRole("tab", { name: tab }));
      const headings = screen.getAllByRole("heading", { level: 1 });
      expect(headings).toHaveLength(1);
      expect(headings[0]).toHaveTextContent(h1);
    }
  });

  it("switches planners via tabs", async () => {
    const user = userEvent.setup();
    renderWithLocale(<App />);

    await user.click(screen.getByRole("tab", { name: "Multi-debt" }));
    expect(screen.getByRole("heading", { name: "Debt payoff planner" })).toBeInTheDocument();
    expect(window.location.pathname).toBe("/debt");
    expect(document.title).toBe("Debt Avalanche vs Snowball Calculator | FinancialPlanner");

    await user.click(screen.getByRole("tab", { name: "Retirement" }));
    expect(screen.getByRole("heading", { name: "Retirement planner" })).toBeInTheDocument();
    expect(window.location.pathname).toBe("/retirement");

    await user.click(screen.getByRole("tab", { name: "Strategies" }));
    expect(screen.getByRole("heading", { name: "Repayment strategies" })).toBeInTheDocument();

    await user.click(screen.getByRole("tab", { name: "Strategic" }));
    expect(
      screen.getByRole("heading", { name: "Strategic scenarios" }),
    ).toBeInTheDocument();

    await user.click(screen.getByRole("tab", { name: "Loan" }));
    expect(window.location.pathname).toBe("/");
    expect(document.title).toBe("Loan EMI Calculator with Prepayment | FinancialPlanner");
  });

  it("opens the tab from a path URL", () => {
    window.history.replaceState({}, "", "/strategies");
    renderWithLocale(<App />);

    expect(screen.getByRole("tab", { name: "Strategies" })).toHaveAttribute(
      "aria-selected",
      "true",
    );
    expect(screen.getByRole("heading", { name: "Repayment strategies" })).toBeInTheDocument();
  });

  it("redirects legacy ?tab= query to path slug", () => {
    window.history.replaceState({}, "", "/?tab=strategies&utm_source=legacy");
    renderWithLocale(<App />);

    expect(screen.getByRole("tab", { name: "Strategies" })).toHaveAttribute(
      "aria-selected",
      "true",
    );
    expect(window.location.pathname).toBe("/strategies");
    expect(window.location.search).toBe("?utm_source=legacy");
  });

  it("normalizes ?tab=loan to the canonical home URL", () => {
    window.history.replaceState({}, "", "/?tab=loan");
    renderWithLocale(<App />);

    expect(screen.getByRole("tab", { name: "Loan" })).toHaveAttribute(
      "aria-selected",
      "true",
    );
    expect(window.location.pathname).toBe("/");
    expect(window.location.search).toBe("");
  });

  it("moves focus between tabs with arrow keys", async () => {
    const user = userEvent.setup();
    renderWithLocale(<App />);

    const loanTab = screen.getByRole("tab", { name: "Loan" });
    loanTab.focus();
    await user.keyboard("{ArrowRight}");

    expect(screen.getByRole("tab", { name: "Multi-debt" })).toHaveFocus();
    expect(screen.getByRole("tab", { name: "Multi-debt" })).toHaveAttribute(
      "aria-selected",
      "true",
    );
    expect(window.location.pathname).toBe("/debt");
  });
});

describe("release notifications (§4.15)", () => {
  beforeEach(() => {
    localStorage.clear();
    mockNotificationApi();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("shows release notification consent until dismissed", () => {
    renderWithLocale(<App />);
    expect(screen.getByText(RELEASE_CONSENT_LEAD)).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: /enable notifications/i }),
    ).toBeInTheDocument();
  });

  it("hides consent after No thanks", async () => {
    const user = userEvent.setup();
    renderWithLocale(<App />);

    await user.click(screen.getByRole("button", { name: /no thanks/i }));

    expect(screen.queryByText(RELEASE_CONSENT_LEAD)).not.toBeInTheDocument();
    expect(localStorage.getItem(RELEASE_NOTIFICATION_CONSENT_KEY)).toBe("reject");
  });

  it("shows new version banner when last seen sha differs from build", () => {
    localStorage.setItem(RELEASE_NOTIFICATION_CONSENT_KEY, "accept");
    localStorage.setItem(LAST_SEEN_COMMIT_SHA_KEY, "old-sha");
    vi.spyOn(buildInfo, "getBuildInfo").mockReturnValue({
      commitSha: "new-sha",
      commitShort: "new5678",
      commitIsoDate: "2026-07-08T10:00:00.000Z",
      githubRepo: "eswarkrishna/FinancialPlanner",
    });

    renderWithLocale(<App />);

    expect(screen.getByText(/A new version is available/i)).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /^reload$/i })).toBeInTheDocument();
  });
});

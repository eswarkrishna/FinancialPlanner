import { screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { axe } from "vitest-axe";
import { describe, expect, it } from "vitest";
import { renderWithLocale } from "./renderWithLocale";
import { App } from "../App";
import { PLANNER_TABS } from "../lib/seo";

async function expectNoA11yViolations(container: HTMLElement) {
  const results = await axe(container);
  expect(results).toHaveNoViolations();
}

describe("accessibility", () => {
  it("loan tab has no axe violations", async () => {
    const { container } = renderWithLocale(<App />);
    await expectNoA11yViolations(container);
  });

  it.each(
    PLANNER_TABS.filter((tab) => tab.id !== "loan").map((tab) => [tab.label, tab.id] as const),
  )("%s tab has no axe violations", async (label) => {
    const user = userEvent.setup();
    const { container } = renderWithLocale(<App />);
    await user.click(screen.getByRole("tab", { name: label }));
    await expectNoA11yViolations(container);
  });
});

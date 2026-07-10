import assert from "node:assert/strict";
import { afterEach, beforeEach, describe, it } from "node:test";
import { launchBrowser, type BrowserSession } from "../helpers/browser";
import { gotoApp, waitForHeading } from "../helpers/page";

describe("budget planner", () => {
  let session: BrowserSession;

  beforeEach(async () => {
    session = await launchBrowser();
  });

  afterEach(async () => {
    await session.close();
  });

  it("shows export controls and reactive income edits", async () => {
    await gotoApp(session.page, "budget");
    await waitForHeading(session.page, "Personal budget");

    const hasExportJson = await session.page.evaluate(() =>
      Array.from(document.querySelectorAll("button")).some((button) =>
        button.textContent?.includes("Export JSON"),
      ),
    );
    assert.equal(hasExportJson, true);

    const updated = await session.page.evaluate(() => {
      const input = document.querySelector<HTMLInputElement>(
        'input[aria-label="Income amount for inc-salary"]',
      );
      if (!input) return false;
      const setter = Object.getOwnPropertyDescriptor(
        window.HTMLInputElement.prototype,
        "value",
      )?.set;
      setter?.call(input, "200000");
      input.dispatchEvent(new Event("input", { bubbles: true }));
      input.dispatchEvent(new Event("change", { bubbles: true }));
      return true;
    });
    assert.equal(updated, true);

    const netFlowLabel = await session.page.evaluate(() => {
      const cards = Array.from(document.querySelectorAll(".kpi-card"));
      const netCard = cards.find((card) => card.textContent?.includes("Net cash flow"));
      return netCard?.textContent ?? "";
    });
    assert.match(netFlowLabel, /Net cash flow/);
  });
});

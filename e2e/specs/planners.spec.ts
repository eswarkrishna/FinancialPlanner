import assert from "node:assert/strict";
import { afterEach, beforeEach, describe, it } from "node:test";
import { launchBrowser, type BrowserSession } from "../helpers/browser";
import { clickTab, gotoApp, waitForHeading } from "../helpers/page";

describe("planner sections", () => {
  let session: BrowserSession;

  beforeEach(async () => {
    session = await launchBrowser();
  });

  afterEach(async () => {
    await session.close();
  });

  it("renders debt comparison after opening multi-debt tab", async () => {
    await gotoApp(session.page, "debt");
    await waitForHeading(session.page, "Debt payoff planner");
    await waitForHeading(session.page, "Debt strategy comparison");
  });

  it("renders retirement scenarios", async () => {
    await gotoApp(session.page, "retirement");
    await waitForHeading(session.page, "Retirement planner");
    await waitForHeading(session.page, "Retirement scenarios");
  });

  it("renders strategy comparison on strategies tab", async () => {
    await gotoApp(session.page, "strategies");
    await waitForHeading(session.page, "Repayment strategies");
    await waitForHeading(session.page, "Strategy comparison");
  });

  it("renders payoff matrix on strategic tab", async () => {
    await gotoApp(session.page, "strategic");
    await waitForHeading(session.page, "Strategic scenarios");

    const hasMatrix = await session.page.evaluate(() =>
      Array.from(document.querySelectorAll("h2")).some(
        (heading) => heading.textContent?.trim() === "Payoff matrix",
      ),
    );
    assert.equal(hasMatrix, true);
  });

  it("renders budget planner on budget tab", async () => {
    await gotoApp(session.page, "budget");
    await waitForHeading(session.page, "Personal budget");
    await waitForHeading(session.page, "50/30/20 comparison");
  });

  it("can return to loan tab from another section", async () => {
    await gotoApp(session.page, "debt");
    await clickTab(session.page, "loan");
    await waitForHeading(session.page, "Loan & assets");
  });
});

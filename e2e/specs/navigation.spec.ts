import assert from "node:assert/strict";
import { afterEach, beforeEach, describe, it } from "node:test";
import { launchBrowser, type BrowserSession } from "../helpers/browser";
import { clickTab, gotoApp, TAB_IDS, waitForHeading } from "../helpers/page";

const TAB_HEADINGS: Record<(typeof TAB_IDS)[number], string> = {
  loan: "Loan & assets",
  debt: "Debt payoff planner",
  retirement: "Retirement planner",
  ppf: "PPF maturity calculator",
  sip: "SIP calculator",
  ssy: "SSY maturity calculator",
  gratuity: "Gratuity calculator",
  strategies: "Repayment strategies",
  strategic: "Strategic scenarios",
  budget: "Personal budget",
};

describe("planner navigation", () => {
  let session: BrowserSession;

  beforeEach(async () => {
    session = await launchBrowser();
  });

  afterEach(async () => {
    await session.close();
  });

  for (const tabId of TAB_IDS) {
    it(`opens the ${tabId} tab from the URL`, async () => {
      await gotoApp(session.page, tabId);
      await waitForHeading(session.page, TAB_HEADINGS[tabId]);
    });
  }

  it("updates the URL when switching tabs", async () => {
    await gotoApp(session.page);

    await clickTab(session.page, "debt");
    const debtUrl = session.page.url();
    assert.match(debtUrl, /\/debt\/?(\?|$|#)/);

    await clickTab(session.page, "loan");
    const loanUrl = session.page.url();
    assert.doesNotMatch(loanUrl, /\/debt/);
  });

  it("moves focus with arrow keys on the tab list", async () => {
    await session.page.setViewport({ width: 900, height: 900 });
    await gotoApp(session.page);

    await session.page.focus("#tab-loan");
    await session.page.keyboard.press("ArrowRight");

    const focusedId = await session.page.evaluate(
      () => document.activeElement?.id ?? "",
    );
    assert.equal(focusedId, "tab-debt");
  });
});

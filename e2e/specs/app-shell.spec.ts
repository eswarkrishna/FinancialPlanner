import assert from "node:assert/strict";
import { afterEach, beforeEach, describe, it } from "node:test";
import { launchBrowser, type BrowserSession } from "../helpers/browser";
import { gotoApp } from "../helpers/page";

describe("app shell", () => {
  let session: BrowserSession;

  beforeEach(async () => {
    session = await launchBrowser();
  });

  afterEach(async () => {
    await session.close();
  });

  it("renders the planner shell and disclaimer footer", async () => {
    await gotoApp(session.page);

    const title = await session.page.$eval("h1", (element) => element.textContent?.trim());
    assert.equal(title, "Loan EMI Calculator with Prepayment");

    const disclaimer = await session.page.evaluate(() =>
      document.body.textContent?.includes("Educational planning only"),
    );
    assert.equal(disclaimer, true);

    const terms = await session.page.evaluate(() =>
      Array.from(document.querySelectorAll("summary")).some(
        (element) => element.textContent?.trim() === "Terms and conditions",
      ),
    );
    assert.equal(terms, true);
  });

  it("shows build metadata in the footer when built from git", async () => {
    await gotoApp(session.page);

    const footerMeta = await session.page.evaluate(() => {
      const meta = document.querySelector(".footer-meta");
      return meta?.textContent ?? "";
    });

    if (footerMeta.includes("Latest push")) {
      const link = await session.page.$(".footer-meta a[href*='github.com']");
      assert.ok(link, "expected footer commit link when build metadata is present");
    }
  });
});

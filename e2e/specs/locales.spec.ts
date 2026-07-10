import assert from "node:assert/strict";
import { afterEach, beforeEach, describe, it } from "node:test";
import { launchBrowser, type BrowserSession } from "../helpers/browser";
import { clickAriaLabel, clickButtonByLabel, gotoApp, waitForHeading } from "../helpers/page";

describe("locale switching", () => {
  let session: BrowserSession;

  beforeEach(async () => {
    session = await launchBrowser();
  });

  afterEach(async () => {
    await session.close();
  });

  it("switches to US locale and updates labels", async () => {
    await gotoApp(session.page);

    await clickAriaLabel(session.page, "United States (USD)");
    await session.page.waitForFunction(
      () => document.documentElement.lang === "en-US",
      { timeout: 5_000 },
    );

    const principalLabel = await session.page.evaluate(() => {
      const label = Array.from(document.querySelectorAll("label")).find((element) =>
        element.textContent?.includes("Principal"),
      );
      return label?.textContent ?? "";
    });
    assert.match(principalLabel, /USD/);
  });

  it("switches to UK locale and updates labels", async () => {
    await gotoApp(session.page);

    await clickAriaLabel(session.page, "United Kingdom (GBP)");
    await session.page.waitForFunction(
      () => document.documentElement.lang === "en-GB",
      { timeout: 5_000 },
    );

    const principalLabel = await session.page.evaluate(() => {
      const label = Array.from(document.querySelectorAll("label")).find((element) =>
        element.textContent?.includes("Principal"),
      );
      return label?.textContent ?? "";
    });
    assert.match(principalLabel, /GBP/);
  });

  it("restores India locale", async () => {
    await gotoApp(session.page);

    await clickAriaLabel(session.page, "United States (USD)");
    await clickAriaLabel(session.page, "India (INR)");
    await session.page.waitForFunction(
      () => document.documentElement.lang === "en-IN",
      { timeout: 5_000 },
    );

    await clickButtonByLabel(session.page, "Load reference scenario");
    await waitForHeading(session.page, "Loan scenario comparison");
  });
});

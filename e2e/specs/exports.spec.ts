import assert from "node:assert/strict";
import { afterEach, beforeEach, describe, it } from "node:test";
import { launchBrowser, type BrowserSession } from "../helpers/browser";
import { clickButtonByLabel, gotoApp, waitForHeading } from "../helpers/page";

describe("exports", () => {
  let session: BrowserSession;

  beforeEach(async () => {
    session = await launchBrowser();
  });

  afterEach(async () => {
    await session.close();
  });

  it("enables schedule export controls after loading reference scenario", async () => {
    await gotoApp(session.page);
    await clickButtonByLabel(session.page, "Load reference scenario");
    await waitForHeading(session.page, "Loan amortisation schedule");

    const exportButtons = await session.page.evaluate(() =>
      Array.from(document.querySelectorAll("button"))
        .map((button) => button.textContent?.trim() ?? "")
        .filter((label) => label === "Export CSV" || label === "Export JSON"),
    );

    assert.deepEqual(exportButtons.sort(), ["Export CSV", "Export JSON"]);
  });
});

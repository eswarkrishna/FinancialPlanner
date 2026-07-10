import assert from "node:assert/strict";
import { afterEach, beforeEach, describe, it } from "node:test";
import { launchBrowser, type BrowserSession } from "../helpers/browser";
import { clickButtonByLabel, dismissConsentBanners, gotoApp, setLabeledInput } from "../helpers/page";

describe("loan form persistence", () => {
  let session: BrowserSession;

  beforeEach(async () => {
    session = await launchBrowser();
  });

  afterEach(async () => {
    await session.close();
  });

  it("restores edited principal after reload", async () => {
    await gotoApp(session.page);
    await clickButtonByLabel(session.page, "Load reference scenario");

    await setLabeledInput(session.page, "Principal (INR)", "6000000");

    await session.page.reload({ waitUntil: "networkidle0" });
    await dismissConsentBanners(session.page);

    const restored = await session.page.evaluate(() => {
      const label = Array.from(document.querySelectorAll("label")).find((element) =>
        element.textContent?.includes("Principal (INR)"),
      );
      return label?.querySelector("input")?.value ?? "";
    });

    assert.equal(restored, "6000000");
  });
});

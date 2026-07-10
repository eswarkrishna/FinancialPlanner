import assert from "node:assert/strict";
import { afterEach, beforeEach, describe, it } from "node:test";
import { launchBrowser, type BrowserSession } from "../helpers/browser";
import {
  clickButtonByLabel,
  getComparisonPayoffMonth,
  gotoApp,
  setLabeledInput,
  waitForHeading,
} from "../helpers/page";

describe("loan planner", () => {
  let session: BrowserSession;

  beforeEach(async () => {
    session = await launchBrowser();
  });

  afterEach(async () => {
    await session.close();
  });

  it("loads the reference scenario and shows BASE payoff at month 168", async () => {
    await gotoApp(session.page);

    await clickButtonByLabel(session.page, "Load reference scenario");
    await waitForHeading(session.page, "Loan scenario comparison");
    await waitForHeading(session.page, "Loan amortisation schedule");

    const payoffMonth = await getComparisonPayoffMonth(session.page);
    assert.equal(payoffMonth, "168");

    const hasSalarySweep = await session.page.evaluate(() =>
      /salary sweep/i.test(document.body.textContent ?? ""),
    );
    assert.equal(hasSalarySweep, true);
  });

  it("recalculates when monthly cash to loan changes", async () => {
    await gotoApp(session.page);
    await clickButtonByLabel(session.page, "Load reference scenario");
    await waitForHeading(session.page, "Loan scenario comparison");

    await setLabeledInput(session.page, "Monthly cash to loan", "50000");

    await session.page.waitForFunction(() => {
      const section = Array.from(document.querySelectorAll("h2"))
        .find((heading) => heading.textContent?.trim() === "Loan scenario comparison")
        ?.closest("section");
      const rows = section ? Array.from(section.querySelectorAll("tbody tr")) : [];
      return rows.some((row) => /to loan/i.test(row.textContent ?? ""));
    });

    const inflowPayoff = await session.page.evaluate(() => {
      const section = Array.from(document.querySelectorAll("h2"))
        .find((heading) => heading.textContent?.trim() === "Loan scenario comparison")
        ?.closest("section");
      const row = Array.from(section?.querySelectorAll("tbody tr") ?? []).find((entry) =>
        /to loan/i.test(entry.textContent ?? ""),
      );
      const cells = row ? Array.from(row.querySelectorAll("td")) : [];
      return Number(cells[1]?.textContent?.trim() ?? "0");
    });

    assert.ok(inflowPayoff > 0);
    assert.ok(inflowPayoff < 168);
  });
});

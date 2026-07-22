import assert from "node:assert/strict";
import { afterEach, beforeEach, describe, it } from "node:test";
import { launchBrowser, type BrowserSession } from "../helpers/browser";
import { gotoApp } from "../helpers/page";

describe("mobile layout (360px)", () => {
  let session: BrowserSession;

  beforeEach(async () => {
    session = await launchBrowser();
    await session.page.setViewport({ width: 360, height: 800 });
  });

  afterEach(async () => {
    await session.close();
  });

  it("loan form has no horizontal overflow at narrow width", async () => {
    await gotoApp(session.page);

    const overflow = await session.page.evaluate(() => {
      const form = document.querySelector(".form-grid");
      if (!form) return { ok: false, reason: "missing form-grid" };
      const rect = form.getBoundingClientRect();
      const overflows = rect.right > window.innerWidth + 1;
      return { ok: !overflows, scrollWidth: form.scrollWidth, viewport: window.innerWidth };
    });

    assert.equal(overflow.ok, true, JSON.stringify(overflow));
  });

  it("locale switcher stays visible and reachable", async () => {
    await gotoApp(session.page);

    const locale = await session.page.$(".locale-segment");
    assert.ok(locale);

    const box = await locale!.boundingBox();
    assert.ok(box);
    assert.ok(box!.width > 0);
    assert.ok(box!.x >= 0);
    assert.ok(box!.x + box!.width <= 360.5);
  });

  it("explainer appears after calculator section", async () => {
    await gotoApp(session.page);

    const order = await session.page.evaluate(() => {
      const panel = document.querySelector("#panel-loan");
      if (!panel) return null;
      const explainer = panel.querySelector(".tab-explainer");
      const calculator = panel.querySelector(".card");
      if (!explainer || !calculator) return null;
      const explainerTop = explainer.getBoundingClientRect().top;
      const calculatorTop = calculator.getBoundingClientRect().top;
      return explainerTop > calculatorTop;
    });

    assert.equal(order, true);
  });
});

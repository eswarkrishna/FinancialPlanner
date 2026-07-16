import { describe, expect, it } from "vitest";
import { GUIDE_PAGES } from "../content/guides";
import { buildGuidePageHtml, buildGuidesHubHtml } from "./guidePages";
import { tabPageUrl } from "./seo";

describe("guidePages", () => {
  const site = "https://example.com/app";

  it("builds hub HTML with all guide links", () => {
    const html = buildGuidesHubHtml(site);
    expect(html).toContain("Financial planning guides");
    for (const guide of GUIDE_PAGES) {
      expect(html).toContain(guide.slug);
    }
  });

  it("builds guide page with calculator CTA", () => {
    const guide = GUIDE_PAGES[0]!;
    const html = buildGuidePageHtml(guide, site);
    expect(html).toContain(guide.title);
    expect(html).toContain("Open interactive calculator");
    expect(html).toContain(tabPageUrl(guide.tab, site).replace(site, ""));
  });
});

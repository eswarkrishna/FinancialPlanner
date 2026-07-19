/**
 * One-off browser axe audit across all planner tabs.
 * Run: npm run audit:a11y (dev server on :5173 required)
 */
import puppeteer from "puppeteer";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import path from "node:path";
import { PLANNER_TABS, tabPathname } from "../src/lib/seo.ts";

const axeSource = readFileSync(
  path.join(path.dirname(fileURLToPath(import.meta.url)), "../node_modules/axe-core/axe.min.js"),
  "utf8",
);

async function auditTab(
  page: import("puppeteer").Page,
  tabId: (typeof PLANNER_TABS)[number]["id"],
  dark = false,
) {
  const url = `http://localhost:5173${tabPathname(tabId)}`;
  await page.emulateMediaFeatures([
    { name: "prefers-color-scheme", value: dark ? "dark" : "light" },
  ]);
  await page.goto(url, { waitUntil: "networkidle0" });
  await page.addScriptTag({ content: axeSource });
  const results = await page.evaluate(async () => {
    // @ts-expect-error injected axe
    return await window.axe.run(document, {
      runOnly: {
        type: "tag",
        values: ["wcag2a", "wcag2aa", "wcag21a", "wcag21aa", "best-practice"],
      },
    });
  });
  return results;
}

async function main() {
  const browser = await puppeteer.launch({
    headless: true,
    args: ["--no-sandbox", "--disable-setuid-sandbox"],
  });
  const page = await browser.newPage();
  let totalViolations = 0;

  for (const dark of [false, true]) {
    const mode = dark ? "dark" : "light";
    for (const tab of PLANNER_TABS) {
      const results = await auditTab(page, tab.id, dark);
      const violations = results.violations ?? [];
      totalViolations += violations.length;
      console.log(
        `\n=== ${tab.id.toUpperCase()} (${mode}, ${violations.length} violations) ===`,
      );
      for (const v of violations) {
        console.log(`\n[${v.impact}] ${v.id}: ${v.help}`);
        console.log(`  ${v.helpUrl}`);
        for (const node of v.nodes.slice(0, 5)) {
          console.log(`  - ${node.html.slice(0, 120)}`);
          if (node.failureSummary) console.log(`    ${node.failureSummary}`);
        }
        if (v.nodes.length > 5) console.log(`  ... and ${v.nodes.length - 5} more`);
      }
    }
  }

  await browser.close();
  process.exit(totalViolations > 0 ? 1 : 0);
}

main().catch((err) => {
  console.error(err);
  process.exit(2);
});

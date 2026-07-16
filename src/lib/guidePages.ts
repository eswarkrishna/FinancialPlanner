import { GUIDE_PAGES, guidePageUrl, type GuidePage } from "../content/guides";
import { SITE_NAME, tabPageUrl } from "./seo";
function escapeHtml(text: string): string {
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

/** Static crawlable HTML for a guide (§8 content hub). */
export function buildGuidePageHtml(guide: GuidePage, siteUrl: string): string {
  const canonical = guidePageUrl(guide.slug, siteUrl);
  const calculatorUrl = tabPageUrl(guide.tab, siteUrl);
  const sections = guide.sections
    .map(
      (section) =>
        `<h2>${escapeHtml(section.heading)}</h2>\n<p>${escapeHtml(section.body)}</p>`,
    )
    .join("\n");

  return `<!DOCTYPE html>
<html lang="en-IN">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>${escapeHtml(guide.title)} | ${SITE_NAME}</title>
  <meta name="description" content="${escapeHtml(guide.description)}" />
  <link rel="canonical" href="${canonical}" />
  <meta property="og:title" content="${escapeHtml(guide.title)}" />
  <meta property="og:description" content="${escapeHtml(guide.description)}" />
  <meta property="og:url" content="${canonical}" />
  <meta name="theme-color" content="#0d9488" />
  <style>
    body { font-family: system-ui, sans-serif; max-width: 42rem; margin: 2rem auto; padding: 0 1rem; line-height: 1.6; color: #0f172a; }
    a { color: #0d9488; }
    .cta { display: inline-block; margin: 1rem 0; padding: 0.65rem 1rem; background: #0d9488; color: #fff; text-decoration: none; border-radius: 8px; font-weight: 600; }
    .hub { margin-top: 2rem; font-size: 0.9rem; color: #64748b; }
  </style>
</head>
<body>
  <nav><a href="${tabPageUrl("guides", siteUrl)}">← All guides</a></nav>
  <h1>${escapeHtml(guide.title)}</h1>
  <p>${escapeHtml(guide.description)}</p>
  ${sections}
  <p><a class="cta" href="${calculatorUrl}">Open interactive calculator</a></p>
  <p class="hub">More guides: <a href="${tabPageUrl("guides", siteUrl)}">Planning guides hub</a> · <a href="${tabPageUrl("loan", siteUrl)}">${SITE_NAME} home</a></p>
</body>
</html>
`;
}

export function buildGuidesHubHtml(siteUrl: string): string {
  const hubUrl = tabPageUrl("guides", siteUrl);
  const items = GUIDE_PAGES.map(
    (guide) =>
      `<li><a href="${guidePageUrl(guide.slug, siteUrl)}">${escapeHtml(guide.title)}</a> — ${escapeHtml(guide.description)}</li>`,
  ).join("\n");

  return `<!DOCTYPE html>
<html lang="en-IN">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Financial Planning Guides | ${SITE_NAME}</title>
  <meta name="description" content="Free guides on home loan prepayment, SIP, PPF, and PF stress tests with links to interactive calculators." />
  <link rel="canonical" href="${hubUrl}" />
  <meta name="theme-color" content="#0d9488" />
  <style>
    body { font-family: system-ui, sans-serif; max-width: 42rem; margin: 2rem auto; padding: 0 1rem; line-height: 1.6; }
    a { color: #0d9488; }
    li { margin-bottom: 1rem; }
  </style>
</head>
<body>
  <h1>Financial planning guides</h1>
  <p>Educational articles linking to free calculators. Not financial advice.</p>
  <ul>
${items}
  </ul>
  <p><a href="${tabPageUrl("loan", siteUrl)}">Open ${SITE_NAME}</a></p>
</body>
</html>
`;
}

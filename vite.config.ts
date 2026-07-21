import fs from "node:fs";
import path from "node:path";
import { defineConfig, type Plugin } from "vite";
import react from "@vitejs/plugin-react";
import { buildInfoDefine, getGitBuildInfo } from "./scripts/git-build-info";
import {
  buildIndexHtmlReplacements,
  buildRobotsTxt,
  buildSitemapXml,
  patchIndexHtmlSeo,
  PLANNER_TABS,
  resolveSiteUrl,
  SEO_ROUTE_SLUGS,
} from "./src/lib/seo";

/** GitHub Pages serves from /{repo}/; AWS/CloudFront uses root `/`. */
const base = process.env.VITE_BASE ?? "/";
const gitBuildInfo = getGitBuildInfo();

function seoSiteUrl(): string {
  return resolveSiteUrl(process.env.VITE_SITE_URL);
}

function readContentSecurityPolicy(): string {
  return fs
    .readFileSync(path.resolve("security/content-security-policy.txt"), "utf8")
    .trim();
}

function cspMetaTag(policy: string): string {
  return `<meta http-equiv="Content-Security-Policy" content="${policy}" />`;
}

function seoPlugin(): Plugin {
  const jsonLdOptions = {
    dateModified: gitBuildInfo.VITE_BUILD_COMMIT_DATE,
    githubRepo: process.env.VITE_GITHUB_REPO,
  };
  return {
    name: "financial-planner-seo",
    transformIndexHtml(html, ctx) {
      const replacements = buildIndexHtmlReplacements(seoSiteUrl(), {
        ...jsonLdOptions,
        tabId: "loan",
        routerBase: base,
      });
      let next = Object.entries(replacements).reduce(
        (acc, [token, value]) => acc.replaceAll(token, value),
        html,
      );
      const cspPlaceholder = "__CSP_META__";
      if (ctx.server) {
        next = next.replace(cspPlaceholder, "");
      } else {
        next = next.replace(cspPlaceholder, cspMetaTag(readContentSecurityPolicy()));
      }
      return next;
    },
    writeBundle() {
      const siteUrl = seoSiteUrl();
      const outDir = path.resolve("dist");
      const indexPath = path.join(outDir, "index.html");
      if (!fs.existsSync(indexPath)) {
        return;
      }
      const homeHtml = fs.readFileSync(indexPath, "utf8");

      fs.writeFileSync(path.join(outDir, "robots.txt"), buildRobotsTxt(siteUrl));
      fs.writeFileSync(
        path.join(outDir, "sitemap.xml"),
        buildSitemapXml(siteUrl, gitBuildInfo.VITE_BUILD_COMMIT_DATE),
      );
      const notFoundHtml = homeHtml.replace(
        /<meta name="robots" content="[^"]*"/,
        '<meta name="robots" content="noindex">',
      );
      fs.writeFileSync(path.join(outDir, "404.html"), notFoundHtml);

      const shellOptions = {
        ...jsonLdOptions,
        routerBase: base,
      };
      for (const slug of SEO_ROUTE_SLUGS) {
        const tab = PLANNER_TABS.find((entry) => entry.id === slug);
        if (!tab) continue;
        const shellHtml = patchIndexHtmlSeo(homeHtml, siteUrl, tab.id, shellOptions);
        const slugDir = path.join(outDir, slug);
        fs.mkdirSync(slugDir, { recursive: true });
        fs.writeFileSync(path.join(slugDir, "index.html"), shellHtml);
      }
    },
  };
}

export default defineConfig({
  base,
  plugins: [react(), seoPlugin()],
  define: buildInfoDefine(gitBuildInfo),
  resolve: {
    alias: { "@": path.resolve(__dirname, "src") },
  },
});

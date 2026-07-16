import fs from "node:fs";
import path from "node:path";
import { defineConfig, type Plugin } from "vite";
import react from "@vitejs/plugin-react";
import { buildInfoDefine, getGitBuildInfo } from "./scripts/git-build-info";
import { versionManifestJson } from "./src/lib/notifications/versionManifest";
import {
  buildIndexHtmlReplacements,
  buildRobotsTxt,
  buildSitemapXml,
  resolveSiteUrl,
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
      const replacements = buildIndexHtmlReplacements(seoSiteUrl(), jsonLdOptions);
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
    closeBundle() {
      const siteUrl = seoSiteUrl();
      const outDir = path.resolve("dist");
      fs.writeFileSync(path.join(outDir, "robots.txt"), buildRobotsTxt(siteUrl));
      fs.writeFileSync(
        path.join(outDir, "sitemap.xml"),
        buildSitemapXml(siteUrl, gitBuildInfo.VITE_BUILD_COMMIT_DATE),
      );
      fs.writeFileSync(
        path.join(outDir, "version.json"),
        versionManifestJson(gitBuildInfo),
      );
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

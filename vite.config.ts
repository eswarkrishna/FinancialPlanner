import fs from "node:fs";
import path from "node:path";
import { defineConfig, type Plugin } from "vite";
import react from "@vitejs/plugin-react";
import { buildInfoDefine, getGitBuildInfo } from "./scripts/git-build-info";
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

function seoPlugin(): Plugin {
  return {
    name: "financial-planner-seo",
    transformIndexHtml(html) {
      const replacements = buildIndexHtmlReplacements(seoSiteUrl());
      return Object.entries(replacements).reduce(
        (next, [token, value]) => next.replaceAll(token, value),
        html,
      );
    },
    closeBundle() {
      const siteUrl = seoSiteUrl();
      const outDir = path.resolve("dist");
      fs.writeFileSync(path.join(outDir, "robots.txt"), buildRobotsTxt(siteUrl));
      fs.writeFileSync(path.join(outDir, "sitemap.xml"), buildSitemapXml(siteUrl));
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

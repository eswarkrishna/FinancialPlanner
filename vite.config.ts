import path from "node:path";
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { buildInfoDefine, getGitBuildInfo } from "./scripts/git-build-info";

/** GitHub Pages serves from /{repo}/; AWS/CloudFront uses root `/`. */
const base = process.env.VITE_BASE ?? "/";
const gitBuildInfo = getGitBuildInfo();

export default defineConfig({
  base,
  plugins: [react()],
  define: buildInfoDefine(gitBuildInfo),
  resolve: {
    alias: { "@": path.resolve(__dirname, "src") },
  },
});

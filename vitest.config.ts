import path from "node:path";
import { defineConfig } from "vitest/config";
import { buildInfoDefine, getGitBuildInfo } from "./scripts/git-build-info";

export default defineConfig({
  define: buildInfoDefine(getGitBuildInfo()),
  test: {
    environment: "jsdom",
    globals: false,
    setupFiles: ["./src/test/setupTests.ts"],
  },
  resolve: {
    alias: { "@": path.resolve(__dirname, "src") },
  },
});

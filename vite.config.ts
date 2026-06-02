import path from "node:path";
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

/** GitHub Pages serves from /{repo}/; AWS/CloudFront uses root `/`. */
const base = process.env.VITE_BASE ?? "/";

export default defineConfig({
  base,
  plugins: [react()],
  resolve: {
    alias: { "@": path.resolve(__dirname, "src") },
  },
});

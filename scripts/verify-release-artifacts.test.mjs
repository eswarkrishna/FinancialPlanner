import assert from "node:assert/strict";
import { describe, it } from "node:test";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import {
  validateIndexHtml,
  validateSeoBuildArtifacts,
  validateServiceWorkerSource,
  validateVersionManifest,
} from "./verify-release-artifacts.mjs";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const swSource = fs.readFileSync(path.join(__dirname, "../public/sw.js"), "utf8");

describe("verify-release-artifacts (§4.15)", () => {
  it("accepts a valid version manifest", () => {
    assert.deepEqual(
      validateVersionManifest({
        sha: "a2c655cfc1f9c482e970e557686cda692aa3c83a",
        short: "a2c655c",
        date: "2026-07-08T16:09:34+05:30",
      }),
      [],
    );
  });

  it("rejects incomplete version manifest", () => {
    const failures = validateVersionManifest({ sha: "abc", short: "x", date: "bad" });
    assert.ok(failures.length >= 3);
  });

  it("validates bundled service worker source", () => {
    assert.deepEqual(validateServiceWorkerSource(swSource), []);
  });

  it("rejects service worker missing required handlers", () => {
    const failures = validateServiceWorkerSource("// empty");
    assert.ok(failures.some((message) => message.includes("CHECK_VERSION")));
    assert.ok(failures.some((message) => message.includes("notificationclick")));
    assert.ok(failures.some((message) => message.includes("financial-planner-release")));
  });

  it("validates index.html root mount", () => {
    assert.deepEqual(validateIndexHtml('<div id="root"></div>'), []);
    assert.ok(validateIndexHtml("<div></div>").length > 0);
  });

  it("validates SEO route shells (§10.54–55)", () => {
    const tmp = fs.mkdtempSync(path.join(path.dirname(__dirname), "seo-dist-"));
    try {
      const home = '<div id="root"></div><noscript>home</noscript>';
      fs.writeFileSync(path.join(tmp, "index.html"), home);
      fs.writeFileSync(path.join(tmp, "404.html"), home);
      for (const slug of ["debt", "retirement", "strategies", "strategic", "budget"]) {
        const dir = path.join(tmp, slug);
        fs.mkdirSync(dir);
        fs.writeFileSync(path.join(dir, "index.html"), `<div id="root"></div><noscript>${slug}</noscript>`);
      }
      assert.deepEqual(validateSeoBuildArtifacts(fs, tmp), []);
      fs.rmSync(path.join(tmp, "debt", "index.html"));
      assert.ok(validateSeoBuildArtifacts(fs, tmp).some((m) => m.includes("debt/index.html")));
    } finally {
      fs.rmSync(tmp, { recursive: true, force: true });
    }
  });
});

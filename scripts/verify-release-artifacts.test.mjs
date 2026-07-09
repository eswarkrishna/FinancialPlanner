import assert from "node:assert/strict";
import { describe, it } from "node:test";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import {
  validateIndexHtml,
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
});

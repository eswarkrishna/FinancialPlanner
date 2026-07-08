import { describe, expect, it } from "vitest";
import { versionManifestFromBuild, versionManifestJson } from "./versionManifest";

describe("versionManifest (§4.15)", () => {
  it("builds manifest from git build info", () => {
    const manifest = versionManifestFromBuild({
      VITE_BUILD_COMMIT_SHA: "abc1234567890",
      VITE_BUILD_COMMIT_SHORT: "abc1234",
      VITE_BUILD_COMMIT_DATE: "2026-07-08T10:00:00+05:30",
    });

    expect(manifest).toEqual({
      sha: "abc1234567890",
      short: "abc1234",
      date: "2026-07-08T10:00:00+05:30",
    });
  });

  it("serializes JSON for dist/version.json", () => {
    const json = versionManifestJson({
      VITE_BUILD_COMMIT_SHA: "fullsha",
      VITE_BUILD_COMMIT_SHORT: "short12",
      VITE_BUILD_COMMIT_DATE: "2026-07-08T10:00:00+05:30",
    });

    expect(JSON.parse(json)).toEqual({
      sha: "fullsha",
      short: "short12",
      date: "2026-07-08T10:00:00+05:30",
    });
  });

  it("returns null manifest when sha is missing", () => {
    expect(
      versionManifestFromBuild({
        VITE_BUILD_COMMIT_SHA: "",
        VITE_BUILD_COMMIT_SHORT: "",
        VITE_BUILD_COMMIT_DATE: "",
      }),
    ).toBeNull();
  });
});

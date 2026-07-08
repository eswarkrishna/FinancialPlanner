import { describe, expect, it } from "vitest";
import {
  evaluateVersionChange,
  isNewVersionAvailable,
  shouldPromptForConsent,
} from "./versionCheck";

describe("versionCheck (§4.15)", () => {
  it("detects new version when sha differs", () => {
    expect(isNewVersionAvailable("abc", "def")).toBe(true);
    expect(isNewVersionAvailable("abc", "abc")).toBe(false);
    expect(isNewVersionAvailable(null, "abc")).toBe(false);
  });

  it("records baseline without alert on first seen sha", () => {
    const result = evaluateVersionChange(null, "sha-v2");
    expect(result.isUpdate).toBe(false);
    expect(result.nextLastSeenSha).toBe("sha-v2");
  });

  it("flags update when last seen differs", () => {
    const result = evaluateVersionChange("sha-v1", "sha-v2");
    expect(result.isUpdate).toBe(true);
    expect(result.nextLastSeenSha).toBe("sha-v2");
  });

  it("prompts until consent is chosen", () => {
    expect(shouldPromptForConsent(null)).toBe(true);
    expect(shouldPromptForConsent("accept")).toBe(false);
    expect(shouldPromptForConsent("reject")).toBe(false);
  });
});

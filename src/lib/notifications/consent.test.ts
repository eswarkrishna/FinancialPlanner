import { describe, expect, it } from "vitest";
import { loadReleaseConsent, saveReleaseConsent } from "./consent";
import { RELEASE_NOTIFICATION_CONSENT_KEY } from "./constants";

function memoryStorage() {
  const map = new Map<string, string>();
  return {
    getItem: (key: string) => map.get(key) ?? null,
    setItem: (key: string, value: string) => {
      map.set(key, value);
    },
  };
}

describe("consent (§4.15)", () => {
  it("persists accept and reject", () => {
    const storage = memoryStorage();
    saveReleaseConsent(storage, "accept");
    expect(storage.getItem(RELEASE_NOTIFICATION_CONSENT_KEY)).toBe("accept");
    expect(loadReleaseConsent(storage)).toBe("accept");

    saveReleaseConsent(storage, "reject");
    expect(loadReleaseConsent(storage)).toBe("reject");
  });
});

import { afterEach, describe, expect, it, vi } from "vitest";

vi.mock("@capacitor/core", () => ({
  Capacitor: {
    isNativePlatform: vi.fn(() => false),
    getPlatform: vi.fn(() => "web"),
  },
}));

import { Capacitor } from "@capacitor/core";
import { isNativeApp, nativePlatform } from "./platform";

describe("platform (§5.2)", () => {
  afterEach(() => {
    vi.mocked(Capacitor.isNativePlatform).mockReturnValue(false);
    vi.mocked(Capacitor.getPlatform).mockReturnValue("web");
  });

  it("reports web by default in tests", () => {
    expect(isNativeApp()).toBe(false);
    expect(nativePlatform()).toBe("web");
  });

  it("detects Capacitor native shell", () => {
    vi.mocked(Capacitor.isNativePlatform).mockReturnValue(true);
    vi.mocked(Capacitor.getPlatform).mockReturnValue("android");
    expect(isNativeApp()).toBe(true);
    expect(nativePlatform()).toBe("android");
  });
});

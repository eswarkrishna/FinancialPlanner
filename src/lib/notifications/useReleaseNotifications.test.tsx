import { act, renderHook, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  AWAITING_RELOAD_SHA_KEY,
  LAST_SEEN_COMMIT_SHA_KEY,
  RELEASE_NOTIFICATION_CONSENT_KEY,
} from "./constants";
import * as releaseNotifications from "./releaseNotifications";
import { useReleaseNotifications } from "./useReleaseNotifications";

function mockNotificationApi() {
  class MockNotification {
    static permission: NotificationPermission = "default";
    static requestPermission = vi.fn(async () => "granted" as NotificationPermission);
  }
  Object.defineProperty(window, "Notification", {
    configurable: true,
    writable: true,
    value: MockNotification,
  });
}

describe("useReleaseNotifications (§4.15)", () => {
  beforeEach(() => {
    localStorage.clear();
    mockNotificationApi();
    vi.spyOn(releaseNotifications, "checkLoadedBuildForUpdate").mockReturnValue({
      isUpdate: false,
      shortCommit: "",
      commitSha: "",
    });
    vi.spyOn(releaseNotifications, "acceptReleaseNotifications").mockResolvedValue("granted");
    vi.spyOn(releaseNotifications, "pollRemoteVersionForUpdate").mockResolvedValue({
      isUpdate: false,
      shortCommit: "",
      commitSha: "",
    });
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("shows consent until user chooses", () => {
    const { result } = renderHook(() => useReleaseNotifications());
    expect(result.current.showConsent).toBe(true);
  });

  it("hides consent after reject", () => {
    const { result } = renderHook(() => useReleaseNotifications());

    act(() => {
      result.current.rejectNotifications();
    });

    expect(result.current.showConsent).toBe(false);
    expect(localStorage.getItem(RELEASE_NOTIFICATION_CONSENT_KEY)).toBe("reject");
  });

  it("accepts notifications and stores consent", async () => {
    const { result } = renderHook(() => useReleaseNotifications());

    await act(async () => {
      await result.current.acceptNotifications();
    });

    expect(result.current.showConsent).toBe(false);
    expect(releaseNotifications.acceptReleaseNotifications).toHaveBeenCalled();
  });

  it("shows new version banner when loaded build differs", async () => {
    localStorage.setItem(RELEASE_NOTIFICATION_CONSENT_KEY, "accept");
    vi.mocked(releaseNotifications.checkLoadedBuildForUpdate).mockReturnValue({
      isUpdate: true,
      shortCommit: "new5678",
      commitSha: "new-sha",
    });

    const { result } = renderHook(() => useReleaseNotifications());

    await waitFor(() => {
      expect(result.current.showNewVersion).toBe(true);
    });
    expect(result.current.newVersionShort).toBe("new5678");
  });

  it("dismiss persists pending update sha to storage", async () => {
    localStorage.setItem(RELEASE_NOTIFICATION_CONSENT_KEY, "accept");
    localStorage.setItem(LAST_SEEN_COMMIT_SHA_KEY, "old-sha");
    vi.mocked(releaseNotifications.checkLoadedBuildForUpdate).mockReturnValue({
      isUpdate: true,
      shortCommit: "new5678",
      commitSha: "new-sha",
    });

    const { result } = renderHook(() => useReleaseNotifications());

    await waitFor(() => {
      expect(result.current.showNewVersion).toBe(true);
    });

    act(() => {
      result.current.dismissNewVersion();
    });

    expect(result.current.showNewVersion).toBe(false);
    expect(localStorage.getItem(LAST_SEEN_COMMIT_SHA_KEY)).toBe("new-sha");
    expect(localStorage.getItem(AWAITING_RELOAD_SHA_KEY)).toBe("new-sha");
  });
});

describe("useReleaseNotifications on native shell (§5.2)", () => {
  beforeEach(() => {
    vi.doMock("../platform", () => ({
      isNativeApp: () => true,
      nativePlatform: () => "android",
    }));
  });

  afterEach(() => {
    vi.doUnmock("../platform");
    vi.resetModules();
  });

  it("hides release notification UI in Capacitor native shell", async () => {
    vi.resetModules();
    vi.doMock("../platform", () => ({
      isNativeApp: () => true,
      nativePlatform: () => "android",
    }));
    const { useReleaseNotifications: useNativeRelease } = await import("./useReleaseNotifications");
    const { result } = renderHook(() => useNativeRelease());

    expect(result.current.showConsent).toBe(false);
    expect(result.current.notificationsSupported).toBe(false);
    expect(result.current.showNewVersion).toBe(false);
  });
});

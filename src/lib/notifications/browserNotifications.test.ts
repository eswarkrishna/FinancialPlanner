import { describe, expect, it, vi } from "vitest";
import {
  RELEASE_NOTIFICATION_TITLE,
  releaseNotificationBody,
} from "./constants";
import {
  isNotificationApiSupported,
  showReleaseNotification,
} from "./browserNotifications";

describe("browserNotifications (§4.15)", () => {
  it("reports unsupported when Notification API is absent", () => {
    const original = globalThis.Notification;
    // @ts-expect-error test override
    delete globalThis.Notification;
    expect(isNotificationApiSupported()).toBe(false);
    globalThis.Notification = original;
  });

  it("builds release notification copy with short commit id", () => {
    expect(releaseNotificationBody("abc1234")).toContain("abc1234");
    expect(RELEASE_NOTIFICATION_TITLE).toBe("FinancialPlanner update");
  });

  it("does not show notification when permission is not granted", () => {
    const original = globalThis.Notification;
    globalThis.Notification = class {
      static permission = "denied";
    } as unknown as typeof Notification;

    expect(showReleaseNotification(RELEASE_NOTIFICATION_TITLE, "body")).toBeNull();
    globalThis.Notification = original;
  });
});

describe("browserNotifications with granted permission", () => {
  it("creates a notification when permission is granted", () => {
    const ctor = vi.fn();
    const original = globalThis.Notification;
    globalThis.Notification = ctor as unknown as typeof Notification;
    Object.defineProperty(globalThis.Notification, "permission", {
      value: "granted",
      configurable: true,
    });

    showReleaseNotification(RELEASE_NOTIFICATION_TITLE, releaseNotificationBody("deadbeef"));
    expect(ctor).toHaveBeenCalledWith(
      RELEASE_NOTIFICATION_TITLE,
      expect.objectContaining({
        body: releaseNotificationBody("deadbeef"),
        tag: "financial-planner-release",
      }),
    );

    globalThis.Notification = original;
  });
});

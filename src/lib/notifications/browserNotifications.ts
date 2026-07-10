/** docs/SPEC.md §4.15 — browser notification permission helpers. */

import { isNativeApp } from "../platform";

export function isNotificationApiSupported(): boolean {
  if (isNativeApp()) return false;
  return typeof window !== "undefined" && "Notification" in window;
}

export function currentNotificationPermission(): NotificationPermission | "unsupported" {
  if (!isNotificationApiSupported()) return "unsupported";
  return Notification.permission;
}

export async function requestNotificationPermission(): Promise<NotificationPermission | "unsupported"> {
  if (!isNotificationApiSupported()) return "unsupported";
  if (Notification.permission === "granted") return "granted";
  if (Notification.permission === "denied") return "denied";
  return Notification.requestPermission();
}

export function showReleaseNotification(
  title: string,
  body: string,
): Notification | null {
  if (!isNotificationApiSupported() || Notification.permission !== "granted") {
    return null;
  }
  try {
    return new Notification(title, {
      body,
      tag: "financial-planner-release",
    });
  } catch {
    return null;
  }
}

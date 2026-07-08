/** docs/SPEC.md §4.15 */

export const RELEASE_NOTIFICATION_CONSENT_KEY =
  "financial-planner-release-notification-consent";
export const LAST_SEEN_COMMIT_SHA_KEY = "financial-planner-last-seen-commit-sha";
export const AWAITING_RELOAD_SHA_KEY = "financial-planner-awaiting-reload-sha";

export const VERSION_POLL_INTERVAL_MS = 60 * 60 * 1000;

export const RELEASE_NOTIFICATION_TITLE = "FinancialPlanner update";
export const RELEASE_CONSENT_LEAD =
  "Get notified when a new version of FinancialPlanner is released.";
export const NEW_VERSION_LEAD = "A new version is available.";

export function releaseNotificationBody(shortCommit: string): string {
  return `Version ${shortCommit} is live. Open the app to refresh.`;
}

export function newVersionBannerText(shortCommit: string): string {
  return `${NEW_VERSION_LEAD} (${shortCommit})`;
}

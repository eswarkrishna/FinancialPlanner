export const ANALYTICS_CONSENT_KEY = "financial-planner-analytics-consent";

export type AnalyticsConsent = "accept" | "reject";

export const ANALYTICS_CONSENT_LEAD =
  "We use privacy-friendly analytics (Google Analytics) to understand which features are used. No loan amounts or personal data are sent. Accept to help us improve the app.";

export interface StorageLike {
  getItem(key: string): string | null;
  setItem(key: string, value: string): void;
}

export function loadAnalyticsConsent(storage: StorageLike): AnalyticsConsent | null {
  const raw = storage.getItem(ANALYTICS_CONSENT_KEY);
  if (raw === "accept" || raw === "reject") return raw;
  return null;
}

export function saveAnalyticsConsent(
  storage: StorageLike,
  consent: AnalyticsConsent,
): void {
  storage.setItem(ANALYTICS_CONSENT_KEY, consent);
}

/** GA4 consent storage (SPEC §5.1.2). */

export const ANALYTICS_CONSENT_KEY = "financial-planner-analytics-consent";

export type AnalyticsConsentChoice = "accept" | "reject";

export function loadAnalyticsConsent(): AnalyticsConsentChoice | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(ANALYTICS_CONSENT_KEY);
    if (raw === "accept" || raw === "reject") return raw;
    return null;
  } catch {
    return null;
  }
}

export function saveAnalyticsConsent(choice: AnalyticsConsentChoice): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(ANALYTICS_CONSENT_KEY, choice);
  } catch {
    // ignore quota / privacy mode
  }
}

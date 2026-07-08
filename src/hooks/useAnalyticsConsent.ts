import { useCallback, useEffect, useState } from "react";
import {
  initAnalytics,
  isAnalyticsEnabled,
  isAnalyticsInitialized,
  trackAnalyticsConsent,
  trackHomePageView,
  trackSessionStart,
} from "../lib/analytics";
import {
  loadAnalyticsConsent,
  saveAnalyticsConsent,
  type AnalyticsConsentChoice,
} from "../lib/analytics/consent";
import {
  captureAcquisitionOnLoad,
  hasSessionStarted,
  markSessionStarted,
  readAcquisitionParams,
} from "../lib/analytics/sessionState";
import { getTabFromLocation } from "../lib/seo";

function fireSessionStart(locale: string): void {
  if (hasSessionStarted()) return;
  const acquisition = readAcquisitionParams();
  const params: Record<string, string> = {
    landing_tab: acquisition?.landing_tab ?? getTabFromLocation(window.location),
    locale,
  };
  if (acquisition?.utm_source) params.utm_source = acquisition.utm_source;
  if (acquisition?.utm_medium) params.utm_medium = acquisition.utm_medium;
  if (acquisition?.utm_campaign) params.utm_campaign = acquisition.utm_campaign;
  if (acquisition?.utm_content) params.utm_content = acquisition.utm_content;
  if (acquisition?.utm_term) params.utm_term = acquisition.utm_term;
  if (acquisition?.referrer_host) params.referrer_host = acquisition.referrer_host;
  trackSessionStart(params);
  markSessionStarted();
}

function bootstrapAnalytics(locale: string): void {
  if (!isAnalyticsEnabled() || isAnalyticsInitialized()) return;
  initAnalytics();
  fireSessionStart(locale);
  trackHomePageView();
}

/**
 * Consent-gated GA4 bootstrap (SPEC §5.1.2).
 * Returns consent state and handlers for the footer banner.
 */
export function useAnalyticsConsent(locale: string) {
  const gaEnabled = isAnalyticsEnabled();
  const [consent, setConsent] = useState<AnalyticsConsentChoice | null>(() =>
    gaEnabled ? loadAnalyticsConsent() : "reject",
  );

  useEffect(() => {
    if (!gaEnabled) return;
    captureAcquisitionOnLoad(getTabFromLocation(window.location));
  }, [gaEnabled]);

  useEffect(() => {
    if (!gaEnabled || consent !== "accept") return;
    bootstrapAnalytics(locale);
  }, [gaEnabled, consent, locale]);

  const accept = useCallback(() => {
    saveAnalyticsConsent("accept");
    setConsent("accept");
    trackAnalyticsConsent("accept");
    bootstrapAnalytics(locale);
  }, [locale]);

  const reject = useCallback(() => {
    saveAnalyticsConsent("reject");
    setConsent("reject");
    trackAnalyticsConsent("reject");
  }, []);

  const showBanner = gaEnabled && consent === null;

  return { showBanner, consent, accept, reject, gaEnabled };
}

import { useCallback, useEffect, useState } from "react";
import {
  initAnalytics,
  isAnalyticsEnabled,
  isAnalyticsInitialized,
  trackHomePageView,
  trackSessionStart,
} from "../lib/analytics";
import {
  loadAnalyticsConsent,
  saveAnalyticsConsent,
  type AnalyticsConsent,
} from "../lib/analytics/consent";
import {
  captureAcquisitionOnLoad,
  hasSessionStarted,
  markSessionStarted,
  readAcquisitionParams,
} from "../lib/analytics/sessionState";
import { isNativeApp } from "../lib/platform";
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

function shouldRunAnalytics(consent: AnalyticsConsent | null): boolean {
  if (!isAnalyticsEnabled()) return false;
  if (isNativeApp()) return true;
  return consent === "accept";
}

/**
 * GA4 bootstrap with web consent gate (SPEC §5.1.2). Native shell auto-inits.
 */
export function useAnalyticsBootstrap(locale: string): {
  gaEnabled: boolean;
  analyticsActive: boolean;
  showAnalyticsConsent: boolean;
  acceptAnalytics: () => void;
  rejectAnalytics: () => void;
} {
  const gaEnabled = isAnalyticsEnabled();
  const [consent, setConsent] = useState<AnalyticsConsent | null>(() => {
    if (typeof window === "undefined") return null;
    if (isNativeApp()) return "accept";
    return loadAnalyticsConsent(window.localStorage);
  });

  const analyticsActive = shouldRunAnalytics(consent);
  const showAnalyticsConsent =
    gaEnabled && !isNativeApp() && consent === null;

  const acceptAnalytics = useCallback(() => {
    saveAnalyticsConsent(window.localStorage, "accept");
    setConsent("accept");
  }, []);

  const rejectAnalytics = useCallback(() => {
    saveAnalyticsConsent(window.localStorage, "reject");
    setConsent("reject");
  }, []);

  useEffect(() => {
    if (!analyticsActive) return;
    captureAcquisitionOnLoad(getTabFromLocation(window.location));
  }, [analyticsActive]);

  useEffect(() => {
    if (!analyticsActive) return;
    bootstrapAnalytics(locale);
  }, [analyticsActive, locale]);

  return {
    gaEnabled,
    analyticsActive,
    showAnalyticsConsent,
    acceptAnalytics,
    rejectAnalytics,
  };
}

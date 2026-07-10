import { useEffect } from "react";
import {
  initAnalytics,
  isAnalyticsEnabled,
  isAnalyticsInitialized,
  trackHomePageView,
  trackSessionStart,
} from "../lib/analytics";
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
 * Auto-init GA4 when measurement ID is set (SPEC §5.1.2 — no consent gate).
 */
export function useAnalyticsBootstrap(locale: string): { gaEnabled: boolean } {
  const gaEnabled = isAnalyticsEnabled();

  useEffect(() => {
    if (!gaEnabled) return;
    captureAcquisitionOnLoad(getTabFromLocation(window.location));
  }, [gaEnabled]);

  useEffect(() => {
    if (!gaEnabled) return;
    bootstrapAnalytics(locale);
  }, [gaEnabled, locale]);

  return { gaEnabled };
}

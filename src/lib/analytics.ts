/**
 * Google Analytics 4 (gtag.js). Loads only when VITE_GA_MEASUREMENT_ID is set at build time.
 */

declare global {
  interface Window {
    dataLayer?: unknown[];
    gtag?: Gtag;
  }
}

type Gtag = (...args: unknown[]) => void;

let initialized = false;

function measurementId(): string {
  return import.meta.env.VITE_GA_MEASUREMENT_ID?.trim() ?? "";
}

export function isAnalyticsEnabled(): boolean {
  return measurementId().length > 0;
}

export function getMeasurementId(): string {
  return measurementId();
}

/** Inject gtag.js and configure GA4 once. */
export function initAnalytics(): void {
  const id = measurementId();
  if (!id || initialized || typeof document === "undefined") {
    return;
  }
  initialized = true;

  const script = document.createElement("script");
  script.async = true;
  script.src = `https://www.googletagmanager.com/gtag/js?id=${encodeURIComponent(id)}`;
  document.head.appendChild(script);

  window.dataLayer = window.dataLayer ?? [];
  window.gtag = function gtag(...args: unknown[]) {
    window.dataLayer?.push(args);
  };
  window.gtag("js", new Date());
  window.gtag("config", id, {
    send_page_view: false,
    anonymize_ip: true,
  });
}

function pagePath(suffix: string): string {
  const base = import.meta.env.BASE_URL ?? "/";
  const normalized = base.endsWith("/") ? base : `${base}/`;
  const path = suffix.startsWith("/") ? suffix.slice(1) : suffix;
  return `${normalized}${path}`.replace(/\/{2,}/g, "/");
}

/** Virtual page view (SPA tabs). */
export function trackPageView(pageSuffix: string, pageTitle?: string): void {
  if (!initialized || !window.gtag) return;
  const page_path = pagePath(pageSuffix);
  window.gtag("event", "page_view", {
    page_path,
    page_title: pageTitle ?? `FinancialPlanner — ${pageSuffix}`,
  });
}

export function trackEvent(
  eventName: string,
  params?: Record<string, string | number | boolean>,
): void {
  if (!initialized || !window.gtag) return;
  window.gtag("event", eventName, params ?? {});
}

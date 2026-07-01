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

type ClickParams = Record<string, string | number | boolean>;

export type AnalyticsLocale = "IN" | "US";

let initialized = false;
let clickTrackingBound = false;
let analyticsLocale: AnalyticsLocale | undefined;

function measurementId(): string {
  return import.meta.env.VITE_GA_MEASUREMENT_ID?.trim() ?? "";
}

export function isAnalyticsEnabled(): boolean {
  return measurementId().length > 0;
}

export function getMeasurementId(): string {
  return measurementId();
}

function localeParams(
  locale?: AnalyticsLocale,
): Record<string, AnalyticsLocale> | undefined {
  const value = locale ?? analyticsLocale;
  return value ? { locale: value } : undefined;
}

function resolveEventLocale(
  explicit?: AnalyticsLocale,
  fromParams?: string | number | boolean,
): AnalyticsLocale | undefined {
  if (explicit !== undefined) return explicit;
  if (fromParams === "IN" || fromParams === "US") return fromParams;
  return analyticsLocale;
}

/** Set module locale for subsequent events and GA4 user_properties. */
export function setAnalyticsLocale(locale: AnalyticsLocale): void {
  analyticsLocale = locale;
  if (initialized && window.gtag) {
    window.gtag("set", "user_properties", { locale });
  }
}

export function trackLocaleSwitch(
  from: AnalyticsLocale,
  to: AnalyticsLocale,
): void {
  trackEvent("locale_switch", { from, to });
}

export function trackLoadReferenceScenario(locale: AnalyticsLocale): void {
  trackEvent("load_reference_scenario", { locale });
}

export function trackJobLossMode(
  locale: AnalyticsLocale,
  enabled: boolean,
): void {
  trackEvent("job_loss_mode", { locale, enabled });
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
  // gtag.js expects dataLayer entries as `arguments` objects, not Arrays.
  window.gtag = function gtag() {
    window.dataLayer?.push(arguments);
  } as Gtag;
  window.gtag("js", new Date());
  window.gtag("config", id, {
    send_page_view: false,
    anonymize_ip: true,
  });
}

function pagePath(suffix: string): string {
  const base = import.meta.env.BASE_URL ?? "/";
  const normalized = base.endsWith("/") ? base : `${base}/`;
  if (!suffix || suffix === "/") {
    return normalized.replace(/\/{2,}/g, "/");
  }
  const path = suffix.startsWith("/") ? suffix.slice(1) : suffix;
  return `${normalized}${path}`.replace(/\/{2,}/g, "/");
}

function currentPagePath(): string {
  if (typeof window === "undefined") {
    return pagePath("/");
  }
  return window.location.pathname || pagePath("/");
}

function truncate(value: string, max = 100): string {
  const trimmed = value.trim().replace(/\s+/g, " ");
  return trimmed.length <= max ? trimmed : `${trimmed.slice(0, max - 1)}…`;
}

/** Build GA4 click parameters from a DOM element (no PII from form values). */
export function buildClickParams(
  element: Element,
  pagePathOverride?: string,
  locale?: AnalyticsLocale,
): ClickParams {
  const html = element as HTMLElement;
  const tag = element.tagName.toLowerCase();
  const params: ClickParams = {
    element_tag: tag,
    page_path: pagePathOverride ?? currentPagePath(),
    ...localeParams(locale),
  };

  if (element.id) {
    params.element_id = element.id;
  }

  const role = element.getAttribute("role");
  if (role) {
    params.element_role = role;
  }

  const ariaLabel = element.getAttribute("aria-label");
  if (ariaLabel) {
    params.element_label = truncate(ariaLabel);
  }

  const type = element.getAttribute("type");
  if (type) {
    params.element_type = type;
  }

  if (tag === "a" && element instanceof HTMLAnchorElement && element.href) {
    params.link_url = element.href;
  }

  const text =
    ariaLabel ??
    html.innerText ??
    element.textContent ??
    element.getAttribute("name") ??
    element.getAttribute("value") ??
    "";
  if (text) {
    params.element_text = truncate(text);
  }

  return params;
}

/** Initial landing page view (home). */
export function trackHomePageView(locale?: AnalyticsLocale): void {
  trackPageView("/", "FinancialPlanner — Home", locale);
}

/** Virtual page view (SPA tabs and routes). */
export function trackPageView(
  pageSuffix: string,
  pageTitle?: string,
  locale?: AnalyticsLocale,
): void {
  if (!initialized || !window.gtag) return;
  const page_path = pagePath(pageSuffix);
  window.gtag("event", "page_view", {
    page_path,
    page_title: pageTitle ?? `FinancialPlanner — ${pageSuffix}`,
    page_location: typeof window !== "undefined" ? window.location.href : page_path,
    ...localeParams(locale),
  });
}

export function trackEvent(
  eventName: string,
  params?: Record<string, string | number | boolean>,
  locale?: AnalyticsLocale,
): void {
  if (!initialized || !window.gtag) return;
  const resolvedLocale = resolveEventLocale(locale, params?.locale);
  window.gtag("event", eventName, {
    ...params,
    ...(resolvedLocale ? { locale: resolvedLocale } : {}),
  });
}

/** Send a GA4 click event for a DOM element. */
export function trackClick(element: Element, pagePathOverride?: string): void {
  trackEvent("click", buildClickParams(element, pagePathOverride));
}

function onDocumentClick(event: MouseEvent): void {
  const target = event.target;
  if (!(target instanceof Element)) {
    return;
  }
  trackClick(target);
}

/** Delegated listener: records every click in the app (inputs excluded from values). */
export function initClickTracking(): void {
  if (!initialized || clickTrackingBound || typeof document === "undefined") {
    return;
  }
  clickTrackingBound = true;
  document.addEventListener("click", onDocumentClick, true);
}

/** Reset module state for tests. */
export function resetAnalyticsForTests(): void {
  if (clickTrackingBound && typeof document !== "undefined") {
    document.removeEventListener("click", onDocumentClick, true);
  }
  clickTrackingBound = false;
  initialized = false;
  analyticsLocale = undefined;
}

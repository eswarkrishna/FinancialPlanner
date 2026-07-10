/**
 * Google Analytics 4 (gtag.js). Loads only when VITE_GA_MEASUREMENT_ID is set at build time.
 * Named interaction events per docs/SPEC.md §5.1.
 */

import { markSessionExport, recordTabVisit } from "./analytics/sessionState";
import type { TabId } from "./seo";

declare global {
  interface Window {
    dataLayer?: unknown[];
    gtag?: Gtag;
  }
}

type Gtag = (...args: unknown[]) => void;

type AnalyticsParams = Record<string, string | number | boolean>;

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

export function isAnalyticsInitialized(): boolean {
  return initialized;
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
    // eslint-disable-next-line prefer-rest-params -- gtag.js contract requires `arguments`
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

function withPagePath(params: AnalyticsParams = {}): AnalyticsParams {
  return { ...params, page_path: currentPagePath() };
}

/** Initial landing page view (home). */
export function trackHomePageView(): void {
  trackPageView("/", "FinancialPlanner — Home");
}

/** Virtual page view (SPA tabs and routes). */
export function trackPageView(pageSuffix: string, pageTitle?: string): void {
  if (!initialized || !window.gtag) return;
  const page_path = pagePath(pageSuffix);
  window.gtag("event", "page_view", {
    page_path,
    page_title: pageTitle ?? `FinancialPlanner — ${pageSuffix}`,
    page_location: typeof window !== "undefined" ? window.location.href : page_path,
  });
}

export function trackEvent(
  eventName: string,
  params?: AnalyticsParams,
): void {
  if (!initialized || !window.gtag) return;
  window.gtag("event", eventName, params ?? {});
}

export function trackTabSelect(tabId: string): void {
  recordTabVisit(tabId as TabId);
  trackEvent("tab_select", withPagePath({ tab_id: tabId }));
}

export function trackLocaleChange(locale: string): void {
  trackEvent("locale_change", withPagePath({ locale }));
}

export function trackLoanLoadReference(locale: string): void {
  trackEvent("loan_load_reference", withPagePath({ locale }));
}

export function trackLoanExportScheduleCsv(
  scenarioView: string,
  locale: string,
): void {
  markSessionExport();
  trackEvent(
    "loan_export_schedule_csv",
    withPagePath({ scenario_view: scenarioView, locale }),
  );
}

export function trackLoanExportScenarioJson(
  scenarioView: string,
  locale: string,
): void {
  markSessionExport();
  trackEvent(
    "loan_export_scenario_json",
    withPagePath({ scenario_view: scenarioView, locale }),
  );
}

export function trackLoanImportScenarioJson(
  scenarioView: string,
  locale: string,
  success: boolean,
): void {
  trackEvent(
    "loan_import_scenario_json",
    withPagePath({
      scenario_view: scenarioView,
      locale,
      success: success ? "true" : "false",
    }),
  );
}

export function trackLoanScenarioViewChange(
  scenarioView: string,
  locale: string,
): void {
  trackEvent(
    "loan_scenario_view_change",
    withPagePath({ scenario_view: scenarioView, locale }),
  );
}

export function trackLoanPrepaySourceChange(
  prepaySource: string,
  locale: string,
): void {
  trackEvent(
    "loan_prepay_source_change",
    withPagePath({ prepay_source: prepaySource, locale }),
  );
}

export function trackLoanStagedPrepayAdd(): void {
  trackEvent("loan_staged_prepay_add", withPagePath());
}

export function trackLoanStagedPrepayRemove(): void {
  trackEvent("loan_staged_prepay_remove", withPagePath());
}

export function trackDebtAdd(debtCount: number): void {
  trackEvent("debt_add", withPagePath({ debt_count: debtCount }));
}

export function trackDebtRemove(debtCount: number): void {
  trackEvent("debt_remove", withPagePath({ debt_count: debtCount }));
}

export function trackDebtStrategyChange(strategy: string): void {
  trackEvent("debt_strategy_change", withPagePath({ strategy }));
}

export function trackRetirementScenarioSelect(scenarioId: string): void {
  trackEvent("retirement_scenario_select", withPagePath({ scenario_id: scenarioId }));
}

export function trackStrategyTierPreset(presetId: string, locale: string): void {
  trackEvent(
    "strategy_tier_preset",
    withPagePath({ preset_id: presetId, locale }),
  );
}

export function trackGameProfileChange(profileId: string): void {
  trackEvent("game_profile_change", withPagePath({ profile_id: profileId }));
}

export function trackGameExportJson(profileId: string, locale: string): void {
  markSessionExport();
  trackEvent(
    "game_export_json",
    withPagePath({ profile_id: profileId, locale }),
  );
}

export function trackDebtExportTimelineCsv(strategy: string, locale: string): void {
  markSessionExport();
  trackEvent(
    "debt_export_timeline_csv",
    withPagePath({ strategy, locale }),
  );
}

export function trackDebtExportJson(strategy: string, locale: string): void {
  markSessionExport();
  trackEvent(
    "debt_export_json",
    withPagePath({ strategy, locale }),
  );
}

export function trackRetirementExportTimelineCsv(
  scenarioId: string,
  locale: string,
): void {
  markSessionExport();
  trackEvent(
    "retirement_export_timeline_csv",
    withPagePath({ scenario_id: scenarioId, locale }),
  );
}

export function trackRetirementExportJson(scenarioId: string, locale: string): void {
  markSessionExport();
  trackEvent(
    "retirement_export_json",
    withPagePath({ scenario_id: scenarioId, locale }),
  );
}

export function trackBudgetExportSummaryCsv(locale: string): void {
  markSessionExport();
  trackEvent("budget_export_summary_csv", withPagePath({ locale }));
}

export function trackBudgetExportJson(locale: string): void {
  markSessionExport();
  trackEvent("budget_export_json", withPagePath({ locale }));
}

export function trackStrategyExportComparisonCsv(locale: string): void {
  markSessionExport();
  trackEvent("strategy_export_comparison_csv", withPagePath({ locale }));
}

export function trackStrategyExportJson(locale: string): void {
  markSessionExport();
  trackEvent("strategy_export_json", withPagePath({ locale }));
}

export function trackFeedbackGithubClick(): void {
  trackEvent("feedback_github_click", withPagePath());
}

export function trackSessionStart(
  params: Record<string, string | number | boolean>,
): void {
  trackEvent("session_start", withPagePath(params));
}

export function trackShareLinkCopy(tabId: string, locale: string): void {
  trackEvent("share_link_copy", withPagePath({ tab_id: tabId, locale }));
}

export function trackSessionSummary(params: {
  tabs_visited_count: number;
  had_export: boolean;
  locale: string;
}): void {
  trackEvent("session_summary", {
    ...withPagePath({
      tabs_visited_count: params.tabs_visited_count,
      had_export: params.had_export ? "true" : "false",
      locale: params.locale,
    }),
    transport_type: "beacon",
  });
}

export function trackWebVitals(params: {
  metric_name: string;
  metric_value: number;
  metric_rating: string;
}): void {
  trackEvent("web_vitals", withPagePath(params));
}

export function trackFeedbackHelpful(
  helpful: boolean,
  tabId: string,
  locale: string,
): void {
  trackEvent(
    "feedback_helpful",
    withPagePath({
      helpful: helpful ? "true" : "false",
      tab_id: tabId,
      locale,
    }),
  );
}

/** Mark that an export occurred this session (§5.1.2 session_summary). */
export function notifyExportForSession(): void {
  markSessionExport();
}

export function trackFooterCommitLinkClick(): void {
  trackEvent("footer_commit_link_click", withPagePath());
}

export function trackFooterTermsToggle(open: boolean): void {
  trackEvent("footer_terms_toggle", withPagePath({ open }));
}

export function trackFooterGaOptoutClick(): void {
  trackEvent("footer_ga_optout_click", withPagePath());
}

/** Reset module state for tests. */
export function resetAnalyticsForTests(): void {
  initialized = false;
}

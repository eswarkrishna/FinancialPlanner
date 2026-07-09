import { useEffect } from "react";
import {
  isAnalyticsInitialized,
  trackSessionSummary,
} from "../lib/analytics";
import { hadSessionExport, hasSessionSummarySent, markSessionSummarySent, tabsVisitedCount } from "../lib/analytics/sessionState";
import { initWebVitalsSampling } from "../lib/analytics/webVitals";

/** Fire session_summary on tab hide and sample web vitals after GA init (§5.1.2). */
export function useAnalyticsLifecycle(locale: string, analyticsActive: boolean): void {
  useEffect(() => {
    if (!analyticsActive || !isAnalyticsInitialized()) return;
    initWebVitalsSampling();
  }, [analyticsActive]);

  useEffect(() => {
    if (!analyticsActive) return;

    function onHide() {
      if (!isAnalyticsInitialized() || hasSessionSummarySent()) return;
      trackSessionSummary({
        tabs_visited_count: tabsVisitedCount(),
        had_export: hadSessionExport(),
        locale,
      });
      markSessionSummarySent();
    }

    const onVisibility = () => {
      if (document.visibilityState === "hidden") onHide();
    };

    window.addEventListener("pagehide", onHide);
    document.addEventListener("visibilitychange", onVisibility);
    return () => {
      window.removeEventListener("pagehide", onHide);
      document.removeEventListener("visibilitychange", onVisibility);
    };
  }, [analyticsActive, locale]);
}

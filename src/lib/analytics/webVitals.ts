import { onCLS, onFCP, onINP, onLCP, onTTFB, type Metric } from "web-vitals";
import { trackWebVitals } from "../analytics";

function ratingFor(metric: Metric): string {
  // web-vitals provides rating on Metric in v4
  return metric.rating ?? "needs-improvement";
}

function reportMetric(metric: Metric): void {
  const value =
    metric.name === "CLS"
      ? Math.round(metric.value * 1000) / 1000
      : Math.round(metric.value);
  trackWebVitals({
    metric_name: metric.name,
    metric_value: value,
    metric_rating: ratingFor(metric),
  });
}

/** Sample Core Web Vitals once per page load when analytics is active (§5.1.2). */
export function initWebVitalsSampling(): void {
  if (typeof window === "undefined") return;
  onLCP(reportMetric);
  onINP(reportMetric);
  onCLS(reportMetric);
  onFCP(reportMetric);
  onTTFB(reportMetric);
}

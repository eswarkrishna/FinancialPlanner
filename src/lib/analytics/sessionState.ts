/** Per-tab session metrics for §5.1 Tier 1–2 analytics. */

import type { TabId } from "../seo";

const SESSION_STARTED_KEY = "financial-planner-analytics-session-started";
const SESSION_SUMMARY_KEY = "financial-planner-session-summary-sent";
const ACQUISITION_KEY = "financial-planner-acquisition";
const TABS_KEY = "financial-planner-tabs-visited";
const HAD_EXPORT_KEY = "financial-planner-had-export";

export interface AcquisitionParams {
  utm_source?: string;
  utm_medium?: string;
  utm_campaign?: string;
  utm_content?: string;
  utm_term?: string;
  referrer_host?: string;
  landing_tab: TabId;
}

function truncate(value: string, max = 64): string {
  const trimmed = value.trim();
  if (!trimmed) return "";
  return trimmed.length <= max ? trimmed : trimmed.slice(0, max);
}

function emailLike(value: string): boolean {
  return /@/.test(value);
}

function safeParam(value: string | null): string | undefined {
  if (!value) return undefined;
  const t = truncate(value);
  if (!t || emailLike(t)) return undefined;
  return t;
}

export function captureAcquisitionOnLoad(landingTab: TabId): AcquisitionParams {
  const params: AcquisitionParams = { landing_tab: landingTab };
  if (typeof window === "undefined") return params;

  const search = new URLSearchParams(window.location.search);
  params.utm_source = safeParam(search.get("utm_source"));
  params.utm_medium = safeParam(search.get("utm_medium"));
  params.utm_campaign = safeParam(search.get("utm_campaign"));
  params.utm_content = safeParam(search.get("utm_content"));
  params.utm_term = safeParam(search.get("utm_term"));

  try {
    const ref = document.referrer ? new URL(document.referrer).hostname : "";
    params.referrer_host = safeParam(ref);
  } catch {
    params.referrer_host = undefined;
  }

  try {
    sessionStorage.setItem(ACQUISITION_KEY, JSON.stringify(params));
  } catch {
    // ignore
  }
  return params;
}

export function readAcquisitionParams(): AcquisitionParams | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = sessionStorage.getItem(ACQUISITION_KEY);
    if (!raw) return null;
    return JSON.parse(raw) as AcquisitionParams;
  } catch {
    return null;
  }
}

export function hasSessionStarted(): boolean {
  if (typeof window === "undefined") return false;
  try {
    return sessionStorage.getItem(SESSION_STARTED_KEY) === "1";
  } catch {
    return false;
  }
}

export function markSessionStarted(): void {
  if (typeof window === "undefined") return;
  try {
    sessionStorage.setItem(SESSION_STARTED_KEY, "1");
  } catch {
    // ignore
  }
}

export function hasSessionSummarySent(): boolean {
  if (typeof window === "undefined") return false;
  try {
    return sessionStorage.getItem(SESSION_SUMMARY_KEY) === "1";
  } catch {
    return false;
  }
}

export function markSessionSummarySent(): void {
  if (typeof window === "undefined") return;
  try {
    sessionStorage.setItem(SESSION_SUMMARY_KEY, "1");
  } catch {
    // ignore
  }
}

export function recordTabVisit(tabId: TabId): void {
  if (typeof window === "undefined") return;
  try {
    const raw = sessionStorage.getItem(TABS_KEY);
    const set = new Set<TabId>(raw ? (JSON.parse(raw) as TabId[]) : []);
    set.add(tabId);
    sessionStorage.setItem(TABS_KEY, JSON.stringify([...set]));
  } catch {
    // ignore
  }
}

export function tabsVisitedCount(): number {
  if (typeof window === "undefined") return 1;
  try {
    const raw = sessionStorage.getItem(TABS_KEY);
    const arr = raw ? (JSON.parse(raw) as TabId[]) : [];
    return Math.max(1, arr.length);
  } catch {
    return 1;
  }
}

export function markSessionExport(): void {
  if (typeof window === "undefined") return;
  try {
    sessionStorage.setItem(HAD_EXPORT_KEY, "1");
  } catch {
    // ignore
  }
}

export function hadSessionExport(): boolean {
  if (typeof window === "undefined") return false;
  try {
    return sessionStorage.getItem(HAD_EXPORT_KEY) === "1";
  } catch {
    return false;
  }
}

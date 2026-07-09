import { useEffect, useState, type KeyboardEvent } from "react";
import { trackPageView, trackTabSelect } from "./lib/analytics";
import {
  getTabFromLocation,
  PLANNER_TABS,
  setTabInUrl,
  type TabId,
  updatePageSeo,
} from "./lib/seo";
import { AppFooter } from "./components/AppFooter";
import { AnalyticsConsentBanner } from "./components/AnalyticsConsentBanner";
import { FeedbackHelpful } from "./components/FeedbackHelpful";
import { LocaleSegment } from "./components/LocaleSegment";
import { NewVersionBanner } from "./components/NewVersionBanner";
import { ReleaseNotificationConsent } from "./components/ReleaseNotificationConsent";
import { useAnalyticsConsent } from "./hooks/useAnalyticsConsent";
import { useAnalyticsLifecycle } from "./hooks/useAnalyticsLifecycle";
import { DebtSection } from "./features/debt/DebtSection";
import { GameSection } from "./features/game/GameSection";
import { useLocale } from "./features/locale/LocaleContext";
import { LoanSection } from "./features/loan/LoanSection";
import { RetirementSection } from "./features/retirement/RetirementSection";
import { StrategySection } from "./features/strategy/StrategySection";
import type { Locale } from "./lib/locale/types";
import { useReleaseNotifications } from "./lib/notifications/useReleaseNotifications";

function focusTab(tabId: TabId) {
  document.getElementById(`tab-${tabId}`)?.focus();
}

function nextTabFromKey(key: string, index: number): TabId | null {
  if (key === "ArrowRight") {
    return PLANNER_TABS[(index + 1) % PLANNER_TABS.length]!.id;
  }
  if (key === "ArrowLeft") {
    return PLANNER_TABS[(index - 1 + PLANNER_TABS.length) % PLANNER_TABS.length]!.id;
  }
  if (key === "Home") {
    return PLANNER_TABS[0]!.id;
  }
  if (key === "End") {
    return PLANNER_TABS[PLANNER_TABS.length - 1]!.id;
  }
  return null;
}

function handleTabKeyDown(
  event: KeyboardEvent<HTMLButtonElement>,
  tabId: TabId,
  selectTab: (id: TabId) => void,
) {
  const index = PLANNER_TABS.findIndex((tab) => tab.id === tabId);
  if (index < 0) return;

  const nextId = nextTabFromKey(event.key, index);
  if (!nextId) return;

  event.preventDefault();
  selectTab(nextId);
  focusTab(nextId);
}

export function App() {
  const [activeTab, setActiveTab] = useState<TabId>(() => getTabFromLocation(window.location));
  const { locale, switchLocale } = useLocale();
  const {
    showConsent,
    showNewVersion,
    newVersionShort,
    acceptNotifications,
    rejectNotifications,
    dismissNewVersion,
    reloadForUpdate,
  } = useReleaseNotifications();
  const {
    showBanner: showAnalyticsConsent,
    accept: acceptAnalytics,
    reject: rejectAnalytics,
    consent: analyticsConsent,
    gaEnabled,
  } = useAnalyticsConsent(locale);
  const analyticsActive = gaEnabled && analyticsConsent === "accept";
  useAnalyticsLifecycle(locale, analyticsActive);

  useEffect(() => {
    const onPopState = () => {
      setActiveTab(getTabFromLocation(window.location));
    };
    window.addEventListener("popstate", onPopState);
    return () => window.removeEventListener("popstate", onPopState);
  }, []);

  useEffect(() => {
    setTabInUrl(activeTab, { push: false });
  }, []);

  useEffect(() => {
    const label = PLANNER_TABS.find((tab) => tab.id === activeTab)?.label ?? activeTab;
    updatePageSeo(activeTab);
    trackPageView(`tab/${activeTab}`, `FinancialPlanner — ${label}`);
  }, [activeTab]);

  useEffect(() => {
    const lang = locale === "US" ? "en-US" : locale === "UK" ? "en-GB" : "en-IN";
    document.documentElement.lang = lang;
  }, [locale]);

  function selectTab(tabId: TabId) {
    if (tabId === activeTab) return;
    trackTabSelect(tabId);
    setTabInUrl(tabId, { push: true });
    setActiveTab(tabId);
  }

  function onLocaleChange(next: Locale) {
    switchLocale(next);
  }

  return (
    <div className="app-shell">
      <a href="#main-content" className="skip-link">
        Skip to content
      </a>

      <div className="app-body">
        <aside className="app-sidebar" aria-label="Planner sections">
          <div className="app-sidebar-brand">
            <span className="app-sidebar-title">FinancialPlanner</span>
          </div>
          <nav className="app-sidebar-nav">
            {PLANNER_TABS.map((tab) => (
              <button
                key={tab.id}
                type="button"
                className={`app-sidebar-link${
                  activeTab === tab.id ? " app-sidebar-link--active" : ""
                }`}
                aria-current={activeTab === tab.id ? "page" : undefined}
                onClick={() => selectTab(tab.id)}
              >
                {tab.label}
              </button>
            ))}
          </nav>
        </aside>

        <div className="app-main-column">
          <header className="app-header">
            <div className="app-header-inner app-brand">
              <div className="app-brand-row">
                <h1>FinancialPlanner</h1>
                <LocaleSegment value={locale} onChange={onLocaleChange} />
              </div>
              <p className="lede">
                Plan your home loan, compare prepayment options, model debt and retirement
                savings, and explore what-if strategies—all in one place. Numbers are for
                learning only, not financial advice.
              </p>
            </div>
            <nav className="app-tabs" aria-label="Planner sections">
              <div
                className="app-tabs-scroll"
                role="tablist"
                aria-orientation="horizontal"
                tabIndex={0}
                aria-label="Planner section tabs"
              >
                {PLANNER_TABS.map((tab) => (
                  <button
                    key={tab.id}
                    type="button"
                    role="tab"
                    id={`tab-${tab.id}`}
                    aria-selected={activeTab === tab.id}
                    aria-controls={`panel-${tab.id}`}
                    tabIndex={activeTab === tab.id ? 0 : -1}
                    className={`app-tab${activeTab === tab.id ? " app-tab--active" : ""}`}
                    onClick={() => selectTab(tab.id)}
                    onKeyDown={(event) => handleTabKeyDown(event, tab.id, selectTab)}
                  >
                    <span className="app-tab-label">{tab.label}</span>
                  </button>
                ))}
              </div>
            </nav>
          </header>

          <main id="main-content" className="layout">
            {PLANNER_TABS.map((tab) => (
              <div
                key={tab.id}
                id={`panel-${tab.id}`}
                role="tabpanel"
                aria-labelledby={`tab-${tab.id}`}
                hidden={activeTab !== tab.id}
                tabIndex={activeTab === tab.id ? 0 : undefined}
              >
                {activeTab === tab.id ? (
                  <>
                    <FeedbackHelpful tabId={tab.id} locale={locale} />
                    {tab.id === "loan" && <LoanSection />}
                    {tab.id === "debt" && <DebtSection />}
                    {tab.id === "retirement" && <RetirementSection />}
                    {tab.id === "strategies" && <StrategySection />}
                    {tab.id === "strategic" && <GameSection />}
                  </>
                ) : null}
              </div>
            ))}
          </main>
        </div>
      </div>

      {showAnalyticsConsent ? (
        <AnalyticsConsentBanner onAccept={acceptAnalytics} onReject={rejectAnalytics} />
      ) : null}

      {showConsent ? (
        <ReleaseNotificationConsent
          onAccept={() => {
            void acceptNotifications();
          }}
          onReject={rejectNotifications}
        />
      ) : null}

      {showNewVersion && newVersionShort ? (
        <NewVersionBanner
          shortCommit={newVersionShort}
          onReload={reloadForUpdate}
          onDismiss={dismissNewVersion}
        />
      ) : null}

      <AppFooter activeTab={activeTab} locale={locale} />
    </div>
  );
}

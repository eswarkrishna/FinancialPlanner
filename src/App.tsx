import { useEffect, useState, Suspense, type KeyboardEvent } from "react";
import { trackPageView, trackTabSelect } from "./lib/analytics";
import {
  getTabFromLocation,
  pageTitle,
  PLANNER_TABS,
  redirectLegacyTabQuery,
  setTabInUrl,
  type TabId,
  updatePageSeo,
} from "./lib/seo";
import { AnalyticsConsent } from "./components/AnalyticsConsent";
import { LogoMark } from "./components/LogoMark";
import { AppFooter } from "./components/AppFooter";
import { FeedbackHelpful } from "./components/FeedbackHelpful";
import { LocaleSegment } from "./components/LocaleSegment";
import { TabPageHeading } from "./components/TabPageHeading";
import { TabExplainer } from "./components/TabExplainer";
import { RelatedCalculators } from "./components/RelatedCalculators";
import { NewVersionBanner } from "./components/NewVersionBanner";
import { ReleaseNotificationConsent } from "./components/ReleaseNotificationConsent";
import { useAnalyticsBootstrap } from "./hooks/useAnalyticsBootstrap";
import { useAnalyticsLifecycle } from "./hooks/useAnalyticsLifecycle";
import { TabCalculatorSection, TabSectionLoading } from "./components/TabCalculatorSection";
import { useLocale } from "./features/locale/LocaleContext";
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
  const [activeTab, setActiveTab] = useState<TabId>(() => redirectLegacyTabQuery());
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
    analyticsActive,
    showAnalyticsConsent,
    acceptAnalytics,
    rejectAnalytics,
  } = useAnalyticsBootstrap(locale);
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
    updatePageSeo(activeTab);
    if (analyticsActive) {
      trackPageView(`tab/${activeTab}`, pageTitle(activeTab));
    }
  }, [activeTab, analyticsActive]);

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
            <div className="app-brand-lockup">
              <LogoMark className="app-brand-logo" size={32} />
              <span className="app-sidebar-title">FinancialPlanner</span>
            </div>
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
                <div className="app-brand-lockup">
                  <LogoMark className="app-brand-logo" size={40} />
                  <p className="app-brand-name">FinancialPlanner</p>
                </div>
                <LocaleSegment value={locale} onChange={onLocaleChange} />
              </div>
              <p className="lede">
                Plan your home loan, compare prepayment options, model debt and retirement
                savings, track your monthly budget and investments, and explore what-if
                strategies—all in one place. Numbers are for learning only, not financial advice.
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
                aria-labelledby={`heading-${tab.id}`}
                hidden={activeTab !== tab.id}
                tabIndex={activeTab === tab.id ? 0 : undefined}
              >
                {activeTab === tab.id ? (
                  <>
                    <TabPageHeading tabId={tab.id} />
                    <TabExplainer tabId={tab.id} />
                    <RelatedCalculators tabId={tab.id} onSelectTab={selectTab} />
                    <FeedbackHelpful tabId={tab.id} locale={locale} />
                    <Suspense fallback={<TabSectionLoading />}>
                      <TabCalculatorSection tabId={tab.id} />
                    </Suspense>
                  </>
                ) : null}
              </div>
            ))}
          </main>
        </div>
      </div>

      {showAnalyticsConsent ? (
        <AnalyticsConsent onAccept={acceptAnalytics} onReject={rejectAnalytics} />
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

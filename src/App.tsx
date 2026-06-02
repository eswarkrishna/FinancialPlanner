import { useEffect, useState } from "react";
import { trackPageView } from "./lib/analytics";
import { AppFooter } from "./components/AppFooter";
import { DebtSection } from "./features/debt/DebtSection";
import { GameSection } from "./features/game/GameSection";
import { LoanSection } from "./features/loan/LoanSection";
import { RetirementSection } from "./features/retirement/RetirementSection";
import { StrategySection } from "./features/strategy/StrategySection";

type TabId = "loan" | "debt" | "retirement" | "strategies" | "strategic";

const TABS: { id: TabId; label: string }[] = [
  { id: "loan", label: "Loan" },
  { id: "debt", label: "Multi-debt" },
  { id: "retirement", label: "Retirement" },
  { id: "strategies", label: "Strategies" },
  { id: "strategic", label: "Strategic" },
];

export function App() {
  const [activeTab, setActiveTab] = useState<TabId>("loan");

  useEffect(() => {
    const label = TABS.find((t) => t.id === activeTab)?.label ?? activeTab;
    trackPageView(`tab/${activeTab}`, `FinancialPlanner — ${label}`);
  }, [activeTab]);

  function selectTab(tabId: TabId) {
    setActiveTab(tabId);
  }

  return (
    <div className="app-shell">
      <a href="#main-content" className="skip-link">
        Skip to content
      </a>

      <header className="app-header">
        <div className="app-header-inner app-brand">
          <h1>FinancialPlanner</h1>
          <p className="lede">
            Loan scenarios, debt payoff, retirement corpus, repayment strategies, and
            strategic game profiles — aligned with <code>docs/SPEC.md</code>.
          </p>
        </div>
        <nav className="app-tabs" aria-label="Planner sections">
          <div className="app-tabs-scroll" role="tablist">
            {TABS.map((tab) => (
              <button
                key={tab.id}
                type="button"
                role="tab"
                id={`tab-${tab.id}`}
                aria-selected={activeTab === tab.id}
                aria-controls={`panel-${tab.id}`}
                className={`app-tab${activeTab === tab.id ? " app-tab--active" : ""}`}
                onClick={() => selectTab(tab.id)}
              >
                <span className="app-tab-label">{tab.label}</span>
              </button>
            ))}
          </div>
        </nav>
      </header>

      <main id="main-content" className="layout">
        {TABS.map((tab) => (
          <div
            key={tab.id}
            id={`panel-${tab.id}`}
            role="tabpanel"
            aria-labelledby={`tab-${tab.id}`}
            hidden={activeTab !== tab.id}
          >
            {activeTab === tab.id && (
              <>
                {tab.id === "loan" && <LoanSection />}
                {tab.id === "debt" && <DebtSection />}
                {tab.id === "retirement" && <RetirementSection />}
                {tab.id === "strategies" && <StrategySection />}
                {tab.id === "strategic" && <GameSection />}
              </>
            )}
          </div>
        ))}
      </main>

      <AppFooter />
    </div>
  );
}

import { useState, type KeyboardEvent } from "react";
import { DebtSection } from "./features/debt/DebtSection";
import { LoanSection } from "./features/loan/LoanSection";
import { RetirementSection } from "./features/retirement/RetirementSection";
import { StrategySection } from "./features/strategy/StrategySection";
import { AppFooter } from "./components/AppFooter";

export type PlannerTab = "loan" | "debt" | "retirement" | "strategy";

const TABS: readonly {
  id: PlannerTab;
  label: string;
  shortHint: string;
}[] = [
  {
    id: "loan",
    label: "Loan",
    shortHint: "EMI, prepayments, amortisation, and scenario comparison.",
  },
  {
    id: "debt",
    label: "Multi-debt",
    shortHint: "Avalanche vs snowball payoff order with a fixed monthly budget.",
  },
  {
    id: "retirement",
    label: "Retirement",
    shortHint: "Corpus projection, inflation, and funded-ratio scenarios.",
  },
  {
    id: "strategy",
    label: "Strategies",
    shortHint: "Equity blend, prepay-heavy, and aggressive prepay side by side.",
  },
];

function tabIndexFor(active: PlannerTab, tabId: PlannerTab): number {
  return active === tabId ? 0 : -1;
}

function focusTab(tabId: PlannerTab): void {
  queueMicrotask(() => {
    document.getElementById(`tab-${tabId}`)?.focus();
  });
}

export function App() {
  const [active, setActive] = useState<PlannerTab>("loan");
  const activeMeta = TABS.find((t) => t.id === active)!;

  function selectTab(tabId: PlannerTab): void {
    setActive(tabId);
  }

  function handleTabKeyDown(
    e: KeyboardEvent<HTMLButtonElement>,
    tabId: PlannerTab,
  ): void {
    const idx = TABS.findIndex((t) => t.id === tabId);
    if (e.key === "ArrowRight" || e.key === "ArrowDown") {
      e.preventDefault();
      const next = TABS[(idx + 1) % TABS.length];
      selectTab(next.id);
      focusTab(next.id);
    } else if (e.key === "ArrowLeft" || e.key === "ArrowUp") {
      e.preventDefault();
      const prev = TABS[(idx - 1 + TABS.length) % TABS.length];
      selectTab(prev.id);
      focusTab(prev.id);
    } else if (e.key === "Home") {
      e.preventDefault();
      selectTab(TABS[0]!.id);
      focusTab(TABS[0]!.id);
    } else if (e.key === "End") {
      e.preventDefault();
      const last = TABS[TABS.length - 1]!;
      selectTab(last.id);
      focusTab(last.id);
    }
  }

  return (
    <div className="app-shell">
      <a className="skip-link" href="#main-content">
        Skip to planner content
      </a>

      <header className="app-header">
        <div className="app-header-inner">
          <div className="app-brand">
            <h1>FinancialPlanner</h1>
            <p className="lede" id="tab-context" aria-live="polite">
              {activeMeta.shortHint}
            </p>
          </div>
        </div>

        <nav className="app-tabs" aria-label="Planner sections">
          <div className="app-tabs-scroll" role="tablist">
            {TABS.map((tab) => (
              <button
                key={tab.id}
                type="button"
                role="tab"
                id={`tab-${tab.id}`}
                aria-selected={active === tab.id}
                aria-controls={`panel-${tab.id}`}
                tabIndex={tabIndexFor(active, tab.id)}
                className={`app-tab ${active === tab.id ? "app-tab--active" : ""}`}
                onClick={() => selectTab(tab.id)}
                onKeyDown={(e) => handleTabKeyDown(e, tab.id)}
              >
                <span className="app-tab-label">{tab.label}</span>
              </button>
            ))}
          </div>
        </nav>
      </header>

      <div className="layout">
        <main id="main-content" className="app-main">
          {active === "loan" && (
            <div
              role="tabpanel"
              id="panel-loan"
              className="app-panel"
              aria-labelledby="tab-loan"
            >
              <LoanSection />
            </div>
          )}
          {active === "debt" && (
            <div
              role="tabpanel"
              id="panel-debt"
              className="app-panel"
              aria-labelledby="tab-debt"
            >
              <DebtSection />
            </div>
          )}
          {active === "retirement" && (
            <div
              role="tabpanel"
              id="panel-retirement"
              className="app-panel"
              aria-labelledby="tab-retirement"
            >
              <RetirementSection />
            </div>
          )}
          {active === "strategy" && (
            <div
              role="tabpanel"
              id="panel-strategy"
              className="app-panel"
              aria-labelledby="tab-strategy"
            >
              <StrategySection />
            </div>
          )}
        </main>

        <AppFooter />
      </div>
    </div>
  );
}

import { lazy, type ComponentType } from "react";
import type { TabId } from "../lib/seo";
import { LoanSection } from "../features/loan/LoanSection";

const DebtSection = lazy(() =>
  import("../features/debt/DebtSection").then((module) => ({ default: module.DebtSection })),
);
const RetirementSection = lazy(() =>
  import("../features/retirement/RetirementSection").then((module) => ({
    default: module.RetirementSection,
  })),
);
const StrategySection = lazy(() =>
  import("../features/strategy/StrategySection").then((module) => ({
    default: module.StrategySection,
  })),
);
const GameSection = lazy(() =>
  import("../features/game/GameSection").then((module) => ({ default: module.GameSection })),
);
const BudgetSection = lazy(() =>
  import("../features/budget/BudgetSection").then((module) => ({ default: module.BudgetSection })),
);
const PpfSection = lazy(() =>
  import("../features/ppf/PpfSection").then((module) => ({ default: module.PpfSection })),
);
const SipSection = lazy(() =>
  import("../features/sip/SipSection").then((module) => ({ default: module.SipSection })),
);

const TAB_SECTIONS: Record<TabId, ComponentType> = {
  loan: LoanSection,
  debt: DebtSection,
  retirement: RetirementSection,
  ppf: PpfSection,
  sip: SipSection,
  strategies: StrategySection,
  strategic: GameSection,
  budget: BudgetSection,
};

export function TabCalculatorSection({ tabId }: { tabId: TabId }) {
  const Section = TAB_SECTIONS[tabId];
  return <Section />;
}

export function TabSectionLoading() {
  return (
    <p className="tab-section-loading" aria-live="polite">
      Loading calculator…
    </p>
  );
}

import { DebtSection } from "./features/debt/DebtSection";
import { LoanSection } from "./features/loan/LoanSection";
import { RetirementSection } from "./features/retirement/RetirementSection";
import { StrategySection } from "./features/strategy/StrategySection";

export function App() {
  return (
    <div className="layout">
      <header className="header">
        <h1>FinancialPlanner Dashboard</h1>
        <p className="lede">
          Loan payoff scenarios, debt payoff planning (avalanche/snowball),
          retirement corpus projections, and the §4.12 repayment strategy planner.
        </p>
      </header>

      <LoanSection />
      <DebtSection />
      <RetirementSection />
      <StrategySection />

      <footer className="footer">
        Educational planning only. EPF withdrawal eligibility, taxes, lender
        prepayment charges, and loan terms vary. Verify with EPFO, your lender, and
        a qualified financial adviser (SPEC §14).
      </footer>
    </div>
  );
}

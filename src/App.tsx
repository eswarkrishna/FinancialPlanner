import { DebtSection } from "./features/debt/DebtSection";
import { LoanSection } from "./features/loan/LoanSection";
import { RetirementSection } from "./features/retirement/RetirementSection";

export function App() {
  return (
    <div className="layout">
      <header className="header">
        <h1>FinancialPlanner Dashboard</h1>
        <p className="lede">
          Loan payoff scenarios, debt payoff planning (avalanche/snowball), and
          retirement corpus projections.
        </p>
      </header>

      <LoanSection />
      <DebtSection />
      <RetirementSection />

      <footer className="footer">
        Educational planning only. EPF withdrawal eligibility, taxes, lender
        prepayment charges, and loan terms vary. Verify with EPFO, your lender, and
        a qualified financial adviser (SPEC §14).
      </footer>
    </div>
  );
}

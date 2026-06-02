/** Site-wide footer: summary disclaimer + expandable terms (educational tool). */
export function AppFooter() {
  return (
    <footer className="footer">
      <p className="footer-lead">
        Educational planning only. EPF withdrawal eligibility, taxes, lender
        prepayment charges, and loan terms vary. Verify with EPFO, your lender, and a
        qualified financial adviser.
      </p>

      <details className="footer-terms">
        <summary className="footer-terms-summary">Terms and conditions</summary>
        <div className="footer-terms-body">
          <p className="footer-terms-intro">
            By using FinancialPlanner you acknowledge and agree to the following:
          </p>
          <ul className="footer-terms-list">
            <li>
              <strong>Not advice.</strong> This app provides general calculators and
              scenario models for learning. It is not financial, investment, tax,
              accounting, or legal advice, and it is not tailored to your situation.
            </li>
            <li>
              <strong>No professional relationship.</strong> Using the app does not
              create any duty of care or advisor–client relationship.
            </li>
            <li>
              <strong>No warranty.</strong> The app and all outputs are provided
              &quot;as is&quot; without warranty of any kind. We do not guarantee
              accuracy, completeness, or fitness for a particular purpose.
            </li>
            <li>
              <strong>Your responsibility.</strong> You are solely responsible for
              decisions you make. Confirm numbers, rules, and outcomes with your
              lender, EPFO or pension provider, tax professional, and a
              SEBI-registered investment adviser where applicable.
            </li>
            <li>
              <strong>Simplified models.</strong> Calculations use stated assumptions
              (including rounding and fixed rates where shown). Real products may use
              different day counts, fees, floating rates, prepayment rules, or tax
              treatment.
            </li>
            <li>
              <strong>Projections are not promises.</strong> Illustrated returns,
              corpus figures, and payoff dates are hypothetical. Past or projected
              performance is not indicative of future results.
            </li>
            <li>
              <strong>Privacy (typical use).</strong> In the standard setup, inputs
              stay in your browser; we do not receive your data unless you choose to
              share or export it elsewhere. If a hosted or connected version is used,
              its privacy policy applies additionally.
            </li>
            <li>
              <strong>Analytics.</strong> The public site may use Google Analytics 4 to
              collect anonymous usage (e.g. which tab you open). No loan amounts or
              personal data are sent. You can block this with a browser extension or
              opt out via{" "}
              <a
                href="https://tools.google.com/dlpage/gaoptout"
                target="_blank"
                rel="noopener noreferrer"
              >
                Google&apos;s opt-out add-on
              </a>
              .
            </li>
            <li>
              <strong>Third parties.</strong> References to institutions (e.g. EPFO,
              lenders) are for context only. We are not endorsed by them.
            </li>
            <li>
              <strong>Limitation of liability.</strong> To the fullest extent
              permitted by law, we are not liable for any loss or damage arising from
              use of or reliance on this app.
            </li>
            <li>
              <strong>Changes.</strong> These terms and the app may be updated. Continued
              use after changes constitutes acceptance of the updated terms.
            </li>
          </ul>
        </div>
      </details>
    </footer>
  );
}

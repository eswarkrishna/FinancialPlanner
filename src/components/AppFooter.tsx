/** Site-wide footer: summary disclaimer + expandable terms (educational tool). */
import {
  formatBuildCommitDate,
  getBuildInfo,
  githubCommitUrl,
} from "../lib/buildInfo";
import { githubIssuesUrl } from "../lib/feedback";
import {
  trackFeedbackGithubClick,
  trackFooterCommitLinkClick,
  trackFooterGaOptoutClick,
  trackFooterTermsToggle,
} from "../lib/analytics";
import { CopyTabLink } from "./CopyTabLink";
import { ShareFacebook } from "./ShareFacebook";
import { useLocale } from "../features/locale/LocaleContext";
import type { TabId } from "../lib/seo";

function BuildMetaLine() {
  const info = getBuildInfo();
  if (!info) {
    return null;
  }

  const commitUrl = githubCommitUrl(info.githubRepo, info.commitSha);

  return (
    <p className="footer-meta">
      Latest push:{" "}
      <time dateTime={info.commitIsoDate}>
        {formatBuildCommitDate(info.commitIsoDate)}
      </time>
      {" · "}
      <a
        href={commitUrl}
        target="_blank"
        rel="noopener noreferrer"
        aria-label={`View commit ${info.commitShort} on GitHub (opens in new tab)`}
        onClick={trackFooterCommitLinkClick}
      >
        <code>{info.commitShort}</code>
      </a>
    </p>
  );
}

function FooterFeedback({ activeTab, locale }: { activeTab: TabId; locale: string }) {
  const issuesUrl = githubIssuesUrl();

  return (
    <section className="footer-feedback" aria-label="Feedback">
      <p className="footer-feedback-lead">Help us improve</p>
      <p className="footer-feedback-actions">
        <CopyTabLink tabId={activeTab} locale={locale} />
        {" · "}
        <ShareFacebook tabId={activeTab} locale={locale} />
        {" · "}
        <a
          href={issuesUrl}
          target="_blank"
          rel="noopener noreferrer"
          aria-label="Report an issue on GitHub (opens in new tab)"
          onClick={trackFeedbackGithubClick}
        >
          Report on GitHub
        </a>
      </p>
    </section>
  );
}

function DisclaimerLead() {
  const { locale } = useLocale();
  if (locale === "US") {
    return (
      <p className="footer-lead">
        Educational planning only. 401(k) withdrawal rules, taxes, lender prepayment
        charges, and mortgage terms vary. Verify with your plan administrator, lender,
        and a qualified financial adviser.
      </p>
    );
  }
  if (locale === "UK") {
    return (
      <p className="footer-lead">
        Educational planning only. Pension access rules, redundancy entitlements,
        Jobseeker&apos;s Allowance, Support for Mortgage Interest, ISA limits, tax rates,
        and mortgage early repayment charges vary. Verify with GOV.UK, your pension
        provider, your lender, and a qualified financial adviser. Figures use 2026/27
        defaults.
      </p>
    );
  }
  return (
    <p className="footer-lead">
      Educational planning only. EPF withdrawal eligibility, taxes, lender prepayment
      charges, and loan terms vary. Verify with EPFO, your lender, and a qualified
      financial adviser.
    </p>
  );
}

export function AppFooter({
  activeTab,
  locale,
}: {
  activeTab: TabId;
  locale: string;
}) {
  return (
    <footer className="footer">
      <BuildMetaLine />
      <DisclaimerLead />
      <FooterFeedback activeTab={activeTab} locale={locale} />

      <details
        className="footer-terms"
        onToggle={(event) => {
          trackFooterTermsToggle((event.currentTarget as HTMLDetailsElement).open);
        }}
      >
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
              <strong>Browser storage.</strong> Form inputs (loan amounts, salaries, debt
              balances, budget lines, and similar) are saved in your browser&apos;s{" "}
              <code>localStorage</code> so they survive refresh. This data stays on your
              device and is not encrypted; anyone with access to your browser profile or a
              malicious script on this site could read it. Clear site data in your browser
              settings to remove it.
            </li>
            <li>
              <strong>Privacy (typical use).</strong> We do not receive your calculator
              inputs on our servers unless you choose to share or export them elsewhere.
              If a hosted or connected version is used, its privacy policy applies
              additionally.
            </li>
            <li>
              <strong>Analytics.</strong> The public site may ask for consent before loading
              Google Analytics 4. When enabled, it collects anonymous usage (e.g. which tab
              you open, exports, and named control actions). No loan amounts or personal data
              are sent. You can decline in the consent strip, block tracking with a browser
              extension, or opt out via{" "}
              <a
                href="https://tools.google.com/dlpage/gaoptout"
                target="_blank"
                rel="noopener noreferrer"
                aria-label="Google Analytics opt-out add-on (opens in new tab)"
                onClick={trackFooterGaOptoutClick}
              >
                Google&apos;s opt-out add-on
              </a>
              .
            </li>
            <li>
              <strong>Feedback.</strong> GitHub issue reports are voluntary and processed
              on GitHub, not stored in this app.
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

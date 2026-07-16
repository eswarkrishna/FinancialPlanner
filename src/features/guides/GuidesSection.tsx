import { GUIDE_PAGES } from "../../content/guides";
import { tabPageUrl } from "../../lib/seo";
import type { TabId } from "../../lib/seo";

type GuidesSectionProps = {
  onOpenTab: (tab: TabId) => void;
};

export function GuidesSection({ onOpenTab }: GuidesSectionProps) {
  return (
    <>
      <section className="card">
        <h2>Planning guides</h2>
        <p className="hint">
          Short guides linking to interactive calculators. Each guide is also available as a
          crawlable page under <code>/guides/</code> for search engines.
        </p>
      </section>

      <div className="guide-grid">
        {GUIDE_PAGES.map((guide) => (
          <article key={guide.slug} className="card guide-card">
            <h3>{guide.title}</h3>
            <p className="hint">{guide.description}</p>
            {guide.sections.map((section) => (
              <div key={section.heading} className="guide-section">
                <h4>{section.heading}</h4>
                <p>{section.body}</p>
              </div>
            ))}
            <div className="inline-actions guide-card-actions">
              <button type="button" className="btn primary btn-sm" onClick={() => onOpenTab(guide.tab)}>
                Open calculator
              </button>
              <a
                className="btn secondary btn-sm"
                href={`./guides/${guide.slug}.html`}
                target="_blank"
                rel="noopener noreferrer"
              >
                Static guide page
              </a>
            </div>
          </article>
        ))}
      </div>

      <section className="card">
        <h3>All guide URLs</h3>
        <ul className="guide-url-list">
          {GUIDE_PAGES.map((guide) => (
            <li key={guide.slug}>
              <a href={`./guides/${guide.slug}.html`}>{guide.title}</a>
              <span className="hint"> → {tabPageUrl(guide.tab)}</span>
            </li>
          ))}
        </ul>
      </section>
    </>
  );
}

import Link from "next/link";

type Section = {
  title: string;
  paragraphs: string[];
};

export function PublicDocument({ eyebrow, title, updated, sections }: {
  eyebrow: string;
  title: string;
  updated: string;
  sections: Section[];
}) {
  return (
    <main className="legal-page">
      <header className="legal-header">
        <Link className="legal-wordmark" href="/" aria-label="Back to ASC Club Portal">
          <b>ASC</b>
          <span>Club Portal<small>closed member portal</small></span>
        </Link>
        <Link className="legal-back" href="/">Back to portal</Link>
      </header>

      <article className="legal-document">
        <div className="legal-title">
          <p className="eyebrow">{eyebrow}</p>
          <h1>{title}</h1>
          <p>Last updated {updated}</p>
        </div>

        <div className="legal-sections">
          {sections.map((section, index) => (
            <section key={section.title}>
              <span>{String(index + 1).padStart(2, "0")}</span>
              <div>
                <h2>{section.title}</h2>
                {section.paragraphs.map((paragraph) => <p key={paragraph}>{paragraph}</p>)}
              </div>
            </section>
          ))}
        </div>
      </article>

      <footer className="legal-footer">
        <strong>ASC</strong>
        <span>Build · Learn · Belong</span>
      </footer>
    </main>
  );
}

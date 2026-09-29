import { Link } from "react-router-dom";
import { LanguageSwitcher } from "@/components/LanguageSwitcher";
import SEO from "@/components/SEO";

type Section = { title: string; body: React.ReactNode };

export default function LegalPage({ title, description, updated, sections }: { title: string; description: string; updated: string; sections: Section[] }) {
  return <div className="eop-root legal-page">
    <SEO title={`${title} - Echoes of the Past`} description={description} />
    <header className="eop-nav">
      <Link to="/" className="eop-logo"><span className="eop-logo-dot" /><span>Echoes of the Past</span></Link>
      <nav className="eop-nav-links" aria-label="Primary navigation"><LanguageSwitcher /><Link to="/learn" className="eop-nav-link">Learn</Link><Link to="/about" className="eop-nav-link">Project</Link></nav>
    </header>
    <main id="main-content" className="legal-page-content">
      <p className="eop-label">Echoes of the Past</p><h1>{title}</h1><p className="legal-page-intro">{description}</p><p className="legal-page-updated">Last updated: {updated}</p>
      {sections.map(section => <section className="legal-page-section" key={section.title}><h2>{section.title}</h2><div>{section.body}</div></section>)}
    </main>
  </div>;
}

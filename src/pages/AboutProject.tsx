import { Link } from "react-router-dom";
import { ArrowLeft, ExternalLink } from "lucide-react";
import SEO from "@/components/SEO";
import { LanguageSwitcher } from "@/components/LanguageSwitcher";
import { useLanguage } from "@/lib/i18n";

const content = {
  en: {
    eyebrow: "Erasmus+ small-scale partnership in youth",
    intro: "Echoes of the Past helps young people explore, preserve and share cultural heritage through accessible AI and digital storytelling tools.",
    overview: "Project overview", activities: "What we are creating", partners: "Partnership", results: "Results and participation",
    code: "Project number", dates: "Project period", grant: "Grant awarded", authority: "Granting authority",
    activityItems: ["An interactive AI learning hub and practical heritage-preservation toolkit.", "Workshops that build digital, AI and storytelling skills with young people.", "Interactive heritage mapping, digital exhibitions and events that share local stories."],
    resultText: "The platform, learning resources and activities are designed to make cultural heritage more accessible while helping young people develop practical digital skills. Explore the archive, use the Learning Hub and follow future project activities through the partner organisations.",
    coordinator: "Coordinator", partner: "Partner", back: "Explore the archive", source: "Learn more about Erasmus+",
    period: "1 September 2025 – 31 August 2027", romania: "Romania", france: "France",
  },
  ro: {
    eyebrow: "Parteneriat Erasmus+ la scară mică în domeniul tineretului",
    intro: "Ecouri ale Trecutului îi ajută pe tineri să exploreze, să păstreze și să împărtășească patrimoniul cultural prin instrumente accesibile de inteligență artificială și narațiune digitală.",
    overview: "Prezentarea proiectului", activities: "Ce creăm", partners: "Parteneriat", results: "Rezultate și participare",
    code: "Numărul proiectului", dates: "Perioada proiectului", grant: "Grant acordat", authority: "Autoritatea finanțatoare",
    activityItems: ["Un hub interactiv de învățare AI și un instrument practic pentru conservarea patrimoniului.", "Ateliere care dezvoltă competențe digitale, AI și de storytelling pentru tineri.", "Cartografiere interactivă a patrimoniului, expoziții digitale și evenimente care împărtășesc povești locale."],
    resultText: "Platforma, resursele de învățare și activitățile fac patrimoniul cultural mai accesibil și îi ajută pe tineri să dezvolte competențe digitale practice. Explorați arhiva, utilizați Hubul de Învățare și urmăriți activitățile viitoare prin organizațiile partenere.",
    coordinator: "Coordonator", partner: "Partener", back: "Explorați arhiva", source: "Aflați mai multe despre Erasmus+",
    period: "1 septembrie 2025 – 31 august 2027", romania: "România", france: "Franța",
  },
  fr: {
    eyebrow: "Partenariat Erasmus+ à petite échelle dans le domaine de la jeunesse",
    intro: "Échos du Passé aide les jeunes à explorer, préserver et partager le patrimoine culturel grâce à des outils accessibles d’IA et de narration numérique.",
    overview: "Présentation du projet", activities: "Ce que nous créons", partners: "Partenariat", results: "Résultats et participation",
    code: "Numéro du projet", dates: "Période du projet", grant: "Subvention accordée", authority: "Autorité chargée de l’octroi",
    activityItems: ["Un hub d’apprentissage interactif en IA et une boîte à outils pratique pour préserver le patrimoine.", "Des ateliers développant les compétences numériques, en IA et en narration des jeunes.", "Cartographie interactive du patrimoine, expositions numériques et événements partageant des histoires locales."],
    resultText: "La plateforme, les ressources d’apprentissage et les activités rendent le patrimoine culturel plus accessible tout en aidant les jeunes à développer des compétences numériques concrètes. Explorez les archives, utilisez le hub d’apprentissage et suivez les activités futures par l’intermédiaire des organisations partenaires.",
    coordinator: "Coordinateur", partner: "Partenaire", back: "Explorer les archives", source: "En savoir plus sur Erasmus+",
    period: "1 septembre 2025 – 31 août 2027", romania: "Roumanie", france: "France",
  },
};

export default function AboutProject() {
  const { lang, t } = useLanguage();
  const text = content[lang];
  return <div className="eop-root about-project-page">
    <SEO title="About the Erasmus+ Project - Echoes of the Past" description="Project information for Echoes of the Past: AI in Heritage Preservation, an Erasmus+ KA210-YOU partnership." />
    <header className="eop-nav">
      <Link to="/" className="eop-logo"><span className="eop-logo-dot" /><span>Echoes of the Past</span></Link>
      <nav className="eop-nav-links"><LanguageSwitcher /><Link to="/learn" className="eop-nav-link">{t("nav_learn")}</Link><Link to="/" className="eop-nav-link">{t("nav_archive")}</Link></nav>
    </header>
    <main className="about-project-content">
      <p className="eop-label">{text.eyebrow}</p>
      <h1>Echoes of the Past: AI in Heritage Preservation</h1>
      <p className="about-project-intro">{text.intro}</p>
      <section className="about-project-section about-project-facts"><h2>{text.overview}</h2><dl>
        <div><dt>{text.code}</dt><dd>2025-1-RO01-KA210-YOU-000352643</dd></div>
        <div><dt>{text.dates}</dt><dd>{text.period}</dd></div>
        <div><dt>{text.grant}</dt><dd>€30,000</dd></div>
        <div><dt>{text.authority}</dt><dd>National Agency for Community Programmes in the Field of Education and Vocational Training (ANPCDEFP), Romania</dd></div>
      </dl></section>
      <section className="about-project-section"><h2>{text.activities}</h2><ul>{text.activityItems.map(item => <li key={item}>{item}</li>)}</ul></section>
      <section className="about-project-section"><h2>{text.partners}</h2><div className="about-partners"><article><p>{text.coordinator}</p><h3>Asociația Small Academy</h3><span>{text.romania}</span></article><article><p>{text.partner}</p><h3>InsightMatches</h3><span>{text.france}</span></article></div></section>
      <section className="about-project-section"><h2>{text.results}</h2><p>{text.resultText}</p></section>
      <div className="about-project-actions"><Link to="/" className="eop-btn-primary"><ArrowLeft size={16} /> {text.back}</Link><a href="https://erasmus-plus.ec.europa.eu/" target="_blank" rel="noreferrer" className="about-project-link">{text.source} <ExternalLink size={15} /></a></div>
    </main>
  </div>;
}

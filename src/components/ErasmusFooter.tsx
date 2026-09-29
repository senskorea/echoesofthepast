import { Link } from "react-router-dom";
import euEmblem from "@/assets/eu-emblem.svg";
import { useLanguage } from "@/lib/i18n";

const content = {
  en: {
    funded: "Funded by the European Union",
    about: "About this Erasmus+ project",
    privacy: "Privacy",
    accessibility: "Accessibility",
    credits: "Credits & licences",
    responsible: "Responsible use & report content",
    disclaimer: "Funded by the European Union. Views and opinions expressed are however those of the author(s) only and do not necessarily reflect those of the European Union or the National Agency for Community Programmes in the Field of Education and Vocational Training (ANPCDEFP). Neither the European Union nor the granting authority can be held responsible for them.",
  },
  ro: {
    funded: "Finanțat de Uniunea Europeană",
    about: "Despre proiectul Erasmus+",
    privacy: "Confidențialitate",
    accessibility: "Accesibilitate",
    credits: "Credite și licențe",
    responsible: "Utilizare responsabilă și raportare",
    disclaimer: "Finanțat de Uniunea Europeană. Opiniile și punctele de vedere exprimate aparțin exclusiv autorului/autorilor și nu reflectă neapărat opiniile Uniunii Europene sau ale Agenției Naționale pentru Programe Comunitare în Domeniul Educației și Formării Profesionale (ANPCDEFP). Nici Uniunea Europeană, nici autoritatea finanțatoare nu pot fi considerate răspunzătoare pentru acestea.",
  },
  fr: {
    funded: "Financé par l’Union européenne",
    about: "À propos du projet Erasmus+",
    privacy: "Confidentialité",
    accessibility: "Accessibilité",
    credits: "Crédits et licences",
    responsible: "Utilisation responsable et signalement",
    disclaimer: "Financé par l’Union européenne. Les points de vue et avis exprimés n’engagent toutefois que leur(s) auteur(s) et ne reflètent pas nécessairement ceux de l’Union européenne ou de l’Agence nationale pour les programmes communautaires dans le domaine de l’éducation et de la formation professionnelle (ANPCDEFP). Ni l’Union européenne ni l’autorité chargée de l’octroi ne peuvent en être tenues responsables.",
  },
};

export default function ErasmusFooter() {
  const { lang } = useLanguage();
  const text = content[lang];

  return <footer className="erasmus-footer">
    <div className="erasmus-footer-inner">
      <div className="erasmus-funding-mark">
        <img src={euEmblem} alt="European Union emblem" />
        <div>
          <p className="erasmus-funded">{text.funded}</p>
          <p className="erasmus-project-code">Erasmus+ KA210-YOU · 2025-1-RO01-KA210-YOU-000352643</p>
        </div>
      </div>
      <div className="erasmus-footer-copy">
        <p>{text.disclaimer}</p>
        <div className="erasmus-footer-links">
          <Link to="/about">{text.about}</Link>
          <Link to="/privacy">{text.privacy}</Link>
          <Link to="/accessibility">{text.accessibility}</Link>
          <Link to="/credits">{text.credits}</Link>
          <Link to="/responsible-use">{text.responsible}</Link>
          <a href="https://github.com/senskorea/echoesofthepast" target="_blank" rel="noreferrer">GitHub</a>
        </div>
      </div>
    </div>
  </footer>;
}

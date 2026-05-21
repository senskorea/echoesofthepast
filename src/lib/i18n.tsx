import { useState, useEffect, createContext, useContext } from "react";

export type Language = "en" | "ro" | "fr";

interface Translations {
  [key: string]: {
    en: string;
    ro: string;
    fr: string;
  };
}

export const translations: Translations = {
  // Navigation
  nav_archive: {
    en: "Archive",
    ro: "Arhivă",
    fr: "Archives"
  },
  nav_learn: {
    en: "Learn",
    ro: "Învățare",
    fr: "Apprendre"
  },
  nav_settings: {
    en: "Settings",
    ro: "Setări",
    fr: "Paramètres"
  },
  nav_add_story: {
    en: "Add Story",
    ro: "Adaugă Poveste",
    fr: "Ajouter"
  },

  // Home Page
  home_hero_title: {
    en: "Echoes of the Past",
    ro: "Ecouri ale Trecutului",
    fr: "Échos du Passé"
  },
  home_hero_sub: {
    en: "Mapping history, one story at a time. Preserve, digitize, and reimagine cultural heritage through AI.",
    ro: "Cartografierea istoriei, poveste cu poveste. Conservați, digitizați și reimaginați patrimoniul cultural prin AI.",
    fr: "Cartographier l'histoire, une histoire à la fois. Préservez, numérisez et réimaginez le patrimoine culturel grâce à l'IA."
  },
  home_search_placeholder: {
    en: "Search postcards, locations, eras...",
    ro: "Căutați cărți poștale, locații, ere...",
    fr: "Rechercher des cartes postales, des lieux, des époques..."
  },

  // Postcard Detail
  pd_back: {
    en: "Back to Archive",
    ro: "Înapoi la Arhivă",
    fr: "Retour aux Archives"
  },
  pd_vision_analysis: {
    en: "AI Vision Analysis",
    ro: "Analiză AI Vision",
    fr: "Analyse Vision IA"
  },
  pd_generate: {
    en: "Generate Content",
    ro: "Generează Conținut",
    fr: "Générer du Contenu"
  },
  pd_creative_space: {
    en: "Creative Space",
    ro: "Spațiu Creativ",
    fr: "Espace Créatif"
  },

  // Settings
  settings_title: {
    en: "Platform Settings",
    ro: "Setările Platformei",
    fr: "Paramètres"
  },
  settings_save: {
    en: "Save Settings",
    ro: "Salvează Setările",
    fr: "Enregistrer"
  },
  settings_saved: {
    en: "Saved to browser",
    ro: "Salvat în browser",
    fr: "Enregistré"
  },

  // Learn Hub
  learn_hero_title: {
    en: "Interactive AI Hub",
    ro: "Hub AI Interactiv",
    fr: "Hub IA Interactif"
  },
  learn_progress: {
    en: "Overall Progress",
    ro: "Progres General",
    fr: "Progrès Global"
  },
  learn_back: {
    en: "Back to Curriculum",
    ro: "Înapoi la Curriculum",
    fr: "Retour au programme"
  }
};

interface LanguageContextType {
  lang: Language;
  setLang: (lang: Language) => void;
  t: (key: keyof typeof translations) => string;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export const LanguageProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [lang, setLangState] = useState<Language>(
    (localStorage.getItem("eop-language") as Language) || "en"
  );

  const setLang = (newLang: Language) => {
    setLangState(newLang);
    localStorage.setItem("eop-language", newLang);
  };

  const t = (key: keyof typeof translations) => {
    return translations[key]?.[lang] || translations[key]?.en || key;
  };

  return (
    <LanguageContext.Provider value={{ lang, setLang, t }}>
      {children}
    </LanguageContext.Provider>
  );
};

export const useLanguage = () => {
  const context = useContext(LanguageContext);
  if (!context) throw new Error("useLanguage must be used within a LanguageProvider");
  return context;
};

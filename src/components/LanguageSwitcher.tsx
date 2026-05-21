import { useLanguage, Language } from "../lib/i18n";

export const LanguageSwitcher = () => {
  const { lang, setLang } = useLanguage();

  return (
    <div style={{ display: "flex", gap: 4, background: "rgba(255,255,255,0.8)", padding: 4, borderRadius: 8, border: "1px solid var(--grey-5)", marginRight: 16 }}>
      {(["en", "ro", "fr"] as const).map(l => (
        <button 
          key={l} 
          onClick={() => setLang(l)}
          style={{ 
            padding: "4px 8px", 
            fontSize: "0.75rem", 
            borderRadius: 6, 
            background: lang === l ? "var(--grey-5)" : "transparent",
            color: lang === l ? "var(--grey-1)" : "var(--grey-3)",
            textTransform: "uppercase",
            fontWeight: 600,
            cursor: "pointer",
            border: "none",
            transition: "all 0.2s"
          }}
        >
          {l}
        </button>
      ))}
    </div>
  );
};

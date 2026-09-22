import { useState } from "react";
import { useLanguage } from "@/lib/i18n";

const repository = "https://github.com/senskorea/echoesofthepast";
const guides = {
  en: {
    copy: "Copy instructions for an AI assistant", copied: "Copied — paste into your AI assistant", help: "Need help installing or customising your copy? Paste these instructions into ChatGPT, Claude, Gemini or another AI assistant. The button copies text; it does not send anything or use your daily AI allowance.", preview: "View instructions / copy manually", failed: "Automatic copying didn’t work. Select and copy the instructions below.",
    title: "README & installation guide",
    intro: "You are using the hosted online version of Echoes of the Past. Use it here without installing anything, or download the source code from GitHub to make it your own: customise the design, add your collection, and run it locally or publish your own website.",
    steps: [
      ["Download the code", "Open the GitHub repository, select Code → Download ZIP, then extract the folder. You can also clone the repository using Git."],
      ["Prepare your computer", "Install Node.js 22.12 or newer within the Node 22 release line, which includes npm. Open a terminal in the extracted project folder."],
      ["Install and configure", "Run npm ci. Copy .env.example to a new file named .env in the project folder; keep any existing .env file. The gallery, lessons and quizzes work without cloud credentials."],
      ["Start the website", "Run npm run dev and open the local address shown in the terminal (usually http://localhost:8080). Keep the terminal running while you use your local copy."],
    ],
    note: "Want AI generation in your own installation? Follow the deployment guide to configure your organisation’s Supabase backend and shared AI services. Gemini and OpenAI secret keys belong in the backend, never in VITE_ variables or the public repository.",
    repo: "Get the code on GitHub", readme: "Read the full README", deploy: "Backend & deployment guide", commands: "In your project folder",
  },
  ro: {
    copy: "Copiază instrucțiunile pentru un asistent AI", copied: "Copiat — lipește în asistentul AI", help: "Ai nevoie de ajutor pentru instalare sau personalizare? Lipește instrucțiunile în ChatGPT, Claude, Gemini sau alt asistent AI. Butonul doar copiază textul; nu trimite nimic și nu consumă limita zilnică AI.", preview: "Vezi instrucțiunile / copiază manual", failed: "Copierea automată nu a reușit. Selectează și copiază instrucțiunile de mai jos.",
    title: "README și ghid de instalare",
    intro: "Folosești versiunea online găzduită a platformei Echoes of the Past. O poți utiliza fără instalare sau poți descărca sursa de pe GitHub pentru a o adapta: personalizează designul, adaugă propria colecție și rulează local sau publică propriul site.",
    steps: [
      ["Descarcă codul", "Deschide depozitul GitHub, alege Code → Download ZIP și dezarhivează folderul. Poți clona depozitul și cu Git."],
      ["Pregătește calculatorul", "Instalează Node.js din seria 22, versiunea 22.12 sau mai nouă, care include npm. Deschide un terminal în folderul proiectului dezarhivat."],
      ["Instalează și configurează", "Rulează npm ci. Copiază .env.example într-un fișier nou numit .env în folderul proiectului; păstrează orice fișier .env existent. Galeria, lecțiile și chestionarele funcționează fără credențiale cloud."],
      ["Pornește site-ul", "Rulează npm run dev și deschide adresa locală afișată în terminal (de obicei http://localhost:8080). Lasă terminalul deschis cât timp folosești copia locală."],
    ],
    note: "Pentru generare AI în propria instalare, urmează ghidul de implementare pentru a configura backend-ul Supabase și serviciile AI ale organizației. Cheile secrete Gemini și OpenAI se păstrează în backend, niciodată în variabile VITE_ sau în depozitul public.",
    repo: "Descarcă de pe GitHub", readme: "Citește README", deploy: "Ghid backend și implementare", commands: "În folderul proiectului",
  },
  fr: {
    copy: "Copier les instructions pour un assistant IA", copied: "Copié — collez dans votre assistant IA", help: "Besoin d’aide pour installer ou personnaliser votre copie ? Collez ces instructions dans ChatGPT, Claude, Gemini ou un autre assistant IA. Le bouton copie le texte sans rien envoyer et sans utiliser votre quota quotidien d’IA.", preview: "Voir les instructions / copier manuellement", failed: "La copie automatique a échoué. Sélectionnez et copiez les instructions ci-dessous.",
    title: "README et guide d’installation",
    intro: "Vous utilisez la version en ligne hébergée d’Echoes of the Past. Utilisez-la sans installation, ou téléchargez le code source sur GitHub pour vous l’approprier : personnalisez le design, ajoutez votre collection et lancez votre copie localement ou publiez votre propre site.",
    steps: [
      ["Télécharger le code", "Ouvrez le dépôt GitHub, choisissez Code → Download ZIP, puis décompressez le dossier. Vous pouvez aussi cloner le dépôt avec Git."],
      ["Préparer votre ordinateur", "Installez Node.js de la série 22, version 22.12 ou ultérieure, qui inclut npm. Ouvrez un terminal dans le dossier du projet décompressé."],
      ["Installer et configurer", "Exécutez npm ci. Copiez .env.example dans un nouveau fichier nommé .env à la racine du projet ; conservez tout fichier .env existant. La galerie, les leçons et les quiz fonctionnent sans identifiants cloud."],
      ["Lancer le site", "Exécutez npm run dev et ouvrez l’adresse locale affichée dans le terminal (généralement http://localhost:8080). Gardez le terminal ouvert pendant l’utilisation de votre copie locale."],
    ],
    note: "Pour activer la génération par IA dans votre installation, suivez le guide de déploiement pour configurer le backend Supabase et les services d’IA de votre organisation. Les clés secrètes Gemini et OpenAI restent dans le backend, jamais dans les variables VITE_ ou le dépôt public.",
    repo: "Obtenir le code sur GitHub", readme: "Lire le README complet", deploy: "Guide backend et déploiement", commands: "Dans le dossier du projet",
  },
};

export default function QuickStartGuide() {
  const { lang } = useLanguage();
  const guide = guides[lang];
  const [copyStatus, setCopyStatus] = useState<"idle" | "copied" | "failed">("idle");
  const instructions = `Help me install, customise or troubleshoot my own copy of Echoes of the Past (GeoStories). Reply in ${lang === "ro" ? "Romanian" : lang === "fr" ? "French" : "English"} using beginner-friendly steps.

Public hosted version: https://senskorea.github.io/echoesofthepast/
Source code: ${repository}
README: ${repository}/blob/main/README.md
Deployment guide: ${repository}/blob/main/DEPLOYMENT.md

First ask which operating system I use, whether I have downloaded the code, and whether I want local installation, customisation, deployment or help with an error. Give one manageable step at a time and check the result. Read the current README and deployment guide; if you cannot access them, ask me to paste the relevant section.

For local installation: download Code → Download ZIP on GitHub and extract it, or clone the repository. Use Node.js 22.12 or newer within the Node 22 release line and npm. Open a terminal in the project folder and run npm ci. Copy .env.example to .env without overwriting existing configuration. Run npm run dev and open the address printed by Vite (usually http://localhost:8080). The gallery, lessons and quizzes work without cloud credentials; external videos require internet.

Explain that the public site is an online hosted version. My downloaded copy can have its own design and collection, run locally, or be published independently. Keep the repository’s MIT licence and copyright notice; check content and image permissions separately.

For AI in my own deployment, follow DEPLOYMENT.md to configure my organisation’s Supabase backend and provider credentials. Downloading the code does not provide the public site’s private keys or AI quota. GitHub Pages hosts static frontend files, not the backend. All VITE_ variables are public. Never ask me to paste Gemini/OpenAI secret keys or Supabase service-role keys into chat, frontend code or GitHub. Explain where I must enter secrets privately. Enable only configured and verified services and set usage limits.

For troubleshooting, ask for the exact step and a redacted error message. Preserve existing files, browser-local creations and backups. Do not advise clearing browser data or overwriting .env as a first step. Help verify the result before moving on.`;
  const copyInstructions = async () => {
    try { await navigator.clipboard.writeText(instructions); setCopyStatus("copied"); }
    catch { setCopyStatus("failed"); }
  };
  return (
    <section id="installation-guide" aria-labelledby="installation-guide-title" className="learn-guide">
      <h2 id="installation-guide-title">{guide.title}</h2>
      <p>{guide.intro}</p>
      <div className="learn-guide-links">
        <a href={repository} target="_blank" rel="noopener noreferrer">{guide.repo} ↗</a>
        <a className="learn-readme-button" href={`${repository}/blob/main/README.md`} target="_blank" rel="noopener noreferrer">{guide.readme} ↗</a>
      </div>
      <div className="learn-ai-help">
        <p>{guide.help}</p>
        <button type="button" className="learn-copy-button" onClick={copyInstructions}>{guide.copy}</button>
        <p role="status" aria-live="polite">{copyStatus === "copied" ? guide.copied : copyStatus === "failed" ? guide.failed : ""}</p>
        <details open={copyStatus === "failed" || undefined}>
          <summary>{guide.preview}</summary>
          <textarea aria-label={guide.preview} readOnly value={instructions} rows={10} onFocus={event => event.currentTarget.select()} />
        </details>
      </div>
      <ol>
        {guide.steps.map(([title, text]) => <li key={title}><strong>{title}</strong><p>{text}</p></li>)}
      </ol>
      <p className="eop-label">{guide.commands}</p>
      <pre><code>{"npm ci\n# Copy .env.example to .env before starting\nnpm run dev"}</code></pre>
      <p className="learn-guide-note">{guide.note}</p>
      <a href={`${repository}/blob/main/DEPLOYMENT.md`} target="_blank" rel="noopener noreferrer">{guide.deploy} ↗</a>
    </section>
  );
}

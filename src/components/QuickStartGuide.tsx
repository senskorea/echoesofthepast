import { useLanguage } from "@/lib/i18n";

const repository = "https://github.com/senskorea/echoesofthepast";
const guides = {
  en: {
    title: "README & installation guide",
    intro: "The platform’s source code is available on GitHub. Download it to run your own local copy. To use this public website, no installation is needed.",
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
    title: "README și ghid de instalare",
    intro: "Codul sursă al platformei este disponibil pe GitHub. Descarcă-l pentru a rula o copie locală. Acest site public poate fi folosit fără instalare.",
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
    title: "README et guide d’installation",
    intro: "Le code source de la plateforme est disponible sur GitHub. Téléchargez-le pour exécuter votre propre copie locale. Aucune installation n’est nécessaire pour utiliser ce site public.",
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
  return (
    <section id="installation-guide" aria-labelledby="installation-guide-title" className="learn-guide">
      <h2 id="installation-guide-title">{guide.title}</h2>
      <p>{guide.intro}</p>
      <div className="learn-guide-links">
        <a href={repository} target="_blank" rel="noopener noreferrer">{guide.repo} ↗</a>
        <a className="learn-readme-button" href={`${repository}/blob/main/README.md`} target="_blank" rel="noopener noreferrer">{guide.readme} ↗</a>
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

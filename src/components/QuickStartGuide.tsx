import { Link } from "react-router-dom";
import { useLanguage } from "@/lib/i18n";

const guides = {
  en: {
    title: "Start here: a quick guide",
    intro: "New to GeoStories? Follow these five steps at your own pace.",
    steps: [
      ["Explore the archive", "Search for a place or open a postcard in Gallery to read its story. Use Map when it is available."],
      ["Learn the basics", "Choose a module below, watch its lessons or read the transcripts, and try the quiz. Mark a module complete when you have finished it."],
      ["Try the AI tools", "Open a postcard, choose a type of creation, review the prompt and select Generate. Check the result: AI can invent details, so verify historical claims against reliable sources."],
      ["Keep your work", "Use Save to Creations for a result you want to keep, and Download File for a copy on your device. Export your postcard archive from Settings for a backup."],
      ["Ask for help", "Open the chat bubble to ask the Smart Tutor a question when the AI service is available. If an action fails, keep your text and try again later; the archive and lessons are still available."],
    ],
    storage: "Your edits, saved creations and learning progress stay in this browser. They do not automatically appear on another device or publish to everyone's archive. Export your postcards before clearing browser data; learning progress is not included in that backup.",
    availability: "AI creation, uploads and the map depend on online services. Online tools may be temporarily unavailable while services are being configured. You do not need to enter API keys. You can start with the gallery and learning modules.",
    archive: "Explore the archive", backup: "Open backup settings",
  },
  ro: {
    title: "Începe aici: ghid rapid",
    intro: "Ești la început cu GeoStories? Urmează acești cinci pași în ritmul tău.",
    steps: [
      ["Explorează arhiva", "Caută un loc sau deschide o carte poștală din galerie pentru a-i citi povestea. Folosește harta când este disponibilă."],
      ["Învață noțiunile de bază", "Alege un modul de mai jos, urmărește lecțiile sau citește transcrierile și răspunde la chestionar. Marchează modulul ca finalizat după ce l-ai parcurs."],
      ["Încearcă instrumentele AI", "Deschide o carte poștală, alege un tip de creație, verifică instrucțiunile și apasă Generate. Verifică rezultatul: AI poate inventa detalii, așa că verifică afirmațiile istorice în surse de încredere."],
      ["Păstrează-ți munca", "Folosește Save to Creations pentru a păstra un rezultat și Download File pentru o copie pe dispozitiv. Exportă arhiva cărților poștale din Setări pentru o copie de siguranță."],
      ["Cere ajutor", "Deschide fereastra de chat pentru a întreba tutorele, când serviciul AI este disponibil. Dacă o acțiune eșuează, păstrează textul și încearcă mai târziu; arhiva și lecțiile rămân disponibile."],
    ],
    storage: "Modificările, creațiile salvate și progresul rămân în acest browser. Nu apar automat pe alt dispozitiv și nu sunt publicate în arhiva tuturor. Exportă cărțile poștale înainte de a șterge datele browserului; progresul lecțiilor nu este inclus în acea copie.",
    availability: "Crearea cu AI, încărcările și harta depind de servicii online. Unele instrumente pot fi temporar indisponibile în timpul configurării serviciilor. Nu trebuie să introduci chei API. Poți începe cu galeria și modulele de învățare.",
    archive: "Explorează arhiva", backup: "Deschide setările pentru backup",
  },
  fr: {
    title: "Commencez ici : guide rapide",
    intro: "Vous découvrez GeoStories ? Suivez ces cinq étapes à votre rythme.",
    steps: [
      ["Explorez les archives", "Recherchez un lieu ou ouvrez une carte postale dans la galerie pour lire son histoire. Utilisez la carte lorsqu'elle est disponible."],
      ["Apprenez les bases", "Choisissez un module ci-dessous, regardez les leçons ou lisez les transcriptions, puis répondez au quiz. Marquez le module comme terminé lorsque vous l'avez parcouru."],
      ["Essayez les outils d'IA", "Ouvrez une carte postale, choisissez un type de création, relisez les instructions et sélectionnez Generate. Vérifiez le résultat : l'IA peut inventer des détails. Consultez des sources fiables pour les affirmations historiques."],
      ["Conservez votre travail", "Utilisez Save to Creations pour conserver un résultat et Download File pour une copie sur votre appareil. Exportez vos cartes postales depuis les paramètres pour en garder une sauvegarde."],
      ["Demandez de l'aide", "Ouvrez la bulle de discussion pour poser une question au tuteur lorsque le service d'IA est disponible. Si une action échoue, gardez votre texte et réessayez plus tard ; les archives et les leçons restent disponibles."],
    ],
    storage: "Vos modifications, créations enregistrées et progrès restent dans ce navigateur. Ils n'apparaissent pas automatiquement sur un autre appareil et ne sont pas publiés dans les archives de tous. Exportez vos cartes postales avant d'effacer les données du navigateur ; les progrès des leçons ne sont pas inclus dans cette sauvegarde.",
    availability: "La création par IA, les envois de fichiers et la carte dépendent de services en ligne. Certains outils peuvent être temporairement indisponibles pendant la configuration des services. Vous ne devez pas saisir de clés API. Vous pouvez commencer par la galerie et les modules.",
    archive: "Explorer les archives", backup: "Ouvrir les paramètres de sauvegarde",
  },
};

export default function QuickStartGuide() {
  const { lang } = useLanguage();
  const guide = guides[lang];

  return (
    <details open className="mb-8 rounded-2xl border border-[var(--grey-5)] bg-white p-5 sm:p-7">
      <summary className="cursor-pointer text-lg font-semibold text-[var(--grey-1)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4">
        {guide.title}
      </summary>
      <p className="mt-3 text-sm leading-relaxed text-[var(--grey-2)]">{guide.intro}</p>
      <ol className="mt-5 list-decimal space-y-4 pl-5 text-sm leading-relaxed text-[var(--grey-2)]">
        {guide.steps.map(([title, text]) => (
          <li key={title} className="pl-1">
            <strong className="text-[var(--grey-1)]">{title}.</strong> {text}
          </li>
        ))}
      </ol>
      <p className="mt-5 rounded-lg bg-[var(--grey-6)] p-4 text-sm leading-relaxed text-[var(--grey-2)]">{guide.storage}</p>
      <p className="mt-3 text-sm leading-relaxed text-[var(--grey-2)]">{guide.availability}</p>
      <div className="mt-5 flex flex-wrap gap-x-6 gap-y-3 text-sm font-semibold">
        <Link to="/" className="underline underline-offset-4">{guide.archive}</Link>
        <Link to="/settings" className="underline underline-offset-4">{guide.backup}</Link>
      </div>
    </details>
  );
}

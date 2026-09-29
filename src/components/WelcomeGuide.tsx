import { Link } from "react-router-dom";
import { useState } from "react";
import { Archive, BookOpen, ChevronLeft, ChevronRight, Landmark, Map, RotateCcw, X } from "lucide-react";
import { type Language, useLanguage } from "@/lib/i18n";

const GUIDE_STORAGE_KEY = "eop-welcome-guide-dismissed";

type Copy = { title: string; body: string; action: string };
type GuideCopy = { welcome: Copy; archive: Copy; map: Copy; learn: Copy; eu: Copy; back: string; next: string; close: string; step: string; restart: string };
type GuideStep = Copy & { icon: typeof Archive; onAction?: () => void; to?: string };

const guideCopy: Record<Language, GuideCopy> = {
  en: {
    welcome: { title: "Welcome to Echoes of the Past", body: "Explore local heritage through historical postcards, maps, stories, and creative AI tools. This short guide shows you where to start.", action: "Start exploring" },
    archive: { title: "Browse the postcard archive", body: "Discover places, images, and stories from across Europe. Open any postcard to see its location, historical context, and related learning material.", action: "Explore the archive" },
    map: { title: "See stories on the map", body: "Use the map to find postcards by place. Select a marker to open its story, or switch back to the gallery whenever you prefer to browse visually.", action: "Open the map" },
    learn: { title: "Learn and make it your own", body: "Visit the Learning Hub for activities and practical guidance. Download the source code from GitHub to adapt the platform for your own community or project.", action: "Visit the Learning Hub" },
    eu: { title: "An Erasmus+ project", body: "Echoes of the Past: AI in Heritage Preservation is funded by the European Union through Erasmus+. It brings together Asociația Small Academy and InsightMatches.", action: "About the project" },
    back: "Back", next: "Next", close: "Close guide", step: "Step", restart: "Start guide",
  },
  ro: {
    welcome: { title: "Bun venit la Echoes of the Past", body: "Explorați patrimoniul local prin cărți poștale istorice, hărți, povești și instrumente AI creative. Acest ghid scurt vă arată de unde să începeți.", action: "Începe explorarea" },
    archive: { title: "Răsfoiți arhiva de cărți poștale", body: "Descoperiți locuri, imagini și povești din Europa. Deschideți orice carte poștală pentru locație, context istoric și materiale de învățare.", action: "Explorați arhiva" },
    map: { title: "Vedeți poveștile pe hartă", body: "Folosiți harta pentru a găsi cărți poștale după loc. Alegeți un marcaj pentru povestea sa sau reveniți la galerie pentru răsfoire vizuală.", action: "Deschideți harta" },
    learn: { title: "Învățați și adaptați platforma", body: "Vizitați Hub-ul de învățare pentru activități și ghidare practică. Descărcați codul sursă de pe GitHub pentru propria comunitate sau proiect.", action: "Vizitați Hub-ul de învățare" },
    eu: { title: "Un proiect Erasmus+", body: "Echoes of the Past: AI in Heritage Preservation este finanțat de Uniunea Europeană prin Erasmus+. Proiectul reunește Asociația Small Academy și InsightMatches.", action: "Despre proiect" },
    back: "Înapoi", next: "Următorul", close: "Închideți ghidul", step: "Pasul", restart: "Porniți ghidul",
  },
  fr: {
    welcome: { title: "Bienvenue dans Echoes of the Past", body: "Explorez le patrimoine local à travers des cartes postales historiques, des cartes, des récits et des outils créatifs d’IA. Ce court guide vous indique par où commencer.", action: "Commencer l’exploration" },
    archive: { title: "Parcourez les archives", body: "Découvrez des lieux, des images et des récits de toute l’Europe. Ouvrez une carte postale pour voir son lieu, son contexte historique et les ressources associées.", action: "Explorer les archives" },
    map: { title: "Découvrez les récits sur la carte", body: "Utilisez la carte pour trouver des cartes postales par lieu. Sélectionnez un repère pour ouvrir son récit, ou revenez à la galerie pour parcourir les images.", action: "Ouvrir la carte" },
    learn: { title: "Apprenez et appropriez-vous la plateforme", body: "Visitez le Hub d’apprentissage pour des activités et des conseils pratiques. Téléchargez le code source sur GitHub pour l’adapter à votre communauté ou projet.", action: "Visiter le Hub d’apprentissage" },
    eu: { title: "Un projet Erasmus+", body: "Echoes of the Past: AI in Heritage Preservation est financé par l’Union européenne dans le cadre d’Erasmus+. Il réunit Asociația Small Academy et InsightMatches.", action: "À propos du projet" },
    back: "Retour", next: "Suivant", close: "Fermer le guide", step: "Étape", restart: "Démarrer le guide",
  },
};

type Props = { open: boolean; onDismiss: () => void; onOpenMap: () => void; onRestart: () => void };

export default function WelcomeGuide({ open, onDismiss, onOpenMap, onRestart }: Props) {
  const { lang } = useLanguage();
  const [step, setStep] = useState(0);
  const copy = guideCopy[lang];
  const close = () => { try { localStorage.setItem(GUIDE_STORAGE_KEY, "true"); } catch { /* The guide still closes for this visit. */ } onDismiss(); };
  const steps: GuideStep[] = [
    { ...copy.welcome, icon: Archive, onAction: () => setStep(1) },
    { ...copy.archive, icon: Archive, onAction: close },
    { ...copy.map, icon: Map, onAction: () => { onOpenMap(); close(); } },
    { ...copy.learn, icon: BookOpen, to: "/learn" },
    { ...copy.eu, icon: Landmark, to: "/about" },
  ];
  const current = steps[step];
  const Icon = current.icon;

  const followLink = () => close();

  if (!open) return <button type="button" className="eop-guide-restart" onClick={onRestart}><RotateCcw size={14} aria-hidden="true" /> {copy.restart}</button>;

  return <aside className="eop-welcome-guide" role="dialog" aria-label={`${copy.step} ${step + 1} of ${steps.length}: ${current.title}`} aria-modal="false">
    <div className="eop-guide-topline"><span>{copy.step} {step + 1} / {steps.length}</span><button type="button" onClick={close} aria-label={copy.close}><X size={18} aria-hidden="true" /></button></div>
    <div className="eop-guide-progress" aria-hidden="true">{steps.map((_, index) => <span className={index <= step ? "active" : ""} key={index} />)}</div>
    <div className="eop-guide-icon"><Icon size={24} aria-hidden="true" /></div>
    <h2>{current.title}</h2><p>{current.body}</p>
    {current.to ? <Link to={current.to} onClick={followLink} className="eop-guide-action">{current.action} <ChevronRight size={16} aria-hidden="true" /></Link> : <button type="button" onClick={current.onAction} className="eop-guide-action">{current.action} <ChevronRight size={16} aria-hidden="true" /></button>}
    <div className="eop-guide-controls"><button type="button" onClick={() => setStep(value => Math.max(0, value - 1))} disabled={step === 0}><ChevronLeft size={15} aria-hidden="true" /> {copy.back}</button><button type="button" onClick={() => setStep(value => Math.min(steps.length - 1, value + 1))} disabled={step === steps.length - 1}>{copy.next} <ChevronRight size={15} aria-hidden="true" /></button></div>
  </aside>;
}

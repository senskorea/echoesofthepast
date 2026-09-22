import type { Language } from './i18n';

const messages = {
  unavailable: ["We couldn't complete your request just now. Please keep your prompt and try again later. You don't need to change your settings or add an API key.", "Nu am putut finaliza cererea acum. Păstrează textul și încearcă mai târziu. Nu trebuie să schimbi setările sau să adaugi o cheie API.", "Nous n'avons pas pu terminer votre demande pour le moment. Conservez votre texte et réessayez plus tard. Inutile de modifier vos paramètres ou d'ajouter une clé API."],
  provider_busy: ["The AI service isn't responding right now, so we couldn't create your result. Please keep your prompt and try again in a few minutes. You don't need to change anything in your settings.", "Serviciul AI nu răspunde momentan, așa că nu am putut crea rezultatul. Păstrează textul și încearcă din nou peste câteva minute. Nu trebuie să modifici setările.", "Le service d'IA ne répond pas pour le moment ; nous n'avons donc pas pu créer votre résultat. Conservez votre texte et réessayez dans quelques minutes. Inutile de modifier vos paramètres."],
  disabled: ["This creation tool isn't enabled on this website yet. Please choose another format or explore the archive and lessons. Adding your own API key isn't needed.", "Acest instrument de creare nu este încă activat pe site. Alege alt format sau explorează arhiva și lecțiile. Nu ai nevoie de o cheie API proprie.", "Cet outil de création n'est pas encore activé sur ce site. Choisissez un autre format ou explorez les archives et les leçons. Aucune clé API personnelle n'est nécessaire."],
  network: ["We couldn't connect. Keep your work and check your connection before trying again.", 'Nu ne-am putut conecta. Păstrează-ți munca și verifică conexiunea înainte de a reîncerca.', 'Connexion impossible. Conservez votre travail et vérifiez votre connexion avant de réessayer.'],
  limit: ['The creation allowance has been reached for now. Please try later; browsing and lessons remain available.', 'Limita de creare a fost atinsă momentan. Încearcă mai târziu; arhiva și lecțiile rămân disponibile.', 'La limite de création est atteinte pour le moment. Réessayez plus tard ; les archives et les leçons restent accessibles.'],
  busy: ['Your request is still being processed. Please wait before trying again.', 'Cererea este încă în curs de procesare. Te rugăm să aștepți.', 'Votre demande est en cours de traitement. Veuillez patienter.'],
  invalid: ['We could not use that input. Check your description or choose a JPEG, PNG or WebP image smaller than 5 MB.', 'Verifică descrierea sau alege o imagine JPEG, PNG sau WebP mai mică de 5 MB.', 'Vérifiez votre description ou choisissez une image JPEG, PNG ou WebP de moins de 5 Mo.'],
  refused: ['We could not create a result from this request. Try changing the description or image.', 'Nu am putut crea un rezultat. Încearcă să modifici descrierea sau imaginea.', "Aucun résultat n'a pu être créé. Essayez de modifier la description ou l'image."],
  timeout: ['This request is taking longer than expected. Your video may still be processing; check its progress again instead of starting another generation.', 'Cererea durează mai mult decât era de așteptat. Verifică progresul videoclipului fără să pornești o altă generare.', 'La demande prend plus de temps que prévu. Vérifiez la progression de la vidéo sans lancer une nouvelle génération.'],
  storage: ['We could not save this in your browser. Download or export your work before closing this page.', 'Nu am putut salva în browser. Descarcă sau exportă munca înainte de a închide pagina.', 'Enregistrement impossible dans ce navigateur. Téléchargez ou exportez votre travail avant de fermer la page.'],
  unknown: ['Something went wrong. Keep your work and try again later.', 'Ceva nu a funcționat. Păstrează-ți munca și încearcă mai târziu.', "Une erreur s'est produite. Conservez votre travail et réessayez plus tard."],
} as const;
export type ErrorCode = keyof typeof messages;
export class ServiceError extends Error {
  constructor(public code: ErrorCode, public requestId?: string) { super(messages[code][0]); }
}
export function friendlyError(error: unknown, lang: Language = 'en'): string {
  const code = error instanceof ServiceError ? error.code : error instanceof DOMException && ['QuotaExceededError', 'SecurityError'].includes(error.name) ? 'storage' : 'unknown';
  return messages[code][{ en: 0, ro: 1, fr: 2 }[lang]];
}
export function responseError(status: number, code?: string, requestId?: string) {
  const safeCode: ErrorCode = code && Object.prototype.hasOwnProperty.call(messages, code) ? code as ErrorCode : status === 429 ? 'limit' : status === 413 || status === 400 ? 'invalid' : 'unavailable';
  return new ServiceError(safeCode, requestId);
}

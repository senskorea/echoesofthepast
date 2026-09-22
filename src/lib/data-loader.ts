import { Postcard } from "../types/postcard";
import bundledPostcards from "../../public/eop-postcards.json";
import { parsePostcards, readDeletedPostcardIds, readStoredPostcards } from "./postcard-data";

// Retired demo stories may still exist in visitors' saved catalogue snapshots.
const retiredSampleIds = new Set([
  "a1b2c3d4-e5f6-7890-1234-567890abcdef", // Calea Victoriei
  "c3d4e5f6-a7b8-9012-3456-7890abcdef12", // Constanța Casino
  "d4e5f6a7-b8c9-0123-4567-890abcdef123", // Montmartre
]);

function resolvePublicAsset(path: string | undefined): string | undefined {
  if (!path?.startsWith("/")) return path;
  if (path.startsWith("//") || path.startsWith(import.meta.env.BASE_URL)) return path;
  return `${import.meta.env.BASE_URL}${path.slice(1)}`;
}

function resolvePostcardAssets(card: Postcard): Postcard {
  return {
    ...card,
    imageUrl: resolvePublicAsset(card.imageUrl),
    image_url: resolvePublicAsset(card.image_url),
    secondaryImages: card.secondaryImages?.map((image) => resolvePublicAsset(image) ?? image),
  };
}

export async function loadAllPostcards(): Promise<Postcard[]> {
  let systemPostcards = parsePostcards(bundledPostcards);
  
  // 1. Load from public eop-postcards.json
  try {
    const res = await fetch(`${import.meta.env.BASE_URL}eop-postcards.json`);
    if (res.ok) {
      const data = await res.json();
      if (Array.isArray(data)) systemPostcards = parsePostcards(data);
    }
  } catch (err) {
    console.error("Failed to fetch eop-postcards.json", err);
  }

  // User imports and edits override the bundled catalogue.
  const userPostcards = readStoredPostcards();

  // 4. Final Merge: User data takes priority
  const final = [...systemPostcards];
  userPostcards.forEach(up => {
    const idx = final.findIndex(f => f.id === up.id);
    if (idx > -1) final[idx] = { ...up, sourceContent: up.sourceContent ?? final[idx].sourceContent };
    else final.push(up);
  });

  const deleted = readDeletedPostcardIds();
  return final.filter((card) => !deleted.has(card.id) && !retiredSampleIds.has(card.id)).map(resolvePostcardAssets);
}

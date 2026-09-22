import { Postcard } from "../types/postcard";
import mockData from "../data/mock-data.json";
import { parsePostcards, readDeletedPostcardIds, readStoredPostcards } from "./postcard-data";

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
  let systemPostcards: Postcard[] = [];
  
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

  // 2. Load from mockData as fallback/base
  const baseData = parsePostcards(mockData);
  
  // Merge system postcards into base (overwrite by ID)
  const mergedSystem = [...baseData];
  systemPostcards.forEach(sp => {
    const idx = mergedSystem.findIndex(b => b.id === sp.id);
    if (idx > -1) mergedSystem[idx] = sp;
    else mergedSystem.push(sp);
  });

  // 3. Load from localStorage (user imports/edits)
  const userPostcards = readStoredPostcards();

  // 4. Final Merge: User data takes priority
  const final = [...mergedSystem];
  userPostcards.forEach(up => {
    const idx = final.findIndex(f => f.id === up.id);
    if (idx > -1) final[idx] = up;
    else final.push(up);
  });

  const deleted = readDeletedPostcardIds();
  return final.filter((card) => !deleted.has(card.id)).map(resolvePostcardAssets);
}

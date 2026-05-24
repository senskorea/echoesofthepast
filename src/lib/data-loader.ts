import { Postcard } from "../types/postcard";
import mockData from "../data/mock-data.json";

export async function loadAllPostcards(): Promise<Postcard[]> {
  let systemPostcards: Postcard[] = [];
  
  // 1. Load from public eop-postcards.json
  try {
    const res = await fetch("/eop-postcards.json");
    if (res.ok) {
      const data = await res.json();
      if (Array.isArray(data)) systemPostcards = data;
    }
  } catch (err) {
    console.error("Failed to fetch eop-postcards.json", err);
  }

  // 2. Load from mockData as fallback/base
  const baseData = [...(mockData as Postcard[])];
  
  // Merge system postcards into base (overwrite by ID)
  const mergedSystem = [...baseData];
  systemPostcards.forEach(sp => {
    const idx = mergedSystem.findIndex(b => b.id === sp.id);
    if (idx > -1) mergedSystem[idx] = sp;
    else mergedSystem.push(sp);
  });

  // 3. Load from localStorage (user imports/edits)
  let userPostcards: Postcard[] = [];
  const stored = localStorage.getItem("geostories-postcards");
  if (stored) {
    try {
      userPostcards = JSON.parse(stored);
    } catch (err) {
      console.error("Failed to parse localStorage postcards", err);
    }
  }

  // 4. Final Merge: User data takes priority
  let final = [...mergedSystem];
  userPostcards.forEach(up => {
    const idx = final.findIndex(f => f.id === up.id);
    if (idx > -1) final[idx] = up;
    else final.push(up);
  });

  // 5. Filter out deleted system postcards
  const deletedStr = localStorage.getItem("geostories-deleted-postcards");
  if (deletedStr) {
    try {
      const deletedIds = JSON.parse(deletedStr) as string[];
      if (Array.isArray(deletedIds)) {
        final = final.filter(f => !deletedIds.includes(f.id));
      }
    } catch (err) {
      console.error("Failed to parse deleted postcards list", err);
    }
  }

  return final;
}

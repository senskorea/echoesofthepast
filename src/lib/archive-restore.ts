import { parsePostcards, parseSavedAsset, readStoredPostcards, sanitizeAsset, assetKey, POSTCARDS_STORAGE_KEY, DELETED_POSTCARDS_STORAGE_KEY } from './postcard-data';

/** Validate everything before writing, and restore previous values if a write fails. */
export function restoreArchive(value: unknown): number {
  const cards = parsePostcards(value);
  const raw = (Array.isArray(value) ? value : [value]) as Array<{assets?: Record<string,unknown>}>;
  const writes = new Map<string,string>();
  cards.forEach((card,index) => {
    const assets = raw[index].assets;
    if (assets !== undefined && (!assets || typeof assets !== 'object' || Array.isArray(assets))) throw new Error('Invalid assets');
    Object.entries(assets || {}).forEach(([preset,asset]) => writes.set(assetKey(card.id,preset),JSON.stringify(sanitizeAsset(parseSavedAsset(asset)))));
  });
  const merged = new Map(readStoredPostcards().map(card=>[card.id,card]));
  cards.forEach(card=>merged.set(card.id,card));
  writes.set(POSTCARDS_STORAGE_KEY,JSON.stringify([...merged.values()]));
  const deleted: unknown = JSON.parse(localStorage.getItem(DELETED_POSTCARDS_STORAGE_KEY) || '[]');
  writes.set(DELETED_POSTCARDS_STORAGE_KEY,JSON.stringify(Array.isArray(deleted) ? deleted.filter(id=>!merged.has(id)) : []));
  const previous = new Map([...writes.keys()].map(key=>[key,localStorage.getItem(key)]));
  try { writes.forEach((value,key)=>localStorage.setItem(key,value)); }
  catch(error) {
    previous.forEach((value,key)=> { try {if (value===null) localStorage.removeItem(key);else localStorage.setItem(key,value);} catch { /* UI reports failure; keep export available. */ } });
    throw error;
  }
  return cards.length;
}

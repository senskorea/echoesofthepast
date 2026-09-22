import { z } from "zod";
import type { Postcard } from "@/types/postcard";

export const POSTCARDS_STORAGE_KEY = "geostories-postcards";
export const DELETED_POSTCARDS_STORAGE_KEY = "eop-deleted-postcards";

const visionSchema = z.object({
  transcribed_text: z.string().optional(),
  visual_description: z.string().optional(),
  historical_context: z.string().optional(),
}).passthrough();

const assetUrlSchema = z.string().refine((value) => {
  if (!value || value.startsWith("data:")) return true;
  try {
    const url = new URL(value, "https://local.invalid/");
    return url.protocol === "https:" || url.protocol === "http:";
  } catch {
    return false;
  }
}, "Expected an HTTP(S), data, or root-relative asset URL.");

export const postcardSchema = z.object({
  id: z.union([z.string(), z.number()]).transform(String).pipe(z.string().min(1)),
  title: z.string().min(1),
  description: z.string().default(""),
  imageUrl: assetUrlSchema.optional(),
  image_url: assetUrlSchema.optional(),
  secondaryImages: z.array(assetUrlSchema).optional(),
  latitude: z.coerce.number().finite().min(-90).max(90),
  longitude: z.coerce.number().finite().min(-180).max(180),
  detailUrl: assetUrlSchema.optional(),
  aiVisionResults: visionSchema.optional(),
});

export type SavedAsset = { type: "text" | "image" | "audio" | "video"; content: string };

const savedAssetSchema = z.object({
  type: z.enum(["text", "image", "audio", "video"]),
  content: z.string().min(1),
});

export function parseSavedAsset(value: unknown): SavedAsset {
  return savedAssetSchema.parse(value) as SavedAsset;
}

export function parsePostcards(value: unknown): Postcard[] {
  const input = Array.isArray(value) ? value : [value];
  return z.array(postcardSchema).parse(input) as Postcard[];
}

export function readStoredPostcards(): Postcard[] {
  try {
    const raw = localStorage.getItem(POSTCARDS_STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) throw new Error("Stored postcard data is not an array.");
    return parsePostcards(parsed);
  } catch (error) {
    console.error("Ignoring invalid stored postcard data", error);
    return [];
  }
}

export function readDeletedPostcardIds(): Set<string> {
  try {
    const raw = localStorage.getItem(DELETED_POSTCARDS_STORAGE_KEY);
    if (!raw) return new Set();
    const parsed: unknown = JSON.parse(raw);
    return new Set(Array.isArray(parsed) ? parsed.filter((id): id is string => typeof id === "string") : []);
  } catch {
    return new Set();
  }
}

export function setPostcardDeleted(id: string, deleted: boolean): void {
  const ids = readDeletedPostcardIds();
  if (deleted) ids.add(id); else ids.delete(id);
  localStorage.setItem(DELETED_POSTCARDS_STORAGE_KEY, JSON.stringify([...ids]));
}

export function assetKey(cardId: string, presetId: string): string {
  return `eop-asset-${cardId}-${presetId}`;
}

export function readAssets(cardId: string): Record<string, SavedAsset> {
  const assets: Record<string, SavedAsset> = {};
  const prefix = `eop-asset-${cardId}-`;
  for (let i = 0; i < localStorage.length; i += 1) {
    const key = localStorage.key(i);
    if (!key?.startsWith(prefix)) continue;
    try {
      const value: unknown = JSON.parse(localStorage.getItem(key) ?? "null");
      assets[key.slice(prefix.length)] = sanitizeAsset(parseSavedAsset(value));
    } catch {
      console.error(`Ignoring invalid saved asset ${key}`);
    }
  }
  return assets;
}

export function sanitizeExternalUrl(value: string): string {
  try {
    const url = new URL(value);
    url.searchParams.delete("key");
    return url.toString();
  } catch {
    return value;
  }
}

export function sanitizeAsset(asset: SavedAsset): SavedAsset {
  return asset.type === "video" ? { ...asset, content: sanitizeExternalUrl(asset.content) } : asset;
}

export function createArchive(postcards: Postcard[], exportedAt = new Date().toISOString()) {
  return postcards.map((card) => ({
    ...card,
    assets: Object.fromEntries(
      Object.entries(readAssets(card.id)).map(([presetId, asset]) => [presetId, sanitizeAsset(asset)])
    ),
    exportedAt,
  }));
}

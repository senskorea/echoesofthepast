import { beforeEach, describe, expect, it, vi } from "vitest";
import { loadAllPostcards } from "./data-loader";
import mockData from "../data/mock-data.json";
import { DELETED_POSTCARDS_STORAGE_KEY } from "./postcard-data";

class MemoryStorage implements Storage {
  private values = new Map<string, string>();
  get length() { return this.values.size; }
  clear() { this.values.clear(); }
  getItem(key: string) { return this.values.get(key) ?? null; }
  key(index: number) { return [...this.values.keys()][index] ?? null; }
  removeItem(key: string) { this.values.delete(key); }
  setItem(key: string, value: string) { this.values.set(key, value); }
}

beforeEach(() => {
  vi.stubGlobal("localStorage", new MemoryStorage());
  vi.stubGlobal("fetch", vi.fn().mockResolvedValue({ ok: true, json: async () => [] }));
});

describe("catalogue loading", () => {
  it("keeps a deleted bundled postcard deleted after reload", async () => {
    const deletedId = mockData[0].id;
    localStorage.setItem(DELETED_POSTCARDS_STORAGE_KEY, JSON.stringify([deletedId]));
    const cards = await loadAllPostcards();
    expect(cards.some((card) => card.id === deletedId)).toBe(false);
  });

  it("loads public data from the configured base path", async () => {
    await loadAllPostcards();
    expect(fetch).toHaveBeenCalledWith(expect.stringMatching(/eop-postcards\.json$/));
  });
});

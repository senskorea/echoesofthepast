import { beforeEach, describe, expect, it, vi } from "vitest";
import { loadAllPostcards } from "./data-loader";
import mockData from "../../public/eop-postcards.json";
import { DELETED_POSTCARDS_STORAGE_KEY, POSTCARDS_STORAGE_KEY } from "./postcard-data";

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
  vi.unstubAllEnvs();
  vi.stubGlobal("localStorage", new MemoryStorage());
  vi.stubGlobal("fetch", vi.fn().mockResolvedValue({ ok: true, json: async () => mockData }));
});

describe("catalogue loading", () => {
  it("preserves image paths across saving and reloading on Pages", async () => {
    vi.stubEnv("BASE_URL", "/echoesofthepast/");
    vi.mocked(fetch).mockResolvedValue({ ok: true, json: async () => [{
      ...mockData[0], imageUrl: "/eop-images/example.png",
    }] } as Response);
    const cards = await loadAllPostcards();
    expect(cards[0].imageUrl).toBe("/echoesofthepast/eop-images/example.png");
    localStorage.setItem(POSTCARDS_STORAGE_KEY, JSON.stringify(cards));
    expect((await loadAllPostcards())[0].imageUrl).toBe(cards[0].imageUrl);
  });
  it("keeps a deleted bundled postcard deleted after reload", async () => {
    const deletedId = mockData[0].id;
    localStorage.setItem(DELETED_POSTCARDS_STORAGE_KEY, JSON.stringify([deletedId]));
    const cards = await loadAllPostcards();
    expect(cards.some((card) => card.id === deletedId)).toBe(false);
  });

  it("uses the same catalogue when the network fails", async () => {
    vi.mocked(fetch).mockRejectedValue(new Error("Offline"));
    expect((await loadAllPostcards()).map(card => card.id)).toEqual(mockData.map(card => card.id));
  });

  it("replaces samples while preserving locally imported stories", async () => {
    const local = { ...mockData[0], id: "my-own-story", title: "My own story" };
    localStorage.setItem(POSTCARDS_STORAGE_KEY, JSON.stringify([local]));
    vi.mocked(fetch).mockResolvedValue({ ok: true, json: async () => [mockData[1]] } as Response);
    const cards = await loadAllPostcards();
    expect(cards.map(card => card.id)).toEqual([mockData[1].id, local.id]);
  });

  it("hides retired samples from saved snapshots and cached public data", async () => {
    const retired = [
      "a1b2c3d4-e5f6-7890-1234-567890abcdef",
      "c3d4e5f6-a7b8-9012-3456-7890abcdef12",
      "d4e5f6a7-b8c9-0123-4567-890abcdef123",
    ].map(id => ({ ...mockData[0], id }));
    const personal = { ...mockData[0], id: "personal-story" };
    const snapshot = JSON.stringify([...retired, personal]);
    localStorage.setItem(POSTCARDS_STORAGE_KEY, snapshot);
    vi.mocked(fetch).mockResolvedValue({ ok: true, json: async () => [...mockData, ...retired] } as Response);
    const cards = await loadAllPostcards();
    expect(cards.map(card => card.id)).toEqual([...mockData.map(card => card.id), personal.id]);
    expect(localStorage.getItem(POSTCARDS_STORAGE_KEY)).toBe(snapshot);
  });

  it("keeps the imported full story when an older browser copy lacks it", async () => {
    const { sourceContent: _content, ...oldCopy } = mockData[0];
    localStorage.setItem(POSTCARDS_STORAGE_KEY, JSON.stringify([{ ...oldCopy, title: "My edited title" }]));
    const cards = await loadAllPostcards();
    expect(cards[0].title).toBe("My edited title");
    expect(cards[0].sourceContent).toEqual(mockData[0].sourceContent);
    expect(cards.every(card => card.sourceContent?.length)).toBe(true);
  });

  it("loads public data from the configured base path", async () => {
    await loadAllPostcards();
    expect(fetch).toHaveBeenCalledWith(expect.stringMatching(/eop-postcards\.json$/));
  });
});

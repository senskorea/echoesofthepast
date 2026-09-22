import { beforeEach, describe, expect, it, vi } from "vitest";
import {
  DELETED_POSTCARDS_STORAGE_KEY,
  POSTCARDS_STORAGE_KEY,
  createArchive,
  parsePostcards,
  readAssets,
  readStoredPostcards,
  sanitizeExternalUrl,
  setPostcardDeleted,
} from "./postcard-data";
import mockData from "../../public/eop-postcards.json";

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
});

describe("postcard persistence", () => {
  it("rejects invalid coordinates and accepts the bundled catalogue", () => {
    expect(parsePostcards(mockData)).toHaveLength(32);
    expect(() => parsePostcards({ id: "bad", title: "Bad", latitude: 91, longitude: 0 })).toThrow();
    expect(() => parsePostcards({ id: "bad", title: "Bad", latitude: 0, longitude: 0, imageUrl: "javascript:alert(1)" })).toThrow();
  });

  it("ignores malformed stored data instead of crashing", () => {
    localStorage.setItem(POSTCARDS_STORAGE_KEY, "{}");
    expect(readStoredPostcards()).toEqual([]);
  });

  it("persists deletion tombstones", () => {
    setPostcardDeleted("pc-1", true);
    expect(JSON.parse(localStorage.getItem(DELETED_POSTCARDS_STORAGE_KEY) ?? "[]")).toContain("pc-1");
    setPostcardDeleted("pc-1", false);
    expect(JSON.parse(localStorage.getItem(DELETED_POSTCARDS_STORAGE_KEY) ?? "[]")).not.toContain("pc-1");
  });

  it("removes API keys from legacy video asset URLs", () => {
    localStorage.setItem("eop-asset-pc-1-video_prompt", JSON.stringify({
      type: "video",
      content: "https://media.example/video.mp4?alt=media&key=secret-value",
    }));
    expect(readAssets("pc-1").video_prompt.content).toBe("https://media.example/video.mp4?alt=media");
    expect(sanitizeExternalUrl("data:video/mp4;base64,AAAA")).toBe("data:video/mp4;base64,AAAA");
  });

  it("includes assets saved against bundled postcards in a full archive", () => {
    const card = parsePostcards(mockData)[0];
    localStorage.setItem(`eop-asset-${card.id}-historical_narrative`, JSON.stringify({
      type: "text",
      content: "Saved narrative",
    }));
    const archive = createArchive([card], "2026-09-12T00:00:00.000Z");
    expect(archive[0].assets.historical_narrative.content).toBe("Saved narrative");
    expect(archive[0].exportedAt).toBe("2026-09-12T00:00:00.000Z");
  });
});

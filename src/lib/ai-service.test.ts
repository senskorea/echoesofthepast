import { beforeEach, describe, expect, it, vi } from "vitest";
import { generateImage, generateText } from "./ai-service";

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
  const storage = new MemoryStorage();
  storage.setItem("ai_provider", "gemini");
  storage.setItem("gemini_api_key", "test-key");
  vi.stubGlobal("localStorage", storage);
});

describe("current AI provider adapters", () => {
  it("sends Gemini keys in a header and reads text output", async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ candidates: [{ content: { parts: [{ text: "answer" }] } }] }),
    });
    vi.stubGlobal("fetch", fetchMock);
    await expect(generateText("question", "gemini-3.6-flash")).resolves.toBe("answer");
    const [url, options] = fetchMock.mock.calls[0];
    expect(url).not.toContain("test-key");
    expect(options.headers["x-goog-api-key"]).toBe("test-key");
  });

  it("reads native Gemini image output", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ candidates: [{ content: { parts: [{ inlineData: { mimeType: "image/png", data: "AAAA" } }] } }] }),
    }));
    await expect(generateImage("postcard", "gemini-3.1-flash-image")).resolves.toBe("data:image/png;base64,AAAA");
  });
});

import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

describe("generate-video credential handling", () => {
  it("uses API-key headers and never appends a key to the returned media URL", () => {
    const source = readFileSync(new URL("./index.ts", import.meta.url), "utf8");
    expect(source).toContain('"x-goog-api-key": key');
    expect(source).not.toContain("finalVideoUrl");
    expect(source).not.toMatch(/videoUri.*[?&]key/);
  });
});

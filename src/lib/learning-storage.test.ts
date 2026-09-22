import { afterEach, expect, it, vi } from "vitest";
import { readQuizAnswers } from "./learning-storage";

afterEach(() => vi.unstubAllGlobals());

it.each(["null", "[]", "broken", '{"module1":null}', '{"module1":{"0":"wrong"}}'])(
  "recovers safely from invalid saved quiz answers: %s", (raw) => {
    vi.stubGlobal("localStorage", { getItem: () => raw });
    expect(readQuizAnswers()).toEqual({});
  }
);

it("restores valid saved answers", () => {
  vi.stubGlobal("localStorage", { getItem: () => '{"module1":{"0":2}}' });
  expect(readQuizAnswers()).toEqual({ module1: { 0: 2 } });
});

import { describe, expect, it, vi } from "vitest";
import { randomInt } from "node:crypto";
import { shuffle } from "./shuffle.js";

vi.mock("node:crypto", () => ({ randomInt: vi.fn() }));

describe("question bank shuffle", () => {
  it("draws each item once using shrinking bounds without mutating the bank", () => {
    vi.mocked(randomInt).mockImplementation(() => 0);
    const bank = Object.freeze(["a", "b", "c", "d"]);
    expect(shuffle(bank)).toEqual(["b", "c", "d", "a"]);
    expect(bank).toEqual(["a", "b", "c", "d"]);
    expect(vi.mocked(randomInt).mock.calls).toEqual([[4], [3], [2]]);
  });

  it("handles empty and single-question banks without drawing an invalid bound", () => {
    vi.mocked(randomInt).mockClear();
    expect(shuffle([])).toEqual([]);
    expect(shuffle(["only"])).toEqual(["only"]);
    expect(randomInt).not.toHaveBeenCalled();
  });
});

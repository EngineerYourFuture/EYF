import { describe, it, expect } from "vitest";
import { nextReview } from "./srs.js";

const initial = { easiness: 2.5, interval: 0, repetitions: 0 };

describe("SM-2 spaced repetition", () => {
  it("resets repetitions on low quality (<3)", () => {
    const result = nextReview({ easiness: 2.5, interval: 6, repetitions: 3 }, 1);
    expect(result.repetitions).toBe(0);
    expect(result.interval).toBe(1);
  });

  it("first correct review yields 1-day interval", () => {
    const result = nextReview(initial, 4);
    expect(result.repetitions).toBe(1);
    expect(result.interval).toBe(1);
  });

  it("second correct review yields 6-day interval", () => {
    const after1 = nextReview(initial, 4);
    const after2 = nextReview(after1, 4);
    expect(after2.repetitions).toBe(2);
    expect(after2.interval).toBe(6);
  });

  it("third correct review multiplies prior interval by easiness", () => {
    const after1 = nextReview(initial, 4);
    const after2 = nextReview(after1, 4);
    const after3 = nextReview(after2, 4);
    expect(after3.repetitions).toBe(3);
    expect(after3.interval).toBe(Math.round(6 * after2.easiness));
  });

  it("easiness floor at 1.3", () => {
    let state = initial;
    for (let i = 0; i < 10; i++) state = nextReview(state, 0);
    expect(state.easiness).toBeGreaterThanOrEqual(1.3);
  });

  it("perfect recall raises easiness", () => {
    const result = nextReview(initial, 5);
    expect(result.easiness).toBeGreaterThan(initial.easiness);
  });

  it("dueAt is interval days from now", () => {
    const result = nextReview(initial, 5);
    const expected = new Date();
    expected.setDate(expected.getDate() + result.interval);
    expect(Math.abs(result.dueAt.getTime() - expected.getTime())).toBeLessThan(2000);
  });
});

import { describe, it, expect } from "vitest";
import { isFinalFailure } from "./judge-retry.js";

describe("isFinalFailure — only mark a submission errored after retries are exhausted", () => {
  it("is final when no retries configured (attempts=1) and it failed", () => {
    expect(isFinalFailure(1, 1)).toBe(true);
  });
  it("is NOT final on the first of several attempts (a retry will follow)", () => {
    expect(isFinalFailure(1, 3)).toBe(false);
  });
  it("is final on the last attempt", () => {
    expect(isFinalFailure(3, 3)).toBe(true);
  });
  it("defaults maxAttempts to 1 when undefined", () => {
    expect(isFinalFailure(1, undefined)).toBe(true);
  });
});

import { describe, it, expect } from "vitest";
import { isRealClerkKey } from "./clerk-key.js";

describe("isRealClerkKey", () => {
  it("rejects an unset key", () => {
    expect(isRealClerkKey(undefined)).toBe(false);
    expect(isRealClerkKey("")).toBe(false);
  });

  it("rejects the .env.example placeholders", () => {
    // Regression: sk_test_replace made every authenticated request pay a ~5s
    // Clerk verifyToken() timeout before falling back to the internal JWT.
    expect(isRealClerkKey("sk_test_replace")).toBe(false);
    expect(isRealClerkKey("pk_test_replace")).toBe(false);
  });

  it("rejects short / malformed keys", () => {
    expect(isRealClerkKey("sk_test_")).toBe(false);
    expect(isRealClerkKey("not_a_key")).toBe(false);
    expect(isRealClerkKey("pk_test_" + "a".repeat(40))).toBe(false); // publishable, not secret
  });

  it("accepts a real-shaped secret key", () => {
    expect(isRealClerkKey("sk_test_" + "a".repeat(40))).toBe(true);
    expect(isRealClerkKey("sk_live_" + "b".repeat(40))).toBe(true);
  });
});

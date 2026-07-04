import { describe, it, expect } from "vitest";
import { buildOrgClaims, readOrgClaims, isOrgToken } from "./org-token.js";

const org = { id: "o1", name: "Acme", slug: "acme" };

describe("org session-token claims", () => {
  it("builds claims tagged with the org scope", () => {
    const c = buildOrgClaims(org);
    expect(c.scope).toBe("org");
    expect(c.org).toEqual(org);
  });
  it("reads valid org claims back", () => {
    expect(readOrgClaims(buildOrgClaims(org))).toEqual(org);
  });
  it("rejects a USER token payload (no org scope) — prevents token confusion", () => {
    expect(readOrgClaims({ id: "u1", email: "a@b.com", plan: "elite" })).toBeNull();
    expect(isOrgToken({ id: "u1", plan: "elite" })).toBe(false);
  });
  it("rejects an org-scoped token missing fields", () => {
    expect(readOrgClaims({ scope: "org", org: { id: "o1" } })).toBeNull();
  });
  it("rejects null / garbage", () => {
    expect(readOrgClaims(null)).toBeNull();
    expect(readOrgClaims("nope")).toBeNull();
  });
  it("isOrgToken true only for an org-scoped token", () => {
    expect(isOrgToken(buildOrgClaims(org))).toBe(true);
    expect(isOrgToken({ id: "u1" })).toBe(false);
  });
});

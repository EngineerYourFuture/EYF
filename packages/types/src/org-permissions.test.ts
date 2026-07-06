import { describe, it, expect } from "vitest";
import {
  ORG_CAPABILITIES,
  canInOrg,
  hasOrgCapability,
  orgGrantsFor,
  isOrgStaff,
  canGrantRoles,
} from "./org-permissions";

describe("org RBAC matrix (PRD §9 truth table)", () => {
  it("OWNER holds every capability at org scope", () => {
    for (const cap of ORG_CAPABILITIES) {
      expect(canInOrg(["OWNER"], cap)).toEqual({ granted: true, scope: "org" });
    }
  });

  it("ADMIN holds everything except org:billing", () => {
    expect(canInOrg(["ADMIN"], "org:billing").granted).toBe(false);
    expect(canInOrg(["ADMIN"], "org:manage")).toEqual({ granted: true, scope: "org" });
    expect(canInOrg(["ADMIN"], "hire:offer")).toEqual({ granted: true, scope: "org" });
  });

  it("ENG_MANAGER is department-scoped for people data, org for talent search", () => {
    expect(canInOrg(["ENG_MANAGER"], "people:skills-read")).toEqual({ granted: true, scope: "department" });
    expect(canInOrg(["ENG_MANAGER"], "assess:view-results")).toEqual({ granted: true, scope: "department" });
    expect(canInOrg(["ENG_MANAGER"], "talent:search")).toEqual({ granted: true, scope: "org" });
    expect(canInOrg(["ENG_MANAGER"], "learn:publish").granted).toBe(false);
    expect(canInOrg(["ENG_MANAGER"], "hire:offer").granted).toBe(false);
  });

  it("INSTRUCTOR can author but not publish (two-person rule lives in routes)", () => {
    expect(canInOrg(["INSTRUCTOR"], "learn:author").granted).toBe(true);
    expect(canInOrg(["INSTRUCTOR"], "learn:publish").granted).toBe(false);
  });

  it("RECRUITER can run pipeline but never offer or read skills", () => {
    expect(canInOrg(["RECRUITER"], "hire:pipeline").granted).toBe(true);
    expect(canInOrg(["RECRUITER"], "hire:offer").granted).toBe(false);
    expect(canInOrg(["RECRUITER"], "people:skills-read").granted).toBe(false);
  });

  it("MENTOR reaches only mentees; MEMBER/INTERN only own", () => {
    expect(canInOrg(["MENTOR"], "people:skills-read")).toEqual({ granted: true, scope: "mentees" });
    expect(canInOrg(["MEMBER"], "people:skills-read")).toEqual({ granted: true, scope: "own" });
    expect(canInOrg(["INTERN"], "assess:view-results")).toEqual({ granted: true, scope: "own" });
    expect(canInOrg(["MEMBER"], "org:members").granted).toBe(false);
  });

  it("multi-role union takes the widest scope per capability", () => {
    // MENTOR (mentees) + ENG_MANAGER (department) → department wins
    expect(canInOrg(["MENTOR", "ENG_MANAGER"], "people:skills-read"))
      .toEqual({ granted: true, scope: "department" });
    // adding HR widens to org
    expect(canInOrg(["MENTOR", "HR"], "people:skills-read"))
      .toEqual({ granted: true, scope: "org" });
  });

  it("unknown roles grant nothing and never throw", () => {
    expect(canInOrg(["GHOST_ROLE"], "org:manage").granted).toBe(false);
    expect(orgGrantsFor([])).toEqual({});
    expect(hasOrgCapability([], "learn:author")).toBe(false);
  });

  it("console access: staff roles yes, MEMBER/INTERN no", () => {
    expect(isOrgStaff(["INSTRUCTOR"])).toBe(true);
    expect(isOrgStaff(["MEMBER"])).toBe(false);
    expect(isOrgStaff(["INTERN", "MENTOR"])).toBe(true);
    expect(isOrgStaff([])).toBe(false);
  });

  it("role-grant hierarchy: only OWNER grants ADMIN/OWNER; HR can grant line roles", () => {
    expect(canGrantRoles(["ADMIN"], ["ADMIN"])).toBe(false);
    expect(canGrantRoles(["OWNER"], ["ADMIN"])).toBe(true);
    expect(canGrantRoles(["HR"], ["INSTRUCTOR", "MENTOR"])).toBe(true);
    expect(canGrantRoles(["HR"], ["OWNER"])).toBe(false);
    expect(canGrantRoles(["LND"], ["MEMBER"])).toBe(false);
  });
});

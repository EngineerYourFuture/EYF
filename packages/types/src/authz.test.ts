import { describe, it, expect } from "vitest";
import {
  resolveOrgAccess,
  isAllowed,
  invalidTenantRoles,
  isOrgRoleName,
  isPlatformRole,
  ORG_ROLE_NAMES,
  CanViewBilling,
  CanInviteMember,
  CanPublishCourse,
  type PermissionEntry,
} from "./authz";
import { canInOrg, ORG_CAPABILITIES, type OrgCapability } from "./org-permissions";
import { hasCapability } from "./permissions";

const T0 = 1_700_000_000_000; // fixed clock for expiry tests

// ── Equivalence: the engine (roles only) MUST match the existing choke point ──
// This is the backward-compatibility contract that makes wiring the engine into
// the middleware provably safe.
describe("resolveOrgAccess ≡ canInOrg for role-only input", () => {
  // Power set of all 11 roles would be 2048 combos; test all singles + all
  // pairs + a few larger unions — enough to catch any divergence in the shared
  // role/scope logic.
  const singles = ORG_ROLE_NAMES.map((r) => [r]);
  const pairs: string[][] = [];
  for (let i = 0; i < ORG_ROLE_NAMES.length; i++) {
    for (let j = i + 1; j < ORG_ROLE_NAMES.length; j++) {
      pairs.push([ORG_ROLE_NAMES[i]!, ORG_ROLE_NAMES[j]!]);
    }
  }
  const larger = [
    ["MENTOR", "INSTRUCTOR", "REVIEWER"],
    ["HR", "RECRUITER", "ENG_MANAGER"],
    ["MEMBER", "INTERN", "MENTOR", "REVIEWER"],
    [...ORG_ROLE_NAMES],
  ];
  const combos = [...singles, ...pairs, ...larger, [], ["NOT_A_ROLE"]];

  it("returns the same granted+scope as canInOrg for every capability", () => {
    for (const roles of combos) {
      for (const cap of ORG_CAPABILITIES) {
        const legacy = canInOrg(roles, cap);
        const engine = resolveOrgAccess(cap, { roles });
        expect(engine.granted).toBe(legacy.granted);
        if (legacy.granted && engine.granted) {
          expect(engine.scope).toBe(legacy.scope);
        }
      }
    }
  });
});

describe("default deny", () => {
  it("denies with no roles and no entries", () => {
    const d = resolveOrgAccess("org:manage", {});
    expect(d.granted).toBe(false);
    expect(d).toMatchObject({ effect: "deny", source: "default" });
  });

  it("denies a capability the roles don't grant", () => {
    expect(isAllowed("org:billing", { roles: ["ADMIN"] })).toBe(false); // ADMIN lacks billing
  });
});

describe("explicit deny is absolute (deny-wins)", () => {
  it("a direct deny overrides a role allow", () => {
    const entries: PermissionEntry[] = [
      { capability: "org:members", effect: "deny", source: "direct", reason: "suspended" },
    ];
    const d = resolveOrgAccess("org:members", { roles: ["OWNER"], entries });
    expect(d.granted).toBe(false);
    expect(d).toMatchObject({ effect: "deny", source: "direct", reason: "suspended" });
  });

  it("a platform deny (kill-switch) overrides everything, including a temporary allow", () => {
    const entries: PermissionEntry[] = [
      { capability: "hire:offer", effect: "allow", scope: "org", source: "temporary", expiresAt: T0 + 10_000 },
      { capability: "hire:offer", effect: "deny", source: "platform", reason: "security hold" },
    ];
    const d = resolveOrgAccess("hire:offer", { roles: ["OWNER"], entries, now: T0 });
    expect(d.granted).toBe(false);
    expect(d).toMatchObject({ source: "platform", reason: "security hold" });
  });

  it("deny attribution picks the highest-precedence deny source", () => {
    const entries: PermissionEntry[] = [
      { capability: "org:manage", effect: "deny", source: "group" },
      { capability: "org:manage", effect: "deny", source: "platform", reason: "top" },
    ];
    const d = resolveOrgAccess("org:manage", { entries });
    expect(d).toMatchObject({ granted: false, source: "platform" });
  });
});

describe("allow composition (widest scope wins)", () => {
  it("a direct org-wide grant widens a role's own-scope grant", () => {
    // MEMBER gets people:skills-read at 'own'; a direct grant lifts it to 'org'.
    const roleOnly = resolveOrgAccess("people:skills-read", { roles: ["MEMBER"] });
    expect(roleOnly).toMatchObject({ granted: true, scope: "own" });

    const widened = resolveOrgAccess("people:skills-read", {
      roles: ["MEMBER"],
      entries: [{ capability: "people:skills-read", effect: "allow", scope: "org", source: "direct" }],
    });
    expect(widened).toMatchObject({ granted: true, scope: "org", source: "direct" });
  });

  it("grants a capability the roles lack via a group entry", () => {
    const d = resolveOrgAccess("reports:org", {
      roles: ["MEMBER"],
      entries: [{ capability: "reports:org", effect: "allow", scope: "org", source: "group", reason: "Finance group" }],
    });
    expect(d).toMatchObject({ granted: true, scope: "org", source: "group", reason: "Finance group" });
  });

  it("does not widen when the extra grant is narrower than the role grant", () => {
    // OWNER already org-wide; an own-scoped direct allow must not narrow it.
    const d = resolveOrgAccess("org:manage", {
      roles: ["OWNER"],
      entries: [{ capability: "org:manage", effect: "allow", scope: "own", source: "direct" }],
    });
    expect(d).toMatchObject({ granted: true, scope: "org", source: "role" });
  });
});

describe("temporary access (expiry)", () => {
  const grant: PermissionEntry = {
    capability: "org:billing",
    effect: "allow",
    scope: "org",
    source: "temporary",
    expiresAt: T0 + 30 * 60_000, // +30 min
    reason: "break-glass",
  };

  it("grants while live", () => {
    const d = resolveOrgAccess("org:billing", { entries: [grant], now: T0 });
    expect(d).toMatchObject({ granted: true, source: "temporary", reason: "break-glass" });
  });

  it("auto-expires after expiresAt (no manual revoke needed)", () => {
    const d = resolveOrgAccess("org:billing", { entries: [grant], now: T0 + 31 * 60_000 });
    expect(d.granted).toBe(false);
  });

  it("an expired deny is also ignored", () => {
    const entries: PermissionEntry[] = [
      { capability: "org:members", effect: "allow", scope: "org", source: "role" },
      { capability: "org:members", effect: "deny", source: "direct", expiresAt: T0 - 1 }, // already expired
    ];
    const d = resolveOrgAccess("org:members", { entries, now: T0 });
    expect(d.granted).toBe(true);
  });
});

describe("composable policies (Layer 6)", () => {
  it("CanViewBilling: OWNER yes, ADMIN no", () => {
    expect(CanViewBilling({ roles: ["OWNER"] }).granted).toBe(true);
    expect(CanViewBilling({ roles: ["ADMIN"] }).granted).toBe(false);
  });

  it("CanInviteMember: HR yes, MEMBER no", () => {
    expect(CanInviteMember({ roles: ["HR"] }).granted).toBe(true);
    expect(CanInviteMember({ roles: ["MEMBER"] }).granted).toBe(false);
  });

  it("CanPublishCourse: LND yes, INSTRUCTOR no (author≠publish)", () => {
    expect(CanPublishCourse({ roles: ["LND"] }).granted).toBe(true);
    expect(CanPublishCourse({ roles: ["INSTRUCTOR"] }).granted).toBe(false);
  });
});

describe("Layer 1 — platform vs. tenant role separation", () => {
  it("classifies org role names", () => {
    expect(isOrgRoleName("OWNER")).toBe(true);
    expect(isOrgRoleName("MEMBER")).toBe(true);
    expect(isOrgRoleName("SUPER_ADMIN")).toBe(false);
  });

  it("classifies platform (staff) roles", () => {
    expect(isPlatformRole("ADMIN")).toBe(true); // staff ADMIN holds capabilities
    expect(isPlatformRole("CONTENT_CREATOR")).toBe(true);
    expect(isPlatformRole("MEMBER")).toBe(false); // org-only role, no platform authority
  });

  it("rejects non-tenant role strings for OrgMember assignment", () => {
    expect(invalidTenantRoles(["OWNER", "HR"])).toEqual([]);
    expect(invalidTenantRoles(["OWNER", "SUPPORT_ENGINEER"])).toEqual(["SUPPORT_ENGINEER"]);
  });

  it("the two engines never cross: org 'ADMIN' and platform 'ADMIN' are independent grants", () => {
    // Platform ADMIN can manage platform content; org decision for the same
    // name is governed only by the org engine (org-wide minus billing).
    expect(hasCapability("ADMIN", "manage:content")).toBe(true); // platform engine
    expect(resolveOrgAccess("org:billing", { roles: ["ADMIN"] }).granted).toBe(false); // org engine
    expect(resolveOrgAccess("org:manage", { roles: ["ADMIN"] }).granted).toBe(true);
    // A platform capability string is meaningless to the org engine and vice versa —
    // they share no input, so authority cannot leak between layers.
  });
});

describe("determinism", () => {
  it("entry order does not affect the decision", () => {
    const a: PermissionEntry = { capability: "org:manage", effect: "allow", scope: "org", source: "direct" };
    const b: PermissionEntry = { capability: "org:manage", effect: "deny", source: "group" };
    const d1 = resolveOrgAccess("org:manage", { entries: [a, b] });
    const d2 = resolveOrgAccess("org:manage", { entries: [b, a] });
    expect(d1).toEqual(d2);
    expect(d1.granted).toBe(false); // deny wins regardless of order
  });
});

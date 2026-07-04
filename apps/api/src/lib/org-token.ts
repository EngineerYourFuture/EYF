/**
 * Employer-portal session token claims. After /org/verify checks the access
 * code (rate-limited), we issue a short-lived signed token carrying these
 * claims — so the raw code is no longer a per-request bearer credential.
 *
 * `scope: "org"` prevents token confusion: an org token can't be used as a user
 * session (the user auth rejects scope==="org") and vice-versa.
 */
export type OrgClaims = { id: string; name: string; slug: string };
const SCOPE = "org";

export function buildOrgClaims(org: OrgClaims): { scope: string; org: OrgClaims } {
  return { scope: SCOPE, org: { id: org.id, name: org.name, slug: org.slug } };
}

export function isOrgToken(decoded: unknown): boolean {
  return !!decoded && typeof decoded === "object" && (decoded as { scope?: unknown }).scope === SCOPE;
}

export function readOrgClaims(decoded: unknown): OrgClaims | null {
  if (!isOrgToken(decoded)) return null;
  const org = (decoded as { org?: { id?: unknown; name?: unknown; slug?: unknown } }).org;
  if (!org || typeof org.id !== "string" || typeof org.name !== "string" || typeof org.slug !== "string") return null;
  return { id: org.id, name: org.name, slug: org.slug };
}

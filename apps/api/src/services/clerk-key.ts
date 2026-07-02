// Pure, dependency-free Clerk key classification. Kept out of clerk.ts (which
// imports env + prisma + the Clerk SDK) so it can be unit-tested in isolation.
//
// Why this exists: .env.example ships CLERK_SECRET_KEY=sk_test_replace. Handing a
// placeholder/bogus key to Clerk's verifyToken() causes a ~5s networked JWKS retry
// before it throws — a tax paid on every authenticated request. Gate all Clerk
// calls on this check so local/dev (placeholder key) skips Clerk entirely and uses
// the internal JWT path. Mirrors the web app's HAS_REAL_CLERK guard.
export function isRealClerkKey(key: string | undefined): boolean {
  if (!key) return false;
  if (key === "sk_test_replace" || key === "pk_test_replace") return false;
  // Real Clerk secret keys are sk_test_/sk_live_ followed by a long token.
  return /^sk_(test|live)_/.test(key) && key.length > 20;
}

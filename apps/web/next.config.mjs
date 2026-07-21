/** @type {import('next').NextConfig} */

// Content-Security-Policy. Enforced (not report-only). The high-impact vectors
// — framing/clickjacking, <base> injection, plugin objects, form hijacking —
// are locked down hard; script/style/connect stay permissive enough for the
// third-party stack (Clerk, PostHog, Monaco, R2) so nothing silently breaks.
// Tightening script-src to per-request nonces is the documented next step.
const isDev = process.env.NODE_ENV !== "production";

// The browser talks directly to the API (NEXT_PUBLIC_API_URL) — its origin must
// be in connect-src or every client fetch is blocked. In prod the API is HTTPS
// (covered by `https:`); in local dev it's http://localhost:4000, so we allow
// localhost + the HMR websocket explicitly. Never loosens production.
const apiOrigin = (() => {
  try { return new URL(process.env.NEXT_PUBLIC_API_URL ?? "").origin; } catch { return ""; }
})();
const connectSrc = [
  "'self'",
  apiOrigin,
  "https:",
  "wss:",
  ...(isDev ? ["http://localhost:*", "http://127.0.0.1:*", "ws://localhost:*", "ws://127.0.0.1:*"] : []),
].filter(Boolean).join(" ");

const csp = [
  "default-src 'self'",
  "base-uri 'self'",
  "object-src 'none'",
  "frame-ancestors 'none'",
  "form-action 'self'",
  "script-src 'self' 'unsafe-inline' 'unsafe-eval' https: blob:",
  // Monaco (the code editor) loads its stylesheet from jsdelivr — script-src
  // already allows the CDN via `https:`; style-src must allow the host too or the
  // editor renders unstyled. Scoped to the one CDN, not all https.
  "style-src 'self' 'unsafe-inline' https://cdn.jsdelivr.net",
  "img-src 'self' data: blob: https:",
  "font-src 'self' data:",
  `connect-src ${connectSrc}`,
  "worker-src 'self' blob:",
  "frame-src 'self' https:",
  ...(isDev ? [] : ["upgrade-insecure-requests"]),
].join("; ");

const securityHeaders = [
  { key: "Content-Security-Policy", value: csp },
  { key: "Strict-Transport-Security", value: "max-age=63072000; includeSubDomains; preload" },
  { key: "X-Frame-Options", value: "DENY" },
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  // Deny the sensitive sensors we never use; allow camera/mic to self for peer
  // mocks + voice interviews.
  { key: "Permissions-Policy", value: "camera=(self), microphone=(self), geolocation=(), payment=(), usb=()" },
  { key: "X-DNS-Prefetch-Control", value: "on" },
];

const nextConfig = {
  reactStrictMode: true,
  transpilePackages: ["@eyf/ui", "@eyf/types"],
  poweredByHeader: false,
  // Lean, self-contained server bundle for the production Docker image.
  output: "standalone",
  // Trace workspace deps from the monorepo root so the standalone bundle is
  // complete. In Next 14.2 this lives under `experimental` (a top-level key is
  // ignored with an "Unrecognized key" warning, silently under-tracing deps).
  experimental: {
    outputFileTracingRoot: new URL("../../", import.meta.url).pathname,
  },
  images: {
    formats: ["image/avif", "image/webp"],
    // Allow the R2/CDN host for resume/certificate assets (set at deploy).
    remotePatterns: [
      { protocol: "https", hostname: "**.r2.cloudflarestorage.com" },
      { protocol: "https", hostname: "cdn.eyf.in" },
    ],
  },
  async headers() {
    return [{ source: "/:path*", headers: securityHeaders }];
  },
};

// Bundle analysis on demand: `ANALYZE=true pnpm --filter @eyf/web build`.
export default process.env.ANALYZE === "true"
  ? (await import("@next/bundle-analyzer")).default({ enabled: true })(nextConfig)
  : nextConfig;

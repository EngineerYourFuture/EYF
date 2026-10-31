/** Separate deployments, selected at build time; never trust a browser header. */
export const IS_LMS = process.env.NEXT_PUBLIC_EYF_PORTAL === "lms";
export const PUBLIC_APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";
export const LMS_URL = process.env.NEXT_PUBLIC_LMS_URL ?? "http://localhost:3001";
export const PORTAL_HOME = IS_LMS ? "/orgs" : "/dashboard";

const under = (path: string, root: string) => path === root || path.startsWith(`${root}/`);
export const isLmsPath = (path: string) => ["/orgs", "/org", "/learn", "/invite"].some((root) => under(path, root));
export function allowedInLms(path: string) {
  return ["/orgs", "/learn", "/invite", "/sign-in", "/sign-up", "/__clerk", "/verify", "/_next"].some((root) => under(path, root))
    || ["/favicon.ico", "/icon-192.png", "/icon-512.png", "/apple-touch-icon.png", "/manifest.webmanifest"].includes(path);
}

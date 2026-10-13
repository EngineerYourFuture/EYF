import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server";
import { NextResponse, type NextRequest, type NextFetchEvent } from "next/server";
import { IS_LMS, isLmsPath, allowedInLms, PUBLIC_APP_URL, LMS_URL } from "@/lib/portal";

const isAppRoute = createRouteMatcher([
  "/dashboard(.*)", "/sprint(.*)", "/labs(.*)", "/problems(.*)", "/assessment(.*)", "/roadmap(.*)",
  "/settings(.*)", "/billing(.*)", "/mocks(.*)", "/peer-mocks(.*)",
  "/games(.*)", "/pressure(.*)", "/code-dna(.*)", "/oa(.*)",
  "/resume(.*)", "/projects(.*)", "/internships(.*)", "/jobs(.*)",
  "/mentors(.*)", "/forum(.*)", "/wrapped(.*)", "/certificates(.*)",
  "/admin(.*)", "/fun(.*)", "/subjects(.*)", "/tracks(.*)", "/visualizer(.*)",
  "/orgs(.*)", "/learn(.*)", "/invite(.*)",
]);

const PK = process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY ?? "";
const PLACEHOLDER_KEY = "pk_test_ZGV2LnBsYWNlaG9sZGVyLmNsZXJrLmFjY291bnRzLmRldiQ";
const HAS_REAL_CLERK = !!PK && PK !== "pk_test_replace" && PK !== PLACEHOLDER_KEY;

// When Clerk keys are placeholders, do NOT use clerkMiddleware at all —
// it 404s app routes when it can't reach the (fake) Clerk host. Use a
// vanilla passthrough so devs can explore the app without Clerk.
const authenticate = HAS_REAL_CLERK
  ? clerkMiddleware(async (auth, req) => {
      if (isAppRoute(req)) await auth.protect();
    }, { authorizedParties: [new URL(PUBLIC_APP_URL).origin, new URL(LMS_URL).origin] })
  : () => NextResponse.next();

export default async function middleware(req: NextRequest, event: NextFetchEvent) {
  const path = req.nextUrl.pathname;
  if (IS_LMS && path === "/robots.txt") return new NextResponse("User-agent: *\nDisallow: /\n", { headers: { "Content-Type": "text/plain" } });
  if (IS_LMS && (path === "/" || path === "/org")) return NextResponse.redirect(new URL("/orgs", req.url));
  if ((!IS_LMS && isLmsPath(path)) || (IS_LMS && !allowedInLms(path))) {
    return new NextResponse("Not found", { status: 404, headers: { "Cache-Control": "private, no-store", "X-Robots-Tag": "noindex, nofollow" } });
  }
  const response = await authenticate(req, event);
  if (IS_LMS && response) {
    response.headers.set("Cache-Control", "private, no-store");
    response.headers.set("X-Robots-Tag", "noindex, nofollow, noarchive");
    response.headers.set("Referrer-Policy", "no-referrer");
  }
  return response;
}

export const config = {
  matcher: ["/((?!_next/static|_next/image).*)"],
};

import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";

const isAppRoute = createRouteMatcher([
  "/dashboard(.*)", "/problems(.*)", "/assessment(.*)", "/roadmap(.*)",
  "/settings(.*)", "/billing(.*)", "/mocks(.*)", "/peer-mocks(.*)",
  "/games(.*)", "/pressure(.*)", "/code-dna(.*)", "/oa(.*)",
  "/resume(.*)", "/projects(.*)", "/internships(.*)", "/jobs(.*)",
  "/mentors(.*)", "/forum(.*)", "/wrapped(.*)", "/certificates(.*)",
  "/admin(.*)", "/fun(.*)", "/subjects(.*)", "/tracks(.*)", "/visualizer(.*)",
]);

const PK = process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY ?? "";
const PLACEHOLDER_KEY = "pk_test_ZGV2LnBsYWNlaG9sZGVyLmNsZXJrLmFjY291bnRzLmRldiQ";
const HAS_REAL_CLERK = !!PK && PK !== "pk_test_replace" && PK !== PLACEHOLDER_KEY;

// When Clerk keys are placeholders, do NOT use clerkMiddleware at all —
// it 404s app routes when it can't reach the (fake) Clerk host. Use a
// vanilla passthrough so devs can explore the app without Clerk.
export default HAS_REAL_CLERK
  ? clerkMiddleware(async (auth, req) => {
      if (isAppRoute(req)) await auth.protect();
    })
  : () => NextResponse.next();

export const config = {
  matcher: [
    "/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)",
    "/(api|trpc)(.*)",
  ],
};

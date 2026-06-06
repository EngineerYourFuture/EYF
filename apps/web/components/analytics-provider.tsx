"use client";
import { useEffect } from "react";
import { initAnalytics } from "@/lib/analytics";
import { ClerkBoundIdentity } from "./analytics-clerk";

const PK = process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY ?? "";
const HAS_REAL_CLERK = !!PK && PK !== "pk_test_replace" && PK !== "pk_test_ZGV2LnBsYWNlaG9sZGVyLmNsZXJrLmFjY291bnRzLmRldiQ";

export function AnalyticsProvider({ children }: { children: React.ReactNode }) {
  useEffect(() => { initAnalytics(); }, []);
  return (
    <>
      {HAS_REAL_CLERK ? <ClerkBoundIdentity /> : null}
      {children}
    </>
  );
}

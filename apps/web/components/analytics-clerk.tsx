"use client";
import { useAuth, useUser } from "@clerk/nextjs";
import { useEffect } from "react";
import { identify, reset } from "@/lib/analytics";

// Isolated from analytics-provider so Clerk hooks are only loaded when
// real Clerk keys are present (prevents crashing in placeholder/dev mode).
export function ClerkBoundIdentity() {
  const { isSignedIn, userId } = useAuth();
  const { user } = useUser();

  useEffect(() => {
    if (isSignedIn && userId) {
      identify(userId, {
        email: user?.primaryEmailAddress?.emailAddress,
        name: user?.fullName,
      });
    } else if (!isSignedIn) {
      reset();
    }
  }, [isSignedIn, userId, user]);

  return null;
}

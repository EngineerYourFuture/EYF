"use client";
import posthog from "posthog-js";

let initialized = false;

const CONSENT_KEY = "eyf-consent";

/** Consent state for non-essential (analytics) cookies. Unset → not yet asked. */
export function getConsent(): "granted" | "denied" | null {
  if (typeof window === "undefined") return null;
  const v = localStorage.getItem(CONSENT_KEY);
  return v === "granted" || v === "denied" ? v : null;
}

export function setConsent(v: "granted" | "denied") {
  try { localStorage.setItem(CONSENT_KEY, v); } catch {}
  if (v === "granted") initAnalytics();
}

export function initAnalytics() {
  if (initialized || typeof window === "undefined") return;
  // GDPR: no analytics until the user has explicitly consented.
  if (getConsent() !== "granted") return;
  const key = process.env.NEXT_PUBLIC_POSTHOG_KEY;
  if (!key) return; // no-op in dev when key unset
  posthog.init(key, {
    api_host: process.env.NEXT_PUBLIC_POSTHOG_HOST ?? "https://us.i.posthog.com",
    capture_pageview: true,
    capture_pageleave: true,
    person_profiles: "identified_only",
    autocapture: false,
  });
  initialized = true;
}

export function identify(userId: string, props?: Record<string, unknown>) {
  if (!initialized) return;
  posthog.identify(userId, props);
}

export function track(event: string, props?: Record<string, unknown>) {
  if (!initialized) return;
  posthog.capture(event, props);
}

export function reset() {
  if (!initialized) return;
  posthog.reset();
}

/** Report a client-side error. Always logs; forwards to PostHog when consented. */
export function captureError(error: unknown, context?: Record<string, unknown>) {
  console.error(error);
  if (!initialized) return;
  posthog.capture("$exception", {
    message: error instanceof Error ? error.message : String(error),
    stack: error instanceof Error ? error.stack : undefined,
    ...context,
  });
}

// Centralized event names so we don't typo across the app.
export const Events = {
  SignedIn:          "signed_in",
  SubmissionCreated: "submission.created",
  SubmissionAccepted: "submission.accepted",
  AssessmentTaken:   "assessment.completed",
  MockStarted:       "mock.started",
  MockEnded:         "mock.ended",
  TrackChosen:       "track.chosen",
  PlanUpgraded:      "plan.upgraded",
  ResumeScored:      "resume.scored",
  MentorBooked:      "mentor.booked",
  ForumPosted:       "forum.posted",
  WrappedDownloaded: "wrapped.downloaded",
  CertificateIssued: "certificate.issued",
  McqCompleted:      "mcq.completed",
  CommunicationDrilled: "communication.drilled",
  ProjectPrepped:    "project.prepped",
} as const;

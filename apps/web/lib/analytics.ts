"use client";
import posthog from "posthog-js";

let initialized = false;

export function initAnalytics() {
  if (initialized || typeof window === "undefined") return;
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
} as const;

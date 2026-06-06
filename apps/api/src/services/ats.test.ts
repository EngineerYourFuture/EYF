import { describe, it, expect } from "vitest";
import { scoreResume } from "./ats.js";
import type { ResumeDocument } from "@eyf/types";

const empty: ResumeDocument = { contact: { name: "", email: "" } };

const full: ResumeDocument = {
  contact: {
    name: "John Praneeth",
    email: "john@eyf.dev",
    phone: "+91 99999 99999",
    location: "Hyderabad",
    github: "github.com/jp",
    linkedin: "linkedin.com/in/jp",
  },
  summary:
    "Final-year CSE student targeting SDE roles at product companies. 200+ DSA solved, built a real-time chat app with 5k users.",
  skills: ["Java", "Spring", "Postgres", "AWS", "Docker", "TypeScript"],
  experience: [
    {
      company: "Razorpay",
      role: "Backend Intern",
      start: "2025-05",
      end: "2025-08",
      bullets: [
        "Built rate-limiter handling 12,000 req/sec, reduced p95 by 40%",
        "Shipped webhook delivery retry system, increased reliability from 92% to 99.5%",
        "Designed Postgres schema for 30M-row payments table, cut query time by 65%",
      ],
    },
  ],
  projects: [
    { name: "Real-time chat", description: "Socket.io chat with 5k MAU", link: "https://chat.example.com" },
  ],
  education: [
    { institution: "IIIT Hyderabad", degree: "BTech CSE", start: "2022", end: "2026", gpa: "8.7" },
  ],
};

describe("ATS scorer", () => {
  it("scores an empty resume near 0", () => {
    const result = scoreResume(empty);
    expect(result.total).toBeLessThan(20);
  });

  it("scores a strong resume above 60 (single-page bar)", () => {
    const result = scoreResume(full);
    expect(result.total).toBeGreaterThan(60);
  });

  it("rewards quantified bullets", () => {
    const result = scoreResume(full);
    const quantified = result.factors.find((f) => f.name === "Quantified impact");
    expect(quantified?.score).toBeGreaterThan(0);
  });

  it("rewards action verbs at bullet start", () => {
    const result = scoreResume(full);
    const action = result.factors.find((f) => f.name === "Action-verb bullets");
    expect(action?.score).toBeGreaterThan(0);
  });

  it("returns a breakdown summing to total", () => {
    const result = scoreResume(full);
    const sum = result.factors.reduce((a, f) => a + f.score, 0);
    expect(sum).toBe(result.total);
  });

  it("penalizes a resume with no contact info", () => {
    const result = scoreResume(empty);
    const contact = result.factors.find((f) => f.name === "Contact info");
    expect(contact?.score).toBe(0);
  });
});

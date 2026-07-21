import { describe, it, expect } from "vitest";
import { buildRoadmap } from "./roadmap-generator.js";
import type { SkillDimension } from "./skill-graph.js";

const dim = (key: string, label: string, score: number): SkillDimension => ({
  key, label, group: "Problem Solving", score, detail: "", href: "/x",
});

// A graph with a couple of weak areas so remediation has something to chew on.
const graph = {
  dimensions: [
    dim("dsa", "DSA", 30),
    dim("cs", "Core CS", 45),
    dim("aptitude", "Aptitude", 80),
    dim("projects", "Projects", 20),
    dim("resume", "Resume", 90),
  ],
};
const track = { name: "Backend Engineer", patterns: ["apis", "databases"], curriculum: null };
const base = { trackSlug: "backend", weeks: 12, hoursPerDay: 4 };

describe("buildRoadmap — structure", () => {
  it("produces exactly `weeks` weeks across Foundation→Depth→Interview phases", () => {
    const plan = buildRoadmap(graph, track, { persona: "STUDENT" }, base);
    expect(plan.plan).toHaveLength(12);
    const phases = new Set(plan.plan.map((w) => w.phase));
    expect(phases).toEqual(new Set(["Foundation", "Depth", "Interview"]));
    // weeks are numbered 1..N in order
    expect(plan.plan.map((w) => w.week)).toEqual(Array.from({ length: 12 }, (_, i) => i + 1));
  });

  it("surfaces the weakest dimensions as focus areas", () => {
    const plan = buildRoadmap(graph, track, { persona: "STUDENT" }, base);
    expect(plan.focusAreas[0]).toBe("Projects"); // lowest score (20)
    expect(plan.focusAreas).toContain("DSA");
  });

  it("clamps weeks to the 4..24 range", () => {
    expect(buildRoadmap(graph, track, null, { ...base, weeks: 1 }).plan).toHaveLength(4);
    expect(buildRoadmap(graph, track, null, { ...base, weeks: 99 }).plan).toHaveLength(24);
  });

  it("defaults to the STUDENT persona and the role name from the track", () => {
    const plan = buildRoadmap(graph, track, null, base);
    expect(plan.targetRole).toBe("Backend Engineer");
    expect(plan.weeks).toBe(12);
  });

  it("falls back to a capitalized slug when the track is missing", () => {
    const plan = buildRoadmap(graph, null, { persona: "STUDENT" }, base);
    expect(plan.targetRole).toBe("Backend");
  });
});

describe("buildRoadmap — persona shapes the depth phase", () => {
  const depthThemes = (persona: string) =>
    buildRoadmap(graph, track, { persona }, base).plan
      .filter((w) => w.phase === "Depth")
      .flatMap((w) => w.tasks.map((t) => t.area));

  it("DEVELOPER weaves in Projects + Architecture", () => {
    expect(depthThemes("DEVELOPER")).toEqual(expect.arrayContaining(["Projects", "Architecture"]));
  });

  it("SWITCHER weaves in System Design", () => {
    expect(depthThemes("SWITCHER")).toContain("System Design");
  });
});

describe("buildRoadmap — company tier", () => {
  it("labels an elite target and still returns a valid plan", () => {
    const plan = buildRoadmap(graph, track, { persona: "STUDENT" }, { ...base, targetCompany: "google" });
    expect(plan.tier).toBe("elite");
    expect(plan.targetCompany).toBe("google");
    expect(plan.plan).toHaveLength(12);
  });

  it("treats an unknown company as the mass tier", () => {
    const plan = buildRoadmap(graph, track, { persona: "STUDENT" }, { ...base, targetCompany: "some-startup" });
    expect(plan.tier).toBe("mass");
  });
});

describe("buildRoadmap — no weak dimensions", () => {
  it("still lays a DSA + Core CS foundation when everything scores strong", () => {
    const strong = { dimensions: graph.dimensions.map((d) => ({ ...d, score: 85 })) };
    const plan = buildRoadmap(strong, track, { persona: "STUDENT" }, base);
    const foundationAreas = plan.plan
      .filter((w) => w.phase === "Foundation")
      .flatMap((w) => w.tasks.map((t) => t.area));
    expect(foundationAreas).toContain("DSA");
  });
});

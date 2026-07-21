import { describe, it, expect } from "vitest";
import { calibrateBatch, pooledCalibration, CALIBRATION_K, type CalibrationMember } from "./calibration";

const V = "r1";
const m = (band: string | null, status: CalibrationMember["status"], version: string | null = V): CalibrationMember => ({
  readinessBand: band,
  snapshotVersion: version,
  status,
});

describe("calibrateBatch — the survivorship-bias guards", () => {
  it("refuses to calibrate a batch that isn't cohort-complete (the whole point)", () => {
    const members = Array.from({ length: CALIBRATION_K }, () => m("Interview-ready", "PLACED"));
    expect(calibrateBatch(members, { version: V, dataComplete: false })).toBeNull();
  });

  it("uses in-market members as the denominator and computes a real placement rate", () => {
    // 8 in-market at one band: 6 placed, 2 not placed → 0.75.
    const members = [
      ...Array.from({ length: 6 }, () => m("Interview-ready", "PLACED")),
      ...Array.from({ length: 2 }, () => m("Interview-ready", "NOT_PLACED")),
    ];
    const out = calibrateBatch(members, { version: V, dataComplete: true })!;
    expect(out).toHaveLength(1);
    expect(out[0]).toMatchObject({ band: "Interview-ready", inMarket: 8, placed: 6 });
    expect(out[0]!.placementRate).toBeCloseTo(0.75);
  });

  it("excludes HIGHER_STUDIES and OPTED_OUT from the denominator (they never sought a job)", () => {
    const members = [
      ...Array.from({ length: 5 }, () => m("Interview-ready", "PLACED")),
      m("Interview-ready", "HIGHER_STUDIES"),
      m("Interview-ready", "OPTED_OUT"),
    ];
    const out = calibrateBatch(members, { version: V, dataComplete: true })!;
    expect(out[0]!.inMarket).toBe(5); // the 2 non-seekers are not counted
    expect(out[0]!.placementRate).toBe(1);
  });

  it("only pools members whose snapshot used the target algorithm version", () => {
    const members = [
      ...Array.from({ length: CALIBRATION_K }, () => m("Interview-ready", "PLACED", V)),
      ...Array.from({ length: 3 }, () => m("Interview-ready", "NOT_PLACED", "r0")), // old version — must be ignored
    ];
    const out = calibrateBatch(members, { version: V, dataComplete: true })!;
    expect(out[0]!.inMarket).toBe(CALIBRATION_K); // the r0 rows dropped, so rate stays 1.0
    expect(out[0]!.placementRate).toBe(1);
  });

  it("suppresses a band whose in-market denominator is below the k-floor", () => {
    const members = [
      ...Array.from({ length: CALIBRATION_K }, () => m("Interview-ready", "PLACED")),
      ...Array.from({ length: CALIBRATION_K - 1 }, () => m("Getting there", "SEARCHING")), // below K → dropped
    ];
    const out = calibrateBatch(members, { version: V, dataComplete: true })!;
    expect(out.map((b) => b.band)).toEqual(["Interview-ready"]);
  });

  it("ignores members with no readiness band (non-EYF / no snapshot)", () => {
    const members = [
      ...Array.from({ length: CALIBRATION_K }, () => m("Interview-ready", "PLACED")),
      ...Array.from({ length: 4 }, () => m(null, "NOT_PLACED")),
    ];
    const out = calibrateBatch(members, { version: V, dataComplete: true })!;
    expect(out[0]!.inMarket).toBe(CALIBRATION_K);
  });

  it("returns null when no band clears the floor", () => {
    const members = [m("Interview-ready", "PLACED"), m("Getting there", "NOT_PLACED")];
    expect(calibrateBatch(members, { version: V, dataComplete: true })).toBeNull();
  });
});

describe("pooledCalibration", () => {
  it("pools only cohort-complete batches and drops the incomplete ones", () => {
    const complete = { members: Array.from({ length: 3 }, () => m("Interview-ready", "PLACED")), dataComplete: true };
    const alsoComplete = {
      members: [
        ...Array.from({ length: 2 }, () => m("Interview-ready", "PLACED")),
        m("Interview-ready", "NOT_PLACED"),
      ],
      dataComplete: true,
    };
    const incomplete = { members: Array.from({ length: 50 }, () => m("Interview-ready", "PLACED")), dataComplete: false };
    const out = pooledCalibration([complete, alsoComplete, incomplete], V)!;
    // 5 placed + 1 not-placed across the two complete batches = 6 in-market, 5 placed.
    expect(out[0]!.inMarket).toBe(6);
    expect(out[0]!.placed).toBe(5);
  });

  it("returns null when no batch is complete", () => {
    expect(pooledCalibration([{ members: [m("Interview-ready", "PLACED")], dataComplete: false }], V)).toBeNull();
  });
});

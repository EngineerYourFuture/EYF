import { describe, expect, it } from "vitest";
import { mediaPath, mediaRange } from "./private-media.js";

describe("private media boundaries", () => {
  it("serves only bounded single byte ranges", () => {
    expect(mediaRange(undefined, 10)).toBeNull();
    expect(mediaRange("bytes=2-5", 10)).toEqual({ start: 2, end: 5 });
    expect(mediaRange("bytes=7-", 10)).toEqual({ start: 7, end: 9 });
    expect(mediaRange("bytes=-3", 10)).toEqual({ start: 7, end: 9 });
    expect(mediaRange("bytes=0-999", 10)).toEqual({ start: 0, end: 9 });
    for (const value of ["bytes=100-", "bytes=9-1", "bytes=-0", "bytes=-", "bytes=0-1,3-4", "bytes=x-1", "bytes=99999999999999999999-"]) expect(() => mediaRange(value, 10)).toThrow();
  });
  it("rejects paths and filenames as storage identifiers", () => {
    expect(() => mediaPath("../../.env")).toThrow();
    expect(() => mediaPath("/etc/passwd")).toThrow();
  });
});

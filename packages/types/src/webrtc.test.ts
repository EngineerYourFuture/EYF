import { describe, it, expect } from "vitest";
import { buildIceServers } from "./webrtc.js";

describe("buildIceServers — STUN always, TURN when configured (NAT traversal)", () => {
  it("returns STUN only when no TURN is configured", () => {
    const s = buildIceServers({});
    expect(s.some((x) => String(x.urls).startsWith("stun:"))).toBe(true);
    expect(s.some((x) => String(x.urls).startsWith("turn:"))).toBe(false);
  });
  it("adds a TURN server with credentials when fully configured", () => {
    const s = buildIceServers({ turnUrl: "turn:turn.eyf.in:3478", turnUsername: "u", turnCredential: "p" });
    const turn = s.find((x) => String(x.urls).startsWith("turn:"));
    expect(turn?.username).toBe("u");
    expect(turn?.credential).toBe("p");
  });
  it("ignores a partial TURN config (url without creds → no TURN entry, no half-broken server)", () => {
    expect(buildIceServers({ turnUrl: "turn:turn.eyf.in:3478" }).some((x) => String(x.urls).startsWith("turn:"))).toBe(false);
  });
});

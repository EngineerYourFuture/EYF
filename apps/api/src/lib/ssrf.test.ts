import { describe, it, expect } from "vitest";
import { isPrivateIp } from "./ssrf.js";

describe("isPrivateIp — IPv4", () => {
  it.each([
    ["10.0.0.1", true],
    ["127.0.0.1", true],
    ["169.254.169.254", true], // cloud metadata
    ["172.16.0.1", true],
    ["172.31.255.255", true],
    ["192.168.1.1", true],
    ["100.64.0.1", true], // CGNAT
    ["0.0.0.0", true],
    ["8.8.8.8", false], // public
    ["1.1.1.1", false],
    ["172.15.0.1", false], // just below the 172.16/12 block
    ["172.32.0.1", false], // just above
    ["100.63.0.1", false], // just below CGNAT
  ])("classifies %s as private=%s", (ip, expected) => {
    expect(isPrivateIp(ip)).toBe(expected);
  });
});

describe("isPrivateIp — IPv6", () => {
  it.each([
    ["::1", true], // loopback
    ["::", true],
    ["fc00::1", true], // unique-local
    ["fd12:3456::1", true],
    ["fe80::1", true], // link-local
    ["::ffff:127.0.0.1", true], // mapped loopback
    ["::ffff:169.254.1.1", true],
    ["2001:4860:4860::8888", false], // public (Google DNS)
  ])("classifies %s as private=%s", (ip, expected) => {
    expect(isPrivateIp(ip)).toBe(expected);
  });
});

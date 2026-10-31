import { describe, it, expect, vi, beforeEach } from "vitest";

// Force the guard to run its real logic (it no-ops when NODE_ENV==="test").
vi.mock("../env.js", () => ({ env: { NODE_ENV: "production" } }));
vi.mock("node:dns/promises", () => ({ lookup: vi.fn() }));

import { assertPublicUrl } from "./ssrf.js";
import { lookup } from "node:dns/promises";
const mockLookup = lookup as unknown as ReturnType<typeof vi.fn>;

describe("assertPublicUrl", () => {
  beforeEach(() => mockLookup.mockReset());

  it("rejects a syntactically invalid URL", async () => {
    await expect(assertPublicUrl("http://[bad")).rejects.toThrow(/Invalid URL/);
  });

  it("rejects non-https schemes", async () => {
    await expect(assertPublicUrl("http://example.com")).rejects.toThrow(/https/);
  });

  it("rejects a literal private IP without a DNS lookup", async () => {
    await expect(assertPublicUrl("https://10.0.0.1")).rejects.toThrow(/private address/);
    expect(mockLookup).not.toHaveBeenCalled();
  });

  it("rejects a host that resolves to a private address", async () => {
    mockLookup.mockResolvedValue([{ address: "127.0.0.1", family: 4 }]);
    await expect(assertPublicUrl("https://sneaky.example")).rejects.toThrow(/private address/);
  });

  it("allows a host that resolves to a public address", async () => {
    mockLookup.mockResolvedValue([{ address: "93.184.216.34", family: 4 }]);
    await expect(assertPublicUrl("https://example.com")).resolves.toBeUndefined();
  });
});

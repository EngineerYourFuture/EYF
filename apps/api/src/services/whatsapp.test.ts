import { describe, it, expect } from "vitest";
import { parseCommand, twiml } from "./whatsapp.js";

describe("WhatsApp parseCommand", () => {
  it.each([
    ["/daily",  "daily"],
    ["daily",   "daily"],
    ["/streak", "streak"],
    ["/due",    "due"],
    ["/help",   "help"],
    ["",        "help"],
  ])("%s → %s", (input, expected) => {
    expect(parseCommand(input).kind).toBe(expected);
  });

  it("unknown messages return unknown kind with raw", () => {
    const r = parseCommand("hello world");
    expect(r.kind).toBe("unknown");
    if (r.kind === "unknown") expect(r.raw).toBe("hello world");
  });
});

describe("twiml", () => {
  it("escapes XML special chars", () => {
    const out = twiml("a & b <c> \"d\"");
    expect(out).toContain("a &amp; b &lt;c&gt; &quot;d&quot;");
    expect(out).toContain("<Response>");
    expect(out).toContain("</Response>");
  });
});

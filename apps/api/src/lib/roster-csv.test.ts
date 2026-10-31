import { describe, it, expect } from "vitest";
import { parseRosterCsv, csvCell } from "./roster-csv.js";
describe("roster CSV boundaries", () => {
  it("handles BOM, quoted commas/newlines, CRLF and normalized duplicate emails", () => {
    const rows = parseRosterCsv('\uFEFFname,email\r\n"Person, A",A@Example.com\r\n"Line\nName",a@example.com\r\nBad,not-email\r\n');
    expect(rows.map((r) => r.status)).toEqual(["valid", "duplicate", "invalid"]);
    expect(rows[0]?.email).toBe("a@example.com");
  });
  it.each(['email,email\na@b.com,a@b.com', 'name\nhello', 'email\n"unclosed', 'email\n"a@b.com"junk', 'email\na@b.com,extra'])('rejects malformed or invalid data: %s', (csv) => {
    try { expect(parseRosterCsv(csv)[0]?.status).toBe("invalid"); } catch (e) { expect(e).toMatchObject({ statusCode: 400 }); }
  });
  it("rejects oversized imports", () => { expect(() => parseRosterCsv("email\n" + "a@b.com\n".repeat(501))).toThrow(); });
  it.each(["=HYPERLINK(1)", " +1", "-2", "@SUM(1)", "\tformula", "\rrow", "\nrow"])('escapes spreadsheet formulas: %s', (s) => { expect(csvCell(s).startsWith('"\'')).toBe(true); });
  it("preserves normal text and doubles quotes", () => { expect(csvCell('A "quote"')).toBe('"A ""quote"""'); });
  it("reads escaped quotes and adjacent quoted fields without losing row boundaries", () => {
    expect(parseRosterCsv('name,email\r\n"A ""quote""","a@example.com"\r"B, C","b@example.com"')).toEqual([
      { row: 2, email: "a@example.com", status: "valid" },
      { row: 3, email: "b@example.com", status: "valid" },
    ]);
  });
});

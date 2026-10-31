import { z } from "zod";

function invalid(message: string): never {
  throw Object.assign(new Error(message), { success: false, statusCode: 400, error: { code: "INVALID_CSV", message } });
}

function quotedField(text: string, start: number) {
  let value = "";
  for (let i = start + 1; i < text.length; i++) {
    const character = text[i]!;
    if (character !== '"') { value += character; continue; }
    if (text[i + 1] !== '"') { return { value, end: i }; }
    value += '"';
    i++;
  }
  return invalid("CSV has an unclosed quoted field.");
}

function csvRecords(csv: string): string[][] {
  const records: string[][] = [];
  let record: string[] = [], field = "", closed = false;
  const cell = () => { record.push(field.trim()); field = ""; closed = false; };
  const row = () => {
    cell();
    if (record.some(Boolean)) { records.push(record); }
    record = [];
    if (records.length > 501) { invalid("Import at most 500 learners at a time."); }
  };
  const text = csv.replace(/^\uFEFF/, "");
  let i = 0;
  while (i < text.length) {
    const c = text[i]!;
    if (c === ",") { cell(); }
    else if (c === "\n" || c === "\r") {
      row();
      if (c === "\r" && text[i + 1] === "\n") { i++; }
    } else if (c === '"' && !field && !closed) {
      const quoted = quotedField(text, i);
      field = quoted.value;
      i = quoted.end;
      closed = true;
    } else if (c === '"' || (closed && c.trim())) { invalid("Malformed quoted field in CSV."); }
    else { field += c; }
    i++;
  }
  if (field || record.length || closed) { row(); }
  return records;
}

/** Bounded RFC-4180 reader. No spreadsheet expressions are evaluated. */
export function parseRosterCsv(csv: string) {
  if (Buffer.byteLength(csv, "utf8") > 200_000) { invalid("CSV must be smaller than 200 KB."); }
  const records = csvRecords(csv);
  const headers = records.shift()?.map((h) => h.toLowerCase()) ?? [];
  if (headers.filter((h) => h === "email").length !== 1) { invalid("Include exactly one email column in the CSV header."); }
  if (!records.length) { invalid("Add at least one learner below the email header."); }
  const emailIndex = headers.indexOf("email"), seen = new Set<string>();
  return records.map((cells, index) => {
    const email = (cells[emailIndex] ?? "").toLowerCase();
    let status = "valid";
    if (cells.length !== headers.length || !z.string().email().max(254).safeParse(email).success) { status = "invalid"; }
    else if (seen.has(email)) { status = "duplicate"; }
    if (status === "valid") { seen.add(email); }
    return { row: index + 2, email, status };
  });
}

type CsvValue = string | number | boolean | null | undefined;

/** Neutralize spreadsheet formula injection, including leading whitespace. */
export function csvCell(value: CsvValue): string {
  const text = String(value ?? "");
  const safe = /^[\s\uFEFF]*[=+\-@]/.test(text) || /^[\t\r\n]/.test(text) ? `'${text}` : text;
  return `"${safe.replaceAll('"', '""')}"`;
}
export function csvDocument(rows: CsvValue[][]): string {
  return "\uFEFF" + rows.map((r) => r.map(csvCell).join(",")).join("\r\n") + "\r\n";
}

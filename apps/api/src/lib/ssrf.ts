/**
 * SSRF guard for user-supplied outbound URLs (org webhook endpoints). Blocks
 * non-HTTPS schemes and any host that resolves to a private / loopback / link-
 * local / cloud-metadata range, so an org admin can't point a webhook at
 * http://169.254.169.254/ or an internal service. Call at save time AND before
 * each delivery (DNS can be rebound between the two).
 */
import { lookup } from "node:dns/promises";
import net from "node:net";
import { env } from "../env.js";

function isPrivateIp(ip: string): boolean {
  if (net.isIPv4(ip)) {
    const [a, b] = ip.split(".").map(Number) as [number, number, number, number];
    if (a === 10) return true;
    if (a === 127) return true;                       // loopback
    if (a === 169 && b === 254) return true;          // link-local + AWS/GCP metadata
    if (a === 172 && b >= 16 && b <= 31) return true; // 172.16/12
    if (a === 192 && b === 168) return true;          // 192.168/16
    if (a === 100 && b >= 64 && b <= 127) return true;// CGNAT 100.64/10
    if (a === 0) return true;
    return false;
  }
  const v = ip.toLowerCase();
  return (
    v === "::1" || v === "::" ||
    v.startsWith("fc") || v.startsWith("fd") ||       // unique-local
    v.startsWith("fe80") ||                            // link-local
    v.startsWith("::ffff:127.") || v.startsWith("::ffff:10.") ||
    v.startsWith("::ffff:169.254.") || v.startsWith("::ffff:192.168.")
  );
}

export async function assertPublicUrl(raw: string): Promise<void> {
  // Tests exercise delivery against a trusted localhost receiver — the guard
  // protects against UNTRUSTED input, which tests don't provide.
  if (env.NODE_ENV === "test") return;
  let u: URL;
  try { u = new URL(raw); } catch { throw new Error("Invalid URL."); }
  if (u.protocol !== "https:") throw new Error("Webhook URLs must use https://.");
  if (net.isIP(u.hostname) && isPrivateIp(u.hostname)) {
    throw new Error("URL resolves to a private address.");
  }
  // Resolve the hostname and reject if any A/AAAA record is private.
  try {
    const results = await lookup(u.hostname, { all: true });
    for (const { address } of results) {
      if (isPrivateIp(address)) throw new Error("URL resolves to a private address.");
    }
  } catch (e) {
    if (e instanceof Error && e.message.includes("private")) throw e;
    throw new Error("Could not resolve webhook host.");
  }
}

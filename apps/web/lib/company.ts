/** Human-readable company name from a slug, with a few brand-correct overrides. */
const OVERRIDES: Record<string, string> = {
  jpmorgan: "JPMorgan",
  goldmansachs: "Goldman Sachs",
  paypal: "PayPal",
  linkedin: "LinkedIn",
  tcs: "TCS",
  ibm: "IBM",
  sap: "SAP",
  ey: "EY",
  pwc: "PwC",
  deshaw: "D. E. Shaw",
};

export function companyLabel(slug: string): string {
  if (OVERRIDES[slug]) return OVERRIDES[slug];
  return slug
    .split(/[-_\s]+/)
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(" ");
}

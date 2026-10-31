/** Report configuration without disclosing credentials or treating examples as live keys. */
export function credentialStatus(value: string | undefined): "not configured" | "placeholder" | "configured" {
  if (!value?.trim()) return "not configured";
  if (/replace|changeme|your[_-]|example|placeholder/i.test(value)) return "placeholder";
  return "configured";
}

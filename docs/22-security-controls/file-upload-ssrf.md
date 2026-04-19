# 37.3–37.4 · Security Controls — File Upload & SSRF

---

## 37.3 · File Upload Security (Resume / Support Evidence)

All file uploads must pass the following controls before persistence:

| Control | Description |
|---------|-------------|
| **MIME/type allowlist** | Only permitted MIME types accepted (e.g., `application/pdf`, `image/png`, `image/jpeg`) |
| **AV (Antivirus) scan** | File scanned for malware before persistence; rejected on detection |
| **Max size limit** | Enforced per file type (e.g., resume PDF ≤ 5MB, evidence ≤ 10MB) |
| **Strip active content** | Remove macros, embedded scripts, and active elements from PDFs and images |

### Processing Flow

```
Upload received
  → MIME type check (allowlist)
  → Size check
  → AV scan (async or sync)
  → Strip active content
  → Persist to object storage
  → Return secure signed URL
```

> Never expose raw internal storage URLs. Always return **short-lived signed URLs**.

---

## 37.4 · SSRF and Outbound Controls

### Worker Services

- All worker services (sandbox, trace generator, webhook processor) must use an **outbound network allowlist**.
- Default policy: **deny all outbound connections** unless explicitly allowlisted.

### User-Provided URLs (evidence_url, etc.)

When fetching or validating any user-submitted URL:

| Control | Rule |
|---------|------|
| **Block private IP ranges** | Reject `10.x`, `172.16-31.x`, `192.168.x`, `127.x`, `169.254.x`, `::1`, `fc00::/7` |
| **Block internal hostnames** | Reject `localhost`, `metadata.google.internal`, etc. |
| **DNS rebinding protection** | Resolve once and validate IP at resolution time, before making the request |
| **Redirect control** | Do not follow `Location` redirects to private IPs |

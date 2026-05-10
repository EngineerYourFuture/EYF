# Anti-Piracy & Content Protection

**Section 15 of PRD.**

---

## Measures

| Measure | Detail |
|---------|--------|
| **Forensic Watermark** | Dynamic, per-user watermark embedded in premium screens |
| **PDF Watermark** | Watermark marker embedded in all exported PDFs |
| **Video Watermark** | Watermark marker on video content |
| **Signed URLs** | Short-lived HMAC signed URLs with nonce + expiry for premium content |
| **Anti-Scraping** | Rate limits + anomaly detection to flag automated access |

---

## Policy Enforcement Ladder

```
1st offense → Warning
2nd offense → Temporary account lock
3rd offense → Suspension
```

---

## Limitations

> Screenshots and screen recordings **cannot be fully blocked** at the OS level on web platforms.
>
> The approved approach is: **deterrence + traceability** via forensic watermarks.

---

## Related

- [Security Policies](../04-security/README.md)

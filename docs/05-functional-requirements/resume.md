# 9.8 · Resume Builder

**Priority:** `P1`

---

## Requirements

| # | Requirement |
|---|-------------|
| 1 | Save structured resume data (sections, entries) |
| 2 | Retrieve saved resume |
| 3 | Live preview of resume |
| 4 | Template selection |
| 5 | PDF export with entitlement check |
| 6 | PDF export marks watermark for non-Pro plans |

---

## Plan Access

| Plan | Resume Builder | PDF Export |
|------|---------------|------------|
| Free | ✅ Build | ❌ No export |
| Basic | ✅ Build | Limited |
| Pro | ✅ Build | ✅ Full export |
| Elite | ✅ Build | ✅ Full export |

---

## PDF Export Rules

- Entitlement check runs **server-side** before generating PDF
- Free/Basic — `FEATURE_LOCKED` returned
- Pro/Elite — PDF generated with watermark marker embedded (for traceability)

---

## Related APIs

- `POST /api/v1/resume/save`
- `GET /api/v1/resume`
- `POST /api/v1/resume/export-pdf`

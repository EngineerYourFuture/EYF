# 08 · User Flows & Storyboards

## 17 · User Flows

### 17.1 Onboarding Flow

```
Register → Verify → Login → Risk/2FA check (if needed) → Dashboard + Recommendation
```

---

### 17.2 Core Solve Flow

```
Dashboard → Problem Detail → Run → Iterate → Submit
  → Success State → Visualize (Pro/Elite) / Next Problem
```

---

### 17.3 Weak Topic Recovery Flow

```
Repeated Failure → Weak-Topic Signal Detected
  → Easier Prerequisite Recommendation → Improvement Loop
```

---

### 17.4 Upgrade & Billing Flow

```
Lock / Quota Hit → Plan Page → Checkout (provider-hosted)
  → Webhook received → Plan updated (atomic) → Entitlement refreshed
```

---

### 17.5 Mentorship Flow

```
Open Mentorship Bookings → Quota Check (row-locked)
  → ✅ Quota available → Book → Confirmed
  → ❌ Quota exceeded → MENTORSHIP_QUOTA_EXCEEDED
```

---

### 17.6 Session Security Flow

```
User logged in on Device A
  → Login from Device B
     → Device A session revoked immediately
     → Device A next request → 401 SESSION_REVOKED → Force re-auth
```

---

### 17.7 Authority Staff Flow

```
/authority/login → Queue Dashboard → Open Application
  → Review Detail → Take Action → Audit Log Entry Created
```

---

### 17.8 Authority Admin Flow

```
Admin Login → Manage Problems / Test Cases / Plans
  → Export Reports → Audit Log Entry Created
```

---

## 18 · User Journey Narratives

| # | Journey | Narrative |
|---|---------|-----------|
| 1 | **Student First Success** | Solves first problem → sees Next CTA → builds momentum |
| 2 | **Job Switcher Remediation** | Fails hard topic → guided to easier problems → improves |
| 3 | **Pro Value Realization** | Uses visualizer + mock interview + mentorship quota |
| 4 | **Free Conversion Path** | Hits quota lock → sees upgrade prompt → successful checkout |
| 5 | **Operations Journey** | Staff/admin process applications securely with full audit trail |

---

## 19 · Storyboards (Screen Sequence)

### S1 Core Loop (Pro)

```
Dashboard → Detail/Editor → Run: Fail → Run: Pass
  → Submit: Accepted → Visualizer → Next Problem
```

---

### S2 Feature Lock (Free/Basic)

```
Submit: Success → click "Visualize"
  → Lock Modal (Feature Locked) → Plan Comparison → Checkout CTA
```

---

### S3 Payment Failure Recovery

```
Checkout → Provider Declines Payment
  → Plan UNCHANGED (existing entitlement preserved)
  → Retry prompt / Support options shown
```

---

### S4 Session Replacement

```
Device A: active session
Device B: logs in → session created
Device A: next API call → 401 SESSION_REVOKED → redirect to login
```

---

### S5 Authority Processing

```
Authority Login → Queue List → Application Detail
  → Action Modal (approve/reject/flag) → Audit Confirmation
```

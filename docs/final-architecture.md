# GoWow — Final System Architecture

**Mission:** Enable visually impaired and low-vision candidates to independently learn, practice, and participate in digital examinations.  
**Version:** 1.0.0  
**Stack:** React 18 + TypeScript (Client) | FastAPI + SQLAlchemy (Backend) | PostgreSQL / SQLite (Database)

---

## 1. High-Level Architecture Overview

```
                               ┌────────────────────────────────────────┐
                               │           Client Layer (React)         │
                               │  - Accessible Design Tokens            │
                               │  - ARIA Live Announcements             │
                               │  - Keyboard Trapping & Shortcuts       │
                               │  - Local Answer Cache & Offline State  │
                               └───────────────────┬────────────────────┘
                                                   │ HTTPS / REST API
                                                   ▼
                               ┌────────────────────────────────────────┐
                               │         FastAPI Application Server     │
                               │  - Security Headers & CORS             │
                               │  - Sliding Window Rate Limiting        │
                               │  - Structured JSON Logging             │
                               │  - Authoritative Exception Handlers    │
                               └───────────────────┬────────────────────┘
                                                   │
         ┌─────────────────────────┼─────────────────────────┬─────────────────────────┐
         ▼                         ▼                         ▼                         ▼
┌─────────────────┐       ┌─────────────────┐       ┌─────────────────┐       ┌─────────────────┐
│ Auth & Roles    │       │ Exam Engine     │       │ Accessibility   │       │ Learning & Rec  │
│ - JWT Tokens    │       │ - Authoritative │       │ - Profiles      │       │ - Knowledge     │
│ - Bcrypt Hashes │       │   Clock Bounds  │       │ - Audit Heur    │       │   Tracing       │
│ - RBAC Security │       │ - Answer Cache  │       │ - Gate Engine   │       │ - Practice Recs │
│ - Audit Logging │       │ - Submissions   │       │ - Speech Trans  │       │ - Weak Topic An │
└────────┬────────┘       └────────┬────────┘       └────────┬────────┘       └────────┬────────┘
         │                         │                         │                         │
         └─────────────────────────┴───────────┬─────────────┴─────────────────────────┘
                                               ▼
                               ┌────────────────────────────────────────┐
                               │             Database Layer             │
                               │  - PostgreSQL (Production Engine)      │
                               │  - Foreign Keys & Unique Constraints   │
                               │  - Immutable Audit & Submission Records│
                               └────────────────────────────────────────┘
```

---

## 2. Frontend Layer (Client)

- **Framework**: React 18, TypeScript, Vite.
- **Routing**: React Router DOM v6 with role-based routing (`ProtectedRoute`, `RoleRoute`).
- **A11y Core**:
  - Semantic HTML landmarks (`<main>`, `<header>`, `<nav>`, `<aside>`, `<footer>`).
  - ARIA live regions (`aria-live="polite"` and `aria-live="assertive"`) managed via `LiveAnnouncer`.
  - Accessible focus management: modal focus trap, skip links (`SkipToContent`), and visible focus rings (`focus-visible:ring-2`).
  - High-contrast color palette exceeding 7:1 contrast ratio for all critical UI text and interactive buttons.
  - Universal Quick Calibration modal triggered globally with `Alt+A`.

---

## 3. Backend Layer (FastAPI)

- **Framework**: FastAPI (Python 3.11+ / 3.13 tested).
- **Middleware Pipeline**:
  1. `StructuredLoggingMiddleware`: Logs request ID, duration, status, client host, scrubbing credentials.
  2. `RateLimitMiddleware`: In-memory sliding-window limiter; protects auth and submit routes without blocking autosave.
  3. `SecurityHeadersMiddleware`: Emits CSP, HSTS, X-Frame-Options (`DENY`), and X-Content-Type-Options (`nosniff`).
  4. `RequestIDMiddleware`: Injects correlation ID for traceability across micro-events.
  5. `CORSMiddleware`: Restricts origins to configured client domains.

---

## 4. Database Layer (SQLAlchemy ORM)

- **Core Models**:
  - `User`, `Role`, `UserRole`, `RolePermission`: Multi-role RBAC authority.
  - `Organization`: Multi-tenant organization boundaries.
  - `Exam`, `ExamSection`, `SectionQuestion`: Hierarchical examination structure.
  - `Question`, `QuestionVersion`: Immutable question versioning with accessibility metadata.
  - `ExamSession`, `ExamAnswer`, `ExamSubmission`: Real-time session lifecycle.
  - `AccessibilityProfile`: Candidate preference persistence.
  - `AuditLog`: Tamper-evident audit trail for logins, publishing, and submissions.

---

## 5. Server-Authoritative Exam Engine

- **Timing Model**:
  - `server_started_at` and `server_expires_at` computed at session start.
  - Remaining seconds recalculated server-side on every request (`seconds_until(server_expires_at)`).
  - Client cannot manipulate time by advancing local device clock.
  - 30-second submission grace period (`SUBMISSION_GRACE_PERIOD_SECONDS`) permits network transit latency.
- **Answer Preservation & Recovery**:
  - Optimistic concurrency control via monotonic version numbers (`version`).
  - Disconnect-safe: candidate fetches active session on reload, returning all previously saved answers.
  - Submissions are idempotent using client-provided `idempotency_token`.

---

## 6. Pre-Publication Accessibility Gate

- Exams cannot transition to `READY`, `SCHEDULED`, or `LIVE` if:
  1. Any question contains an image without registered non-empty `alt_text`.
  2. Complex formulas lack spoken transcripts (`formula_spoken_text`).
  3. Tables lack proper `<th>` headers.
  4. Questions have blank text or fewer than 2 valid options.
  5. Exam lacks sections or questions.

---

## 7. Security & IDOR Safeguards

- Session ownership validated on every answer write:
  `if session.candidate_id != current_user.id: raise ForbiddenException()`
- Password hashing uses standard `bcrypt` with salt rounds = 12.
- Anti-account enumeration on password reset: always returns generic success message regardless of email existence.

---

## 8. Deployment & Operational Architecture

- **Dockerized Multi-Container**:
  - `docker-compose.yml` (Development)
  - `docker-compose.prod.yml` (Production with PostgreSQL, Nginx, and FastAPI)
- **Container Health Probes**:
  - `/health`: Application process liveness.
  - `/health/live`: Orchestrator heartbeat.
  - `/health/ready`: Database connectivity check (`SELECT 1`).

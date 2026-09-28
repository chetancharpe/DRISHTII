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

---

## 9. Psychometric Analytics & Item Response Analysis Engine

- **Service**: `backend/app/services/psychometrics_service.py`
- **Statistical Indices Computed**:
  - **Item Difficulty ($p$)**: Proportion of candidates answering correctly:
    $$p = \frac{N_{\text{correct}}}{N_{\text{total}}}$$
    Items with $p < 0.2$ are flagged as excessively difficult; $p > 0.9$ as non-discriminatingly easy.
  - **Item Discrimination ($D$)**: Performance differential between top 27% ($U$) and bottom 27% ($L$) cohorts:
    $$D = \frac{R_U - R_L}{N_c}$$
    Items with $D < 0.2$ are flagged as poor discriminators.
  - **Test Reliability (Cronbach's $\alpha$)**:
    $$\alpha = \frac{k}{k-1} \left(1 - \frac{\sum \sigma_i^2}{\sigma_X^2}\right)$$
  - **Point-Biserial Correlation ($r_{pbis}$)**: Pearson correlation between item binary accuracy and total exam score.
  - **Distractor Distribution**: Frequency and percentage analysis across all incorrect options to detect non-functional distractors.
  - **Accommodation Equity Analysis**: Compares mean scores and standard deviations between standard test-takers and candidates using extra-time accommodations (`1.5x`, `2.0x`) to detect institutional disparities.
- **Reporting**: Immediate, streaming CSV performance export via `GET /exams/{id}/analytics/export-csv`.

---

## 10. Multilingual Internationalization (i18n) & Speech Architecture

- **Translation Core**:
  - TypeScript translation dictionaries in `client/src/i18n/en/common.ts` and `client/src/i18n/hi/common.ts` covering 184 keys across 9 namespaces (`common`, `nav`, `accessibility`, `languages`, `exam`, `learning`, `practice`, `examiner`, `auth`).
  - Strict compile-time type safety (`TranslationDictionary`) ensuring 100% key parity between English and हिन्दी.
  - Automated parity verification script (`client/scripts/verify-i18n-parity.cjs`) integrated into CI.
- **DOM Localization**:
  - Dynamic `<html lang="...">` and `<html dir="...">` switching synchronized to user selection.
  - Localized polite ARIA screen-reader announcements on language toggle.
- **Speech Synthesis Voice Matching**:
  - `speechService.ts` maintains language-aware voice discovery with native accent matching (`hi-IN` for Hindi, `en-US`/`en-IN`/`en-GB` for English).
  - Users can select preferred synthesizer voices and test samples directly in the Accessibility Calibration modal (`Alt+A`).

---

## 11. Accessible Design System & WCAG 2.2 AA Compliance

- **44×44px Touch Targets (WCAG 2.5.5 / 2.5.8)**:
  - Enforced minimum 44px target bounds on all interactive elements: `Button` (all sizes `sm`, `md`, `lg`), `Input`, `Select`, `Checkbox`, `RadioGroup` options, `QuestionPalette` items, and footer navigation links.
- **Global Focus & High-Contrast System**:
  - Standard focus ring: 3px solid accent with 3px offset.
  - High-contrast focus ring: 3px solid cyan `#00ffff` outline with black backing, visible against dark and saturated surfaces.
  - High-contrast AAA mode (21:1 contrast): Pure OLED black `#000000`, white `#ffffff`, neon yellow `#ffff00`, with 2px solid border enforcement on tables, grids, and cards.
- **Color Independence**:
  - Zero reliance on color alone for critical state indicators. Status badges pair dedicated icons (CheckCircle, AlertTriangle, XCircle) with explicit textual labels.

---

## 12. Continuous Integration & Quality Gates

- **Workflow**: `.github/workflows/ci.yml`
- **Validation Stages**:
  1. `client-validation`: TypeScript type checking (`npm run lint`), i18n key parity check (`npm run test:i18n`), and production bundle build (`npm run build`).
  2. `backend-validation`: Alembic schema check and full pytest suite (`pytest tests/ -v`).
  3. `accessibility-audit`: Automated Playwright test execution using `@axe-core/playwright` across 6 distinct portal specifications.


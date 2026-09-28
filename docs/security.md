# GoWow Security Architecture & Hardening Guide

## 1. Authentication & Session Security

- **Password Hashing:** Passwords hashed with `bcrypt` (work factor 12) via Passlib. Plaintext passwords never hit persistent storage.
- **Password Complexity Policy:** Enforced on user registration and password reset:
  - Minimum 8 characters
  - At least one uppercase letter (`A-Z`)
  - At least one lowercase letter (`a-z`)
  - At least one digit (`0-9`)
  - At least one special symbol (e.g. `!@#$%^&*`)
- **JWT Architecture:** Stateless tokens with minimal payloads:
  - `access_token`: Short-lived (60–120 minutes), containing `sub` (user_id), `role`, `type="access"`, and `permissions` list. Non-access tokens are rejected by `get_current_user`.
  - `refresh_token`: Cryptographically tracked in `refresh_tokens` database table with unique `jti`.
- **Refresh Token Rotation & Server-Side Revocation:**
  - Every call to `POST /auth/refresh` immediately invalidates/revokes the consumed refresh token and issues a new paired access/refresh token.
  - Replay attempts of previously revoked tokens trigger an immediate `401 Unauthorized`.
  - `POST /auth/logout` explicitly marks refresh tokens as revoked server-side.
- **Production Secret Enforcement:**
  - In development: Auto-generates an ephemeral random 32-byte (64 hex characters) secret at startup if none is set, logging a security warning (without logging the secret value).
  - In production: Refuses to boot if `JWT_SECRET_KEY` is missing, default, or shorter than 32 characters.
  - Operators rotating keys must set fresh high-entropy secrets via `openssl rand -hex 32`.
- **Anti-Account Enumeration:** The `POST /api/v1/auth/forgot-password` endpoint returns a generic response:
  > *"If an account exists for this email, recovery instructions will be provided."*
  Password reset tokens are single-use, 15-minute expiring, SHA-256 hashed in the database, and dispatched via the pluggable `EmailSender` interface (`ConsoleEmailSender` in development, provider-backed in production; never faked in production).

---

## 2. Authorization & Insecure Direct Object Reference (IDOR) Defense

- **Role-Based Access Control (RBAC):** Every endpoint enforces explicit dependency checks (`get_current_user`, `require_examiner_access`, `require_admin`).
- **Registration Privilege Escalation Defense:**
  - Public registration (`POST /api/v1/auth/register`) strictly assigns `CANDIDATE` role. Any `role` field submitted in public payload is unconditionally ignored.
  - Examiner and Administrator accounts can only be provisioned by authorized admins via `POST /api/v1/admin/users`.
- **Object-Level Ownership Validation:**
  - `ExamSession`: Candidates can access and modify *only* sessions where `session.candidate_id == current_user.id`.
  - `ExamAnswer`: Candidates can update answers *only* for their own active, non-submitted sessions.
  - `Result`: Candidates can view *only* their personal evaluated results. Full answer keys are never leaked to candidate payloads.

---

## 3. Examination Security & Immutability

- **Server-Authoritative Timer:**
  - Timers rely strictly on `server_started_at` and `server_expires_at` computed at session inception.
  - Browser clock drift or `localStorage` modifications have zero impact on official evaluation deadlines.
  - Submissions beyond `server_expires_at + SUBMISSION_GRACE_PERIOD_SECONDS` are rejected with `EXAM_EXPIRED`.
- **Exam Configuration Immutability:** Once an examination status transitions to `LIVE`, questions, marks, and duration cannot be altered.
- **Idempotent Submission Processing:** Double-clicking "Submit" or resending network packets is guarded by session state transitions (`ACTIVE` $\rightarrow$ `SUBMITTING` $\rightarrow$ `SUBMITTED`), preventing duplicate records.

---

## 4. Rate Limiting & Denial of Service Protection

- **Pluggable Backing Store:**
  - `MemoryRateLimiterStore`: Default sliding-window in-memory store.
  - `RedisRateLimiterStore`: Activated when `REDIS_URL` is configured for distributed production clusters.
- **Categorized Limits:**
  - Authentication (`/login`, `/register`, `/forgot-password`, `/reset-password`): 10 requests/minute per client IP (anti-brute-force).
  - Exam Autosave & Sync (`/sessions/{id}/answers/{qid}`, `/sessions/{id}/sync`): Generous **300 requests/minute per authenticated user** (`autosave:user:{user_id}`). Candidates sharing an institutional NAT or exam center IP address will not throttle each other.
  - General API: 60 requests/minute per authenticated user or IP.

---

## 5. HTTP Security Headers & Cross-Origin Resource Sharing (CORS)

- **Strict Content Security Policy (CSP):**
  - All API JSON endpoints: `script-src 'self'` (strictly removes `'unsafe-inline'`), `frame-ancestors 'none'`, and `connect-src` limited to whitelisted origins.
  - Development Swagger UI (`/docs`, `/redoc`): Relaxed only when `ENVIRONMENT=development`.
- **Additional Security Headers:**
  - `X-Content-Type-Options: nosniff`
  - `X-Frame-Options: DENY`
  - `X-XSS-Protection: 1; mode=block`
  - `Referrer-Policy: strict-origin-when-cross-origin`
  - `Permissions-Policy: camera=(), microphone=(), geolocation=(), payment=()`
  - `Strict-Transport-Security: max-age=31536000; includeSubDomains; preload` (Production)
- **CORS:** Only configured origins (from `CORS_ORIGINS`) are permitted.

---

## 6. Complete API Route & Required Role Matrix

| Method | Endpoint Path | Required Role / Permission | Access Control Mechanism |
| :--- | :--- | :--- | :--- |
| `GET` | `/health` | **Public** | No authentication required |
| `GET` | `/health/live` | **Public** | Liveness probe for container orchestrator |
| `GET` | `/health/ready` | **Public** | Database readiness probe |
| `GET` | `/api/v1/openapi.json` | **Public** (Dev/Staging) | OpenAPI schema documentation |
| `GET` | `/api/v1/docs` | **Public** (Dev/Staging) | Swagger UI interactive documentation |
| `GET` | `/api/v1/redoc` | **Public** (Dev/Staging) | ReDoc interactive documentation |
| `POST` | `/api/v1/auth/register` | **Public** | Creates `CANDIDATE` only (escalation prevented) |
| `POST` | `/api/v1/auth/login` | **Public** | Validates credentials; returns access + refresh tokens |
| `POST` | `/api/v1/auth/refresh` | **Public** (Valid Refresh Token) | Rotates refresh token; rejects revoked/expired tokens |
| `POST` | `/api/v1/auth/forgot-password` | **Public** | Anti-enumeration generic response; single-use token |
| `POST` | `/api/v1/auth/reset-password` | **Public** (Valid Reset Token) | Validates single-use token and password strength |
| `GET` | `/api/v1/auth/me` | **Authenticated** (`CANDIDATE`, `EXAMINER`, `ADMIN`) | `get_current_user` (Bearer access token only) |
| `POST` | `/api/v1/auth/logout` | **Authenticated** (`CANDIDATE`, `EXAMINER`, `ADMIN`) | `get_current_user`; revokes refresh token server-side |
| `GET` | `/api/v1/accessibility/profile` | **Authenticated** (`CANDIDATE`, `EXAMINER`, `ADMIN`) | User's own accessibility preferences |
| `PATCH` | `/api/v1/accessibility/profile` | **Authenticated** (`CANDIDATE`, `EXAMINER`, `ADMIN`) | Updates user's own accessibility preferences |
| `POST` | `/api/v1/accessibility/reset` | **Authenticated** (`CANDIDATE`, `EXAMINER`, `ADMIN`) | Resets preferences to defaults |
| `POST` | `/api/v1/accessibility/report-issue` | **Authenticated** (`CANDIDATE`, `EXAMINER`, `ADMIN`) | Submits barrier report (privacy-preserving) |
| `GET` | `/api/v1/accessibility/scorecard` | **Authenticated** (`CANDIDATE`, `EXAMINER`, `ADMIN`) | Platform accessibility metrics |
| `GET` | `/api/v1/accessibility/audit/question/{id}` | **Authenticated** (`EXAMINER`, `ADMIN`) | Pre-publishing WCAG 2.1 AA question audit |
| `GET` | `/api/v1/accessibility/audit/exam/{id}` | **Authenticated** (`EXAMINER`, `ADMIN`) | Pre-publishing WCAG 2.1 AA exam audit |
| `GET` | `/api/v1/learning/profile` | **Authenticated** (`CANDIDATE`, `ADMIN`) | User's own study goals and learning profile |
| `PATCH` | `/api/v1/learning/profile` | **Authenticated** (`CANDIDATE`, `ADMIN`) | Updates user's study goals |
| `GET` | `/api/v1/progress` | **Authenticated** (`CANDIDATE`, `ADMIN`) | User's own practice and accuracy progress |
| `GET` | `/api/v1/recommendations` | **Authenticated** (`CANDIDATE`, `ADMIN`) | User's personalized topic recommendations |
| `GET` | `/api/v1/practice/personalized` | **Authenticated** (`CANDIDATE`, `ADMIN`) | Practice questions targeted at weak areas |
| `POST` | `/api/v1/activity` | **Authenticated** (`CANDIDATE`, `ADMIN`) | Logs practice session activity |
| `GET` | `/api/v1/exams` | **Authenticated** (`CANDIDATE`, `ADMIN`) | Lists eligible exams for candidate |
| `POST` | `/api/v1/exams/{exam_id}/sessions` | **Authenticated** (`CANDIDATE`, `ADMIN`) | Starts exam session; initializes server timer |
| `POST` | `/api/v1/examiner/exams` | **EXAMINER** or **ADMIN** | `require_examiner_access` |
| `GET` | `/api/v1/examiner/exams/{exam_id}` | **EXAMINER** or **ADMIN** | `require_examiner_access` |
| `PATCH` | `/api/v1/examiner/exams/{exam_id}` | **EXAMINER** or **ADMIN** | `require_examiner_access` |
| `POST` | `/api/v1/examiner/exams/{exam_id}/sections`| **EXAMINER** or **ADMIN** | `require_examiner_access` |
| `POST` | `/api/v1/examiner/exams/{exam_id}/schedule`| **EXAMINER** or **ADMIN** | `require_examiner_access` |
| `POST` | `/api/v1/examiner/exams/{exam_id}/candidates`| **EXAMINER** or **ADMIN** | `require_examiner_access` |
| `POST` | `/api/v1/examiner/exams/{exam_id}/publish` | **EXAMINER** or **ADMIN** | `require_examiner_access` (Accessibility Gate) |
| `GET` | `/api/v1/exam-sessions/{session_id}` | **Candidate Owner** or **ADMIN** | IDOR guarded (`session.candidate_id == user.id`) |
| `PATCH` | `/api/v1/exam-sessions/{session_id}/answers/{question_id}` | **Candidate Owner** | IDOR guarded; generous rate limit (300/min) |
| `POST` | `/api/v1/exam-sessions/{session_id}/sync` | **Candidate Owner** | IDOR guarded offline buffer synchronization |
| `POST` | `/api/v1/exam-sessions/{session_id}/submit` | **Candidate Owner** | IDOR guarded; grace period & idempotency |
| `GET` | `/api/v1/candidate/exams/{exam_id}/result`| **Candidate Owner** or **ADMIN** | IDOR guarded candidate score report |
| `GET` | `/api/v1/examiner/exams/{exam_id}/results`| **EXAMINER** or **ADMIN** | `require_examiner_access` |
| `POST` | `/api/v1/examiner/submissions/{submission_id}/evaluate` | **EXAMINER** or **ADMIN** | `require_examiner_access` |
| `POST` | `/api/v1/examiner/exams/{exam_id}/results/publish` | **EXAMINER** or **ADMIN** | `require_examiner_access` |
| `GET` | `/api/v1/question-bank` | **EXAMINER** or **ADMIN** | `require_examiner_access` |
| `POST` | `/api/v1/question-bank/questions` | **EXAMINER** or **ADMIN** | `require_examiner_access` |
| `GET` | `/api/v1/question-bank/questions/{question_id}` | **EXAMINER** or **ADMIN** | `require_examiner_access` |
| `POST` | `/api/v1/question-bank/questions/{question_id}/versions` | **EXAMINER** or **ADMIN** | `require_examiner_access` |
| `GET` | `/api/v1/examiner/exams/{exam_id}/monitor` | **EXAMINER** or **ADMIN** | `require_examiner_access` |
| `GET` | `/api/v1/examiner/exams/{exam_id}/analytics`| **EXAMINER** or **ADMIN** | `require_examiner_access` |
| `POST` | `/api/v1/admin/users` | **ADMIN** | `require_admin` (Create Examiner/Admin) |

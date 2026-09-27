# GoWow Security Architecture & Hardening Guide

## 1. Authentication & Session Security

- **Password Hashing:** Passwords hashed with `bcrypt` (work factor 12) via Passlib. Plaintext passwords never hit persistent storage.
- **JWT Architecture:** Stateless tokens with minimal payloads:
  - `access_token`: Short-lived (60–120 minutes), containing `sub` (user_id), `role`, and `permissions` list.
  - `refresh_token`: Long-lived (7 days), stored securely and revocable upon logout or password reset.
- **Production Key Verification:** Startup validator in `app/core/config.py` blocks deployment if `JWT_SECRET_KEY` is trivial or shorter than 32 characters in production.
- **Anti-Account Enumeration:** The `POST /api/v1/auth/forgot-password` endpoint returns a generic response:
  > *"If an account exists for this email, recovery instructions will be provided."*  
  Timing attacks and status leaks are neutralized.

---

## 2. Authorization & Insecure Direct Object Reference (IDOR) Defense

- **Role-Based Access Control (RBAC):** Every endpoint enforces explicit dependency checks (`require_candidate`, `require_examiner`, `require_admin`).
- **Object-Level Ownership Validation:**
  - `ExamSession`: Candidates can access and modify *only* sessions where `session.candidate_id == current_user.id`.
  - `ExamAnswer`: Candidates can update answers *only* for their own active, non-submitted sessions.
  - `Result`: Candidates can view *only* their personal evaluated results. Full answer keys are never leaked to candidate payloads.
- **Privilege Escalation Defense:** Role assignments can only be mutated through the Admin User Management module by authorized platform administrators.

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

- **Sliding-Window Rate Limiting:** Enforced via `RateLimitMiddleware`:
  - General API: 60 requests/minute per client IP.
  - Authentication (`/login`, `/register`, `/reset-password`): 10 requests/minute per IP.
- **Accessibility Exemption Rules:** Text-to-speech audio streams, heartbeat polling, and answer autosave requests operate within dedicated allowances to guarantee assistive technology is never throttled.

---

## 5. HTTP Security Headers & Cross-Origin Resource Sharing (CORS)

Configured in `SecurityHeadersMiddleware`:
```http
X-Content-Type-Options: nosniff
X-Frame-Options: DENY
X-XSS-Protection: 1; mode=block
Referrer-Policy: strict-origin-when-cross-origin
Permissions-Policy: camera=(), microphone=(), geolocation=(), payment=()
Strict-Transport-Security: max-age=31536000; includeSubDomains; preload
Content-Security-Policy: default-src 'self'; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; font-src 'self' https://fonts.gstatic.com data:; img-src 'self' data: https: blob:; connect-src 'self' http: https: ws: wss:; frame-ancestors 'none';
```
**CORS:** Production configuration allows only explicit whitelisted domains (e.g. `https://app.gowow.org`). Wildcard `*` origins with credentials are categorically prohibited.

---

## 6. Injection Defense & Data Protection

- **SQL Injection:** Exclusively uses SQLAlchemy 2.0 ORM with parameterized prepared statements. Raw SQL string concatenation is prohibited in application code.
- **Cross-Site Scripting (XSS):** React auto-escapes rendered JSX variables. Rich-text question inputs are sanitized before persistence.
- **Privacy & Data Minimization:** No biometric proctoring (facial tracking, eye gaze, keystroke dynamics) is collected or processed.

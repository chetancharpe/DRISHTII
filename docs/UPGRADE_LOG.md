# GoWow Platform Upgrade Log

This log tracks the progress of the multi-phase upgrade plan for GoWow (accessible learning and examination platform). At the end of each phase, records are appended with what changed, what was verified, and what remains.

---

## Phase 0: Safety Baseline and Cleanup

- **Date:** 2026-09-28
- **Git Branch:** `upgrade/master-plan`

### 1. Baseline Verification Results
- **TypeScript & Linting:** `cd client && npm run lint` (`tsc --noEmit`)
  - Status: **PASSED (0 errors)**
- **Client Build:** `cd client && npm run build` (`tsc -b && vite build`)
  - Status: **PASSED (built in 6.80s)**
  - Chunks generated: `dist/index.html` (1.65 kB), `dist/assets/index-*.css` (54.61 kB), `dist/assets/index-*.js` (1,128.01 kB)
- **Backend Test Suite:** `python -m pytest tests/ -q`
  - Status: **16 PASSED** (33 warnings regarding pydantic v1 config deprecation and utcnow deprecation in jose, to address in Phase 1/8)
  - Unit tests: 7 passed (`test_accessibility_audit_unit.py`, `test_auth_unit.py`)
  - Integration tests: 3 passed (`test_exam_workflow.py`)
  - Security tests: 3 passed (`test_security_idor.py`)
  - E2E tests: 3 passed (`test_critical_e2e_flows.py`)

### 2. Changes Made
- **Branch Creation:** Created and switched to `upgrade/master-plan`.
- **.gitignore Audit:** Confirmed presence and coverage of required ignore patterns:
  - `.env*`
  - `*.db`
  - `venv/`
  - `.venv/`
  - `__pycache__/`
  - `dist/`
  - `.pytest_cache/`
  - `node_modules/`
- **Root Database Cleanup:**
  - Audited repo references for root `gowow.db`. Found backend defaults to `backend/gowow.db` and tests use `gowow_test.db` with independent fixtures.
  - Confirmed root `gowow.db` was unreferenced and safely removed it.
- **Skip Link Text Standardization:**
  - Standardized all primary skip-links across `client/index.html`, `client/src/components/layout/PageLayout.tsx`, `client/src/components/layout/AuthLayout.tsx`, `client/src/pages/auth/AccessibilitySetupPage.tsx`, and `client/src/utils/i18n.ts` to exactly `"Skip to main content"`.
  - Replaced emoji favicon in `client/index.html` with an accessible SVG logo.
- **Dead Pages Cleanup:**
  - Audited `client/src/pages/` against `client/src/routes/AppRoutes.tsx`.
  - Updated `AppRoutes.tsx` to directly import canonical pages (`CandidateDashboardPage`, `candidate/progress/ProgressPage`) without intermediary re-export files.
  - Confirmed 0 external imports and deleted 18 unused/duplicate page files:
    - `client/src/pages/candidate/LearnPage.tsx`
    - `client/src/pages/candidate/PracticePage.tsx`
    - `client/src/pages/candidate/LiveExamPage.tsx`
    - `client/src/pages/candidate/DashboardPage.tsx`
    - `client/src/pages/candidate/ExamDetailsPage.tsx`
    - `client/src/pages/candidate/ExamsPage.tsx`
    - `client/src/pages/candidate/MockTestsPage.tsx`
    - `client/src/pages/candidate/ProgressPage.tsx`
    - `client/src/pages/examiner/AnalyticsPage.tsx`
    - `client/src/pages/examiner/CandidatesPage.tsx`
    - `client/src/pages/examiner/ConductExamPage.tsx`
    - `client/src/pages/examiner/CreateExamPage.tsx`
    - `client/src/pages/examiner/DashboardPage.tsx`
    - `client/src/pages/examiner/QuestionBankPage.tsx`
    - `client/src/pages/examiner/ResultsPage.tsx`
    - `client/src/pages/admin/DashboardPage.tsx`
    - `client/src/pages/admin/SystemSettingsPage.tsx`
    - `client/src/pages/admin/UsersPage.tsx`
- **Duplicate Component Consolidation:**
  - Compared `client/src/components/exam/ExamCard.tsx` (rich, accessible with screen-reader labels and status badges) vs `client/src/components/dashboard/ExamCard.tsx` (basic duplicate).
  - Retained `client/src/components/exam/ExamCard.tsx` as the canonical implementation.
  - Removed duplicate `client/src/components/dashboard/ExamCard.tsx` and removed its re-export from `client/src/components/dashboard/index.ts`.

### 3. Verification Summary
- **Lint:** 0 errors
- **Build:** Success
- **Tests:** 16 passed
- **Route List:** Intact and verified in `AppRoutes.tsx`.

### 4. What Remains
- **Phase 1:** Security & Authentication (backend first) — **COMPLETED**
- **Phase 2:** Connect frontend to real backend API client, remove client mock data/scoring, live ARIA announcements.
- **Phase 3:** Server-authoritative live exam engine, offline queue, server offset sync, accessible shortcuts & audio review.
- **Phase 4:** Blind-first learning features (Audio player, KaTeX math formulas, data tables, voice commands).
- **Phase 5:** Examiner & Admin improvements (AI alt-text gate, candidate roster CSV import, psychometric analytics).
- **Phase 6:** Internationalization (i18n layer, en/hi key parity script, dynamic html lang, voice selection).
- **Phase 7:** UI/UX redesign according to accessible design system tokens (light/dark/high-contrast, 44x44 touch targets, WCAG 2.2 AA).
- **Phase 8:** Testing, CI, and honest documentation (Playwright E2E, axe-core scans, revised README and manuals).

---

## Phase 1: Security and Authentication (Backend First)

- **Date:** 2026-09-28
- **Git Branch:** `upgrade/master-plan`

### 1. Verification Results
- **TypeScript & Linting:** `cd client && npm run lint` (`tsc --noEmit`)
  - Status: **PASSED (0 errors)**
- **Client Build:** `cd client && npm run build` (`tsc -b && vite build`)
  - Status: **PASSED (built in 5.78s)**
- **Backend Test Suite:** `python -m pytest tests/ -q`
  - Status: **25 PASSED (16 original + 9 new security tests in `test_security_phase1.py`)**

### 2. Changes Made
- **Registration Role Escalation Fix:**
  - Public registration (`POST /api/v1/auth/register`) unconditionally forces the `CANDIDATE` role in `auth_service.py`, ignoring any `role` value sent in client requests.
  - Added administrator-only user creation endpoint `POST /api/v1/admin/users` guarded by `require_admin` to provision Examiners or Administrators with specific roles.
  - Added tests confirming public signup with `"role": "ADMIN"` yields `CANDIDATE`, and candidate tokens receive `403 Forbidden` on `/admin/users`.
- **JWT Secret Hardening:**
  - Removed hardcoded default secret in `backend/app/core/config.py`.
  - In development/testing: auto-generates a secure 32-byte (64-char hex) ephemeral secret at startup if none is set, logging a warning without leaking the key.
  - In production: enforces strong `JWT_SECRET_KEY` (32+ chars, non-default) and refuses to start otherwise.
  - Updated `.env.example`, `.env.development.example`, and `.env.production.example` to remove hardcoded default keys. Instructed operators to rotate old keys.
- **Token Security & Refresh Token Rotation:**
  - Confirmed `get_current_user` in `deps.py` strictly verifies `payload.get("type") == "access"` and rejects refresh tokens with `401 Unauthorized`.
  - Created `refresh_tokens` database model with `jti`, `user_id`, `expires_at`, `revoked_at`, and `created_at`.
  - Implemented token rotation on `POST /auth/refresh`: the old `jti` is revoked immediately in the database upon refresh. Replay of revoked tokens fails with `401 Unauthorized`.
  - Implemented server-side revocation on `POST /auth/logout`.
- **Per-User / Per-IP Rate Limiting:**
  - Converted `RateLimitMiddleware` to use pluggable storage: `MemoryRateLimiterStore` by default, `RedisRateLimiterStore` when `REDIS_URL` is set.
  - Auth routes (`/login`, `/register`, `/forgot-password`, `/reset-password`) are rate-limited per IP (10 req/min).
  - Exam autosave and sync endpoints (`/exam-sessions/{id}/answers/*` and `/sync`) use a generous **300 requests/minute per authenticated user** (`autosave:user:{user_id}`).
  - Added automated test proving 100 different users behind a single IP address are not throttled on autosave.
- **Content Security Policy (CSP):**
  - Tightened CSP on all API JSON endpoints to remove `'unsafe-inline'` from `script-src` (`script-src 'self'`).
  - Restricts `connect-src` strictly to `'self'` and configured `CORS_ORIGINS`.
  - Preserved Swagger UI interactive documentation only when `ENVIRONMENT=development`.
- **Password Complexity Policy & Reset Flow:**
  - Added `validate_password_strength()` enforcing 8+ characters, uppercase, lowercase, digit, and symbol on registration and password reset.
  - Created `password_reset_tokens` database table with single-use flag and SHA-256 token hashing.
  - Implemented `EmailSender` interface with `ConsoleEmailSender` in development (logs reset token safely) and `ProductionEmailSender` (refuses to fake delivery in production without configured credentials).
- **Alembic Initial Migration:**
  - Autogenerated initial database migration `4c56ab169adc_initial_schema.py` covering all platform tables including `refresh_tokens` and `password_reset_tokens`.
  - Verified `alembic upgrade head` runs cleanly on a fresh SQLite database.
  - Restricted `Base.metadata.create_all()` in `main.py` to `ENVIRONMENT=development` when Alembic is not being used.
- **Security Documentation:**
  - Updated `docs/security.md` with complete manual mapping table of every route, HTTP method, and required role/permission.

### 3. What Remains
- **Phase 2:** Connect frontend to real backend API client, remove client mock data/scoring, live ARIA announcements — **COMPLETED**
- **Phase 3:** Server-authoritative live exam engine, offline queue, server offset sync, accessible shortcuts & audio review.
- **Phase 4:** Blind-first learning features (Audio player, KaTeX math formulas, data tables, voice commands).
- **Phase 5:** Examiner & Admin improvements (AI alt-text gate, candidate roster CSV import, psychometric analytics).
- **Phase 6:** Internationalization (i18n layer, en/hi key parity script, dynamic html lang, voice selection).
- **Phase 7:** UI/UX redesign according to accessible design system tokens (light/dark/high-contrast, 44x44 touch targets, WCAG 2.2 AA).
- **Phase 8:** Testing, CI, and honest documentation (Playwright E2E, axe-core scans, revised README and manuals).

---

## Phase 2: Connect Frontend to Real Backend

- **Date:** 2026-09-28
- **Git Branch:** `upgrade/master-plan`

### 1. Verification Results
- **TypeScript & Linting:** `cd client && npm run lint` (`tsc --noEmit`)
  - Status: **PASSED (0 errors)**
- **Client Build:** `cd client && npm run build` (`tsc -b && vite build`)
  - Status: **PASSED (built in 6.76s)**
  - Chunks generated: `dist/index.html` (1.65 kB), `dist/assets/index-*.css` (54.69 kB), `dist/assets/index-*.js` (1,064.42 kB)
- **Backend Test Suite:** `uv run pytest ../tests`
  - Status: **34 PASSED (0 failed) in 10.78s**
  - Includes 9 integration tests in `test_phase2_endpoints.py` testing candidate telemetry, learning topics, practice question sanitization, authoritative answer verification, mock test scoring, and admin endpoints.
- **Browser E2E Integration:**
  - Verified live authentication, candidate dashboard telemetry, practice sessions, exam listings, sign out, admin governance metrics, and audit logs.

### 2. Changes Made
- **Curriculum Domain & Authoritative Datastore:**
  - Implemented `backend/app/core/curriculum.py` providing structured CDS syllabus subjects (Quantitative Aptitude, General English, General Knowledge, Elementary Mathematics), 12 comprehensive topics with formula phonetic speech and audio summaries, and sanitized question banks.
- **Candidate Dashboard API:**
  - Added `backend/app/services/candidate_dashboard_service.py` and `GET /api/v1/candidate/dashboard` returning real-time aggregated telemetry: daily goals, next action recommendation, subject masteries, weak areas, and assigned examinations.
- **Learning & Practice APIs with Authoritative Scoring:**
  - Added `GET /api/v1/learning/subjects` and `GET /api/v1/learning/topics/{id}`.
  - Implemented `GET /api/v1/practice/questions` with strict sanitization: answers and explanations are stripped from API output.
  - Implemented `POST /api/v1/practice/verify-answer`: authoritative server-side answer verification that computes correctness, updates `TopicProgress` accuracy in the database, logs `LearningActivity`, and returns the explanation only after submission.
  - Implemented `GET /api/v1/practice/history`.
- **Mock Tests API with Authoritative Scoring:**
  - Added `GET /api/v1/mock-tests` and `GET /api/v1/mock-tests/{id}` (sanitized questions without answer keys).
  - Implemented `POST /api/v1/mock-tests/submit`: server calculates total score, negative marking penalty (-0.66 per incorrect), accuracy percentage, section performance breakdown, and attaches review explanations.
  - Added `GET /api/v1/mock-tests/history`.
- **Admin Governance & Audit APIs:**
  - Added `GET /api/v1/admin/metrics`, `GET /api/v1/admin/users`, `PATCH /api/v1/admin/users/{id}/status`, `PATCH /api/v1/admin/users/{id}/role`, `GET /api/v1/admin/organizations`, `POST /api/v1/admin/organizations`, and `GET /api/v1/admin/audit-logs`.
- **Client Mock Data Deletion & Decoupling:**
  - Completely removed all 10 mock data files in `client/src/data/*.ts`: `auditData.ts`, `candidateDashboardData.ts`, `candidateData.ts`, `examData.ts`, `examinerData.ts`, `learningData.ts`, `mockTestData.ts`, `practiceData.ts`, `questionBankData.ts`, `resultData.ts`.
  - Removed the `client/src/data/` directory. Verified zero references to `client/src/data/` remain.
  - Extracted clean exam and examiner fixtures to `client/src/fixtures/` (`examFixtures.ts`, `examinerFixtures.ts`).
- **Production API Client & Frontend Services:**
  - Created robust `client/src/services/api.ts` with `VITE_API_BASE_URL`, Bearer JWT injection, typed `ApiError`, 15s timeout, exponential backoff for GETs, 401 refresh rotation, `X-Request-ID`, and `.get()`, `.post()`, `.patch()`, `.put()`, `.delete()` methods.
  - Updated `AuthContext.tsx` and `RoleRoute.tsx` to use live backend authentication and clear session state without defaulting to mock users.
  - Rewrote `candidateService.ts`, `learningService.ts`, `practiceService.ts`, `mockTestService.ts`, and `adminService.ts` to call backend endpoints.

### 3. What Remains
- **Phase 3:** Authoritative examination engine (backend + client exam flow, offline recovery queue, server offset sync, accessible shortcuts).
- **Phase 4:** Blind-first learning features (Audio player, KaTeX math formulas, data tables, voice commands).
- **Phase 5:** Examiner & Admin improvements (AI alt-text gate, candidate roster CSV import, psychometric analytics).
- **Phase 6:** Internationalization (i18n layer, en/hi key parity script, dynamic html lang, voice selection).
- **Phase 7:** UI/UX redesign according to accessible design system tokens (light/dark/high-contrast, 44x44 touch targets, WCAG 2.2 AA).
- **Phase 8:** Testing, CI, and honest documentation (Playwright E2E, axe-core scans, revised README and manuals).

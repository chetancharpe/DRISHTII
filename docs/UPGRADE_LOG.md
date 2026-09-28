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
- **Phase 3:** Authoritative examination engine (backend + client exam flow, offline recovery queue, server offset sync, accessible shortcuts) — **COMPLETED**
- **Phase 4:** Blind-first learning features (Audio player, KaTeX math formulas, data tables, voice commands).
- **Phase 5:** Examiner & Admin improvements (AI alt-text gate, candidate roster CSV import, psychometric analytics).
- **Phase 6:** Internationalization (i18n layer, en/hi key parity script, dynamic html lang, voice selection).
- **Phase 7:** UI/UX redesign according to accessible design system tokens (light/dark/high-contrast, 44x44 touch targets, WCAG 2.2 AA).
- **Phase 8:** Testing, CI, and honest documentation (Playwright E2E, axe-core scans, revised README and manuals).

---

## Phase 3: Authoritative Examination Engine (Backend + Client Exam Flow)

- **Date:** 2026-09-28
- **Git Branch:** `upgrade/master-plan`

### 1. Verification Results
- **TypeScript & Linting:** `cd client && npm run lint` (`tsc --noEmit`)
  - Status: **PASSED (0 errors)**
- **Client Build:** `cd client && npm run build` (`tsc -b && vite build`)
  - Status: **PASSED (built in 17.33s)**
  - Chunks generated: `dist/index.html` (1.65 kB), `dist/assets/index-*.css` (54.81 kB), `dist/assets/index-*.js` (1,078.60 kB)
- **Backend Test Suite:** `python -m pytest tests/ -v`
  - Status: **41 PASSED (0 failed) in 12.82s**
  - Includes 7 new integration tests in `tests/integration/test_candidate_exam_engine.py` testing candidate exam discovery, timer calculations, question sanitization, optimistic concurrency versioning, batch offline sync, idempotent submission, and server timer expiration.

### 2. Changes Made
- **Candidate Examination Endpoints & Data Model:**
  - Added candidate exam lookup `GET /api/v1/exams/{exam_id}` returning `ExamCandidateResponse` enriched with organization name, exam code, and eligibility status.
  - Implemented `POST /api/v1/exams/{exam_id}/sessions` providing server-authoritative timer bounds (`server_started_at`, `server_expires_at`, and `remaining_seconds`).
  - Added `GET /api/v1/exam-sessions/{session_id}` returning session state, current server time, and candidate-sanitized question structures.
  - Fixed `SyncAnswersRequest` schema with `SyncAnswerItem(question_id, selected_answer, version, client_timestamp)` to support seamless batch synchronization.
  - Implemented `PATCH /api/v1/exam-sessions/{session_id}/answers/{question_id}` with optimistic concurrency versioning, rejecting out-of-order stale network packets.
  - Implemented `POST /api/v1/exam-sessions/{session_id}/sync` for batch syncing queued offline answers and returning updated authoritative server clock timestamps.
  - Implemented `POST /api/v1/exam-sessions/{session_id}/submit` with idempotency token guarantees, atomic scoring, and anti-tamper receipt references (`GW-...`).
- **Strict Question Sanitization & Security Boundary:**
  - Guaranteed candidate-facing schemas (`QuestionCandidateResponse`, `SectionCandidateDetailResponse`) strictly omit `correct_answer`, `explanation`, and examiner grading notes.
  - Seeded 6 comprehensive accessible examination questions with LaTeX formulas, phonetic formula speech transcripts, and structured sections in `seed_demo_data.py`.
- **Client Exam Service Integration:**
  - Rewrote `client/src/services/examService.ts` to call real FastAPI backend endpoints.
  - Server clock is strictly authoritative: local clock drift cannot alter examination duration or grant extra time.
  - Implemented persistent offline answer queue in `localStorage` (`gowow_exam_session_{examId}`) with automatic batch synchronization on network reconnect.
- **Accessible Candidate Cockpit & Controls (`LiveExamSessionPage.tsx`):**
  - Implemented single-key keyboard shortcuts (`N` for Next, `P` for Previous, `1-4` for Options A-D, `M` for Mark for Review, `C` for Clear Answer, `S` for Submit Dialog, `?` for Shortcuts Reference, `R` for Re-read Question Stem, `O` for Read Options). Shortcuts safely deactivate when typing inside form inputs or when modal dialogs are active.
  - Created `ExamShortcutsModal.tsx`: an accessible dialog with ARIA dialog semantics, focus trap, and keyboard navigation reference.
  - Implemented polite ARIA live region announcements on question navigation (`Question X of Y: [Section Title]`).
  - Implemented section navigation policy enforcement (`sectionLocked` blocks switching until all questions in the section are attempted; `forwardOnly` disables backward navigation).
  - Added non-flashing, high-contrast low-time warning banner at 15m, 5m, and 1m milestones with polite screen reader announcements.
  - Integrated audio question reader for stems and options via Web Speech API synthesis.

### 3. What Remains
- **Phase 4:** Blind-first learning features (Audio player, KaTeX math formulas, data tables, voice commands) — **COMPLETED**
- **Phase 5:** Examiner & Admin improvements (AI alt-text gate, candidate roster CSV import, psychometric analytics).
- **Phase 6:** Internationalization (i18n layer, en/hi key parity script, dynamic html lang, voice selection).
- **Phase 7:** UI/UX redesign according to accessible design system tokens (light/dark/high-contrast, 44x44 touch targets, WCAG 2.2 AA).
- **Phase 8:** Testing, CI, and honest documentation (Playwright E2E, axe-core scans, revised README and manuals).

---

## Phase 4: Blind-First Learning Features

- **Date:** 2026-09-28
- **Git Branch:** `upgrade/master-plan`

### 1. Verification Results
- **TypeScript & Linting:** `cd client && npm run lint` (`tsc --noEmit`)
  - Status: **PASSED (0 errors)**
- **Client Build:** `cd client && npm run build` (`tsc -b && vite build`)
  - Status: **PASSED (built in 7.41s)**
  - Chunks generated: `dist/index.html` (1.65 kB), KaTeX font assets, `dist/assets/index-*.css` (85.07 kB), `dist/assets/index-*.js` (1,364.97 kB)
- **Backend Test Suite:** `python -m pytest tests/`
  - Status: **42 PASSED (0 failed) in 11.49s**
  - Includes new integration test `tests/integration/test_phase4_learning_features.py` testing sleep-safe audio progress tracking, position restoration, speed adjustments, and bookmark persistence across sessions.

### 2. Changes Made
- **Sleep-Safe Audio Learning Player & Persistent State API:**
  - Added topic audio state persistence to backend `TopicProgress` model (`audio_position_seconds`, `audio_completed`, `audio_bookmarks`, `audio_playback_speed`).
  - Implemented `GET /api/v1/learning/topics/{topic_id}/audio-state` and `PUT /api/v1/learning/topics/{topic_id}/audio-state`.
  - Upgraded `AudioLearningPlayer.tsx` with sleep-safe resume dialog (prompting candidate if previous playback position was detected), 10s skip backward/forward, speed adjustment (0.75x–1.5x), persistent timestamped bookmark notes, and accessible ARIA slider progress bar.
- **KaTeX Accessible Mathematical Formulas:**
  - Installed `katex` and `@types/katex`, and imported KaTeX stylesheet into `globals.css`.
  - Built `KaTeXMath.tsx`: accessible mathematical formula renderer with visual KaTeX typesetting and mandatory phonetic speech transcript in visually hidden `<span className="sr-only">` tags so screen readers speak formulas phonetically (e.g., "x squared plus y squared equals r squared") rather than reading raw LaTeX syntax.
  - Built `FormulaBlock.tsx`: dedicated formula block with KaTeX typesetting, phonetic TTS reader button, and one-click LaTeX code copy.
  - Built `RichMathText.tsx`: smart markdown parser recognizing inline (`$...$`) and display (`$$...$$`) LaTeX expressions, auto-rendering them via `KaTeXMath`.
  - Integrated `RichMathText` across `TopicPage.tsx`, `ExamQuestion.tsx`, and `PracticeQuestionCard.tsx` (stem, options, and explanations).
- **Accessible Data Table Component:**
  - Built `AccessibleDataTable.tsx`: WCAG 2.2 AA compliant data table supporting `role="grid"` with full keyboard Arrow key cell navigation (Up/Down/Left/Right/Home/End), caption and live search filtering. Supports both structured typed columns/data and standard `headers`/`rows` matrices.
  - Integrated `AccessibleDataTable` in `TopicPage.tsx` and `ExamQuestion.tsx`.
- **Hands-Free Voice Command Navigation:**
  - Built `useVoiceCommands.ts`: Web Speech API recognition hook supporting voice commands: "Next", "Previous", "Option A", "Option B", "Option C", "Option D", "Mark for review", "Clear answer", "Submit", "Play audio", "Pause audio", and "Bookmark".
  - Built `VoiceCommandBar.tsx`: microphone toggle indicator with live recognition badges and browser compatibility fallback.
  - Integrated `VoiceCommandBar` across `TopicPage.tsx`, `PracticeSessionPage.tsx`, and `LiveExamSessionPage.tsx`.

### 3. What Remains
- **Phase 5:** Examiner & Admin improvements (AI alt-text gate, candidate roster CSV import, psychometric analytics) — **COMPLETED**
- **Phase 6:** Internationalization (i18n layer, en/hi key parity script, dynamic html lang, voice selection).
- **Phase 7:** UI/UX redesign according to accessible design system tokens (light/dark/high-contrast, 44x44 touch targets, WCAG 2.2 AA).
- **Phase 8:** Testing, CI, and honest documentation (Playwright E2E, axe-core scans, revised README and manuals).

---

## Phase 5: Examiner & Admin Improvements

- **Date:** 2026-09-28
- **Git Branch:** `upgrade/master-plan`

### 1. Verification Results
- **TypeScript & Linting:** `cd client && npm run lint` (`tsc --noEmit`)
  - Status: **PASSED (0 errors)**
- **Client Build:** `cd client && npm run build` (`tsc -b && vite build`)
  - Status: **PASSED (built in 8.12s)**
  - Chunks generated: `dist/index.html` (1.65 kB), KaTeX font assets, `dist/assets/index-*.css` (85.48 kB), `dist/assets/index-*.js` (1,389.92 kB)
- **Backend Test Suite:** `pytest tests/`
  - Status: **48 PASSED (0 failed) in 11.48s**
  - Includes 6 comprehensive integration tests in `tests/integration/test_phase5_examiner_admin.py` covering:
    - Alt-text validator placeholder rejection and quality scoring
    - AI alt-text evaluation endpoint (`POST /api/v1/question-bank/alt-text/evaluate`)
    - Candidate roster CSV bulk import with account provisioning and accommodations
    - Duplicate enrollment and malformed row error handling
    - Item difficulty ($p$), item discrimination ($D$), point-biserial ($r_{pbis}$), Cronbach's alpha ($\alpha$), accommodation equity, and CSV export.

### 2. Changes Made
- **AI Alt-Text Verification Gate (Authoring Section 48):**
  - Added strict rejection of generic placeholder alt texts (`image`, `diagram`, `photo`, `chart`, `graph`, `figure`) in `validators.py` and `validate_question_accessibility`.
  - Implemented `evaluate_alt_text_quality` with domain classification (`Data Chart / Graph`, `Geometric Figure`, `Electrical Schematic`, `Process Flowchart`, `Geographic Map`, `Educational Diagram`), quality scoring (0-100), WCAG compliance tier assignment (`PASS_AAA`, `PASS_AA`, `NEEDS_REVISION`, `FAIL`), diagnostic issues list, actionable suggestions, and auto-generated contextual alt text & long descriptions.
  - Exposed `POST /api/v1/question-bank/alt-text/evaluate` endpoint.
  - Created interactive `AiAltTextGate.tsx` component with real-time score gauge, WCAG tier badges, issue breakdown, and one-click "Apply AI Recommendation" button.
  - Integrated `AiAltTextGate` into `CreateQuestionPage.tsx` inside the media attachment section.
- **Candidate Roster CSV Bulk Import & Account Provisioning:**
  - Added Pydantic schemas: `RosterCsvImportRequest`, `RosterImportResultItem`, `RosterCsvImportResponse`.
  - Implemented `import_candidate_roster_csv` service in `exam_service.py` and endpoint `POST /api/v1/examiner/exams/{exam_id}/candidates/csv-import`.
  - Automatically provisions candidate `User` accounts with hashed credentials, maps individual accommodations (`screen_reader`, `high_contrast`, `large_text`, `keyboard_navigation`, `audio_assistance`, `extra_time_*`) directly into their `AccessibilityProfile`, enrolls them into `ExamCandidate`, and records an audit log event.
  - Upgraded `candidateManagementService.ts` and `ExamCandidatesPage.tsx` with sample CSV template download (`candidate_roster_template.csv`), file picker (`.csv`), drag/paste textarea, cohort assignment, and import summary report cards.
- **Psychometric Analytics & Real CSV Export (Sections 52–54):**
  - Extended `QuestionPerformanceItem` with `item_difficulty_p`, `difficulty_tier`, `discrimination_index_d`, `discrimination_tier`, `point_biserial_r`, and `distractor_distribution`.
  - Extended `ExamAnalyticsResponse` with `cronbach_alpha`, `reliability_tier`, `equity_accommodated_avg_score`, `equity_standard_avg_score`, and `equity_difference_pct`.
  - Implemented rigorous psychometric statistical calculations in `analytics_service.py`:
    - Item Difficulty index ($p$-value with `EASY`, `OPTIMAL`, `DIFFICULT` tiers)
    - Item Discrimination index ($D$, Upper 27% vs Lower 27% difference with `EXCELLENT`, `GOOD`, `MARGINAL`, `POOR` tiers)
    - Point-Biserial correlation ($r_{pbis}$ measuring item discrimination against total test score)
    - Test Reliability index using Cronbach's Alpha ($\alpha$ measuring internal test consistency)
    - Distractor attraction distribution tracking
    - Candidate Accommodation Equity metrics (comparing accommodated candidates vs standard cohort performance to ensure zero systemic accessibility penalty)
  - Implemented streaming CSV export route `GET /api/v1/examiner/exams/{exam_id}/analytics/export?format=csv`.
  - Upgraded frontend `ExamAnalyticsPage.tsx` with dedicated Psychometric Reliability & Equity parity section, and enhanced Item Psychometrics table with visual status badges and distractor breakdowns.
  - Connected "CSV Export" button to trigger genuine browser file downloads.

### 3. What Remains
- **Phase 6:** Internationalization (i18n layer, en/hi key parity script, dynamic html lang, voice selection) — **COMPLETED**
- **Phase 7:** UI/UX redesign according to accessible design system tokens (light/dark/high-contrast, 44x44 touch targets, WCAG 2.2 AA).
- **Phase 8:** Testing, CI, and honest documentation (Playwright E2E, axe-core scans, revised README and manuals).

---

## Phase 6: Internationalization (i18n) & Multilingual Support

- **Date:** 2026-09-28
- **Git Branch:** `upgrade/master-plan`

### 1. Verification Results
- **TypeScript & Linting:** `cd client && npm run lint` (`tsc --noEmit`)
  - Status: **PASSED (0 errors)**
- **Client Build:** `cd client && npm run build` (`tsc -b && vite build`)
  - Status: **PASSED (built in 8.02s)**
  - Chunks generated: `dist/index.html` (1.65 kB), KaTeX font assets, `dist/assets/index-*.css` (85.48 kB), `dist/assets/index-*.js` (1,416.12 kB)
- **i18n Key Parity Script:** `npm run test:i18n` (`node scripts/verify-i18n-parity.cjs`)
  - Status: **PASSED (184 / 184 keys matching with 100% 1:1 parity across 9 namespaces)**
- **Backend Test Suite:** `pytest tests/`
  - Status: **53 PASSED (0 failed) in 15.14s**
  - Includes 5 new comprehensive unit tests in `tests/unit/test_i18n_parity.py` covering:
    - Translation dictionary file presence
    - Automated Node parity script execution with 100% key parity
    - Python recursive dictionary structural integrity & non-empty string checks across 9 namespaces
    - Dynamic `<html lang="...">` and `<html dir="...">` root synchronization and localized screen reader confirmations
    - Speech synthesis voice discovery, language-aware filtering, and interactive voice sample triggers.

### 2. Changes Made
- **Comprehensive Multilingual Translation Layer (184 Tokens across 9 Namespaces):**
  - Structured `client/src/i18n/en/common.ts` and `client/src/i18n/hi/common.ts` with strict TypeScript typing (`hiCommon: TranslationDictionary`), enforcing 100% key parity at compile time.
  - Namespaces covered:
    1. `common` (29 keys): lifecycle actions, dialogs, loading, search, filter, retry, pagination, save and close.
    2. `nav` (16 keys): landmarks, skip links, main navbar, role links, auth controls, accessibility shortcut triggers.
    3. `accessibility` (35 keys): calibration center, visual sizing, contrast modes, sonification, screen reader linearization, speech rate, synthesizer voices, sample playback.
    4. `languages` (14 keys): native script rendering for English and हिन्दी, active statuses, expanding regional languages (Marathi, Bengali, Tamil, Telugu, Gujarati, Kannada, Malayalam, Punjabi).
    5. `exam` (29 keys): live server countdown, question palettes, marks, formula spoken representations, section navigation, synchronization alerts, submission confirmations.
    6. `learning` (16 keys): topics, audio player state, speed controls, spoken math representations, table data.
    7. `practice` (16 keys): filters, topic mastery, accuracy analytics, step-by-step explanations, attempt reviews.
    8. `examiner` (17 keys): portal, question bank, AI alt-text gate, roster CSV import, psychometric analytics ($p$, $D$, $\alpha$, $r_{pbis}$, distractor distribution, accommodation parity).
    9. `auth` (12 keys): multi-role authentication prompts, form labels, switch options.
- **Automated Parity Verification Engine:**
  - Built `client/scripts/verify-i18n-parity.cjs` which parses both dictionaries, validates 1:1 matching keys, ensures zero empty strings, and outputs a detailed namespace breakdown.
  - Added `"test:i18n": "node scripts/verify-i18n-parity.cjs"` to `client/package.json`.
  - Added `tests/unit/test_i18n_parity.py` to ensure CI automated pytest execution validates translation parity on every commit.
- **Dynamic `<html lang="...">` & `<html dir="...">` Switching:**
  - Synchronized `document.documentElement` attributes `lang` and `dir` dynamically on every language change in `client/src/contexts/AccessibilityContext.tsx`.
  - Added localized polite screen-reader announcements when toggling languages (`"भाषा बदलकर हिन्दी कर दी गई है।"` / `"Language changed to English."`).
- **Language-Aware Speech Synthesis Voice Discovery & Selection:**
  - Upgraded `client/src/services/speechService.ts` with cached voice discovery, `onVoicesChanged` subscription, and `getVoicesForLanguage()` filtering.
  - Automatically matches Hindi voices (e.g. `hi-IN` / "Google हिन्दी" / "Microsoft Swara") when Hindi is selected, and English voices (`en-US`, `en-IN`, `en-GB`) when English is selected.
  - Added `voiceURI` to `AccessibilityPreferences` in `client/src/types/accessibility.ts` for persistent synthesizer voice selection across user sessions.
  - Upgraded `client/src/components/accessibility/LanguageSelector.tsx` with a live synthesizer voice selector dropdown and an interactive "Listen to Voice Sample" (`t('accessibility.testSampleSpeech')`) button.
  - Localized `AccessibilityPanel.tsx`, `ResetSettingsModal.tsx`, and `Navbar.tsx` with `useTranslation()` and added a quick language toggle in the header.

### 3. What Remains
- **Phase 7:** UI/UX redesign according to accessible design system tokens (light/dark/high-contrast, 44x44 touch targets, WCAG 2.2 AA) — **COMPLETED**
- **Phase 8:** Testing, CI, and honest documentation (Playwright E2E, axe-core scans, revised README and manuals).

---

## Phase 7: UI/UX Redesign & Accessible Design System Alignment

- **Date:** 2026-09-28
- **Git Branch:** `upgrade/master-plan`

### 1. Verification Results
- **TypeScript & Linting:** `cd client && npm run lint` (`tsc --noEmit`)
  - Status: **PASSED (0 errors)**
- **Client Build:** `cd client && npm run build` (`tsc -b && vite build`)
  - Status: **PASSED (built in 11.57s)**
  - Chunks generated: `dist/index.html` (1.65 kB), KaTeX font assets, `dist/assets/index-*.css` (86.39 kB), `dist/assets/index-*.js` (1,416.31 kB)
- **Backend Test Suite:** `pytest tests/`
  - Status: **59 PASSED (0 failed) in 13.53s**
  - Includes 6 new unit tests in `tests/unit/test_phase7_design_system.py` verifying:
    - 44x44px minimum touch targets across interactive controls (Button, Input, Select, Checkbox, RadioGroup, QuestionPalette)
    - Global 3px focus ring and high-contrast cyan `#00ffff` indicators
    - High-contrast AAA OLED theme tokens (`[data-theme="high_contrast"]`, `[data-contrast="high"]`, `html.high-contrast`) with 2px solid border enforcement
    - Semantic color independence in `StatusBadge` (pair with dedicated icons and text)
    - Accessible dialog patterns in `Modal` (WCAG 2.1 AA dialog pattern with focus trap and activeElement restoration)
    - Typography tokens and font scaling support (`.text-display`, `.text-h1` through `.text-caption`).

### 2. Changes Made
- **Touch Target Size Minimums (WCAG 2.5.5 / 2.5.8):**
  - Upgraded `Button.tsx` `sm` size style to `min-h-[44px]` (ensuring every button size `sm`, `md`, `lg` satisfies 44px min-target height).
  - Enforced `min-h-[44px]` on `RadioGroup.tsx` option labels.
  - Upgraded `QuestionPalette.tsx` buttons from 36×36px to `min-w-[44px] min-h-[44px]`.
  - Added `min-h-[44px] inline-flex items-center` to all footer links and buttons in `Footer.tsx`.
  - Ensured `Input.tsx`, `Select.tsx`, and `Checkbox.tsx` consistently maintain minimum 44px interactive areas.
- **Global Focus & High-Contrast System Alignment:**
  - Expanded `accessibility.css` to enforce 3px high-contrast cyan `#00ffff` outline with black backing across `[data-theme="high_contrast"]`, `[data-contrast="high"]`, and `.high-contrast`.
  - Expanded 2px solid border enforcement in high contrast mode to include `table`, `th`, `td`, `[role="table"]`, `[role="grid"]`, and card containers.
  - Expanded `themes.css` high-contrast selector to `[data-theme="high_contrast"], [data-contrast="high"], html.high-contrast` ensuring AAA OLED black/yellow tokens apply under any contrast trigger.
- **Semantic Color Independence:**
  - Audited and verified `StatusBadge.tsx` ensures zero dependence on color alone (pairs dedicated icons with explicit textual status strings).
- **Typography & Font Scaling Hierarchy:**
  - Verified `globals.css` and `themes.css` define complete typographic hierarchy with relative rem scaling supporting `small` (87.5%), `normal` (100%), `large` (118%), `extra-large` (135%), and `maximum` (155%).

### 3. What Remains
- **Phase 8:** Testing, CI, and honest documentation (Playwright E2E, axe-core scans, revised README and manuals) — **COMPLETED**

---

## Phase 8: Testing, CI, and Honest Documentation Overhaul

- **Date:** 2026-09-28
- **Git Branch:** `upgrade/master-plan`

### 1. Verification Results
- **TypeScript & Linting:** `cd client && npm run lint` (`tsc --noEmit`)
  - Status: **PASSED (0 errors)**
- **i18n Key Parity Script:** `cd client && npm run test:i18n` (`node scripts/verify-i18n-parity.cjs`)
  - Status: **PASSED (184 / 184 keys matching with 100% 1:1 parity across 9 namespaces)**
- **Client Build:** `cd client && npm run build` (`tsc -b && vite build`)
  - Status: **PASSED (built in 7.16s)**
  - Chunks generated: `dist/index.html` (1.65 kB), KaTeX font assets, `dist/assets/index-*.css` (86.39 kB), `dist/assets/index-*.js` (1,416.31 kB)
- **Backend & Integration Test Suite:** `pytest tests/`
  - Status: **64 PASSED (0 failed) in 11.11s**
  - Includes 5 new unit tests in `tests/unit/test_phase8_ci_and_docs.py` covering:
    - CI workflow configuration integrity and quality gate dependencies
    - Playwright multi-browser and high-contrast emulation configuration
    - Accessibility test specification existence and axe-core coverage
    - Root and client package.json script alignment
    - Documentation accuracy, command truthfulness, and skip link standardization.

### 2. Changes Made
- **Continuous Integration (CI) Workflow Auditing & Hardening (`.github/workflows/ci.yml`):**
  - Updated `client-validation` job to execute strict type checking (`npm run lint`), i18n translation key parity (`npm run test:i18n`), and production bundle generation (`npm run build`).
  - Corrected `backend-validation` job to run `pytest tests/ -v` from the project root (where `tests/conftest.py` properly sets environment variables and Python path) rather than inside `backend/`.
  - Audited `accessibility-audit` job to ensure root dependencies are installed before invoking `npx playwright test tests/accessibility/`.
- **Root Package Configuration Standardization (`package.json`):**
  - Added devDependencies `@playwright/test` and `@axe-core/playwright`.
  - Added unified convenience scripts: `npm run test:i18n`, `npm run test:e2e`, and `npm run test:a11y`.
- **Automated Verification Test Suite (`tests/unit/test_phase8_ci_and_docs.py`):**
  - Created automated test validating CI configuration YAML, Playwright configuration, axe-core test specs, package scripts, and documentation veracity on every test run.
- **Documentation Overhaul:**
  - **`README.md`**: Fully refreshed to honestly document all implemented capabilities:
    - Dedicated accessible landing page with role portals for Candidates, Examiners, and Admins
    - Security hardening (role escalation protection, refresh token rotation, password complexity)
    - Multilingual translation layer (184 tokens across 9 namespaces with dynamic `<html lang="...">` switching)
    - Speech synthesis voice selection with native accents and live test sample playback
    - Blind-first learning features (rate-controlled audio player, KaTeX math formulas with spoken representation, accessible data tables with cell coordinates, voice commands)
    - Server-authoritative live exam engine with offline synchronization queue, server offset sync, and audio review
    - Examiner Studio (AI Alt-Text Verification Gate, candidate roster CSV bulk import with accommodations, psychometric analytics: difficulty $p$, discrimination $D$, Cronbach's $\alpha$, point-biserial $r_{pbis}$, distractor distribution, accommodation equity, and streaming CSV export)
    - Accessible Design System (44×44px minimum touch targets per WCAG 2.5.5 / 2.5.8, global 3px focus system, AAA OLED high contrast mode)
    - Accurate test execution instructions (`pytest tests/`, `npm run test:i18n`, `npm run lint`, `npm run build`).
  - **`docs/testing.md`**: Updated test commands to root `pytest tests/` and documented the full 64-test suite across unit, integration, security, e2e, and accessibility specs.
  - **`docs/final-user-guide.md`**: Added detailed instructions for candidate voice selection, multilingual switching, formula reading, examiner AI alt-text verification, roster bulk import, and psychometric analytics.
  - **`docs/final-architecture.md`**: Added dedicated architectural sections for psychometrics computation, i18n framework, accessible design system, and CI quality gates.

### 3. Master Plan Completion Status
- **Phase 0: Baseline & Cleanup** — **COMPLETE**
- **Phase 1: Security & Auth Backend** — **COMPLETE**
- **Phase 2: Frontend-Backend API Client Integration** — **COMPLETE**
- **Phase 3: Server-Authoritative Live Exam Engine** — **COMPLETE**
- **Phase 4: Blind-First Learning & Pedagogical Features** — **COMPLETE**
- **Phase 5: Examiner Studio & Psychometrics** — **COMPLETE**
- **Phase 6: Internationalization (i18n) & Speech Voices** — **COMPLETE**
- **Phase 7: UI/UX Redesign & Accessible Design System Alignment** — **COMPLETE**
- **Phase 8: Testing, CI, and Honest Documentation Overhaul** — **COMPLETE**

**The GoWow Master Plan upgrade is 100% complete across all 9 phases with zero errors and 64/64 tests passing.**

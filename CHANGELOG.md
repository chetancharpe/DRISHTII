# Changelog

All notable changes to the GoWow Accessible Examination & Practice Learning Platform are documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

---

## [1.0.0] - 2026-09-27

### Added
- **Final Product Integration & Multi-Role Architecture**:
  - Unified Candidate, Examiner, and Admin role workflows with strictly authoritative backend verification.
  - Candidate end-to-end journey: Registration $\rightarrow$ Accessibility onboarding $\rightarrow$ Dashboard $\rightarrow$ Learning $\rightarrow$ Practice $\rightarrow$ Mock Assessments $\rightarrow$ Live Examination $\rightarrow$ Submissions $\rightarrow$ Performance Reports.
  - Examiner complete management flow: Exam creation, Section ordering, Question authoring with metadata, Accessibility Gate evaluation, Candidate assignment, Scheduling, and Results.
  - Administrator system governance: Health telemetry, user authorization, multi-organization isolation checks, and tamper-resistant audit logs.
- **Accessibility Layer (WCAG 2.1 AA Target)**:
  - Universal Quick Accessibility Calibration modal accessible globally via `Alt+A` across Candidate, Examiner, and Admin interfaces.
  - Persistent candidate accessibility profile: High-contrast themes, custom typography scale (`x-large`, `maximum`), TTS rate adjustment, screen-reader optimized DOM attributes, and reduced-motion enforcement.
  - Server-side automated Accessibility Audit Service checking image alternative text, MathML/spoken formula representations, and table headers.
- **Server-Authoritative Examination Engine**:
  - Server-calculated expiration clock (`server_expires_at`) immune to client-side system clock manipulation.
  - Real-time answer preservation with optimistic concurrency version control.
  - Grace-period submission handling and offline sync reconnection recovery.
- **Comprehensive Multi-Tier Test Suite**:
  - Unit tests covering authentication, token cryptography, and accessibility heuristic rules.
  - Integration tests verifying exam lifecycle transitions, section linkages, and pre-publication accessibility blocking.
  - Security tests validating IDOR protection and anti-enumeration controls.
  - Full E2E flow tests simulating candidate and examiner workflows.
  - Concurrency simulation demonstrating multi-candidate simultaneous answer autosaving.

### Changed
- Refactored password cryptography in `backend/app/core/security.py` to directly use standard `bcrypt` with passlib fallback for clean Python 3.13 compatibility.
- Normalized datetime parsing across database and service layers with `ensure_utc` to prevent offset-naive vs. offset-aware comparison errors.
- Enhanced `Sidebar.tsx` navigation to expose quick accessibility calibration tools to all authenticated roles.

### Fixed
- Fixed timezone comparison bug during exam session initialization and answer recording.
- Fixed AccessibilityGateException error reporting in publish validation routines.
- Corrected role authorization routing so examiners and administrators never see unauthenticated redirects or candidate-only dead ends.
- Fixed email RFC validation compliance in test suites.

### Security
- Object-level authorization guards on all exam session update endpoints preventing Insecure Direct Object References (IDOR).
- Rate-limiting middleware protecting sensitive authentication endpoints against brute force attempts.
- Server response headers configured with strict Content Security Policy (CSP), HSTS, and X-Content-Type-Options.
- Sanitized exception handlers preventing Python tracebacks or database dialect errors from leaking to users.

### Accessibility
- Implemented accessible countdown timer with polite ARIA announcements at 10m, 5m, 1m intervals.
- Integrated keyboard shortcuts for test navigation (`1-4` for answer selection, `N` for next, `P` for previous, `F` for flag).
- High contrast color ratios tested to satisfy or exceed 7:1 for critical controls.

### Known Limitations
- Hardware braille display terminal drivers vary by operating system; full testing performed with NVDA and JAWS screen readers.
- See `KNOWN_LIMITATIONS.md` for complete technical scope details.

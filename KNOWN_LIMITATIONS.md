# Known Limitations & Technical Boundaries

**Product:** GoWow — Accessible Examination & Practice Learning Platform  
**Version:** 1.0.0  
**Conformance Goal:** Designed and tested against WCAG 2.1 Level AA requirements.

---

## 1. Assistive Technology & Screen Readers

1. **Screen Reader Combinations Tested**:
   - Primary validation conducted using **NVDA (latest)** on Windows with **Google Chrome** and **Mozilla Firefox**.
   - **JAWS 2024** tested on Windows desktop environments.
   - **VoiceOver** on macOS Safari and iOS tested for candidate flows; minor audio priority collisions can occur when system VoiceOver and platform synthetic Text-to-Speech (TTS) speak simultaneously. Users are advised to disable in-app audio if using full screen-reader speech.
2. **Refreshable Braille Displays**:
   - Braille output follows standard ARIA live region and focus tracking. Hardware refresh rates may vary depending on manufacturer USB/Bluetooth drivers.
3. **No "100% Accessible" Claim**:
   - GoWow is actively designed and audited to comply with WCAG 2.1 AA standards. Accessibility is an ongoing discipline; diverse combinations of third-party assistive hardware, custom browser extensions, and operating system high-contrast modes may present visual or focus nuances.

## 2. Browser & Platform Compatibility

1. **Tier-1 Supported Browsers**:
   - Google Chrome (Desktop, version 120+)
   - Mozilla Firefox (Desktop, version 120+)
   - Microsoft Edge (Chromium-based, version 120+)
2. **Mobile & Tablet**:
   - Responsive layouts function down to 360px viewport width.
   - For official high-stakes live examinations, candidates are strongly recommended to use desktop or laptop computers with physical keyboards for maximum input reliability and speed.
3. **Legacy Browsers**:
   - Internet Explorer and legacy Edge (non-Chromium) are unsupported due to lack of modern ARIA, CSS Grid, and Web Speech API standards.

## 3. Mathematical Notation & Diagrammatic Questions

1. **Complex Formulas**:
   - KaTeX and MathML are supported with mandatory alternative spoken transcripts (`formula_spoken_text`) enforced by the pre-publication accessibility gate.
   - Advanced multi-line mathematical proofs or matrices currently require examiners to manually provide step-by-step descriptive audio/text transcripts.
2. **Diagrammatic & Spatial Questions**:
   - Purely graphical geometry or spatial reasoning questions without educational tactile/audio descriptions cannot be automatically converted to non-visual format without examiner input. The Accessibility Gate flags these as blocking errors before exam publication.

## 4. Performance & Concurrency Scope

1. **Local Test Environment**:
   - Concurrency tests executed on local SQLite simulate concurrent sessions with file-level locking.
2. **Production Deployment**:
   - Production architecture is designed for PostgreSQL with connection pooling (PgBouncer) and horizontal FastAPI container scaling on Kubernetes or Google Cloud Run. Production pilots are dimensioned for 500 concurrent examinees per standard cluster node.

## 5. Offline & Network Recovery

1. **Offline Window**:
   - Answer caching uses browser `localStorage`. If connection is severed, candidates may continue answering questions locally for up to 10 minutes.
   - Full exam completion and official score recording requires network restoration prior to the server-authoritative expiration time. Client clocks cannot override server deadlines.

## 6. Pilot-Only Features & Future Integrations

1. **Biometric & Remote Proctoring**:
   - Candidate identity verification relies on standard authentication, organization roster assignment, and audit logs. Webcam/AI-based eye-tracking proctoring is intentionally excluded to avoid penalizing visually impaired candidates who cannot maintain centered ocular gaze.
2. **External LMS Integration (LTI 1.3)**:
   - Planned for future release roadmap; current version uses REST API and CSV candidate rosters.

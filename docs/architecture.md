# GoWow Platform Architecture Specification

## 1. System Overview

GoWow is an accessibility-first digital examination and preparation platform designed to empower visually impaired, blind, and low-vision candidates to independently prepare, practice, and complete digital examinations.

The platform deliberately adheres to a simple, resilient, and maintainable 3-tier architecture:

```
┌────────────────────────────────────────────────────────┐
│             Candidate / Examiner / Admin               │
│         (Screen Reader, Keyboard, Zoom, Braille)       │
└───────────────────────────┬────────────────────────────┘
                            │ HTTPS / TLS 1.3
                            ▼
┌────────────────────────────────────────────────────────┐
│             Frontend Presentation Layer                │
│             React 18 + TypeScript + Vite               │
│        (WCAG 2.1 AA, POUR Framework, WAI-ARIA)         │
└───────────────────────────┬────────────────────────────┘
                            │ REST / JSON (HTTPS)
                            │ X-Request-ID Correlation
                            ▼
┌────────────────────────────────────────────────────────┐
│               Backend Application Layer                │
│                 FastAPI (Python 3.11)                  │
│       - Security Middleware (HSTS, CSP, nosniff)       │
│       - Accessibility-Aware Rate Limiting              │
│       - Server-Authoritative Timer Engine              │
│       - Idempotent Submission Processor                │
└───────────────────────────┬────────────────────────────┘
                            │ SQLAlchemy 2.0 (ORM)
                            │ Parameterized Queries / SSL
                            ▼
┌────────────────────────────────────────────────────────┐
│               Persistent Storage Layer                 │
│               PostgreSQL 15 (Relational)               │
│       - Least Privilege User Separation                │
│       - Strict Foreign Keys & Indexes                  │
│       - Automated Backup & Checksum Verification       │
└────────────────────────────────────────────────────────┘
```

---

## 2. Core Architectural Principles

1. **Simplicity Over Microservices:**
   A unified monolithic FastAPI backend and single PostgreSQL cluster eliminate distributed failure modes, network partitioning latency, and complex consensus issues during high-stakes exams.
2. **Server-Authoritative State:**
   The browser is treated as an untrusted rendering terminal. Exam timers (`server_started_at`, `server_expires_at`), marking schemes, answer evaluation, and eligibility are strictly enforced by the backend.
3. **Accessibility as a First-Class Invariant:**
   Rate limits, session recovery, DOM structures, and error states are engineered to never penalize screen-reader users, slow keyboard typing, or repeated text-to-speech audio requests.
4. **Idempotent & Transaction-Safe Operations:**
   Submitting an exam or saving an answer operates under ACID transactions with optimistic locking (`version` counters) to prevent lost updates or double submissions.

---

## 3. Component Breakdown

| Layer | Technology | Responsibilities |
| :--- | :--- | :--- |
| **Client** | React 18, TypeScript, Tailwind CSS, Vite | Accessible UI components, keyboard navigation management (`useKeyboardNavigation`), live region announcements (`aria-live`), offline local response buffering. |
| **API Gateway** | FastAPI, Uvicorn, Starlette | Request validation (Pydantic v2), security headers, structured access logging, token bucket rate limiting, JWT issuance and verification. |
| **Services** | Python 3.11 Modules | Exam session lifecycle, recommendation engine, accessibility quality audits (`accessibility_audit_service.py`), answer evaluation. |
| **Database** | PostgreSQL 15 | Persistent storage with Alembic migrations, foreign keys with cascade constraints, query-specific indexes, and daily automated encrypted backups. |

---

## 4. Network Topology & Security Boundaries

- **Public Internet:** Only ports 80/443 reach the frontend web server (Nginx reverse proxy).
- **Application Network:** Backend API listens on port 8000 internally; TLS is terminated at the ingress or reverse proxy.
- **Database Isolation:** PostgreSQL port 5432 is strictly bound to an isolated internal Docker bridge network (`gowow_internal_net`) with no public routing or port exposure.

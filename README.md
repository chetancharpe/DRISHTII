# GoWow — Accessible Examination & Practice Learning Platform

[![Accessibility: WCAG 2.1 AA](https://img.shields.io/badge/Accessibility-WCAG%202.1%20AA-blue.svg)](docs/accessibility.md)
[![License: MIT](https://img.shields.io/badge/License-MIT-green.svg)](LICENSE)
[![Python: 3.11+](https://img.shields.io/badge/Python-3.11%2B-blue.svg)](backend/)
[![Node: 20+](https://img.shields.io/badge/Node-20%2B-brightgreen.svg)](client/)

> **"Enable visually impaired and low-vision candidates to independently learn, practice, and participate in digital examinations."**  
> *GoWow is designed and tested against WCAG 2.1 AA requirements.*

---

## 1. Project Overview

**GoWow** is an accessibility-first digital examination, preparation, and pedagogical evaluation platform engineered specifically for blind, low-vision, and keyboard-reliant test-takers. It provides complete candidate autonomy—from onboarding and personalized accessibility calibration to timed mock examinations, offline connection recovery, live competitive exam completion, and detailed diagnostic scorecards.

---

## 2. Production Architecture

GoWow enforces a reliable, maintainable 3-tier architecture with zero unnecessary microservices:

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

## 3. Technology Stack

- **Frontend:** React 18, TypeScript, Tailwind CSS, Vite, Lucide Icons
- **Backend:** FastAPI (Python 3.11), Uvicorn, Pydantic v2, Python-Jose (JWT), Passlib (Bcrypt)
- **Database:** PostgreSQL 15 (Relational persistence), SQLAlchemy 2.0 ORM, Alembic (Migrations)
- **Quality & Accessibility:** Axe-Core, Playwright (`@axe-core/playwright`), Vitest, Pytest
- **Containers & Orchestration:** Docker, Multi-Stage Dockerfiles, Docker Compose

---

## 4. Key Platform Features

### Candidate Experience
- **Accessibility Onboarding & Calibration:** Step-by-step sensory onboarding; font scaling up to 200%, high-contrast AAA mode (7:1), theme cycles, and speech rate adjustments (`Alt+A`).
- **Keyboard Map & Help Center:** Instant access to shortcut references (`Alt+H`) for screen readers and keyboard navigation.
- **Learning & Practice:** Self-paced pedagogical modules with spoken formula transcripts and keyboard-operable choices.
- **Live Examination Engine:** Server-authoritative timer with audible warnings (15m, 5m, 1m), auto-saving answer synchronization, offline recovery caching, and confirmation modals protecting against accidental submission (`Alt+S`).
- **Diagnostic Results:** Accessible score breakdowns with tabular summaries, non-color status indicators, and subject analytics.

### Examiner Studio
- **Accessible Question Authoring:** Question creator with automated quality engine validating image alternative text, table headers, and mathematical speech transcripts before publishing.
- **Candidate Scheduling & Management:** Candidate roster assignment, accommodations configuration (1.5x, 2.0x extra time), and exam scheduling.
- **Real-Time Monitoring:** Real-time candidate progress monitoring with sortable accessible tables.

### Administrator Console
- **User & Role Management:** Strict RBAC management with audit trails.
- **System Health & Audit Logs:** Chronological compliance tracking and readiness checks.

---

## 5. Accessibility Invariants & POUR Conformance

- **Perceivable:** All visual diagrams require alternative text; complex charts require long descriptions. Standard contrast ratio $\ge 4.5:1$; High-contrast mode $\ge 7:1$.
- **Operable:** 100% of candidate journeys operable without a mouse. Skip link (`.skip-link`) jumps directly to `#main-content`. Modals trap focus and close via `Escape`.
- **Understandable:** Consistent landmarks, predictable navigation, and non-color dependent status indicators (Passed ✓ / Needs Review ✕).
- **Robust:** Complies with WAI-ARIA Authoring Practices 1.2; audited with NVDA, JAWS, and VoiceOver.

### Global Keyboard Shortcuts
- `Alt + H`: Accessibility Help & Shortcuts Guide
- `Alt + A`: Accessibility Calibration Center (Display, Contrast, Audio)
- `Alt + N`: Next Question (Auto-saves current response)
- `Alt + P`: Previous Question
- `Alt + M`: Mark / Unmark Question for Review
- `Alt + C`: Clear Selected Answer
- `Alt + L`: Read Question Aloud via Text-to-Speech
- `Alt + S`: Submit Examination Confirmation Dialog

---

## 6. Quick Start & Local Setup

### Option A: Using Docker Compose (Recommended)
```bash
# Clone the repository
git clone https://github.com/gowow/gowow-platform.git
cd gowow-platform

# Start development stack (PostgreSQL + FastAPI Backend + React Client)
docker compose up -d

# Seed isolated demo data
docker compose exec backend python scripts/seed_demo_data.py
```
Access the application:
- Frontend: `http://localhost:5173`
- Backend API Docs: `http://localhost:8000/api/v1/docs`
- Health Endpoint: `http://localhost:8000/health/ready`

### Option B: Native Local Setup

#### 1. Backend Setup (FastAPI)
```bash
cd backend
python -m venv venv
# Windows:
.\venv\Scripts\activate
# Linux/macOS:
source venv/bin/activate

pip install -r requirements.txt
cp .env.development.example .env

# Run database migrations
alembic upgrade head

# Seed demo data
python scripts/seed_demo_data.py

# Start API server
uvicorn app.main:app --reload --port 8000
```

#### 2. Frontend Setup (React + Vite)
```bash
cd client
npm install
cp .env.development.example .env.local
npm run dev
```

---

## 7. Environment Configuration

GoWow separates configuration cleanly across deployment environments:

- `.env.development.example`: Local development defaults (SQLite or local PostgreSQL).
- `.env.test.example`: Automated testing configuration with relaxed rate limiting.
- `.env.production.example`: Hardened production template (enforced strong keys, restricted CORS, SSL database connection).

*Never commit `.env` files with real credentials to version control.*

---

## 8. Automated Testing Suite

```bash
# Frontend Lint & Strict Type Check
cd client && npm run lint

# Client Production Bundle Build
cd client && npm run build

# Automated Axe-Core & WCAG 2.1 AA Tests (Playwright)
npx playwright test tests/accessibility/

# High Contrast Mode Emulation Test
npx playwright test tests/accessibility/ --project=high-contrast-mode

# Backend Pytest Suite
cd backend && python -m pytest -v
```

---

## 9. Production Deployment & Security

- **Containerization:** Multi-stage `backend/Dockerfile` runs as unprivileged `appuser`. `client/Dockerfile` serves static bundles via optimized Nginx with gzip and security headers.
- **Security Headers:** Strict CSP, HSTS, X-Content-Type-Options: nosniff, X-Frame-Options: DENY, Referrer-Policy.
- **Rate Limiting:** Protects `/login`, `/register`, `/forgot-password`, and exam submissions without throttling accessibility audio streams.
- **Authoritative Timing:** Server computes and enforces `server_started_at` and `server_expires_at`. Client clock tampering has no effect.
- **Full Deployment Guide:** See [docs/deployment.md](docs/deployment.md).

---

## 10. Database Backups & Recovery

- **Automated Backup:**
  ```bash
  python backend/scripts/backup.py
  ```
  Generates gzip-compressed archives with companion `.sha256` checksums and prunes archives older than 30 days.
- **Restoration & Verification Drill:**
  ```bash
  python backend/scripts/restore.py backend/backups/<backup_file>.sql.gz
  ```
- **Disaster Recovery Playbook:** See [docs/incident-response.md](docs/incident-response.md).

---

## 11. Documentation Directory

- [Architecture Specification](docs/architecture.md)
- [Accessibility & WCAG Standards](docs/accessibility.md)
- [Security & Threat Defense Guide](docs/security.md)
- [Production Deployment Playbook](docs/deployment.md)
- [Database Schema & Migrations](docs/database.md)
- [Comprehensive Testing Strategy](docs/testing.md)
- [Incident Response & SRE Playbook](docs/incident-response.md)
- [Operational Troubleshooting Guide](docs/troubleshooting.md)
- [Contributor Guide](CONTRIBUTING.md)

---

## 12. License
This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

# DRISHTI — Accessible Examination & Practice Learning Platform

[![Accessibility: WCAG 2.1 AA](https://img.shields.io/badge/Accessibility-WCAG%202.1%20AA-blue.svg)](docs/accessibility.md)
[![License: MIT](https://img.shields.io/badge/License-MIT-green.svg)](LICENSE)
[![Python: 3.11+](https://img.shields.io/badge/Python-3.11%2B-blue.svg)](backend/)
[![Node: 20+](https://img.shields.io/badge/Node-20%2B-brightgreen.svg)](client/)

> **"Enable visually impaired and low-vision candidates to independently learn, practice, and participate in digital examinations."**  
> *DRISHTI is designed and tested against WCAG 2.1 AA requirements.*

---

## 1. Project Overview

**DRISHTI** is an accessibility-first digital examination, preparation, and pedagogical evaluation platform engineered specifically for blind, low-vision, and keyboard-reliant test-takers. It provides complete candidate autonomy—from onboarding and personalized accessibility calibration to timed mock examinations, offline connection recovery, live competitive exam completion, and detailed diagnostic scorecards.

---

## 2. Production Architecture

DRISHTI enforces a reliable, maintainable 3-tier architecture with zero unnecessary microservices:

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

### Accessible Landing Page & Role Portals
- **Public Showcase & Discovery:** Comprehensive landing page detailing platform capabilities, POUR accessibility pillars, live feature demos, and role-specific journeys.
- **Dedicated Portals:** Direct entry points for Candidates, Examiners, and Administrators with role selection modals and single-click access.

### Candidate Experience
- **Multilingual Support (English & हिन्दी):** Complete bilingual support across 184 translation keys and 9 namespaces with dynamic `<html lang="...">` and `<html dir="...">` switching.
- **Language-Aware Speech Synthesis:** Native voice discovery matching Hindi (`hi-IN`) and English (`en-US`/`en-IN`) with pitch/rate controls and interactive sample testing (`Alt+A`).
- **Blind-First Learning & Practice:** Pedagogical audio player with playback speed controls, KaTeX mathematical equations with spoken text representations, accessible data tables with cell coordinates, and voice command navigation.
- **Live Server-Authoritative Exam Engine:** Centralized countdown timer with audible alerts, auto-saving answer synchronization, resilient offline recovery queue, and confirmation modals protecting against accidental submission (`Alt+S`).
- **Accessible Design System:** Strict 44×44px minimum touch targets across all controls (WCAG 2.5.5 / 2.5.8), global 3px focus ring with high-contrast cyan `#00ffff` indicators, and AAA OLED high-contrast mode (21:1 contrast).

### Examiner Studio
- **Accessible Question Authoring & AI Alt-Text Gate:** Interactive question creator with automated quality engine validating image alternative text, table headers, and spoken mathematical transcripts before publishing.
- **Candidate Roster CSV Bulk Import:** Fast bulk provisioning of candidate accounts with automated password hashing and accommodation multipliers (1.0x, 1.5x, 2.0x extra time).
- **Psychometric Item Analytics:** Real-time item difficulty index ($p$), discrimination index ($D$), test reliability (Cronbach's $\alpha$), item-total correlation ($r_{pbis}$), distractor choice distribution, and accommodation equity analytics.
- **Streaming Report Export:** Immediate, accessible CSV candidate performance downloads.

### Administrator Console
- **Strict Role-Based Access Control:** Secure account provisioning guarded against role escalation.
- **System Health & Audit Logs:** Live telemetry, readiness health probes (`/health/ready`), and chronological audit logs.

---

## 5. Accessibility Invariants & POUR Conformance

- **Perceivable:**
  - All visual diagrams require alternative text; complex charts require long descriptions.
  - Standard contrast ratio $\ge 4.5:1$; High-contrast mode $\ge 21:1$ (pure OLED black `#000000`, white `#ffffff`, neon yellow `#ffff00`).
  - Text scales seamlessly up to 200% zoom without truncation or horizontal scrolling.
- **Operable:**
  - 100% of candidate journeys operable without a mouse.
  - Interactive targets satisfy 44×44px minimum sizing per WCAG 2.5.5 and 2.5.8.
  - Skip link (`.skip-link`) jumps directly to `#main-content`.
  - Accessible modals trap focus with `aria-modal="true"` and restore focus on `Escape`.
- **Understandable:**
  - Consistent semantic landmarks (`header`, `nav`, `main`, `footer`).
  - Dual-modality status indicators pairing dedicated icons with text (never color alone).
- **Robust:**
  - Complies with WAI-ARIA Authoring Practices 1.2; audited with NVDA, JAWS, and VoiceOver.
  - Automated `@axe-core/playwright` audits integrated directly into CI.

### Global Keyboard Shortcuts
- `Alt + H`: Accessibility Help & Shortcuts Guide
- `Alt + A`: Accessibility Calibration Center (Display, Contrast, Audio, Voice)
- `Alt + N`: Next Question (Auto-saves current response)
- `Alt + P`: Previous Question
- `Alt + M`: Mark / Unmark Question for Review
- `Alt + C`: Clear Selected Answer
- `Alt + L`: Read Question Aloud via Text-to-Speech
- `Alt + S`: Submit Examination Confirmation Dialog
- `1, 2, 3, 4`: Select Multiple Choice Options A, B, C, D

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
# 1. Frontend Lint & Strict Type Check
cd client && npm run lint

# 2. Multilingual i18n Parity Check (184 keys, 100% 1:1 EN/HI)
cd client && npm run test:i18n

# 3. Client Production Bundle Build
cd client && npm run build

# 4. Automated Axe-Core & WCAG 2.1 AA Tests (Playwright)
npx playwright test tests/accessibility/

# High Contrast Mode Emulation Test
npx playwright test tests/accessibility/ --project=high-contrast-mode

# 5. Full Backend & End-to-End Test Suite (run from project root)
pytest tests/ -v
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

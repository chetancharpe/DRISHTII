# DRISHTI — Accessible Examination & Practice Learning Platform

[![Accessibility: WCAG 2.1 AA](https://img.shields.io/badge/Accessibility-WCAG%202.1%20AA-blue.svg)](docs/accessibility.md)
[![License: MIT](https://img.shields.io/badge/License-MIT-green.svg)](LICENSE)
[![Python: 3.11+](https://img.shields.io/badge/Python-3.11%2B-blue.svg)](backend/)
[![Node: 20+](https://img.shields.io/badge/Node-20%2B-brightgreen.svg)](client/)
[![FastAPI](https://img.shields.io/badge/FastAPI-0.115%2B-teal.svg)](https://fastapi.tiangolo.com)
[![React 18](https://img.shields.io/badge/React-18.3-61dafb.svg)](https://react.dev)

> **"Empowering visually impaired, low-vision, and keyboard-reliant candidates to independently learn, practice, and take digital examinations with complete autonomy and dignity."**  
> *DRISHTI is rigorously engineered and audited against WCAG 2.1 AA requirements and the POUR accessibility framework.*

---

## 1. Project Overview

**DRISHTI** is an accessibility-first digital examination, preparation, and pedagogical evaluation platform engineered specifically for blind, visually impaired (PwD), and keyboard-only test-takers. It provides complete candidate independence:
- **Autonomous Onboarding:** Personalized sensory calibration (high contrast, typography, speech rates, audio earcons).
- **दृष्टि सारथी (Drishti Sarthi) AI Tutor:** Empathetic voice-guided conversational companion operating in natural Hindi & English.
- **Examiner Studio:** Silent, desktop-first portal for teachers to create questions, upload mock tests, and issue unique candidate access passes.
- **Official Live Exam Mode:** Server-authoritative timer, offline network recovery queue, and strict anti-cheat AI Scribe mode.

---

## 2. Production Architecture & Panel Separation

DRISHTI follows a clear architectural separation across roles to maximize efficiency and preserve exam integrity:

```
┌────────────────────────────────────────────────────────────────────────┐
│                          DRISHTI PLATFORM                              │
└───────────────────────────────────┬────────────────────────────────────┘
                                    │
         ┌──────────────────────────┼──────────────────────────┐
         ▼                          ▼                          ▼
┌──────────────────┐       ┌──────────────────┐       ┌──────────────────┐
│  Candidate Panel │       │ Examiner Studio  │       │  Admin Console   │
│  (/candidate/*)  │       │  (/examiner/*)   │       │   (/admin/*)     │
├──────────────────┤       ├──────────────────┤       ├──────────────────┤
│ • Voice In / Out │       │ • Silent Desktop │       │ • System Health  │
│ • Drishti Sarthi │       │ • Exam Authoring │       │ • User Mgmt      │
│ • Hands-free Mic │       │ • Mock Uploads   │       │ • Audit Logs     │
│ • Screen-Reader  │       │ • Candidate Pass │       │ • Access Control │
│ • High-Contrast  │       │ • Psychometrics  │       │ • Telemetry      │
└──────────────────┘       └──────────────────┘       └──────────────────┘
```

### Role Invariants
1. **Candidate Panel (`/candidate/*`):** Dedicated AI Tutor ("दृष्टि सारथी") active with natural voice interaction, earcons, audio briefings, and keyboard shortcuts.
2. **Examiner & Admin Panels (`/examiner/*`, `/admin/*`):** Strictly silent, desktop-optimized interfaces without voice commands or AI tutor popups to ensure high teacher productivity.

---

## 3. Technology Stack

- **Frontend:** React 18, TypeScript, Tailwind CSS, Vite, Lucide Icons, KaTeX (Math), Web Speech API.
- **Backend:** FastAPI (Python 3.11+), Uvicorn, Pydantic v2, SQLAlchemy 2.0 ORM, Alembic (Migrations), Passlib (Bcrypt), Python-Jose (JWT).
- **Database:** SQLite (default for zero-dependency local development) / PostgreSQL 15 (production-ready).
- **Quality & Accessibility:** Axe-Core, Playwright (`@axe-core/playwright`), Vitest, Pytest.
- **Containers:** Docker, Docker Compose, Multi-Stage Dockerfiles.

---

## 4. Key Platform Capabilities

### 🎓 दृष्टि सारथी (Drishti Sarthi) — AI Companion & Digital Scribe
- **Login Audio Briefing:** Automatically welcomes the candidate by name in their preferred language (Hindi/English), announces the teacher's newly uploaded exams and mock tests, and asks about their study plan.
- **Hands-Free Conversational Voice Loop:** Web Speech recognition starts immediately after Sarthi finishes speaking, allowing continuous hands-free dialogue.
- **Mode-Aware Intelligence:**
  - *Learning & Practice Mode (`/candidate/learn`, `/candidate/practice`, `/candidate/mock-tests`):* Explains concepts, breaks down questions, provides hints, and suggests study plans as a loyal friend.
  - *Live Exam Mode (`/candidate/exams/:id/session`):* Switches automatically to **Digital Scribe / Reader** mode—reads questions and options aloud upon command, but strictly refuses to leak answers.

### 👩‍🏫 Examiner Studio (Teacher Portal)
- **Exam & Mock Test Authoring:** Create structured multi-section tests with WCAG-compliant image alternative text and mathematical formulas.
- **Candidate Access Pass Generator:** Issue unique 1-click access passes (e.g., `DRISHTI-PASS-8842`) allowing visually impaired students to enter their tailored dashboard without password friction.
- **Item Analytics & Psychometrics:** Discrimination index ($D$), difficulty level ($p$), and distractor distributions.

---

## 5. Localhost Quick Start (Step-by-Step Guide)

Follow these steps to run DRISHTI completely on your local machine (`localhost`).

### Prerequisites
- **Python:** Version 3.11 or higher installed ([python.org](https://www.python.org/downloads/)).
- **Node.js:** Version 18 or 20+ installed ([nodejs.org](https://nodejs.org/)).
- **Git:** Installed and available on your PATH.

---

### Step 1: Backend Setup (FastAPI + SQLite)

Open a terminal (PowerShell on Windows, or Bash on macOS/Linux) and navigate to the project root:

```bash
cd backend
```

#### 1.1 Virtual Environment on Windows & Linux

> [!NOTE]
> DRISHTI includes a pre-installed virtual environment in `backend/venv`. You can immediately run commands using the **Zero-Friction Method** without activation issues.

##### Option 1: Zero-Friction Method (Recommended for Windows PowerShell & CMD)
You do **not** need to activate the virtualenv or change PowerShell execution policies. Run commands directly using `.\venv\Scripts\`:

```powershell
# 1. Run migrations
.\venv\Scripts\alembic.exe upgrade head

# 2. Seed demo data & passes
.\venv\Scripts\python.exe scripts/seed_demo_data.py
.\venv\Scripts\python.exe scripts/seed_passes.py

# 3. Start API server
.\venv\Scripts\python.exe -m uvicorn app.main:app --reload --port 8000
```

##### Option 2: Traditional Virtual Environment Activation

**Windows (PowerShell):**
```powershell
# In PowerShell, always run .ps1 (do NOT use activate.bat in PowerShell):
Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope CurrentUser
.\venv\Scripts\Activate.ps1
```

**Windows (Command Prompt / CMD):**
```cmd
REM In classic Command Prompt only:
.\venv\Scripts\activate.bat
```

**macOS / Linux:**
```bash
source venv/bin/activate
```

> [!WARNING]
> **Encountered `Unable to copy ... venvlauncher.exe to ... python.exe`?**  
> This error happens on Windows if:
> 1. You try to recreate `venv` while a Python process or terminal is still running.
> 2. OneDrive cloud sync has locked `python.exe`.
> 
> **Solution:** You do **not** need to recreate `venv`! The environment in `backend/venv` is already complete. Simply use **Option 1 (Zero-Friction Method)** above. If you ever must recreate it from scratch, terminate any running Python processes first, close VS Code terminals, delete `backend/venv`, and run `python -m venv venv`.

#### 1.2 Install Python Dependencies
```bash
pip install --upgrade pip
pip install -r requirements.txt
```

#### 1.3 Setup Environment Variables
Copy the development environment file:

**Windows (PowerShell):**
```powershell
Copy-Item .env.development.example .env
```

**Windows (CMD):**
```cmd
copy .env.development.example .env
```

**macOS / Linux:**
```bash
cp .env.development.example .env
```

*(By default, `.env` is configured with `DATABASE_URL=sqlite:///./gowow.db` for instant local execution without needing Docker or PostgreSQL).*

#### 1.4 Apply Migrations & Seed Demo Data
```bash
# Apply database schema migrations
alembic upgrade head

# Seed full curriculum, demo users, questions, and mock tests
python scripts/seed_demo_data.py

# Seed candidate access passes (for direct pass code testing)
python scripts/seed_passes.py
```

#### 1.5 Start the Backend API Server
```bash
uvicorn app.main:app --reload --port 8000
```

Verify backend health:
- **API Documentation (Swagger UI):** [http://localhost:8000/api/v1/docs](http://localhost:8000/api/v1/docs)
- **Health Probe:** [http://localhost:8000/health/ready](http://localhost:8000/health/ready)

---

### Step 2: Frontend Setup (React 18 + Vite)

Open a **new terminal tab or window**, navigate to the `client` directory:

```bash
cd client
```

#### 2.1 Install Node Dependencies
```bash
npm install
```

#### 2.2 Setup Client Environment Variables

**Windows (PowerShell):**
```powershell
Copy-Item .env.development.example .env.local
```

**Windows (CMD):**
```cmd
copy .env.development.example .env.local
```

**macOS / Linux:**
```bash
cp .env.development.example .env.local
```

Verify that `client/.env.local` contains:
```env
VITE_API_BASE_URL=http://localhost:8000/api/v1
VITE_ENABLE_ANALYTICS=false
VITE_APP_ENV=development
```

#### 2.3 Start the Vite Development Server
```bash
npm run dev
```

The frontend will start at:
👉 **[http://localhost:5173](http://localhost:5173)**

---

## 6. Pre-Configured Demo Accounts & Roles

The seeded database comes with ready-to-use accounts for all user personas:

| Portal Role | Login Email / Access Code | Password | Portal Entry URL | Description & Key Features |
| :--- | :--- | :--- | :--- | :--- |
| **Candidate** *(Voice-First)* | `candidate1@gowow.org` | `CandidateSecure123!` | `http://localhost:5173/auth/login` | Voice-guided candidate portal with **Drishti Sarthi AI Tutor**, audio briefings, high contrast, and mock exams. |
| **Candidate Quick Pass** | Pass Code: `DRISHTI-PASS-8842` | *(No password required)* | `http://localhost:5173/auth/quick-access` | Direct entry for visually impaired candidates with pre-calibrated accommodations. |
| **Examiner (Teacher)** | `examiner@gowow.org` | `ExaminerSecure123!` | `http://localhost:5173/auth/login` | Silent studio for creating exams, publishing mock tests, assigning passes, and reviewing results. |
| **Administrator** | `admin@gowow.org` | `AdminSecurePass123!` | `http://localhost:5173/auth/login` | Silent console for system telemetry, user management, and security audit logs. |

*(Quick Demo buttons on the Login page allow one-click autofill for each of these accounts).*

---

## 7. Keyboard Shortcuts & Voice Navigation

DRISHTI is 100% operable via keyboard and speech without requiring a mouse:

| Key Combination | Function | Context |
| :--- | :--- | :--- |
| **Spacebar** | Toggle Microphone (Talk to Drishti Sarthi) | Candidate Portal (when not in text input) |
| **Alt + B** | Replay Drishti Sarthi Spoken Audio Briefing & Study Plan | Candidate Dashboard |
| **Alt + S** | Toggle Voice Input / Scribe | Candidate Portal & Exam Session |
| **Alt + T** | Toggle Drishti Sarthi Chat Drawer | Candidate Portal |
| **Alt + A** | Open Accessibility Calibration Center (Sensory, Audio, Contrast) | Candidate Portal |
| **Alt + H** | Open Accessibility Help & Shortcuts Modal | Global |
| **Alt + N** | Next Question (Auto-saves answer) | Live Exam / Mock Test Session |
| **Alt + P** | Previous Question | Live Exam / Mock Test Session |
| **Alt + M** | Mark / Unmark Current Question for Review | Live Exam / Mock Test Session |
| **Alt + C** | Clear Selected Answer | Live Exam / Mock Test Session |
| **1, 2, 3, 4** | Select Multiple Choice Option A, B, C, D | Live Exam / Mock Test Session |
| **Escape** | Stop Sarthi Speaking / Close Modal | Global |

---

## 8. Common Localhost Troubleshooting

### 1. "Fatal error in launcher: Unable to create process using python.exe..." or "Unable to copy ... venvlauncher.exe"
- **Cause:**  
  1. Python virtual environment `.exe` files contain old absolute paths after a folder rename.
  2. Or Windows / OneDrive has locked `python.exe` while another terminal or background process is running.
- **Immediate Zero-Friction Fix (No reinstall needed!):**  
  Do **not** run `python -m venv venv` or `activate.bat`. Run the commands directly with:
  ```powershell
  cd backend
  .\venv\Scripts\python.exe -m uvicorn app.main:app --reload --port 8000
  ```
- **If you truly need to recreate the environment:**
  1. Close any running Python or terminal sessions.
  2. Run in PowerShell:
     ```powershell
     cd backend
     Remove-Item -Recurse -Force venv
     python -m venv venv
     .\venv\Scripts\Activate.ps1
     pip install -r requirements.txt
     ```

### 2. Port Already in Use (`8000` or `5173`)
- **Fix for Port 8000 (Backend):**
  ```powershell
  # Windows PowerShell: Find and terminate process on port 8000
  Get-NetTCPConnection -LocalPort 8000 -ErrorAction SilentlyContinue | ForEach-Object { Stop-Process -Id $_.OwningProcess -Force }
  ```
- **Fix for Port 5173 (Frontend):**
  ```powershell
  Get-NetTCPConnection -LocalPort 5173 -ErrorAction SilentlyContinue | ForEach-Object { Stop-Process -Id $_.OwningProcess -Force }
  ```

### 3. Browser Speech Synthesis Autoplay Throttling
- **Cause:** Chromium-based browsers (Chrome, Edge, Brave) restrict unprompted audio autoplay until the user interacts with the page (click or keypress).
- **Fix:** DRISHTI includes an automatic audio unlock listener. Simply click anywhere, press the **Spacebar**, or press **`Alt + B`** to trigger speech immediately.

### 4. Switching to PostgreSQL (Optional Docker Setup)
If you prefer running with PostgreSQL instead of SQLite:
```bash
# Start PostgreSQL via Docker Compose
docker compose up -d db

# Update backend/.env:
# DATABASE_URL=postgresql://gowow_dev_user:gowow_dev_pass@localhost:5432/gowow_dev_db

alembic upgrade head
python scripts/seed_demo_data.py
```

---

## 9. Automated Testing Suite

```bash
# 1. Frontend Typecheck and Production Build
cd client
npm run build

# 2. Frontend Lint
npm run lint

# 3. Multilingual i18n Key Parity Check
npm run test:i18n

# 4. Automated Axe-Core & WCAG 2.1 AA Tests (Playwright)
npx playwright test tests/accessibility/

# 5. Full Backend Unit & Integration Tests (from project root)
pytest tests/ -v
```

---

## 10. Documentation Directory

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

## 11. License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

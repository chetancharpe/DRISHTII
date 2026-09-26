# GoWow — Accessible Examination & Practice Learning Platform

> **"This project is designed as an accessibility-first examination and practice platform for visually impaired and low-vision candidates."**

---

## 1. Project Purpose
**GoWow** is an examination, mock testing, and interactive pedagogical learning ecosystem built from the ground up for visually impaired and low-vision candidates. It guarantees end-to-end independence—from registration and accessibility calibration to practice testing, live competitive exam completion, and in-depth weak area diagnostics.

Accessibility is the foundational core of the product architecture, not an auxiliary afterthought or cosmetic layer.

---

## 2. Problem Being Solved
Conventional digital examination platforms, testing portals, and school assessment portals are overwhelmingly visual-centric. They present insurmountable barriers:
- Inaccessible visual graphs, complex mathematical formulas, and data tables that break screen-reader linear reading order.
- Time-gated assessments without auditory sonification or clear countdown alerts.
- Mouse-dependent UI components (modals, dropdowns, drag-and-drop questions) that trap or ignore keyboard navigation.
- Inflexible contrast and typography that cause severe eye strain or render content unreadable for low-vision test takers.

GoWow solves these systemic barriers with a deterministic, keyboard-first, screen-reader optimized, and auditory-enhanced examination environment.

---

## 3. Target Users
1. **Blind & Screen-Reader Reliant Candidates**: Navigate through standard assistive technology (NVDA, JAWS, VoiceOver, Orca) using standard HTML5 landmarks, explicit ARIA live regions, and structured keyboard commands.
2. **Low-Vision Candidates**: Require dynamic text scaling up to 200%, specialized high-contrast color themes (including pure black OLED and mellow cream), and prominent focus indicators.
3. **Keyboard-Only Users**: Candidates with motor impairments or those who operate without pointing devices.
4. **Examiners & Test Authors**: Create, verify, and monitor examination questions with accessible descriptions, math formulas, and empirical psychometric telemetry.
5. **System Administrators**: Manage institutional candidates, organizations, and compliance auditing.

---

## 4. Technology Stack
- **Framework**: React 18 / modern TypeScript
- **Build Tool**: Vite
- **Styling**: Tailwind CSS & Vanilla CSS design token system
- **Routing**: React Router v6
- **Iconography**: Lucide React
- **Assistive APIs**: Web Speech Synthesis API, Web Audio API foundation, ARIA Live Regions

---

## 5. Folder Architecture
The repository follows a clean, decoupled monorepo architecture:

```text
GoWow-Accessible-Exam-Platform/
│
├── client/                              # Modern React + TypeScript + Vite SPA
│   ├── public/assets/                   # Static images, icons, and webfonts
│   └── src/
│       ├── assets/                      # Bundled media and SVG illustrations
│       ├── components/                  # Layered component hierarchy
│       │   ├── common/                  # Atomic primitives (Button, Input, Card, Modal, Loader, Tooltip)
│       │   ├── layout/                  # Shell layout (Navbar, Sidebar, Footer, PageLayout)
│       │   ├── accessibility/           # Contrast, Font scale, Speech & Reader panels
│       │   ├── exam/                    # Test-runner widgets (QuestionCard, Palette, Timer)
│       │   ├── dashboard/               # Metric cards, Progress charts, Weak area cards
│       │   └── examiner/                # Test & question authoring forms, Candidate tables
│       ├── pages/                       # Route views grouped by role & lifecycle
│       │   ├── public/                  # Public landing, About, Features, Accessibility info
│       │   ├── auth/                    # Login, Signup, Forgot password, A11y setup
│       │   ├── candidate/               # Dashboard, Practice, Mock tests, Live exam, Results
│       │   ├── examiner/                # Studio dashboard, Create exam, Question bank, Analytics
│       │   └── admin/                   # Admin dashboard, Users, Organizations, Settings
│       ├── routes/                      # Route config, ProtectedRoute & RoleRoute guards
│       ├── contexts/                    # Global state (Auth, Accessibility, Theme)
│       ├── hooks/                       # Custom hooks (useAuth, useAccessibility, useSpeech, etc.)
│       ├── services/                    # API client layer ready for FastAPI backend
│       ├── store/                       # Client state management directory
│       ├── types/                       # Reusable TypeScript interfaces (User, Exam, Question, etc.)
│       ├── utils/                       # Mock data generators and storage helpers
│       ├── styles/                      # Tokenized CSS (accessibility.css, themes.css, globals.css)
│       ├── App.tsx                      # Root application wrapper with context providers
│       └── main.tsx                     # React DOM entry point
│
├── server/                              # Future Backend services (.gitkeep placeholder)
├── shared/                              # Shared types, constants, and validation schemas
├── docs/                                # Project documentation (UI/UX, A11Y, API, Architecture)
├── .gitignore
├── README.md
└── LICENSE
```

---

## 6. Development Phases
1. **Phase 1 (Current)**: Frontend Architecture, Design Tokens, Routing Foundation, Contexts, Hooks, Placeholder Pages & Common Accessible Components.
2. **Phase 2**: Candidate Practice Portal, Accessibility Calibration & Audio Sonification Engine.
3. **Phase 3**: Live Examination Interface, Server-Authoritative Secure Timer & Keyboard Navigation.
4. **Phase 4**: Weak Area Diagnostic Engine, Remediation Tutor & Detailed Results Analytics.
5. **Phase 5**: Examiner & Authoring Studio with Automated Accessibility Health Verification.
6. **Phase 6**: Enterprise FastAPI Backend, PostgreSQL Integration & Certified WCAG 2.2 AAA Audit.

---

## 7. Accessibility-First Philosophy
* **Zero Disabling of Focus**: Focus rings are mandatory, distinct, and visible in all themes.
* **Semantic Native HTML**: Buttons are `<button>`, links are `<a>`, labels are `<label for="...">`.
* **Reduced Motion Guarantee**: `prefers-reduced-motion: reduce` unconditionally silences non-essential animations.
* **No Color-Only Information**: Status indicators always combine shape, text, and audible sonification.
* **User-Controlled Speech**: Speech synthesis is non-intrusive and never speaks without explicit user intent.
* **Local Persistence**: Candidate visual contrast, font scale, and language selections persist across reloads.

---

## 8. How to Run the Frontend Locally

### Prerequisites
- Node.js (v18+ or higher, v25 supported)
- npm (v9+ or higher)

### Setup & Launch
```bash
# 1. Navigate to the client directory
cd client

# 2. Install dependencies
npm install

# 3. Start local development server
npm run dev
```

The application will be live at `http://localhost:5173`.

Alternatively, from the project root:
```bash
npm run dev
```

---

## 9. Future Backend Integration
All API operations are decoupled into `client/src/services/`:
- `api.ts`: Base HTTP client with authorization interceptors and timeout guards.
- `authService.ts`: Maps to FastAPI OAuth2 / JWT authentication endpoints.
- `examService.ts`: Maps to test suite loading, question fetching, and session submission.
- `analyticsService.ts`: Delivers candidate weak topic analysis and test attempt scoring.

Transitioning from Phase 1 mock providers to the real backend simply requires pointing `VITE_API_BASE_URL` in `.env` to the FastAPI gateway.

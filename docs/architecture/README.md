# System Architecture & Directory Purpose — GoWow

## Frontend Layer Architecture
The frontend is constructed using a decoupled, modular design in `client/src`:

| Directory | Purpose |
| :--- | :--- |
| `components/common` | Minimal, high-reusability foundational UI elements (Button, Input, Card, Modal, Loader, Tooltip). |
| `components/layout` | Global shell containers, Navigation bar, Sidebar, and Semantic Page Layout wrappers. |
| `components/accessibility` | Dedicated accessibility controls (Font scaling, Contrast modes, Theme toggles, Screen-reader & Audio feedback adjustments). |
| `components/exam` | Examination test-runner UI (Question cards, Palettes, Timers, Navigation grids, and Submission dialogs). |
| `components/dashboard` | Candidate and Examiner analytical metric widgets, Progress charts, and Topic performance cards. |
| `components/examiner` | Test authoring forms, Question item authoring tools, and candidate telemetry tables. |
| `pages/` | Clean route views for Public, Authentication, Candidate, Examiner, and Admin workflows. |
| `routes/` | Declarative React Router setup with Role-based and Authentication protection guards. |
| `contexts/` | Global state for Authentication, Accessibility Preferences, and Theme Switching with local persistence. |
| `hooks/` | Custom ergonomic React hooks (`useAuth`, `useAccessibility`, `useKeyboardNavigation`, `useSpeech`). |
| `services/` | Structured API layer ready for clean FastAPI/REST backend integration. |
| `types/` | Strongly-typed TypeScript interfaces across domain entities (User, Exam, Question, Analytics). |
| `styles/` | CSS token system, High-contrast palettes, and WCAG focus/spacing utilities. |
| `utils/` | Mock data generators and persistent browser storage helpers. |

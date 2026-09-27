# GoWow Comprehensive Testing Strategy & Quality Gates

## 1. Testing Pyramid Overview

GoWow enforces quality through four distinct verification layers:

```
                  ┌────────────────────────┐
                  │   Real User Usability  │
                  │   Testing & Feedback   │
                  └───────────┬────────────┘
                              │
                  ┌───────────▼────────────┐
                  │ Manual Assistive Tech  │
                  │ (NVDA, JAWS, VoiceOver)│
                  └───────────┬────────────┘
                              │
                  ┌───────────▼────────────┐
                  │ Automated Axe-Core &   │
                  │ Playwright A11y Suite  │
                  └───────────┬────────────┘
                              │
                  ┌───────────▼────────────┐
                  │ Unit, Integration &    │
                  │ Static Type Checking   │
                  └────────────────────────┘
```

---

## 2. Test Execution Commands

### A. Frontend Verification
```bash
cd client

# TypeScript Strict Type Checking
npm run lint

# Production Bundle Build Verification
npm run build
```

### B. Automated Accessibility Tests (Playwright + Axe-Core)
```bash
# Execute complete WCAG 2.1 AA test matrix across all 6 spec categories
npx playwright test tests/accessibility/

# Run against high-contrast mode emulation
npx playwright test tests/accessibility/ --project=high-contrast-mode

# Run against 200% scaled viewport
npx playwright test tests/accessibility/ --project=zoomed-viewport
```

### C. Backend Unit & API Route Tests
```bash
cd backend

# Execute pytest suite with coverage
python -m pytest -v --cov=app

# Verify Alembic migration schema synchronization
alembic check
```

---

## 3. Automated Accessibility Test Suites (`tests/accessibility/`)

| Test Specification | Scope & Focus | WCAG Criteria Validated |
| :--- | :--- | :--- |
| `landing.accessibility.spec.ts` | Skip link, single H1, semantic landmarks, button accessible names | 1.1.1, 1.3.1, 2.4.1, 2.4.2, 4.1.2 |
| `auth.accessibility.spec.ts` | Form input labels, `aria-required`, non-color error alerts, onboarding wizard | 1.3.1, 1.4.1, 2.1.1, 3.3.1, 3.3.2 |
| `candidate.accessibility.spec.ts` | Card accessibility, TTS audio controls, non-color badges, chart text alternatives | 1.1.1, 1.3.1, 1.4.1, 1.4.4, 2.1.1 |
| `exam.accessibility.spec.ts` | Radio groups, live timer updates, exam keyboard hotkeys, submit modal focus trap | 1.3.1, 2.1.1, 2.1.2, 2.2.1, 4.1.3 |
| `examiner.accessibility.spec.ts` | Table headers (`<th scope="col">`), sort state announcements, question validation gate | 1.1.1, 1.3.1, 2.1.1, 3.3.2, 4.1.2 |
| `admin.accessibility.spec.ts` | User management data tables, contextual action labels, audit log readability | 1.3.1, 2.1.1, 2.4.6, 3.3.2, 4.1.2 |

---

## 4. Manual Screen Reader Verification Protocol

1. **NVDA on Windows:**
   - Verify Landmark jumping (`D`) moves between Header, Navigation, Main, and Footer.
   - Verify Heading navigation (`H`) follows H1 $\rightarrow$ H2 $\rightarrow$ H3 without gaps.
   - Verify Question options announce position ("Option 1 of 4") and checked state.
2. **JAWS on Windows:**
   - Confirm table headers are read with cell coordinates in Examiner candidate management.
   - Verify `Escape` key dismisses modals and restores focus to triggering control.
3. **VoiceOver on macOS:**
   - Test rotor navigation for Headings and Form Controls.
   - Verify audio speech rate controls are accessible and sliders announce percentage values.

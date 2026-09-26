# GoWow Design System & Accessibility Engineering Specification

> **Mission**: "This project is designed as an accessibility-first examination and practice platform for visually impaired and low-vision candidates."
> **Core Principle**: "Accessibility should improve usability for everyone."

---

## 1. Design Tokens & Color System

All colors are tokenized via CSS Custom Properties in `client/src/styles/themes.css` and mapped in `client/tailwind.config.js`.

### 1.1 Semantic Color Tokens

| Token | Light Theme | Dark Theme (Default) | High Contrast (AAA OLED) | Purpose |
|---|---|---|---|---|
| `--color-bg` | `#f8fafc` | `#0b0f19` | `#000000` | Application canvas |
| `--color-surface` | `#ffffff` | `#141e2e` | `#0a0a0a` | Cards, input fields, containers |
| `--color-surface-elevated` | `#f1f5f9` | `#1e2c42` | `#141414` | Dialogs, elevated panels, hover |
| `--color-text-primary` | `#0f172a` (18.5:1) | `#f8fafc` (14.8:1) | `#ffffff` (21:1) | Headings, primary labels, questions |
| `--color-text-secondary` | `#334155` (9.5:1) | `#cbd5e1` (9.2:1) | `#ffffff` (21:1) | Subtitles, helper text, explanations |
| `--color-text-muted` | `#475569` (5.9:1) | `#94a3b8` (5.2:1) | `#ffff88` (19:1) | Meta text, timestamps, captions |
| `--color-primary` | `#0369a1` | `#38bdf8` | `#ffff00` | CTAs, active selections, links |
| `--color-primary-hover` | `#075985` | `#7dd3fc` | `#ffffff` | Primary button hover |
| `--color-primary-contrast` | `#ffffff` | `#070d18` | `#000000` | Text/icons inside primary buttons |
| `--color-secondary` | `#e2e8f0` | `#1e2c42` | `#000000` | Secondary button backgrounds |
| `--color-border` | `#cbd5e1` | `#283952` | `#ffffff` (2px) | Element boundaries |
| `--color-border-strong` | `#94a3b8` | `#475f82` | `#ffff00` (2px) | Form borders, card borders |
| `--color-focus` | `#1d4ed8` | `#facc15` | `#00ffff` | Unmistakable 3px keyboard ring |
| `--color-success` | `#15803d` | `#34d399` | `#00ff66` | Completion, correct answer |
| `--color-warning` | `#b45309` | `#fbbf24` | `#ffff00` | Timer alert, review flag |
| `--color-error` | `#b91c1c` | `#f87171` | `#ff3333` | Validation error, critical failure |
| `--color-info` | `#1d4ed8` | `#60a5fa` | `#00e5ff` | Instructions, guidelines |

---

## 2. Typography System

- **Font Stack**: `'Inter', 'Noto Sans Devanagari', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif`
- Full bilingual fidelity supporting English and Hindi (Devanagari scripts) with clear letterforms, generous counters, and optical kerning.

| Token | Class | Size (Desktop) | Weight | Line Height | Purpose |
|---|---|---|---|---|---|
| **Display** | `.text-display` | 40px–44px | 800 (ExtraBold) | 1.15 | Major landing titles |
| **H1** | `.text-h1` | 32px–36px | 700 (Bold) | 1.2 | Page title / Landmark header |
| **H2** | `.text-h2` | 24px–28px | 700 (Bold) | 1.25 | Card / Section title |
| **H3** | `.text-h3` | 20px–22px | 600 (SemiBold) | 1.3 | Subsection / Question header |
| **H4** | `.text-h4` | 18px | 600 (SemiBold) | 1.35 | Component group label |
| **Body Large** | `.text-body-lg` | 18px | 400 (Regular) | 1.6 | Exam question body |
| **Body** | `.text-body` | 16px | 400 (Regular) | 1.6 | Standard interface body |
| **Body Small** | `.text-body-sm` | 14px | 400 (Regular) | 1.5 | Compact lists, table data |
| **Label** | `.text-label` | 14px | 600 (SemiBold) | 1.4 | Form labels, control tags |
| **Caption** | `.text-caption` | 12px | 400 (Regular) | 1.4 | Timestamps, metadata |

### 2.1 Font Scaling Architecture
Sizing is relative to root rem. The user's chosen `data-font-size` adjusts root sizing cleanly:
- `small`: `87.5%` (14px base)
- `normal`: `100%` (16px base)
- `large`: `120%` (19.2px base)
- `extra_large`: `140%` (22.4px base)

---

## 3. Spacing, Radius & Shadows

### Spacing Scale
Consistent 4px based scale:
`--space-1` (4px), `--space-2` (8px), `--space-3` (12px), `--space-4` (16px), `--space-5` (20px), `--space-6` (24px), `--space-8` (32px), `--space-10` (40px), `--space-12` (48px), `--space-16` (64px), `--space-20` (80px).

### Border Radius
- `--radius-sm`: `4px`
- `--radius-md`: `8px`
- `--radius-lg`: `12px`
- `--radius-xl`: `16px`
- `--radius-full`: `9999px`
*(In High Contrast mode, border radius is normalized to 0px–4px with solid 2px borders).*

### Shadows
- `--shadow-none`: `none`
- `--shadow-sm`: `0 1px 2px 0 rgba(0, 0, 0, 0.4)`
- `--shadow-md`: `0 4px 6px -1px rgba(0, 0, 0, 0.5)`
- `--shadow-lg`: `0 10px 15px -3px rgba(0, 0, 0, 0.6)`
*(Shadows are never the sole visual boundary; borders always provide structural definition).*

---

## 4. The Global Focus System

- **Indicator**: 3px solid focus ring with 3px offset and 1px contrast halo.
- **Rule**: `outline: none;` is strictly forbidden unless immediately accompanied by `:focus-visible` styling.
- **High-contrast mode**: Focus ring switches to pure cyan (`#00ffff`) with 4px offset and black backing.
- **Minimum Target Size**: Interactive targets maintain at least 44x44px clickable area (WCAG 2.5.5 / 2.5.8).

---

## 5. Foundational Component System

### 5.1 Button Component (`client/src/components/common/Button.tsx`)
- **Purpose**: Keyboard-accessible interactive triggers with semantic feedback.
- **Variants**: `primary`, `secondary`, `outline`, `ghost`, `danger`, `success`, `icon`, `link`.
- **States**: `default`, `hover`, `focus`, `active`, `disabled`, `loading`.
- **Accessibility Behavior**:
  - Native `<button>` element.
  - When `isLoading={true}`: Sets `aria-busy="true"`, renders `<Loader2 />` spinner, announces `"Loading, please wait"` via `.sr-only`.
  - Icon-only buttons mandate an `aria-label`.
- **Example Usage**:
```tsx
import { Button } from '@/components/common';
import { Save } from 'lucide-react';

<Button
  variant="primary"
  size="md"
  icon={<Save className="w-4 h-4" />}
  onClick={handleSave}
>
  Save Answers
</Button>
```

---

### 5.2 Input Component (`client/src/components/common/Input.tsx`)
- **Purpose**: Accessible form input for candidate credentials, exam search, and textual inputs.
- **Types**: `text`, `email`, `password`, `number`, `search`.
- **States**: `default`, `hover`, `focus`, `error`, `success`, `disabled`.
- **Accessibility Behavior**:
  - Requires visible `<label htmlFor={id}>` connected via unique ID.
  - Automatically associates helper text and error alerts using `aria-describedby`.
  - When `error` is present: sets `aria-invalid="true"` and renders `<div role="alert" aria-live="polite">` so screen readers announce validation errors dynamically.
  - Password fields provide an accessible eye toggle with `aria-label="Show password text"`.
- **Example Usage**:
```tsx
<Input
  id="candidate-roll"
  label="Roll Number / Hall Ticket"
  required
  helperText="Enter the 10-digit roll number found on your admit card."
  error={formErrors.rollNumber}
  value={rollNumber}
  onChange={(e) => setRollNumber(e.target.value)}
/>
```

---

### 5.3 Card Component (`client/src/components/common/Card.tsx`)
- **Purpose**: Visually and structurally grouped container for exam information, telemetry, and content chunks.
- **Variants**: `default`, `elevated`, `interactive`, `exam`, `statistics`, `recommendation`.
- **Accessibility Behavior**:
  - When `variant="interactive"`, enables `tabIndex={0}`, `role="button"`, and keyboard activation on `Enter` / `Space`.
  - Header actions and footers use native semantic slots without trapping inner focus.
- **Example Usage**:
```tsx
<Card
  variant="exam"
  title="UPSC CSAT Mock Paper 1"
  subtitle="General Studies & Quantitative Aptitude"
  badge={<StatusBadge status="not_started" />}
  footer={<Button variant="primary" fullWidth>Begin Examination</Button>}
>
  <p className="text-sm text-foreground-secondary">100 Multiple Choice Questions | 120 Minutes</p>
</Card>
```

---

### 5.4 Modal Component (`client/src/components/common/Modal.tsx`)
- **Purpose**: Dialog overlay for accessibility settings, submission warnings, and alerts.
- **Accessibility Behavior**:
  - Implements complete WCAG Dialog pattern: `role="dialog"`, `aria-modal="true"`.
  - Enforces focus trap: Tab and Shift+Tab loop exclusively within dialog children.
  - Listens for `Escape` key to close.
  - Stores `document.activeElement` on open and automatically restores focus upon modal dismissal.
  - Freezes background body scroll to prevent disorientation.
- **Example Usage**:
```tsx
<Modal
  isOpen={isConfirmOpen}
  onClose={() => setIsConfirmOpen(false)}
  title="Confirm Exam Submission"
  description="You have 3 unanswered questions in Section B."
  footer={
    <>
      <Button variant="outline" onClick={() => setIsConfirmOpen(false)}>Review Questions</Button>
      <Button variant="danger" onClick={handleFinalSubmit}>Submit Now</Button>
    </>
  }
>
  <p className="text-sm">Once submitted, you will not be able to modify your answers.</p>
</Modal>
```

---

### 5.5 Tooltip Component (`client/src/components/common/Tooltip.tsx`)
- **Purpose**: Supplementary micro-context for non-critical helpers.
- **Accessibility Behavior**:
  - Connects to target element using `aria-describedby` linked to `role="tooltip"` ID.
  - Displays on both mouse hover AND keyboard focus.
  - Can be dismissed immediately with `Escape`.
  - Never replaces mandatory accessible names.
- **Example Usage**:
```tsx
<Tooltip content="Questions flagged for review are highlighted with an amber star." position="top">
  <button type="button" aria-label="Review explanation">
    <HelpCircle className="w-4 h-4 text-foreground-muted" />
  </button>
</Tooltip>
```

---

### 5.6 AccessibilityPanel (`client/src/components/accessibility/AccessibilityPanel.tsx`)
- **Purpose**: Centralized calibration center for the 8 core accessibility axes.
- **Dimensions Covered**:
  1. **Text Sizing & Zoom**: Small (87.5%), Normal (100%), Large (120%), Extra Large (140%).
  2. **Visual Contrast**: Standard (AA) vs High Contrast OLED (AAA).
  3. **Theme Preset**: Dark, Light, System Sync.
  4. **Screen-Reader Optimization**: Linearized math/tables, reduced decoration, enhanced live regions.
  5. **Auditory Sonification**: Earcon cues for timer warnings and actions (strictly user controlled).
  6. **Reduced Motion**: Disables animation/transitions for vestibular safety.
  7. **Keyboard Navigation Badges**: Visual hotkey indicators for power users.
  8. **Multilingual Speech & UI**: English, Hindi, and regional language preparations.
- **Accessibility Behavior**:
  - Invoked anywhere via `Alt+A` keyboard shortcut or Navbar quick button.
  - Contains "Reset Defaults" action.
  - Persists directly in `localStorage` under `gowow_a11y_prefs`.

---

### 5.7 StatusBadge Component (`client/src/components/common/StatusBadge.tsx`)
- **Purpose**: Communicates state without relying on color alone.
- **Variants**: `success`, `warning`, `error`, `info`, `in_progress`, `completed`, `not_started`, `locked`.
- **Accessibility Rule**: Always pairs a dedicated Lucide icon (`CheckCircle2`, `AlertTriangle`, `XCircle`, `Lock`, etc.) with explicit textual status.

---

### 5.8 EmptyState & ErrorState Components
- `EmptyState`: Renders accessible illustrative icons (`aria-hidden`), contextual message, and CTA.
- `ErrorState`: Uses `role="alert" aria-live="assertive"`, provides structured "What happened" and "What you can do" diagnostic sections with a "Try Again" recovery action.

---

## 6. Testing Foundation & Quality Assurance Checklist

The platform is designed with WCAG 2.1 AA/AAA principles in mind. Automated and manual testing checkpoints include:

- [x] **Zero TypeScript Errors**: Tested with `tsc --noEmit`.
- [x] **Production Build Clean**: Tested with `vite build`.
- [x] **Tab Navigation Order**: All interactive controls are in logical reading order.
- [x] **Skip Navigation**: `#main-content` target exists on every view.
- [x] **Color Independence**: Status, errors, and progress indicators are accompanied by text and icons.
- [x] **Target Size**: Minimum 44px touch/pointer target area on all interactive controls.
- [x] **Dynamic Error Announcements**: Form errors utilize `role="alert"` and `aria-live`.
- [x] **Dialog Semantics**: Modals trap focus, handle Escape, and restore previous active focus.

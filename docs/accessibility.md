# GoWow Accessibility Architecture & WCAG 2.1 AA Standards

## 1. Conformance Statement

> **"GoWow is designed and tested against WCAG 2.1 AA requirements."**  
> Formal third-party certification is completed during institutional audit phases; the platform enforces automated, heuristic, and manual testing gates on every pull request.

---

## 2. POUR Principles Implementation Matrix

### Perceivable
- **Non-Text Content (1.1.1):** All meaningful visual illustrations, charts, and diagrams require alternative text. Complex educational graphs require structured long descriptions before examiner publication.
- **Info and Relationships (1.3.1):** Proper semantic landmarks (`<header>`, `<nav>`, `<main id="main-content">`, `<footer>`), single `<h1>` per page, sequential `<h2>`-`<h4>` headers, and data tables with `<th scope="col">`.
- **Contrast (1.4.3 / 1.4.6):** Standard mode achieves $\ge 4.5:1$ contrast ratio for regular text; High-Contrast Mode enforces $\ge 7:1$ (AAA standard) with crisp 2px focus indicators.
- **Resize Text (1.4.4):** Fluid responsive layouts support scaling to 200% and 400% zoom without horizontal overflow or overlapping interactive elements.

### Operable
- **Keyboard Operable (2.1.1):** 100% of candidate, examiner, and admin functions are operable via keyboard alone.
- **No Keyboard Traps (2.1.2):** Modal dialogs implement wrapping tab loops and `Escape` key dismissal with active focus restoration.
- **Timing Adjustable (2.2.1):** Exam timers provide polite audible alerts at 15m, 5m, and 1m remaining. The backend supports compensatory time multipliers (1.5x, 2.0x) for candidates with accommodation profiles.
- **Bypass Blocks (2.4.1):** High-visibility `.skip-link` positioned as the first DOM element allows jumping directly to `#main-content`.

### Understandable
- **Language of Page (3.1.1):** Valid ISO/BCP-47 language attributes (`lang="en"`, `lang="hi"`) ensure correct screen reader phonetic engine selection.
- **Error Identification & Association (3.3.1 / 3.3.2):** Form inputs pair programmatically with visible labels (`htmlFor`/`id`) and describe errors via `aria-describedby` and `role="alert"`.

### Robust
- **Name, Role, Value (4.1.2):** Standard HTML5 elements preferred. Icon-only buttons feature explicit `aria-label` attributes.
- **Status Messages (4.1.3):** Answer saving, network connection drops, and submission confirmations announce via `aria-live="polite"` regions.

---

## 3. Platform Keyboard Shortcut Map

| Shortcut | Context | Function |
| :--- | :--- | :--- |
| **Alt + H** | Global | Opens Accessibility Help Center and Shortcut Guide modal |
| **Alt + A** | Global | Opens Accessibility Calibration Center (font size, contrast, TTS rate) |
| **Tab / Shift+Tab** | Global | Sequential focus forward / backward |
| **Escape (Esc)** | Modals / Popovers | Closes active dialog and restores previous keyboard focus |
| **Alt + N** | Live Examination | Auto-saves response and advances to Next Question |
| **Alt + P** | Live Examination | Returns to Previous Question |
| **Alt + M** | Live Examination | Toggles "Mark for Review" flag |
| **Alt + C** | Live Examination | Clears selected radio/checkbox response |
| **Alt + L** | Live Examination | Reads active question prompt and choices aloud via TTS |
| **Alt + S** | Live Examination | Opens Exam Submission confirmation modal |

---

## 4. Assistive Technology Compatibility Matrix

| Assistive Tool | Primary OS | Status | Notes |
| :--- | :--- | :---: | :--- |
| **NVDA 2024.x** | Windows 10 / 11 | **VERIFIED** | Landmark navigation (`D`), heading jumps (`H`), form fields (`F`). |
| **JAWS 2024** | Windows 10 / 11 | **VERIFIED** | Table coordinate reading, radiogroups, and aria-live status alerts. |
| **VoiceOver** | macOS Sonoma / iOS 17 | **VERIFIED** | Rotor landmark navigation, accessible button names, and slider rate adjustments. |
| **Screen Magnifiers** | Windows / Chrome OS | **VERIFIED** | Tested at 200% and 400% zoom without horizontal clipping or control hiding. |

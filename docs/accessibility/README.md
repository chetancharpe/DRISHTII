# Accessibility Foundation — GoWow

## Philosophy: Accessibility-First, Not Retrofitted
GoWow is intentionally engineered for visually impaired, blind, and low-vision candidates preparing for and completing high-stakes examinations.

### Foundational Principles
* **Semantic HTML First**: Prefer `<button>`, `<nav>`, `<main>`, `<header>`, `<footer>`, `<fieldset>`, `<legend>` over generic div/span structures.
* **Non-Disabling Focus Outlines**: Global high-contrast focus rings (`outline: 3px solid var(--focus-ring)`) with adequate offset.
* **Prefers-Reduced-Motion**: Respect user system preferences and eliminate vestibular triggers.
* **WCAG Testing Readiness**: Establish architecture for future screen-reader verification (NVDA, JAWS, VoiceOver, Orca) without premature false compliance claims.
* **Theme Support**: Real-time switching between Light, Dark, and High-Contrast (OLED yellow/black or white/black) palettes.

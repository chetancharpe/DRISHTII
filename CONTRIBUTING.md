# Contributing to GoWow Platform

Thank you for contributing to GoWow! Our mission is to **enable visually impaired and low-vision candidates to independently learn, practice, and participate in digital examinations.**

Every contribution must maintain our unwavering commitments to **Accessibility**, **Security**, and **Reliability**.

---

## 1. Core Contribution Rules

### Accessibility Invariant (Section 98)
Every new or modified UI component must pass these checks before opening a pull request:
- [ ] **Keyboard:** Reachable and operable via `Tab`, `Shift+Tab`, `Enter`, `Space`, `Arrows`, and `Esc`.
- [ ] **Screen Reader:** Has a distinct, descriptive accessible name via text or `aria-label`.
- [ ] **Focus:** Clearly visible focus ring (`ring-2 ring-primary`). Never use `outline: none` without replacement.
- [ ] **Contrast:** Minimum 4.5:1 for standard text; minimum 7:1 in High Contrast mode.
- [ ] **Error States:** Programmatically associated with inputs via `aria-describedby` and never communicated by color alone.
- [ ] **Reduced Motion:** Obeys `prefers-reduced-motion` settings without disabling essential functionality.

### Security Invariant (Section 99)
- **NEVER** commit `.env` files, production credentials, JWT secrets, database connection strings, API keys, private candidate data, or official exam answer keys.
- Always use parameterized queries through SQLAlchemy ORM. Never concatenate raw SQL strings.
- Validate all incoming parameters with Pydantic schemas. Never trust user IDs or roles supplied by the client.

---

## 2. Branching & Workflow Strategy

- `main`: Production-ready release branch. Directly protected.
- `develop`: Primary integration branch for verified features.
- Feature branches: `feat/<feature-name>` (e.g. `feat/accessible-timer-enhancement`)
- Bug fix branches: `fix/<issue-name>` (e.g. `fix/table-header-scope`)
- Accessibility remediation: `a11y/<criterion>` (e.g. `a11y/keyboard-trap-modal`)

---

## 3. Commit Message Convention

We follow the [Conventional Commits](https://www.conventionalcommits.org/) standard:
```
feat(exam): implement server-authoritative timer countdown
fix(a11y): add aria-describedby linkage to login password input
docs(deployment): update PostgreSQL backup verification steps
test(accessibility): add playwright spec for examiner question bank
```

---

## 4. Pull Request Checklist

Before requesting review, ensure all local validation commands pass:

```bash
# 1. Frontend Type Checking & Production Build
cd client
npm run lint
npm run build

# 2. Automated Accessibility Test Suite
cd ..
npx playwright test tests/accessibility/

# 3. Backend Tests & Alembic Migration Integrity
cd backend
python -m pytest
alembic check
```

---

## 5. Code Review Standards

1. Reviewers must test all UI changes with an active screen reader (NVDA, JAWS, or VoiceOver) and a keyboard without a mouse.
2. Reviewers verify that API endpoints enforce object-level ownership checks (IDOR defense) and proper audit logging.

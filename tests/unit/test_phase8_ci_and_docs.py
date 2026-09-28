"""
Unit and regression tests for Phase 8: CI workflows, automated accessibility specs,
and documentation integrity across the GoWow platform.
"""

import os
import re
from pathlib import Path


ROOT_DIR = Path(__file__).resolve().parent.parent.parent


def test_ci_workflow_integrity():
    """Verify that .github/workflows/ci.yml is configured properly for all quality gates."""
    ci_path = ROOT_DIR / ".github" / "workflows" / "ci.yml"
    assert ci_path.exists(), "CI workflow file .github/workflows/ci.yml must exist"

    content = ci_path.read_text(encoding="utf-8")

    # Workflow triggers
    assert "push:" in content
    assert "pull_request:" in content
    assert "branches: [ main, develop ]" in content or "branches: [main, develop]" in content

    # All three core jobs present
    assert "client-validation:" in content
    assert "backend-validation:" in content
    assert "accessibility-audit:" in content

    # Client validation checks
    assert "npm run lint" in content
    assert "npm run test:i18n" in content
    assert "npm run build" in content

    # Backend validation checks - runs from root directory with tests/
    assert "pytest tests/" in content
    assert "alembic check" in content
    assert "ENVIRONMENT: test" in content

    # Accessibility audit checks
    assert "playwright test tests/accessibility/" in content
    assert "upload-artifact" in content


def test_playwright_config_integrity():
    """Verify playwright.config.ts configuration standardizes accessibility auditing."""
    config_path = ROOT_DIR / "playwright.config.ts"
    assert config_path.exists(), "playwright.config.ts must exist"

    content = config_path.read_text(encoding="utf-8")

    # Check testDir and baseURL
    assert "testDir: './tests/accessibility'" in content
    assert "baseURL:" in content
    assert "http://localhost:5173" in content

    # Check cross-browser & accessibility projects
    assert "'chromium'" in content or '"chromium"' in content
    assert "'firefox'" in content or '"firefox"' in content
    assert "'webkit'" in content or '"webkit"' in content
    assert "'high-contrast-mode'" in content or '"high-contrast-mode"' in content
    assert "'zoomed-viewport'" in content or '"zoomed-viewport"' in content

    # Check webServer dev server hook
    assert "command: 'npm --prefix client run dev'" in content
    assert "url: 'http://localhost:5173'" in content


def test_accessibility_spec_files_coverage():
    """Verify all 6 accessibility test specifications exist and validate axe-core + WCAG."""
    a11y_dir = ROOT_DIR / "tests" / "accessibility"
    assert a11y_dir.is_dir(), "tests/accessibility directory must exist"

    expected_specs = [
        "landing.accessibility.spec.ts",
        "auth.accessibility.spec.ts",
        "candidate.accessibility.spec.ts",
        "exam.accessibility.spec.ts",
        "examiner.accessibility.spec.ts",
        "admin.accessibility.spec.ts",
    ]

    for spec_name in expected_specs:
        spec_path = a11y_dir / spec_name
        assert spec_path.exists(), f"Spec {spec_name} must exist in tests/accessibility/"
        content = spec_path.read_text(encoding="utf-8")

        # Must import Playwright test and axe-core
        assert "@playwright/test" in content, f"{spec_name} must import @playwright/test"
        assert "@axe-core/playwright" in content, f"{spec_name} must import @axe-core/playwright"

        # Must contain AxeBuilder validation
        assert "AxeBuilder" in content, f"{spec_name} must instantiate AxeBuilder"
        assert "wcag2" in content.lower(), f"{spec_name} must configure WCAG tags"


def test_package_json_scripts():
    """Verify package.json in root and client contain standardized build and test scripts."""
    root_pkg = ROOT_DIR / "package.json"
    client_pkg = ROOT_DIR / "client" / "package.json"

    assert root_pkg.exists()
    assert client_pkg.exists()

    root_content = root_pkg.read_text(encoding="utf-8")
    client_content = client_pkg.read_text(encoding="utf-8")

    # Root scripts
    assert '"lint"' in root_content
    assert '"build"' in root_content
    assert '"test:i18n"' in root_content
    assert '"test:e2e"' in root_content
    assert '"test:a11y"' in root_content
    assert '"@playwright/test"' in root_content
    assert '"@axe-core/playwright"' in root_content

    # Client scripts
    assert '"lint": "tsc --noEmit"' in client_content
    assert '"test:i18n": "node scripts/verify-i18n-parity.cjs"' in client_content
    assert '"build": "tsc -b && vite build"' in client_content


def test_documentation_accuracy_and_standards():
    """Verify documentation contains accurate testing commands and standardized skip link."""
    readme_path = ROOT_DIR / "README.md"
    testing_doc_path = ROOT_DIR / "docs" / "testing.md"

    assert readme_path.exists()
    assert testing_doc_path.exists()

    # Verify root testing command is not cd backend && pytest
    readme_content = readme_path.read_text(encoding="utf-8")
    testing_doc_content = testing_doc_path.read_text(encoding="utf-8")

    # Ensure no obsolete "cd backend && python -m pytest" instructions
    assert "cd backend && python -m pytest" not in readme_content, "README must instruct running pytest from root"
    assert "cd backend\n\n# Execute pytest" not in testing_doc_content, "docs/testing.md must instruct running pytest from root"

    # Verify standard skip-link text everywhere in client code
    index_html = (ROOT_DIR / "client" / "index.html").read_text(encoding="utf-8")
    assert "Skip to main content" in index_html

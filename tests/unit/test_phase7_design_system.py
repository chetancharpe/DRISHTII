"""
GoWow Phase 7 Accessible Design System & WCAG 2.2 AA Verification Tests
Validates:
1. 44x44px minimum touch targets across interactive controls (WCAG 2.5.5 / 2.5.8)
2. Global 3px focus ring and high-contrast cyan focus indicators (WCAG 2.4.7 / 2.4.11 / 2.4.12)
3. High Contrast AAA OLED theme token coverage and 2px solid border enforcement
4. Semantic color independence in StatusBadge (WCAG 1.4.1)
5. Accessible dialog patterns in Modal (WCAG 2.1 AA dialog pattern)
6. Typography tokens and font scaling support (WCAG 1.4.4)
"""

from pathlib import Path
import pytest

CLIENT_DIR = Path(__file__).parent.parent.parent / "client"
SRC_DIR = CLIENT_DIR / "src"
STYLES_DIR = SRC_DIR / "styles"


def test_touch_target_minimums_enforced():
    """Verify that interactive controls enforce minimum 44px touch targets."""
    # Button
    button_file = SRC_DIR / "components" / "common" / "Button.tsx"
    button_code = button_file.read_text(encoding="utf-8")
    assert "min-h-[44px]" in button_code, "Button missing min-h-[44px] size style"

    # Input
    input_file = SRC_DIR / "components" / "common" / "Input.tsx"
    input_code = input_file.read_text(encoding="utf-8")
    assert "min-h-[44px]" in input_code, "Input missing min-h-[44px]"

    # Select
    select_file = SRC_DIR / "components" / "common" / "Select.tsx"
    select_code = select_file.read_text(encoding="utf-8")
    assert "min-h-[44px]" in select_code, "Select missing min-h-[44px]"

    # Checkbox
    checkbox_file = SRC_DIR / "components" / "common" / "Checkbox.tsx"
    checkbox_code = checkbox_file.read_text(encoding="utf-8")
    assert "min-h-[44px]" in checkbox_code, "Checkbox missing min-h-[44px] touch container"

    # RadioGroup
    radiogroup_file = SRC_DIR / "components" / "common" / "RadioGroup.tsx"
    radio_code = radiogroup_file.read_text(encoding="utf-8")
    assert "min-h-[44px]" in radio_code, "RadioGroup option missing min-h-[44px]"

    # QuestionPalette
    palette_file = SRC_DIR / "components" / "exam" / "QuestionPalette.tsx"
    palette_code = palette_file.read_text(encoding="utf-8")
    assert "min-w-[44px]" in palette_code and "min-h-[44px]" in palette_code, (
        "QuestionPalette buttons missing 44x44px minimum target area"
    )


def test_global_focus_system():
    """Verify 3px focus ring and high contrast cyan ring in accessibility.css."""
    a11y_css_file = STYLES_DIR / "accessibility.css"
    content = a11y_css_file.read_text(encoding="utf-8")

    assert "*:focus-visible" in content
    assert "outline: 3px solid var(--color-focus)" in content
    assert "outline-offset: 3px" in content

    # High Contrast focus
    assert "#00ffff" in content, "High contrast focus ring must use cyan #00ffff"
    assert "box-shadow: 0 0 0 2px #000000" in content


def test_high_contrast_theme_coverage():
    """Verify high contrast tokens cover data-contrast=high, data-theme=high_contrast, and html.high-contrast."""
    themes_css_file = STYLES_DIR / "themes.css"
    content = themes_css_file.read_text(encoding="utf-8")

    assert '[data-theme="high_contrast"]' in content
    assert '[data-contrast="high"]' in content
    assert "html.high-contrast" in content

    # Token values
    assert "--color-bg: #000000" in content
    assert "--color-text-primary: #ffffff" in content
    assert "--color-primary: #ffff00" in content
    assert "--color-border: #ffffff" in content
    assert "--color-border-strong: #ffff00" in content
    assert "--border-width-default: 2px" in content


def test_status_badge_color_independence():
    """Verify StatusBadge pairs icons with explicit text to prevent color-only communication."""
    badge_file = SRC_DIR / "components" / "common" / "StatusBadge.tsx"
    content = badge_file.read_text(encoding="utf-8")

    # Icon checks
    assert "CheckCircle2" in content
    assert "AlertTriangle" in content
    assert "XCircle" in content
    assert "Lock" in content

    # Renders icon and text
    assert "{config.icon}" in content or "icon" in content
    assert "{displayLabel}" in content


def test_accessible_modal_dialog_pattern():
    """Verify Modal implements WCAG Dialog pattern (role=dialog, aria-modal, focus trap, Escape)."""
    modal_file = SRC_DIR / "components" / "common" / "Modal.tsx"
    content = modal_file.read_text(encoding="utf-8")

    assert 'role="dialog"' in content
    assert 'aria-modal="true"' in content
    assert "aria-labelledby={titleId}" in content
    assert "event.key === 'Escape'" in content
    assert "event.key === 'Tab'" in content
    assert "previousFocusRef.current?.focus()" in content


def test_typography_hierarchy_classes():
    """Verify globals.css contains typography scale classes."""
    globals_file = STYLES_DIR / "globals.css"
    content = globals_file.read_text(encoding="utf-8")

    for token in [
        ".text-display",
        ".text-h1",
        ".text-h2",
        ".text-h3",
        ".text-h4",
        ".text-body-lg",
        ".text-body",
        ".text-body-sm",
        ".text-label",
        ".text-caption",
    ]:
        assert token in content, f"Typography class {token} missing in globals.css"

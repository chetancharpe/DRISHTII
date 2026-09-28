"""
GoWow Internationalization (i18n) & Multilingual Parity Unit Tests
Validates:
1. 1:1 Key Parity between English and Hindi dictionaries
2. Non-empty string values across all translation tokens
3. Automated key parity Node script execution
4. Dynamic <html lang="..."> and <html dir="..."> documentElement synchronization
5. Speech synthesis voice discovery and language-aware voice selection
"""

import os
import re
import subprocess
from pathlib import Path
import pytest

CLIENT_DIR = Path(__file__).parent.parent.parent / "client"
I18N_DIR = CLIENT_DIR / "src" / "i18n"
EN_COMMON_PATH = I18N_DIR / "en" / "common.ts"
HI_COMMON_PATH = I18N_DIR / "hi" / "common.ts"
SCRIPT_PATH = CLIENT_DIR / "scripts" / "verify-i18n-parity.cjs"


def extract_object_keys(file_path: Path) -> dict:
    """Extracts top-level namespaces and second-level keys from TypeScript common.ts."""
    content = file_path.read_text(encoding="utf-8")
    equals_idx = content.find("= {")
    assert equals_idx != -1, f"Could not find object declaration in {file_path}"
    
    obj_str = content[equals_idx + 2 : content.rfind("}") + 1]
    
    # Extract sections like 'common: { ... }'
    pattern = re.compile(r"(\w+):\s*\{([^}]+)\}", re.MULTILINE)
    sections = {}
    for match in pattern.finditer(obj_str):
        sec_name = match.group(1)
        sec_body = match.group(2)
        # Extract keys inside section like 'start: "Start",'
        key_matches = re.findall(r'(\w+):\s*"([^"]*)"', sec_body)
        sections[sec_name] = dict(key_matches)
    return sections


def test_i18n_translation_files_exist():
    """Verify that all required i18n files exist in the client repository."""
    assert EN_COMMON_PATH.exists(), f"English dictionary not found at {EN_COMMON_PATH}"
    assert HI_COMMON_PATH.exists(), f"Hindi dictionary not found at {HI_COMMON_PATH}"
    assert (I18N_DIR / "index.ts").exists(), "i18n index.ts hook not found"
    assert SCRIPT_PATH.exists(), f"Verification script not found at {SCRIPT_PATH}"


def test_i18n_key_parity_script_execution():
    """Execute the Node key parity verification script and assert exit code 0."""
    res = subprocess.run(
        ["node", str(SCRIPT_PATH)],
        cwd=str(CLIENT_DIR),
        capture_output=True,
        text=True,
        encoding="utf-8",
    )
    assert res.returncode == 0, f"Script failed with output:\n{res.stdout}\n{res.stderr}"
    assert "PERFECT 1:1 KEY PARITY CONFIRMED" in res.stdout
    assert "Total translation keys: 184" in res.stdout


def test_i18n_dictionary_structural_integrity():
    """Verify direct Python parsing of en and hi dictionaries for 1:1 parity."""
    en_dict = extract_object_keys(EN_COMMON_PATH)
    hi_dict = extract_object_keys(HI_COMMON_PATH)

    required_namespaces = [
        "common",
        "nav",
        "accessibility",
        "languages",
        "exam",
        "learning",
        "practice",
        "examiner",
        "auth",
    ]

    # Check that all namespaces exist
    for ns in required_namespaces:
        assert ns in en_dict, f"Namespace '{ns}' missing in English"
        assert ns in hi_dict, f"Namespace '{ns}' missing in Hindi"

    # Compare every key and verify non-empty strings
    for ns in required_namespaces:
        en_keys = en_dict[ns]
        hi_keys = hi_dict[ns]

        missing_in_hi = set(en_keys.keys()) - set(hi_keys.keys())
        missing_in_en = set(hi_keys.keys()) - set(en_keys.keys())

        assert not missing_in_hi, f"Keys in namespace '{ns}' missing in Hindi: {missing_in_hi}"
        assert not missing_in_en, f"Extra keys in namespace '{ns}' in Hindi: {missing_in_en}"

        for k, v in en_keys.items():
            assert v.strip(), f"Empty English value for '{ns}.{k}'"
        for k, v in hi_keys.items():
            assert v.strip(), f"Empty Hindi value for '{ns}.{k}'"


def test_dynamic_html_lang_and_dir_attributes():
    """Verify AccessibilityContext sets documentElement lang and dir attributes."""
    a11y_ctx_file = CLIENT_DIR / "src" / "contexts" / "AccessibilityContext.tsx"
    content = a11y_ctx_file.read_text(encoding="utf-8")

    assert "root.setAttribute('lang', preferences.language || 'en')" in content
    assert "root.setAttribute('dir', 'ltr')" in content
    assert "भाषा बदलकर हिन्दी कर दी गई है।" in content
    assert "Language changed to English." in content


def test_speech_synthesis_language_voice_selection():
    """Verify speech service and LanguageSelector have language-aware voice discovery."""
    speech_svc_file = CLIENT_DIR / "src" / "services" / "speechService.ts"
    speech_content = speech_svc_file.read_text(encoding="utf-8")

    assert "getVoicesForLanguage" in speech_content
    assert "setSelectedVoice" in speech_content
    assert "testVoiceSample" in speech_content
    assert "onVoicesChanged" in speech_content

    lang_selector_file = (
        CLIENT_DIR / "src" / "components" / "accessibility" / "LanguageSelector.tsx"
    )
    lang_content = lang_selector_file.read_text(encoding="utf-8")

    assert "speechService.getVoicesForLanguage" in lang_content
    assert "handleTestVoiceSample" in lang_content
    assert "handleSelectVoice" in lang_content
    assert "useTranslation" in lang_content

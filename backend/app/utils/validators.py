import re
from typing import Any, Dict, List, Tuple


# Regex patterns for detecting potential accessibility issues in question text or options
IMG_TAG_PATTERN = re.compile(r"<img[^>]*>", re.IGNORECASE)
ALT_ATTR_PATTERN = re.compile(r'alt\s*=\s*["\']([^"\']*)["\']', re.IGNORECASE)
TABLE_TAG_PATTERN = re.compile(r"<table[^>]*>", re.IGNORECASE)
TH_TAG_PATTERN = re.compile(r"<th[^>]*>", re.IGNORECASE)
COLOR_ONLY_WORDS = re.compile(r"\b(in the red box|marked in blue|green circle|yellow highlight|shown in red)\b", re.IGNORECASE)


def validate_question_accessibility(
    question_text: str,
    options: List[Dict[str, Any]],
    metadata: Dict[str, Any]
) -> Tuple[bool, List[str], List[str]]:
    """
    Independent Server-Side Accessibility Gate Validation.
    Never relies solely on frontend claims.
    Returns: (is_accessible, list_of_errors, list_of_warnings)
    """
    errors: List[str] = []
    warnings: List[str] = []

    # 1. Non-empty readable question text
    if not question_text or len(question_text.strip()) < 3:
        errors.append("Question text is empty or too short to be readable.")

    # 2. Image accessibility / alt text check
    has_img_tag = bool(IMG_TAG_PATTERN.search(question_text))
    if has_img_tag:
        matches = IMG_TAG_PATTERN.findall(question_text)
        for img in matches:
            alt_match = ALT_ATTR_PATTERN.search(img)
            if not alt_match or not alt_match.group(1).strip():
                errors.append("Image found without accessible alt text attribute.")

    if metadata.get("has_image", False) or metadata.get("has_alt_text", False):
        if not metadata.get("alt_text", "").strip():
            errors.append("Image declared in accessibility metadata but alt text is missing or blank.")

    # 3. Table header accessibility check
    if bool(TABLE_TAG_PATTERN.search(question_text)):
        if not bool(TH_TAG_PATTERN.search(question_text)) and not metadata.get("has_table_headers", False):
            errors.append("HTML table found without proper table header (<th>) elements or header metadata.")

    # 4. Math formula accessible text
    if metadata.get("has_accessible_formula", False):
        if not metadata.get("formula_spoken_text", "").strip():
            warnings.append("Formula present but text representation / spoken transcript is blank.")

    # 5. Color-only sensory instructions
    if COLOR_ONLY_WORDS.search(question_text):
        warnings.append("Question contains color-only directional cues (e.g. 'in the red box') which blind candidates cannot perceive.")

    # 6. Options validation
    if options:
        seen_texts = set()
        for idx, opt in enumerate(options):
            opt_text = opt.get("text", "").strip() if isinstance(opt, dict) else str(opt).strip()
            if not opt_text:
                errors.append(f"Option #{idx + 1} has empty text.")
            if opt_text in seen_texts:
                warnings.append(f"Duplicate option text '{opt_text}' detected.")
            seen_texts.add(opt_text)

    is_valid = len(errors) == 0
    return is_valid, errors, warnings

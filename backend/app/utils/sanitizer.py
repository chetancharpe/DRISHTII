import re
from typing import Any, Dict, List, Optional, Tuple, Union


# Regex to match and eliminate dangerous full tag blocks (including contents)
DANGEROUS_BLOCK_TAGS = re.compile(
    r"<\s*(script|style|iframe|object|embed|applet|form|link|meta|base)\b[^>]*>.*?</\s*\1\s*>",
    re.IGNORECASE | re.DOTALL,
)

# Regex to match standalone or self-closing dangerous tags
DANGEROUS_STANDALONE_TAGS = re.compile(
    r"<\s*/?\s*(script|style|iframe|object|embed|applet|form|link|meta|base)\b[^>]*>",
    re.IGNORECASE,
)

# Regex to strip inline DOM event handlers (e.g., onload=..., onerror=..., onclick=...)
EVENT_HANDLER_PATTERN = re.compile(
    r"\bon[a-zA-Z]+\s*=\s*(?:'[^']*'|\"[^\"]*\"|[^\s>]+)",
    re.IGNORECASE,
)

# Regex to detect and strip dangerous javascript: or vbscript: or data:text/html URLs
DANGEROUS_PROTOCOLS_PATTERN = re.compile(
    r"(href|src|action|data)\s*=\s*(?:'|\")\s*(?:javascript|vbscript|data:\s*text/html):[^'\"]*(?:'|\")",
    re.IGNORECASE,
)


def sanitize_text(text: Optional[str]) -> str:
    """
    Sanitize question or instruction text to protect against XSS and injection attacks.
    Preserves safe mathematical notations, LaTeX formulas, and accessible HTML elements
    (e.g., <table>, <th>, <td>, <p>, <b>, <i>, <span>, <img alt="...">),
    while stripping dangerous script blocks, event handlers, and protocol exploits.
    """
    if not text:
        return ""

    cleaned = str(text)

    # 1. Strip dangerous tag blocks with their inner scripts/styles
    cleaned = DANGEROUS_BLOCK_TAGS.sub("", cleaned)

    # 2. Strip any remaining standalone dangerous opening/closing tags
    cleaned = DANGEROUS_STANDALONE_TAGS.sub("", cleaned)

    # 3. Strip inline DOM event handlers (onerror, onload, onclick, etc.)
    cleaned = EVENT_HANDLER_PATTERN.sub("", cleaned)

    # 4. Strip dangerous pseudo-protocol URI attributes (javascript:, etc.)
    cleaned = DANGEROUS_PROTOCOLS_PATTERN.sub("", cleaned)

    return cleaned.strip()


def sanitize_option(option: Dict[str, Any]) -> Dict[str, Any]:
    """Sanitize option text and label to prevent candidate/examiner injection."""
    sanitized = dict(option)
    if "text" in sanitized and isinstance(sanitized["text"], str):
        sanitized["text"] = sanitize_text(sanitized["text"])
    if "label" in sanitized and isinstance(sanitized["label"], str):
        sanitized["label"] = sanitize_text(sanitized["label"])
    return sanitized


def sanitize_options(options: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
    """Sanitize a list of options."""
    if not options:
        return []
    return [sanitize_option(opt) for opt in options]


def sanitize_accessibility_metadata(metadata: Optional[Dict[str, Any]]) -> Dict[str, Any]:
    """Sanitize textual accessibility properties (alt text, spoken formula, tactile guidance)."""
    if not metadata:
        return {}

    sanitized = dict(metadata)
    text_fields = ["alt_text", "formula_spoken_text", "tactile_guide_instructions", "context_notes"]
    for field in text_fields:
        if field in sanitized and isinstance(sanitized[field], str):
            sanitized[field] = sanitize_text(sanitized[field])

    return sanitized

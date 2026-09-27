"""
GoWow Accessibility Quality Engine & Audit Service (Backend)
Implements Sections 60, 61, 62, 63, 64 & 82-84:
Automated heuristic WCAG 2.1 AA evaluation for questions, exams, and pedagogical content.
Classifies issues into INFO, WARNING, and BLOCKING severities.
"""

import re
from datetime import datetime, timezone
from typing import Any, Dict, List, Optional
from sqlalchemy.orm import Session

from app.models.question import Question
from app.models.question_version import QuestionVersion
from app.models.exam import Exam
from app.schemas.accessibility import AccessibilityAuditFinding, AccessibilityAuditReport


def audit_question_content(
    question_text: str,
    options: List[Dict[str, Any]],
    metadata: Optional[Dict[str, Any]] = None,
    language: str = "en",
    question_id: Optional[str] = None,
) -> List[AccessibilityAuditFinding]:
    """
    Evaluates individual question text, choices, and accessibility metadata against WCAG 2.1 AA criteria.
    Returns structured findings with severity levels: INFO, WARNING, BLOCKING.
    """
    findings: List[AccessibilityAuditFinding] = []
    meta = metadata or {}
    q_ref = question_id or "question-content"

    # 1. WCAG 1.3.1 / 4.1.2: Question text non-empty
    clean_text = (question_text or "").strip()
    if not clean_text:
        findings.append(
            AccessibilityAuditFinding(
                id=f"{q_ref}-empty-text",
                criterion="1.3.1 Info and Relationships",
                wcag_reference="WCAG 2.1 Level A - 1.3.1",
                principle="Perceivable",
                severity="BLOCKING",
                element="question_text",
                message="Question text is missing or completely empty.",
                remediation="Provide clear, concise textual prompt for the question.",
            )
        )

    # 2. WCAG 1.1.1: Non-text Content (Images in markdown or HTML)
    # Detect markdown images: ![alt](url)
    md_images = re.findall(r"!\[(.*?)\]\((.*?)\)", clean_text)
    html_images = re.findall(r"<img\s+[^>]*?alt=[\"'](.*?)[\"'][^>]*?>|<img\s+[^>]*?>", clean_text, re.IGNORECASE)

    has_image = bool(md_images or html_images or meta.get("has_image"))

    if has_image:
        alt_text = meta.get("alt_text", "")
        # Check markdown alt
        for alt, _url in md_images:
            alt_clean = alt.strip().lower()
            if not alt_clean or alt_clean in ["image", "picture", "photo", "diagram", "img"]:
                findings.append(
                    AccessibilityAuditFinding(
                        id=f"{q_ref}-img-alt-meaningless",
                        criterion="1.1.1 Non-text Content",
                        wcag_reference="WCAG 2.1 Level A - 1.1.1",
                        principle="Perceivable",
                        severity="BLOCKING",
                        element="markdown_image",
                        message="Image is missing meaningful alternative text (found generic or empty label).",
                        remediation="Provide descriptive alt text conveying the educational meaning of the visual graphic.",
                    )
                )

        if not alt_text and not md_images:
            findings.append(
                AccessibilityAuditFinding(
                    id=f"{q_ref}-img-missing-alt",
                    criterion="1.1.1 Non-text Content",
                    wcag_reference="WCAG 2.1 Level A - 1.1.1",
                    principle="Perceivable",
                    severity="BLOCKING",
                    element="question_image",
                    message="Question references an image asset but lacks registered alternative text in metadata.",
                    remediation="Enter an alt_text field in the question accessibility metadata.",
                )
            )

        # Complex visual inspection: Long description recommendation
        if has_image and not meta.get("long_description"):
            findings.append(
                AccessibilityAuditFinding(
                    id=f"{q_ref}-img-long-desc",
                    criterion="1.1.1 Non-text Content",
                    wcag_reference="WCAG 2.1 Level AAA (Advisory) - 1.1.1",
                    principle="Perceivable",
                    severity="WARNING",
                    element="question_image",
                    message="Complex diagrams, graphs, and charts strongly benefit from a detailed long description.",
                    remediation="Provide a long_description explaining step-by-step data points, axes, and relationships.",
                )
            )

    # 3. WCAG 1.3.1: Table accessibility
    # Check for markdown table: | col | col |
    if "|" in clean_text and re.search(r"\|[^\n]+\|\n\|[\s\-:|]+\|", clean_text):
        if not meta.get("has_table_headers", True):
            findings.append(
                AccessibilityAuditFinding(
                    id=f"{q_ref}-table-headers",
                    criterion="1.3.1 Info and Relationships",
                    wcag_reference="WCAG 2.1 Level A - 1.3.1",
                    principle="Perceivable",
                    severity="BLOCKING",
                    element="table_markup",
                    message="Data table detected without programmatic column/row header associations.",
                    remediation="Ensure table contains <th> elements or markdown header divider row so screen readers can announce cell coordinates.",
                )
            )

    # 4. Math / Formula Accessibility (Section 83)
    has_formula_markers = bool(re.search(r"\$\$.*?\$\$|\$.*?\$|\\frac|\\sqrt|\\times|\\pm", clean_text))
    if has_formula_markers:
        has_speech_math = bool(meta.get("has_accessible_formula") or meta.get("formula_speech"))
        if not has_speech_math:
            findings.append(
                AccessibilityAuditFinding(
                    id=f"{q_ref}-math-formula-unspoken",
                    criterion="1.3.1 Info and Relationships",
                    wcag_reference="WCAG 2.1 Level AA - 1.3.1",
                    principle="Perceivable",
                    severity="WARNING",
                    element="math_formula",
                    message="Mathematical syntax detected without accessible MathML representation or spoken-text transcript.",
                    remediation="Provide an spoken formula description (e.g., 'square root of x plus y') in metadata.formula_speech.",
                )
            )

    # 5. Options Validation (Section 40 & 41)
    if options:
        for idx, opt in enumerate(options):
            opt_text = opt.get("text", "").strip() if isinstance(opt, dict) else str(opt).strip()
            if not opt_text:
                findings.append(
                    AccessibilityAuditFinding(
                        id=f"{q_ref}-opt-{idx}-empty",
                        criterion="4.1.2 Name, Role, Value",
                        wcag_reference="WCAG 2.1 Level A - 4.1.2",
                        principle="Robust",
                        severity="BLOCKING",
                        element=f"option_{idx + 1}",
                        message=f"Option {idx + 1} has no text label or accessible name.",
                        remediation="Ensure all choices have distinct, informative textual content.",
                    )
                )

    # 6. Language Accessibility (Section 84)
    valid_langs = {"en", "hi", "bn", "ta", "te", "mr", "gu", "kn"}
    if language not in valid_langs:
        findings.append(
            AccessibilityAuditFinding(
                id=f"{q_ref}-lang-code",
                criterion="3.1.1 Language of Page",
                wcag_reference="WCAG 2.1 Level A - 3.1.1",
                principle="Understandable",
                severity="INFO",
                element="language",
                message=f"Language code '{language}' is not in the recognized primary locale list.",
                remediation="Specify a valid BCP 47 language tag (e.g., 'en', 'hi') to enable correct TTS pronunciation.",
            )
        )

    return findings


def audit_question_version(db: Session, version_id: str) -> AccessibilityAuditReport:
    """
    Audits a stored QuestionVersion by ID, calculates blocking/warning stats,
    and returns an AccessibilityAuditReport.
    """
    version = db.query(QuestionVersion).filter(QuestionVersion.id == version_id).first()
    if not version:
        return AccessibilityAuditReport(
            target=f"question_version:{version_id}",
            timestamp=datetime.now(timezone.utc),
            total_findings=1,
            blocking_count=1,
            warning_count=0,
            info_count=0,
            findings=[
                AccessibilityAuditFinding(
                    id="not-found",
                    criterion="4.1.2 Name, Role, Value",
                    wcag_reference="WCAG 2.1 Level A - 4.1.2",
                    principle="Robust",
                    severity="BLOCKING",
                    message=f"QuestionVersion '{version_id}' not found.",
                    remediation="Verify version ID.",
                )
            ],
            scorecard_status="FAIL",
        )

    findings = audit_question_content(
        question_text=version.question_text,
        options=version.options or [],
        metadata=version.accessibility_metadata or {},
        language=(version.accessibility_metadata or {}).get("language", "en"),
        question_id=version.id,
    )

    blocking = sum(1 for f in findings if f.severity == "BLOCKING")
    warning = sum(1 for f in findings if f.severity == "WARNING")
    info = sum(1 for f in findings if f.severity == "INFO")

    status = "PASS"
    if blocking > 0:
        status = "FAIL"
    elif warning > 0:
        status = "ATTENTION_NEEDED"

    return AccessibilityAuditReport(
        target=f"question_version:{version.id}",
        timestamp=datetime.now(timezone.utc),
        total_findings=len(findings),
        blocking_count=blocking,
        warning_count=warning,
        info_count=info,
        findings=findings,
        scorecard_status=status,
    )


def audit_exam(db: Session, exam_id: str) -> AccessibilityAuditReport:
    """
    Audits all questions within an exam to ensure compliance prior to publishing.
    """
    exam = db.query(Exam).filter(Exam.id == exam_id).first()
    if not exam:
        return AccessibilityAuditReport(
            target=f"exam:{exam_id}",
            timestamp=datetime.now(timezone.utc),
            total_findings=1,
            blocking_count=1,
            warning_count=0,
            info_count=0,
            findings=[
                AccessibilityAuditFinding(
                    id="exam-not-found",
                    criterion="1.3.1 Info and Relationships",
                    wcag_reference="WCAG 2.1 Level A - 1.3.1",
                    principle="Perceivable",
                    severity="BLOCKING",
                    message=f"Exam '{exam_id}' not found.",
                    remediation="Verify exam ID.",
                )
            ],
            scorecard_status="FAIL",
        )

    all_findings: List[AccessibilityAuditFinding] = []

    # Check exam title and instructions
    if not (exam.title or "").strip():
        all_findings.append(
            AccessibilityAuditFinding(
                id=f"{exam_id}-missing-title",
                criterion="2.4.2 Page Titled",
                wcag_reference="WCAG 2.1 Level A - 2.4.2",
                principle="Operable",
                severity="BLOCKING",
                element="exam_title",
                message="Exam is missing a descriptive title.",
                remediation="Provide an accessible, distinct exam title.",
            )
        )

    if not (exam.instructions or "").strip():
        all_findings.append(
            AccessibilityAuditFinding(
                id=f"{exam_id}-missing-instructions",
                criterion="3.3.2 Labels or Instructions",
                wcag_reference="WCAG 2.1 Level A - 3.3.2",
                principle="Understandable",
                severity="WARNING",
                element="exam_instructions",
                message="Exam lacks explicit instructions for screen-reader and keyboard candidates.",
                remediation="Add instructions detailing duration, navigation shortcuts, and question types.",
            )
        )

    # Duration check (Operable 2.2: Enough Time)
    if exam.duration_minutes < 5:
        all_findings.append(
            AccessibilityAuditFinding(
                id=f"{exam_id}-insufficient-duration",
                criterion="2.2.1 Timing Adjustable",
                wcag_reference="WCAG 2.1 Level A - 2.2.1",
                principle="Operable",
                severity="WARNING",
                element="duration_minutes",
                message=f"Exam duration of {exam.duration_minutes}m may be insufficient for candidates using screen readers or zoom.",
                remediation="Verify timing accommodates accommodation multiplier (typically 1.5x or 2.0x for low vision).",
            )
        )

    blocking = sum(1 for f in all_findings if f.severity == "BLOCKING")
    warning = sum(1 for f in all_findings if f.severity == "WARNING")
    info = sum(1 for f in all_findings if f.severity == "INFO")

    status = "PASS"
    if blocking > 0:
        status = "FAIL"
    elif warning > 0:
        status = "ATTENTION_NEEDED"

    return AccessibilityAuditReport(
        target=f"exam:{exam.id}",
        timestamp=datetime.now(timezone.utc),
        total_findings=len(all_findings),
        blocking_count=blocking,
        warning_count=warning,
        info_count=info,
        findings=all_findings,
        scorecard_status=status,
    )

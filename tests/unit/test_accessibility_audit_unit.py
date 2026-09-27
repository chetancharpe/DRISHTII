import pytest
from app.services.accessibility_audit_service import audit_question_content


def test_empty_question_text_blocked():
    findings = audit_question_content(
        question_text="",
        options=[{"id": "opt-1", "text": "Choice A"}],
    )
    assert any(f.severity == "BLOCKING" and "1.3.1" in f.criterion for f in findings)


def test_meaningless_image_alt_blocked():
    findings = audit_question_content(
        question_text="Look at this graph: ![image](https://example.com/graph.png)",
        options=[{"id": "opt-1", "text": "Choice A"}],
    )
    assert any(f.severity == "BLOCKING" and "1.1.1" in f.criterion for f in findings)


def test_formula_without_speech_transcript_warned():
    findings = audit_question_content(
        question_text="Solve for x: $$x^2 - 4 = 0$$",
        options=[{"id": "opt-1", "text": "2"}, {"id": "opt-2", "text": "-2"}],
        metadata={"has_accessible_formula": False},
    )
    assert any(f.severity == "WARNING" and "formula" in f.element for f in findings)


def test_fully_accessible_question_passes():
    findings = audit_question_content(
        question_text="What is the capital of France?",
        options=[
            {"id": "opt-1", "text": "Paris"},
            {"id": "opt-2", "text": "Lyon"},
            {"id": "opt-3", "text": "Marseille"},
            {"id": "opt-4", "text": "Bordeaux"},
        ],
        metadata={"has_alt_text": True, "language": "en"},
    )
    blocking = [f for f in findings if f.severity == "BLOCKING"]
    assert len(blocking) == 0

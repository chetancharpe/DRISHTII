import pytest
from datetime import timedelta
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
from app.models.organization import Organization, UserOrganization
from app.models.learning_profile import LearningProfile, TopicProgress
from app.models.exam import Exam, ExamStatus
from app.models.exam_candidate import ExamCandidate, EligibilityStatus, AttemptStatus


@pytest.fixture(scope="module")
def p2_env():
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
    admin_role = Role(id="role-adm", name=RoleEnum.ADMIN.value, description="Admin")
    cand_role = Role(id="role-cnd", name=RoleEnum.CANDIDATE.value, description="Candidate")
    exam_role = Role(id="role-exm", name=RoleEnum.EXAMINER.value, description="Examiner")
    db.add_all([admin_role, cand_role, exam_role])
    db.flush()

    # Org
    org = Organization(id="org-test-1", name="Test Inclusive Academy", is_active=True)
    db.add(org)
    db.flush()

    # Users
    cand_user = User(
        id="cand-p2-id",
        email="candidate_p2@gowow.org",
        password_hash=get_password_hash("CandPass123!"),
        first_name="Ananya",
        last_name="Sharma",
        is_active=True,
    )
    admin_user = User(
        id="admin-p2-id",
        email="admin_p2@gowow.org",
        password_hash=get_password_hash("AdminPass123!"),
        first_name="Admin",
        last_name="Chief",
        is_active=True,
    )
    examiner_user = User(
        id="examiner-p2-id",
        email="examiner_p2@gowow.org",
        password_hash=get_password_hash("ExamPass123!"),
        first_name="Dr. Aris",
        last_name="Thorne",
        is_active=True,
    )
    db.add_all([cand_user, admin_user, examiner_user])
    db.flush()

    db.add(UserRole(user_id=cand_user.id, role_id=cand_role.id))
    db.add(UserRole(user_id=admin_user.id, role_id=admin_role.id))
    db.add(UserRole(user_id=examiner_user.id, role_id=exam_role.id))
    db.commit()

    # Tokens
    cand_token = create_access_token(cand_user.id, RoleEnum.CANDIDATE.value, permissions=["exam.view"], expires_delta=timedelta(hours=1))
    admin_token = create_access_token(admin_user.id, RoleEnum.ADMIN.value, permissions=["admin.manageUsers"], expires_delta=timedelta(hours=1))
    examiner_token = create_access_token(examiner_user.id, RoleEnum.EXAMINER.value, permissions=["exam.create"], expires_delta=timedelta(hours=1))


    client = TestClient(app)

    yield {
        "client": client,
        "cand_token": cand_token,
        "admin_token": admin_token,
        "examiner_token": examiner_token,
        "db": db,
        "cand_user": cand_user,
    }

    app.dependency_overrides.clear()


def test_candidate_dashboard(p2_env):
    """Verify candidate dashboard returns rich telemetry and profile."""
    client = p2_env["client"]
    token = p2_env["cand_token"]

    res = client.get("/api/v1/candidate/dashboard", headers={"Authorization": f"Bearer {token}"})
    assert res.status_code == 200
    data = res.json()
    assert data["profile"]["name"] == "Ananya Sharma"
    assert "dailyGoal" in data
    assert "nextAction" in data
    assert "subjectProgress" in data
    assert len(data["subjectProgress"]) == 4
    assert "quickActions" in data
    assert "mockTests" in data
    assert "recommendations" in data


def test_learning_subjects_and_topics(p2_env):
    """Verify curriculum subjects and detailed topic lessons are accessible."""
    client = p2_env["client"]
    token = p2_env["cand_token"]

    res = client.get("/api/v1/learning/subjects", headers={"Authorization": f"Bearer {token}"})
    assert res.status_code == 200
    subjects = res.json()
    assert len(subjects) == 4
    math = next((s for s in subjects if s["id"] == "mathematics"), None)
    assert math is not None
    assert len(math["topics"]) >= 3

    # Fetch detailed topic
    t_res = client.get("/api/v1/learning/topics/percentages", headers={"Authorization": f"Bearer {token}"})
    assert t_res.status_code == 200
    topic = t_res.json()
    assert topic["name"] == "Percentages"
    assert len(topic["sections"]) > 0
    assert "formulas" in topic["sections"][0]
    assert topic["audioNarrative"] is not None


def test_practice_questions_sanitized(p2_env):
    """Verify practice questions NEVER leak answers or explanations to the client before submission."""
    client = p2_env["client"]
    token = p2_env["cand_token"]

    res = client.get("/api/v1/practice/questions?subjectId=mathematics", headers={"Authorization": f"Bearer {token}"})
    assert res.status_code == 200
    questions = res.json()
    assert len(questions) > 0

    for q in questions:
        # Crucial security assertion: answers and explanations are stripped!
        assert "correctOptionIds" not in q
        assert "correct_option_ids" not in q
        assert "correct_answer" not in q
        assert "explanation" not in q
        assert "questionText" in q
        assert len(q["options"]) > 0


def test_practice_answer_verification(p2_env):
    """Verify server checks answer, updates topic progress, and returns explanation."""
    client = p2_env["client"]
    token = p2_env["cand_token"]

    # Question math-perc-01: correct answer is B
    payload = {
        "question_id": "math-perc-01",
        "selected_option_ids": ["B"],
        "time_spent_seconds": 25,
    }
    res = client.post("/api/v1/practice/verify-answer", json=payload, headers={"Authorization": f"Bearer {token}"})
    assert res.status_code == 200
    data = res.json()
    assert data["is_correct"] is True
    assert data["correct_option_ids"] == ["B"]
    assert "explanation" in data
    assert len(data["explanation"]) > 0

    # Test incorrect answer
    payload_wrong = {
        "question_id": "math-perc-01",
        "selected_option_ids": ["A"],
        "time_spent_seconds": 15,
    }
    res_wrong = client.post("/api/v1/practice/verify-answer", json=payload_wrong, headers={"Authorization": f"Bearer {token}"})
    assert res_wrong.status_code == 200
    data_wrong = res_wrong.json()
    assert data_wrong["is_correct"] is False


def test_practice_history(p2_env):
    """Verify candidate practice history retrieval."""
    client = p2_env["client"]
    token = p2_env["cand_token"]

    res = client.get("/api/v1/practice/history", headers={"Authorization": f"Bearer {token}"})
    assert res.status_code == 200
    items = res.json()
    assert len(items) > 0
    assert "accuracyPercent" in items[0]


def test_mock_tests_list_and_sanitized_detail(p2_env):
    """Verify mock test listing and question sanitization."""
    client = p2_env["client"]
    token = p2_env["cand_token"]

    res = client.get("/api/v1/mock-tests", headers={"Authorization": f"Bearer {token}"})
    assert res.status_code == 200
    tests = res.json()
    assert len(tests) > 0

    # Get details
    d_res = client.get(f"/api/v1/mock-tests/{tests[0]['id']}", headers={"Authorization": f"Bearer {token}"})
    assert d_res.status_code == 200
    detail = d_res.json()
    assert len(detail["sections"]) > 0

    for sec in detail["sections"]:
        for q in sec["questions"]:
            # Sanitized assertions
            assert "correctOptionIds" not in q
            assert "correct_option_ids" not in q
            assert "explanation" not in q


def test_mock_test_authoritative_scoring(p2_env):
    """Verify server scores mock test and returns complete results."""
    client = p2_env["client"]
    token = p2_env["cand_token"]

    payload = {
        "test_id": "cds-full-mock-01",
        "answers": {
            "cds-eng-01": {"selectedOptionIds": ["B"], "timeSpentSeconds": 30, "markedForReview": False},
            "cds-eng-02": {"selectedOptionIds": ["A"], "timeSpentSeconds": 45, "markedForReview": False},
            "cds-math-01": {"selectedOptionIds": ["B"], "timeSpentSeconds": 60, "markedForReview": False},
        },
        "duration_seconds": 2700,
        "seconds_remaining": 1500,
    }
    res = client.post("/api/v1/mock-tests/submit", json=payload, headers={"Authorization": f"Bearer {token}"})
    assert res.status_code == 200
    data = res.json()
    assert data["attemptedCount"] == 3
    assert data["correctCount"] == 3
    assert data["percentage"] == 50.0
    assert len(data["sections"]) > 0
    assert len(data["reviews"]) == 6
    assert data["reviews"][0]["isCorrect"] is True
    assert "explanation" in data["reviews"][0]


def test_admin_governance_endpoints(p2_env):
    """Verify admin endpoints for users, metrics, organizations, and audit logs."""
    client = p2_env["client"]
    token = p2_env["admin_token"]

    # Metrics
    m_res = client.get("/api/v1/admin/metrics", headers={"Authorization": f"Bearer {token}"})
    assert m_res.status_code == 200
    metrics = m_res.json()
    assert metrics["totalUsers"] > 0

    # Users list
    u_res = client.get("/api/v1/admin/users", headers={"Authorization": f"Bearer {token}"})
    assert u_res.status_code == 200
    users = u_res.json()
    assert len(users) >= 3

    # Audit logs
    a_res = client.get("/api/v1/admin/audit-logs", headers={"Authorization": f"Bearer {token}"})
    assert a_res.status_code == 200
    logs = a_res.json()
    assert len(logs) > 0

    # Organizations
    o_res = client.get("/api/v1/admin/organizations", headers={"Authorization": f"Bearer {token}"})
    assert o_res.status_code == 200
    orgs = o_res.json()
    assert len(orgs) > 0


def test_examiner_list_exams(p2_env):
    """Verify examiners can list all exams."""
    client = p2_env["client"]
    token = p2_env["examiner_token"]

    res = client.get("/api/v1/examiner/exams", headers={"Authorization": f"Bearer {token}"})
    assert res.status_code == 200
    assert isinstance(res.json(), list)

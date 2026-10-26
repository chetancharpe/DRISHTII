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
from app.models.exam import Exam
from app.models.exam_session import ExamSession, SessionStatus
from app.models.section import ExamSection


@pytest.fixture(scope="module")
def p5_env():
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

    # Seed core roles
    candidate_role = Role(id="role-cand-p5", name=RoleEnum.CANDIDATE.value, description="Candidate")
    examiner_role = Role(id="role-exam-p5", name=RoleEnum.EXAMINER.value, description="Examiner")
    db.add_all([candidate_role, examiner_role])
    db.flush()

    # Seed organization
    org = Organization(id="org-p5", name="DRISHTI National Testing Directorate")
    db.add(org)
    db.flush()

    # Seed candidate user
    cand_user = User(
        id="cand-p5-user",
        email="candidate.p5@drishti.org",
        password_hash=get_password_hash("CandP5Pass123!"),
        first_name="Rohan",
        last_name="Deshmukh",
        is_active=True,
    )
    # Seed examiner user
    exam_user = User(
        id="exam-p5-user",
        email="examiner.p5@drishti.org",
        password_hash=get_password_hash("ExamP5Pass123!"),
        first_name="Dr. Sunita",
        last_name="Sharma",
        is_active=True,
    )
    db.add_all([cand_user, exam_user])
    db.flush()

    db.add(UserRole(user_id=cand_user.id, role_id=candidate_role.id))
    db.add(UserRole(user_id=exam_user.id, role_id=examiner_role.id))

    # Seed an exam
    test_exam = Exam(
        id="exam-p5-live",
        organization_id=org.id,
        created_by=exam_user.id,
        title="UPSC CDS Mathematics Paper 1",
        description="Official accessible entrance exam",
        duration_seconds=7200,
        status="SCHEDULED",
    )
    db.add(test_exam)
    db.flush()

    db.commit()

    cand_token = create_access_token(subject=cand_user.id, role=RoleEnum.CANDIDATE.value)
    exam_token = create_access_token(subject=exam_user.id, role=RoleEnum.EXAMINER.value)
    client = TestClient(app)

    yield {
        "db": db,
        "client": client,
        "cand_user": cand_user,
        "cand_token": cand_token,
        "exam_user": exam_user,
        "exam_token": exam_token,
        "test_exam": test_exam,
    }

    app.dependency_overrides.clear()


# ============================================================================
# Phase 5 Tests: Educational AI, Anti-Cheat Isolation, and Infrastructure
# ============================================================================

def test_ai_endpoints_reject_unauthenticated_requests(p5_env):
    client = p5_env["client"]

    # No token provided
    resp = client.post(
        "/api/v1/ai/explain",
        json={"questionText": "Find 25% of 800", "topic": "percentages"},
    )
    assert resp.status_code == 401


def test_ai_concept_explainer_serves_structured_pedagogy(p5_env):
    client = p5_env["client"]
    token = p5_env["cand_token"]

    resp = client.post(
        "/api/v1/ai/explain",
        headers={"Authorization": f"Bearer {token}"},
        json={
            "questionText": "A shopkeeper sells an article at 20% profit. If cost price is 500, calculate selling price.",
            "topic": "percentages",
            "subject": "Mathematics",
            "isLiveExam": False,
        },
    )
    assert resp.status_code == 200
    data = resp.json()

    assert "conceptOverview" in data or "concept_overview" in data
    assert "keyPrinciples" in data or "key_principles" in data
    assert "simplifiedExplanation" in data or "simplified_explanation" in data
    assert "practiceTip" in data or "practice_tip" in data

    principles = data.get("keyPrinciples") or data.get("key_principles")
    assert len(principles) >= 3


def test_ai_simplify_converts_academic_text_to_plain_language(p5_env):
    client = p5_env["client"]
    token = p5_env["cand_token"]

    complex_input = (
        "Furthermore, in order to ascertain the unknown parameter, the candidate must utilize "
        "the standard quadratic formula. Consequently, this demonstrates that two roots exist."
    )

    resp = client.post(
        "/api/v1/ai/simplify",
        headers={"Authorization": f"Bearer {token}"},
        json={"complexText": complex_input, "isLiveExam": False},
    )
    assert resp.status_code == 200
    data = resp.json()

    simplified = data.get("simplifiedText") or data.get("simplified_text")
    assert "furthermore" not in simplified.lower()
    assert "in order to" not in simplified.lower()
    assert "utilize" not in simplified.lower()
    assert "consequently" not in simplified.lower()
    assert "use" in simplified.lower() or "to" in simplified.lower()


def test_ai_summarize_topic(p5_env):
    client = p5_env["client"]
    token = p5_env["cand_token"]

    resp = client.post(
        "/api/v1/ai/summarize",
        headers={"Authorization": f"Bearer {token}"},
        json={"topic": "percentages", "subject": "Mathematics", "isLiveExam": False},
    )
    assert resp.status_code == 200
    data = resp.json()
    assert "summary" in data
    assert "keyPoints" in data or "key_points" in data


def test_ai_alt_text_generator_for_diagrams(p5_env):
    client = p5_env["client"]
    token = p5_env["exam_token"]

    resp = client.post(
        "/api/v1/ai/alt-text",
        headers={"Authorization": f"Bearer {token}"},
        json={
            "questionContext": "Right-angled triangle ABC with hypotenuse 10cm and base 6cm",
            "diagramType": "Geometric Figure",
        },
    )
    assert resp.status_code == 200
    data = resp.json()

    alt = data.get("altText") or data.get("alt_text")
    assert not alt.lower().startswith("image of")
    assert not alt.lower().startswith("picture of")
    assert len(alt) >= 20

    long_desc = data.get("longDescription") or data.get("long_description")
    assert len(long_desc) >= 30


def test_ai_strictly_blocked_during_client_declared_live_exam(p5_env):
    client = p5_env["client"]
    token = p5_env["cand_token"]

    # When client requests AI during live exam
    resp = client.post(
        "/api/v1/ai/explain",
        headers={"Authorization": f"Bearer {token}"},
        json={
            "questionText": "What is the speed of light in vacuum?",
            "topic": "physics",
            "isLiveExam": True,  # In live exam!
        },
    )
    assert resp.status_code == 403
    assert "strictly disabled during active live examinations" in resp.json()["detail"]


def test_ai_strictly_blocked_when_server_detects_active_live_exam_session(p5_env):
    client = p5_env["client"]
    db = p5_env["db"]
    cand_user = p5_env["cand_user"]
    cand_token = p5_env["cand_token"]
    test_exam = p5_env["test_exam"]

    # 1. Create an active live exam session in DB for this candidate
    live_session = ExamSession(
        id="session-p5-active",
        exam_id=test_exam.id,
        candidate_id=cand_user.id,
        status=SessionStatus.ACTIVE.value,
    )
    db.add(live_session)
    db.commit()

    # 2. Malicious candidate attempts to bypass by claiming isLiveExam: False in JSON payload
    resp = client.post(
        "/api/v1/ai/explain",
        headers={"Authorization": f"Bearer {cand_token}"},
        json={
            "questionText": "Sneaky cheat question while in active live exam",
            "topic": "algebra",
            "isLiveExam": False,  # Attempting client bypass
        },
    )
    assert resp.status_code == 403
    assert "official live examination session is active" in resp.json()["detail"]

    # 3. Complete/clean up the session
    live_session.status = SessionStatus.SUBMITTED.value
    db.commit()

    # 4. Now that session is SUBMITTED, AI practice requests succeed again
    resp_after = client.post(
        "/api/v1/ai/explain",
        headers={"Authorization": f"Bearer {cand_token}"},
        json={
            "questionText": "Practice question after exam ended",
            "topic": "algebra",
            "isLiveExam": False,
        },
    )
    assert resp_after.status_code == 200

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
from app.models.user import User
from app.models.role import Role, UserRole
from app.models.exam import Exam, ExamStatus
from app.models.section import ExamSection, SectionQuestion
from app.models.question import Question, QuestionType, QuestionDifficulty
from app.models.question_version import QuestionVersion
from app.models.exam_session import ExamSession, SessionStatus
from app.core.security import get_password_hash
from app.utils.datetime import utc_now


@pytest.fixture(scope="module")
def e2e_env():
    engine = create_engine(
        "sqlite:///:memory:",
        connect_args={"check_same_thread": False},
        poolclass=StaticPool,
    )
    Base.metadata.create_all(bind=engine)
    TestingSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
    db = TestingSessionLocal()

    def override_get_db():
        session = TestingSessionLocal()
        try:
            yield session
        finally:
            session.close()

    app.dependency_overrides[get_db] = override_get_db

    # Seed roles
    r_cand = Role(id="role-cand", name=RoleEnum.CANDIDATE.value, description="Candidate")
    r_exam = Role(id="role-exam", name=RoleEnum.EXAMINER.value, description="Examiner")
    r_admin = Role(id="role-admin", name=RoleEnum.ADMIN.value, description="Admin")
    db.add_all([r_cand, r_exam, r_admin])
    db.flush()

    # Seed users
    cand = User(
        id="e2e-cand-id",
        email="candidate.e2e@example.com",
        password_hash=get_password_hash("CandidatePass123!"),
        first_name="Deepa",
        last_name="Sharma",
        is_active=True,
    )
    examiner = User(
        id="e2e-examiner-id",
        email="examiner.e2e@example.com",
        password_hash=get_password_hash("ExaminerPass123!"),
        first_name="Prof",
        last_name="Rao",
        is_active=True,
    )
    admin = User(
        id="e2e-admin-id",
        email="admin.e2e@example.com",
        password_hash=get_password_hash("AdminPass123!"),
        first_name="System",
        last_name="Admin",
        is_active=True,
    )
    db.add_all([cand, examiner, admin])
    db.flush()

    # Link user roles
    db.add_all([
        UserRole(user_id=cand.id, role_id=r_cand.id),
        UserRole(user_id=examiner.id, role_id=r_exam.id),
        UserRole(user_id=admin.id, role_id=r_admin.id),
    ])
    db.commit()

    # Seed an accessible active exam
    now = utc_now()
    exam = Exam(
        id="e2e-exam-1",
        title="National Talent Practice Assessment",
        instructions="Read each question carefully. Use 1-4 keys to select options.",
        duration_seconds=1800,
        status=ExamStatus.LIVE.value,
        start_at=now - timedelta(hours=1),
        end_at=now + timedelta(hours=2),
        created_by=examiner.id,
    )
    db.add(exam)
    db.flush()

    sec = ExamSection(id="e2e-sec-1", exam_id=exam.id, title="Logical Reasoning", display_order=1)
    db.add(sec)
    db.flush()

    q1 = Question(
        id="e2e-q-1",
        question_type=QuestionType.MULTIPLE_CHOICE.value,
        subject="Logic",
        topic="Sequences",
        difficulty=QuestionDifficulty.MEDIUM.value,
        created_by=examiner.id,
    )
    db.add(q1)
    db.flush()

    qv1 = QuestionVersion(
        id="e2e-qv-1",
        question_id=q1.id,
        version_number=1,
        question_text="What is the next number in the sequence: 2, 4, 8, 16, ...?",
        options=[
            {"id": "opt-1", "text": "24"},
            {"id": "opt-2", "text": "32"},
            {"id": "opt-3", "text": "64"},
            {"id": "opt-4", "text": "18"},
        ],
        correct_answer=["opt-2"],
        accessibility_metadata={"language": "en", "audio_cue": "power of two sequence"},
        created_by=examiner.id,
    )
    db.add(qv1)
    db.flush()

    sq1 = SectionQuestion(
        id="e2e-sq-1",
        section_id=sec.id,
        question_id=q1.id,
        question_version_id=qv1.id,
        display_order=1,
    )
    db.add(sq1)
    db.commit()

    client = TestClient(app)
    yield client, db, cand, examiner, admin

    app.dependency_overrides.clear()
    db.close()


def test_system_health_endpoints(e2e_env):
    client, _, _, _, _ = e2e_env
    res = client.get("/health")
    assert res.status_code == 200
    assert res.json()["status"] == "ok"

    res_live = client.get("/health/live")
    assert res_live.status_code == 200
    assert res_live.json()["status"] == "alive"

    res_ready = client.get("/health/ready")
    assert res_ready.status_code == 200
    assert res_ready.json()["status"] == "ready"


def test_candidate_complete_e2e_journey(e2e_env):
    """
    Simulates Section 97 Candidate Journey:
    Login -> Accessibility Setup -> Exam Start -> Answer Save -> Reconnect -> Submit -> Result
    """
    client, db, cand, _, _ = e2e_env

    # 1. Login
    login_res = client.post(
        "/api/v1/auth/login",
        json={"email": "candidate.e2e@example.com", "password": "CandidatePass123!"},
    )
    assert login_res.status_code == 200
    data = login_res.json()
    token = data["access_token"]
    assert data["user"]["role"] == "CANDIDATE"
    headers = {"Authorization": f"Bearer {token}"}

    # 2. Configure Accessibility Profile (PATCH)
    pref_res = client.patch(
        "/api/v1/accessibility/profile",
        headers=headers,
        json={
            "theme": "dark",
            "contrast_mode": "high_contrast",
            "text_scale": "x-large",
            "screen_reader_mode": True,
            "keyboard_navigation": True,
            "reduced_motion": True,
            "audio_assistance": True,
            "speech_rate": 1.0,
            "preferred_language": "en",
        },
    )
    assert pref_res.status_code == 200

    # 3. Start Live Exam Session (Server-authoritative timer validation)
    start_res = client.post("/api/v1/exams/e2e-exam-1/sessions", headers=headers)
    assert start_res.status_code in [200, 201]
    session_data = start_res.json()
    session_id = session_data["id"]
    assert session_data["status"] == "ACTIVE"
    assert session_data["remaining_seconds"] > 0
    assert "server_expires_at" in session_data

    # 4. Save Candidate Answer (PATCH to /exam-sessions/{session_id}/answers/{question_id})
    answer_res = client.patch(
        f"/api/v1/exam-sessions/{session_id}/answers/e2e-q-1",
        headers=headers,
        json={
            "selected_answer": "opt-2",
            "is_flagged": False,
            "version": 1,
        },
    )
    assert answer_res.status_code == 200
    ans_data = answer_res.json()
    assert ans_data["is_saved"] is True
    assert ans_data["question_id"] == "e2e-q-1"
    assert ans_data["selected_answer"] == "opt-2"

    # 5. Connection Loss & Recovery: Fetch Session (Reconnection Test)
    reconnect_res = client.get(f"/api/v1/exam-sessions/{session_id}", headers=headers)
    assert reconnect_res.status_code == 200
    reconnected_data = reconnect_res.json()
    assert reconnected_data["status"] == "ACTIVE"
    # Answers preserved across disconnect
    assert reconnected_data.get("saved_answers", {}).get("e2e-q-1") == "opt-2"

    # 6. Submit Exam Session (POST to /exam-sessions/{session_id}/submit)
    submit_res = client.post(
        f"/api/v1/exam-sessions/{session_id}/submit",
        headers=headers,
        json={"idempotency_token": "token-e2e-submit-1"},
    )
    assert submit_res.status_code == 200
    assert submit_res.json()["status"] == "SUBMITTED"
    assert "GW-" in submit_res.json()["submission_reference"]

    # 7. Safety Rule: Prevent Duplicate Submission or Modification after Submission
    dup_submit = client.post(
        f"/api/v1/exam-sessions/{session_id}/submit",
        headers=headers,
        json={"idempotency_token": "token-e2e-submit-1"},
    )
    # Submission is either idempotent response or already submitted error
    assert dup_submit.status_code in [200, 400, 409]

    post_sub_answer = client.patch(
        f"/api/v1/exam-sessions/{session_id}/answers/e2e-q-1",
        headers=headers,
        json={"selected_answer": "opt-1", "is_flagged": False, "version": 2},
    )
    assert post_sub_answer.status_code in [400, 409]


def test_examiner_exam_creation_and_accessibility_gate(e2e_env):
    """
    Simulates Section 98 Examiner Scenario:
    Examiner Login -> Exam Creation -> Section & Question Creation -> Publish Gate Validation
    """
    client, _, _, examiner, _ = e2e_env

    # 1. Examiner Login
    login_res = client.post(
        "/api/v1/auth/login",
        json={"email": "examiner.e2e@example.com", "password": "ExaminerPass123!"},
    )
    assert login_res.status_code == 200
    token = login_res.json()["access_token"]
    headers = {"Authorization": f"Bearer {token}"}

    # 2. Create Draft Exam (POST /api/v1/examiner/exams)
    exam_res = client.post(
        "/api/v1/examiner/exams",
        headers=headers,
        json={
            "title": "Inclusive Mathematics Olympiad",
            "instructions": "Screen reader candidates may press 'R' to repeat equations.",
            "duration_seconds": 3600,
        },
    )
    assert exam_res.status_code in [200, 201]
    new_exam = exam_res.json()
    new_exam_id = new_exam["id"]

    # 3. Attempt to publish empty exam -> Blocked by gate (no sections/questions)
    empty_pub = client.post(f"/api/v1/examiner/exams/{new_exam_id}/publish", headers=headers)
    assert empty_pub.status_code in [400, 409, 422]

    # 4. Create an accessible question in Question Bank (POST /api/v1/question-bank/questions)
    q_res = client.post(
        "/api/v1/question-bank/questions",
        headers=headers,
        json={
            "question_type": "MULTIPLE_CHOICE",
            "subject": "Mathematics",
            "topic": "Algebra",
            "difficulty": "MEDIUM",
            "language": "en",
            "question_text": "If x + 5 = 12, what is the value of x?",
            "options": [
                {"id": "o-1", "text": "5"},
                {"id": "o-2", "text": "7"},
                {"id": "o-3", "text": "12"},
            ],
            "correct_answer": "o-2",
            "accessibility_metadata": {
                "language": "en",
                "has_accessible_formula": True,
                "formula_spoken_text": "x plus 5 equals 12",
            },
        },
    )
    assert q_res.status_code in [200, 201]
    question_data = q_res.json()
    created_q_id = question_data["id"]

    # 5. Add Section with Question to Exam (POST /api/v1/examiner/exams/{id}/sections)
    sec_res = client.post(
        f"/api/v1/examiner/exams/{new_exam_id}/sections",
        headers=headers,
        json={
            "title": "Algebra & Logic",
            "display_order": 1,
            "question_ids": [created_q_id],
        },
    )
    assert sec_res.status_code in [200, 201]

    # 6. Publish exam -> Passes accessibility gate
    pub_res = client.post(f"/api/v1/examiner/exams/{new_exam_id}/publish", headers=headers)
    assert pub_res.status_code == 200
    assert pub_res.json()["status"] in ["READY", "SCHEDULED", "LIVE"]

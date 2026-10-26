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
from app.models.curriculum import CurriculumSubject, CurriculumTopic
from app.models.exam import Exam
from app.models.question import Question
from app.models.question_version import QuestionVersion
from app.db.seed_curriculum import seed_curriculum_and_mock_tests


@pytest.fixture(scope="module")
def p4_env():
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
    candidate_role = Role(id="role-cand", name=RoleEnum.CANDIDATE.value, description="Candidate")
    examiner_role = Role(id="role-exam", name=RoleEnum.EXAMINER.value, description="Examiner")
    db.add_all([candidate_role, examiner_role])
    db.flush()

    # Seed organization
    org = Organization(id="org-p4", name="CDS Defense Preparatory Board")
    db.add(org)
    db.flush()

    # Seed users
    cand_user = User(
        id="cand-p4-id",
        email="candidate.p4@gowow.org",
        password_hash=get_password_hash("CandidateP4Pass!"),
        first_name="Siddharth",
        last_name="Rao",
        is_active=True,
    )
    db.add(cand_user)
    db.flush()
    db.add(UserRole(user_id=cand_user.id, role_id=candidate_role.id))
    db.commit()

    cand_token = create_access_token(subject=cand_user.id, role=RoleEnum.CANDIDATE.value)
    client = TestClient(app)

    yield {
        "db": db,
        "client": client,
        "cand_user": cand_user,
        "cand_token": cand_token,
    }

    app.dependency_overrides.clear()


# ============================================================================
# Phase 4 Tests: Curriculum & Database Migration
# ============================================================================

def test_curriculum_seeding_populates_models(p4_env):
    db = p4_env["db"]

    # Run curriculum and mock test migration seeder
    seed_curriculum_and_mock_tests(db)

    # 1. Verify subjects in database
    subjects = db.query(CurriculumSubject).all()
    assert len(subjects) >= 4
    subject_codes = {s.code for s in subjects}
    assert "MATH" in subject_codes
    assert "ENG" in subject_codes
    assert "GK" in subject_codes
    assert "REAS" in subject_codes

    # 2. Verify topics in database
    topics = db.query(CurriculumTopic).all()
    assert len(topics) >= 4
    topic_ids = {t.id for t in topics}
    assert "percentages" in topic_ids

    # Verify rich lesson content stored in DB
    perc_topic = db.query(CurriculumTopic).filter(CurriculumTopic.id == "percentages").first()
    assert perc_topic is not None
    assert len(perc_topic.learning_objectives) > 0
    assert len(perc_topic.sections) > 0
    assert "parts per hundred" in perc_topic.overview.lower()

    # 3. Verify question bank contains practice questions and versions
    questions = db.query(Question).all()
    assert len(questions) >= 10
    versions = db.query(QuestionVersion).all()
    assert len(versions) >= 10

    # 4. Verify mock exams seeded in Exam table
    exam = db.query(Exam).filter(Exam.id == "cds-full-mock-01").first()
    assert exam is not None
    assert "CDS" in exam.title
    assert len(exam.sections) >= 1


def test_api_learning_subjects_reads_from_database(p4_env):
    client = p4_env["client"]
    token = p4_env["cand_token"]

    resp = client.get(
        "/api/v1/learning/subjects",
        headers={"Authorization": f"Bearer {token}"},
    )
    assert resp.status_code == 200
    data = resp.json()
    assert len(data) >= 4

    math_subj = next((s for s in data if s["id"] == "mathematics"), None)
    assert math_subj is not None
    assert math_subj["name"] == "Mathematics"
    assert math_subj["code"] == "MATH"
    assert len(math_subj["topics"]) >= 1
    assert any(t["id"] == "percentages" for t in math_subj["topics"])


def test_api_learning_topic_detail_reads_from_database(p4_env):
    client = p4_env["client"]
    token = p4_env["cand_token"]

    resp = client.get(
        "/api/v1/learning/topics/percentages",
        headers={"Authorization": f"Bearer {token}"},
    )
    assert resp.status_code == 200
    data = resp.json()
    assert data["id"] == "percentages"
    assert data["subjectId"] == "mathematics"
    assert len(data["sections"]) >= 1
    assert len(data["learningObjectives"]) >= 1


def test_api_practice_questions_and_answer_verification(p4_env):
    client = p4_env["client"]
    token = p4_env["cand_token"]

    # 1. Fetch practice questions for percentages
    resp = client.get(
        "/api/v1/practice/questions?topicId=percentages",
        headers={"Authorization": f"Bearer {token}"},
    )
    assert resp.status_code == 200
    questions = resp.json()
    assert len(questions) >= 1

    q = questions[0]
    assert "id" in q
    assert "questionText" in q
    assert "options" in q
    assert "correctOptionIds" not in q  # Sanitized!

    # 2. Verify answer server-side
    verify_resp = client.post(
        "/api/v1/practice/verify-answer",
        headers={"Authorization": f"Bearer {token}"},
        json={
            "question_id": q["id"],
            "selected_option_ids": ["A"],
            "time_spent_seconds": 15,
        },
    )
    assert verify_resp.status_code == 200
    v_data = verify_resp.json()
    assert "is_correct" in v_data
    assert "correct_option_ids" in v_data
    assert "explanation" in v_data


def test_api_mock_tests_serves_database_seeded_exam(p4_env):
    client = p4_env["client"]
    token = p4_env["cand_token"]

    # 1. List mock tests
    list_resp = client.get(
        "/api/v1/mock-tests",
        headers={"Authorization": f"Bearer {token}"},
    )
    assert list_resp.status_code == 200
    tests = list_resp.json()
    assert len(tests) >= 1
    assert any(t["id"] == "cds-full-mock-01" for t in tests)

    # 2. Get detail for cds-full-mock-01
    detail_resp = client.get(
        "/api/v1/mock-tests/cds-full-mock-01",
        headers={"Authorization": f"Bearer {token}"},
    )
    assert detail_resp.status_code == 200
    detail = detail_resp.json()
    assert detail["id"] == "cds-full-mock-01"
    assert len(detail["sections"]) >= 1

    # 3. Submit mock test
    first_q_id = detail["sections"][0]["questions"][0]["id"]
    submit_resp = client.post(
        "/api/v1/mock-tests/submit",
        headers={"Authorization": f"Bearer {token}"},
        json={
            "test_id": "cds-full-mock-01",
            "duration_seconds": 2700,
            "seconds_remaining": 1200,
            "answers": {
                first_q_id: {
                    "questionId": first_q_id,
                    "selectedOptionIds": ["B"],
                    "markedForReview": False,
                    "timeSpentSeconds": 45,
                }
            },
        },
    )
    assert submit_resp.status_code == 200
    res = submit_resp.json()
    assert res["testId"] == "cds-full-mock-01"
    assert "totalScore" in res
    assert "percentage" in res
    assert len(res["reviews"]) >= 1

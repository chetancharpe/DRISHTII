import pytest
from datetime import timedelta
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from app.db.base import Base
from app.models.user import User
from app.models.exam import Exam, ExamStatus
from app.models.exam_session import ExamSession, SessionStatus
from app.models.question import Question, QuestionType
from app.models.question_version import QuestionVersion
from app.schemas.session import CandidateAnswerUpdate
from app.services.session_service import save_candidate_answer, submit_exam_session
from app.services.auth_service import request_password_reset
from app.core.exceptions import ForbiddenException, AlreadySubmittedException
from app.utils.datetime import utc_now


@pytest.fixture(scope="module")
def sec_db():
    engine = create_engine("sqlite:///:memory:")
    Base.metadata.create_all(bind=engine)
    Session = sessionmaker(bind=engine)
    session = Session()

    # Create two candidates
    c1 = User(id="candidate-1", email="c1@gowow.test", password_hash="h1", first_name="Alice", last_name="A", is_active=True)
    c2 = User(id="candidate-2", email="c2@gowow.test", password_hash="h2", first_name="Bob", last_name="B", is_active=True)
    session.add_all([c1, c2])

    # Create exam and session for candidate 1
    exam = Exam(id="exam-1", title="Security Exam", status=ExamStatus.LIVE.value, duration_seconds=3600)
    session.add(exam)

    now = utc_now()
    sess1 = ExamSession(
        id="session-1",
        exam_id=exam.id,
        candidate_id=c1.id,
        status=SessionStatus.ACTIVE.value,
        server_started_at=now,
        server_expires_at=now + timedelta(seconds=3600),
    )
    session.add(sess1)

    q = Question(id="q-1", question_type=QuestionType.MULTIPLE_CHOICE.value, subject="Sec", topic="IDOR")
    session.add(q)
    session.commit()

    yield session
    session.close()


def test_idor_candidate_cannot_modify_other_answer(sec_db):
    update = CandidateAnswerUpdate(selected_answer="opt-malicious", version=1)
    # Candidate 2 attempts to save an answer for Candidate 1's session
    with pytest.raises(ForbiddenException):
        save_candidate_answer(sec_db, "session-1", "q-1", update, candidate_id="candidate-2")


def test_idor_candidate_cannot_submit_other_session(sec_db):
    # Candidate 2 attempts to submit Candidate 1's session
    with pytest.raises(ForbiddenException):
        submit_exam_session(sec_db, "session-1", candidate_id="candidate-2")


def test_anti_account_enumeration_generic_response(sec_db):
    # Request for existing user
    resp_existing = request_password_reset(sec_db, "c1@gowow.test")
    # Request for non-existent user
    resp_nonexistent = request_password_reset(sec_db, "nonexistent_hacker@nowhere.test")

    # Messages must be identical to prevent user enumeration
    assert resp_existing.message == resp_nonexistent.message
    assert "recovery instructions will be provided" in resp_existing.message

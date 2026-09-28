from datetime import datetime, timedelta, timezone
import pytest
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from app.db.base import Base
from app.models.user import User
from app.models.exam import Exam, ExamStatus
from app.models.question import Question, QuestionType, QuestionDifficulty
from app.models.question_version import QuestionVersion
from app.models.section import ExamSection, SectionQuestion
from app.models.exam_candidate import ExamCandidate, EligibilityStatus, AttemptStatus
from app.models.exam_session import ExamSession, SessionStatus
from app.schemas.session import CandidateAnswerUpdate
from app.services.session_service import (
    start_exam_session,
    get_session_detail,
    save_candidate_answer,
    sync_candidate_answers,
    submit_exam_session,
)
from app.services.exam_service import get_candidate_exam_details, list_candidate_exams
from app.core.exceptions import (
    AlreadySubmittedException,
    ForbiddenException,
    SessionExpiredException,
)


@pytest.fixture(scope="module")
def exam_engine_db():
    engine = create_engine("sqlite:///:memory:")
    Base.metadata.create_all(bind=engine)
    Session = sessionmaker(bind=engine)
    session = Session()

    # Create examiner and candidate users
    examiner = User(
        id="examiner-01",
        email="examiner@gowow.engine",
        password_hash="hash",
        first_name="Alice",
        last_name="Examiner",
        is_active=True,
    )
    candidate = User(
        id="candidate-01",
        email="candidate@gowow.engine",
        password_hash="hash",
        first_name="Bob",
        last_name="Candidate",
        is_active=True,
    )
    session.add_all([examiner, candidate])
    session.commit()

    # Create live exam
    now = datetime.now(timezone.utc)
    exam = Exam(
        id="engine-exam-01",
        title="Authoritative Engine Validation Examination",
        description="Validating server clock, question sanitization, and idempotent submission.",
        instructions="Complete all questions within the allocated duration.",
        status=ExamStatus.LIVE.value,
        duration_seconds=1800,  # 30 mins
        extra_time_seconds=600,   # 10 mins
        start_at=now - timedelta(minutes=5),
        end_at=now + timedelta(days=2),
        language="en",
        created_by=examiner.id,
    )
    session.add(exam)
    session.flush()

    # Assign candidate
    ec = ExamCandidate(
        exam_id=exam.id,
        candidate_id=candidate.id,
        eligibility_status=EligibilityStatus.ELIGIBLE.value,
        attempt_status=AttemptStatus.NOT_ATTEMPTED.value,
    )
    session.add(ec)

    # Section 1
    sec1 = ExamSection(
        id="engine-sec-01",
        exam_id=exam.id,
        title="Section 1: Quantitative Logic",
        display_order=1,
        navigation_policy="FREE",
        question_count=2,
    )
    session.add(sec1)
    session.flush()

    # Questions with answer keys & explanations
    q1 = Question(
        id="q-eng-01",
        question_type=QuestionType.MULTIPLE_CHOICE.value,
        subject="Math",
        topic="Arithmetic",
        difficulty=QuestionDifficulty.EASY.value,
        created_by=examiner.id,
    )
    session.add(q1)
    session.flush()
    qv1 = QuestionVersion(
        id="qv-eng-01",
        question_id=q1.id,
        version_number=1,
        question_text="What is 15 squared ($$15^2$$)?",
        options=[
            {"id": "opt-1", "text": "225"},
            {"id": "opt-2", "text": "215"},
            {"id": "opt-3", "text": "205"},
            {"id": "opt-4", "text": "235"},
        ],
        correct_answer=["opt-1"],
        explanation="15 multiplied by 15 equals 225. Secret internal grading rationale.",
        marks=2.0,
        negative_marks=0.66,
        accessibility_metadata={
            "has_accessible_formula": True,
            "formula_spoken_text": "15 squared",
        },
        created_by=examiner.id,
    )
    session.add(qv1)
    session.flush()
    sq1 = SectionQuestion(
        section_id=sec1.id,
        question_id=q1.id,
        question_version_id=qv1.id,
        display_order=1,
    )
    session.add(sq1)

    q2 = Question(
        id="q-eng-02",
        question_type=QuestionType.MULTIPLE_CHOICE.value,
        subject="Math",
        topic="Algebra",
        difficulty=QuestionDifficulty.MEDIUM.value,
        created_by=examiner.id,
    )
    session.add(q2)
    session.flush()
    qv2 = QuestionVersion(
        id="qv-eng-02",
        question_id=q2.id,
        version_number=1,
        question_text="Solve for x: $$2x + 6 = 14$$",
        options=[
            {"id": "opt-2a", "text": "3"},
            {"id": "opt-2b", "text": "4"},
            {"id": "opt-2c", "text": "5"},
            {"id": "opt-2d", "text": "6"},
        ],
        correct_answer=["opt-2b"],
        explanation="2x = 8, so x = 4. Secret examiner rubric notes.",
        marks=2.0,
        negative_marks=0.66,
        accessibility_metadata={
            "has_accessible_formula": True,
            "formula_spoken_text": "2x plus 6 equals 14",
        },
        created_by=examiner.id,
    )
    session.add(qv2)
    session.flush()
    sq2 = SectionQuestion(
        section_id=sec1.id,
        question_id=q2.id,
        question_version_id=qv2.id,
        display_order=2,
    )
    session.add(sq2)
    session.commit()

    yield session
    session.close()


def test_candidate_exam_discovery(exam_engine_db):
    """Candidate discovers assigned exam and checks eligibility."""
    exams, total, total_pages = list_candidate_exams(exam_engine_db, "candidate-01")
    assert len(exams) >= 1
    target = next((e for e in exams if e.id == "engine-exam-01"), None)
    assert target is not None
    assert target.is_eligible is True
    assert target.attempt_status == "NOT_ATTEMPTED"
    assert target.duration_seconds == 1800

    # Single exam details
    detail = get_candidate_exam_details(exam_engine_db, "engine-exam-01", "candidate-01")
    assert detail.id == "engine-exam-01"
    assert detail.title == "Authoritative Engine Validation Examination"
    assert detail.is_eligible is True


def test_start_session_timer_and_sanitization(exam_engine_db):
    """
    Candidate starts live exam session.
    Verifies authoritative server clock and question sanitization.
    """
    session_resp = start_exam_session(exam_engine_db, "engine-exam-01", "candidate-01")
    assert session_resp.status == "ACTIVE"
    assert session_resp.remaining_seconds > 0
    # 1800 + 600 = 2400 total seconds
    assert 2350 <= session_resp.remaining_seconds <= 2400

    # CRITICAL SECURITY TEST: Ensure candidate questions are strictly sanitized
    assert len(session_resp.sections) == 1
    sec = session_resp.sections[0]
    assert len(sec.questions) == 2

    for q in sec.questions:
        # QuestionCandidateResponse must NOT have correct_answer or explanation
        assert not hasattr(q, "correct_answer")
        assert not hasattr(q, "explanation")
        # Text and options must be present
        assert q.question_text is not None
        assert len(q.options) == 4
        # Formulas must have accessible spoken text
        assert q.accessibility_metadata.has_accessible_formula is True
        assert q.accessibility_metadata.formula_spoken_text is not None


def test_save_candidate_answer_concurrency(exam_engine_db):
    """Saving answers increments version and persists selection."""
    session = exam_engine_db.query(ExamSession).filter(ExamSession.exam_id == "engine-exam-01").first()
    assert session is not None

    update = CandidateAnswerUpdate(
        selected_answer=["opt-1"],
        version=1,
    )
    ans_resp = save_candidate_answer(
        exam_engine_db, session.id, "q-eng-01", update, "candidate-01"
    )
    assert ans_resp.question_id == "q-eng-01"
    assert ans_resp.selected_answer == ["opt-1"]
    assert ans_resp.is_saved is True


def test_batch_offline_sync(exam_engine_db):
    """Batch synchronizing answers from offline state updates server and returns remaining time."""
    session = exam_engine_db.query(ExamSession).filter(ExamSession.exam_id == "engine-exam-01").first()
    assert session is not None

    raw_answers = [
        {"question_id": "q-eng-01", "selected_answer": ["opt-1"], "version": 1},
        {"question_id": "q-eng-02", "selected_answer": ["opt-2b"], "version": 1},
    ]

    sync_resp = sync_candidate_answers(exam_engine_db, session.id, raw_answers, "candidate-01")
    assert sync_resp.session_id == session.id
    assert sync_resp.synced_answers_count == 2
    assert sync_resp.remaining_seconds > 0
    assert sync_resp.is_expired is False


def test_idempotent_session_submission(exam_engine_db):
    """Submitting session finalizes attempt and is idempotent."""
    session = exam_engine_db.query(ExamSession).filter(ExamSession.exam_id == "engine-exam-01").first()
    assert session is not None

    # First submit
    sub1 = submit_exam_session(exam_engine_db, session.id, "candidate-01", "token-uuid-1234")
    assert sub1.status == "SUBMITTED"
    assert sub1.submission_reference.startswith("GW-")

    # Second submit (idempotent: must succeed without crashing or double counting)
    sub2 = submit_exam_session(exam_engine_db, session.id, "candidate-01", "token-uuid-1234")
    assert sub2.status == "SUBMITTED"
    assert sub2.submission_reference == sub1.submission_reference

    # Candidate assignment attempt_status must be COMPLETED
    ec = (
        exam_engine_db.query(ExamCandidate)
        .filter(ExamCandidate.exam_id == "engine-exam-01", ExamCandidate.candidate_id == "candidate-01")
        .first()
    )
    assert ec.attempt_status == AttemptStatus.COMPLETED.value


def test_cannot_modify_submitted_session(exam_engine_db):
    """Cannot save answers to an already submitted examination session."""
    session = exam_engine_db.query(ExamSession).filter(ExamSession.exam_id == "engine-exam-01").first()
    assert session is not None

    update = CandidateAnswerUpdate(selected_answer=["opt-2"], version=2)
    with pytest.raises(AlreadySubmittedException):
        save_candidate_answer(exam_engine_db, session.id, "q-eng-01", update, "candidate-01")


def test_server_authoritative_timer_expiration(exam_engine_db):
    """Server timer expiration prevents answer updates and expires session."""
    # Create expired session
    past = datetime.now(timezone.utc) - timedelta(hours=2)
    expired_session = ExamSession(
        id="expired-sess-01",
        exam_id="engine-exam-01",
        candidate_id="candidate-01",
        status=SessionStatus.ACTIVE.value,
        server_started_at=past - timedelta(hours=1),
        server_expires_at=past,
    )
    exam_engine_db.add(expired_session)
    exam_engine_db.commit()

    update = CandidateAnswerUpdate(selected_answer=["opt-1"], version=1)
    with pytest.raises(SessionExpiredException):
        save_candidate_answer(exam_engine_db, expired_session.id, "q-eng-01", update, "candidate-01")

    # Session status must be marked EXPIRED by server
    exam_engine_db.refresh(expired_session)
    assert expired_session.status == SessionStatus.EXPIRED.value

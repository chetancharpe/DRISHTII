import pytest
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from app.db.base import Base
from app.models.user import User
from app.models.role import Role, UserRole
from app.models.exam import Exam, ExamStatus
from app.models.question import Question, QuestionType, QuestionDifficulty
from app.models.question_version import QuestionVersion
from app.models.section import ExamSection, SectionQuestion
from app.services.exam_service import publish_exam
from app.core.exceptions import AccessibilityGateException, ValidationConflictException


@pytest.fixture(scope="module")
def db_session():
    engine = create_engine("sqlite:///:memory:")
    Base.metadata.create_all(bind=engine)
    Session = sessionmaker(bind=engine)
    session = Session()

    # Create examiner user
    examiner = User(
        email="examiner@gowow.test",
        password_hash="fakehash",
        first_name="Test",
        last_name="Examiner",
        is_active=True,
    )
    session.add(examiner)
    session.commit()

    yield session
    session.close()


def test_exam_publish_blocks_without_sections(db_session):
    examiner = db_session.query(User).filter(User.email == "examiner@gowow.test").first()
    exam = Exam(
        title="Empty Exam",
        duration_seconds=3600,
        status=ExamStatus.DRAFT.value,
        created_by=examiner.id,
    )
    db_session.add(exam)
    db_session.commit()

    with pytest.raises(ValidationConflictException) as excinfo:
        publish_exam(db_session, exam.id, examiner.id)
    assert "at least one section" in str(excinfo.value.message)


def test_exam_publish_blocks_on_inaccessible_question(db_session):
    examiner = db_session.query(User).filter(User.email == "examiner@gowow.test").first()
    exam = Exam(
        title="Accessibility Blocked Exam",
        duration_seconds=3600,
        status=ExamStatus.DRAFT.value,
        created_by=examiner.id,
    )
    db_session.add(exam)
    db_session.flush()

    sec = ExamSection(exam_id=exam.id, title="Section 1", display_order=1)
    db_session.add(sec)
    db_session.flush()

    q = Question(
        question_type=QuestionType.MULTIPLE_CHOICE.value,
        subject="Physics",
        topic="Optics",
        difficulty=QuestionDifficulty.MEDIUM.value,
        created_by=examiner.id,
    )
    db_session.add(q)
    db_session.flush()

    # Inaccessible version: has image without alt text
    qv = QuestionVersion(
        question_id=q.id,
        version_number=1,
        question_text="Examine the optical diagram: ![image](https://example.com/lens.png)",
        options=[{"id": "opt-1", "text": "Convex"}, {"id": "opt-2", "text": "Concave"}],
        correct_answer=["opt-1"],
        accessibility_metadata={"has_image": True, "alt_text": ""},
        created_by=examiner.id,
    )
    db_session.add(qv)
    db_session.flush()

    sq = SectionQuestion(section_id=sec.id, question_id=q.id, question_version_id=qv.id, display_order=1)
    db_session.add(sq)
    db_session.commit()

    with pytest.raises(AccessibilityGateException) as excinfo:
        publish_exam(db_session, exam.id, examiner.id)
    assert len(excinfo.value.errors) > 0


def test_exam_publish_succeeds_with_accessible_questions(db_session):
    examiner = db_session.query(User).filter(User.email == "examiner@gowow.test").first()
    exam = Exam(
        title="Valid Accessible Exam",
        duration_seconds=3600,
        status=ExamStatus.DRAFT.value,
        created_by=examiner.id,
    )
    db_session.add(exam)
    db_session.flush()

    sec = ExamSection(exam_id=exam.id, title="General Knowledge", display_order=1)
    db_session.add(sec)
    db_session.flush()

    q = Question(
        question_type=QuestionType.MULTIPLE_CHOICE.value,
        subject="Geography",
        topic="Capitals",
        difficulty=QuestionDifficulty.EASY.value,
        created_by=examiner.id,
    )
    db_session.add(q)
    db_session.flush()

    qv = QuestionVersion(
        question_id=q.id,
        version_number=1,
        question_text="What is the capital city of Japan?",
        options=[{"id": "opt-1", "text": "Tokyo"}, {"id": "opt-2", "text": "Kyoto"}],
        correct_answer=["opt-1"],
        accessibility_metadata={"language": "en"},
        created_by=examiner.id,
    )
    db_session.add(qv)
    db_session.flush()

    sq = SectionQuestion(section_id=sec.id, question_id=q.id, question_version_id=qv.id, display_order=1)
    db_session.add(sq)
    db_session.commit()

    resp = publish_exam(db_session, exam.id, examiner.id)
    assert resp.status in [ExamStatus.READY.value, ExamStatus.SCHEDULED.value, ExamStatus.LIVE.value]

from typing import Any, Dict, List, Optional
from sqlalchemy.orm import Session
from app.core.exceptions import EntityNotFoundException, ValidationConflictException
from app.models.question import Question
from app.models.question_version import QuestionVersion
from app.schemas.question import (
    AccessibilityMetadataSchema,
    QuestionCandidateResponse,
    QuestionCreate,
    QuestionExaminerResponse,
    QuestionOptionSchema,
    QuestionUpdate,
    QuestionVersionCreate,
)
from app.services.audit_service import log_audit_event
from app.utils.datetime import utc_now
from app.utils.pagination import paginate
from app.utils.validators import validate_question_accessibility


def create_question(db: Session, data: QuestionCreate, creator_id: str) -> QuestionExaminerResponse:
    """Create a new question and its version 1 with server-side accessibility validation."""
    raw_options = [opt.model_dump() for opt in data.options]
    raw_metadata = data.accessibility_metadata.model_dump() if data.accessibility_metadata else {}

    # Run accessibility gate checks
    is_valid, errors, warnings = validate_question_accessibility(
        question_text=data.question_text,
        options=raw_options,
        metadata=raw_metadata,
    )

    raw_metadata["accessibility_validation_status"] = "VALIDATED" if is_valid else "ERROR"
    raw_metadata["accessibility_errors"] = errors
    raw_metadata["accessibility_warnings"] = warnings

    question = Question(
        question_type=data.question_type,
        subject=data.subject,
        topic=data.topic,
        difficulty=data.difficulty,
        language=data.language,
        created_by=creator_id,
        is_active=True,
    )
    db.add(question)
    db.flush()

    v1 = QuestionVersion(
        question_id=question.id,
        version_number=1,
        question_text=data.question_text,
        options=raw_options,
        correct_answer=data.correct_answer,
        explanation=data.explanation,
        marks=data.marks,
        negative_marks=data.negative_marks,
        accessibility_metadata=raw_metadata,
        created_by=creator_id,
    )
    db.add(v1)
    db.commit()
    db.refresh(question)
    db.refresh(v1)

    log_audit_event(
        db,
        action="QUESTION_CREATE",
        resource_type="Question",
        resource_id=question.id,
        actor_id=creator_id,
        metadata={"subject": question.subject, "difficulty": question.difficulty, "is_accessible": is_valid},
    )

    return get_examiner_question(db, question.id)


def create_question_version(
    db: Session, question_id: str, data: QuestionVersionCreate, user_id: str
) -> QuestionExaminerResponse:
    """Create a new immutable revision/version for an existing question."""
    question = db.query(Question).filter(Question.id == question_id).first()
    if not question:
        raise EntityNotFoundException("Question", question_id)

    latest_version = (
        db.query(QuestionVersion)
        .filter(QuestionVersion.question_id == question_id)
        .order_by(QuestionVersion.version_number.desc())
        .first()
    )
    next_ver = (latest_version.version_number + 1) if latest_version else 1

    raw_options = [opt.model_dump() for opt in data.options]
    raw_metadata = data.accessibility_metadata.model_dump() if data.accessibility_metadata else {}

    is_valid, errors, warnings = validate_question_accessibility(
        question_text=data.question_text,
        options=raw_options,
        metadata=raw_metadata,
    )
    raw_metadata["accessibility_validation_status"] = "VALIDATED" if is_valid else "ERROR"
    raw_metadata["accessibility_errors"] = errors
    raw_metadata["accessibility_warnings"] = warnings

    new_v = QuestionVersion(
        question_id=question.id,
        version_number=next_ver,
        question_text=data.question_text,
        options=raw_options,
        correct_answer=data.correct_answer,
        explanation=data.explanation,
        marks=data.marks,
        negative_marks=data.negative_marks,
        accessibility_metadata=raw_metadata,
        created_by=user_id,
    )
    db.add(new_v)
    question.updated_at = utc_now()
    db.commit()
    db.refresh(new_v)

    log_audit_event(
        db,
        action="QUESTION_VERSION_CREATE",
        resource_type="QuestionVersion",
        resource_id=new_v.id,
        actor_id=user_id,
        metadata={"question_id": question_id, "version": next_ver},
    )

    return get_examiner_question(db, question_id)


def get_examiner_question(db: Session, question_id: str) -> QuestionExaminerResponse:
    """Retrieve full question details including answer key and audit trail for examiners."""
    question = db.query(Question).filter(Question.id == question_id).first()
    if not question:
        raise EntityNotFoundException("Question", question_id)

    latest_v = (
        db.query(QuestionVersion)
        .filter(QuestionVersion.question_id == question_id)
        .order_by(QuestionVersion.version_number.desc())
        .first()
    )
    if not latest_v:
        raise EntityNotFoundException("QuestionVersion", f"latest for {question_id}")

    options_data = [QuestionOptionSchema(**opt) for opt in latest_v.options or []]
    acc_meta = AccessibilityMetadataSchema(**(latest_v.accessibility_metadata or {}))

    return QuestionExaminerResponse(
        id=question.id,
        question_type=question.question_type,
        subject=question.subject,
        topic=question.topic,
        difficulty=question.difficulty,
        language=question.language,
        is_active=question.is_active,
        created_by=question.created_by,
        created_at=question.created_at,
        updated_at=question.updated_at,
        version_number=latest_v.version_number,
        question_text=latest_v.question_text,
        options=options_data,
        correct_answer=latest_v.correct_answer,
        explanation=latest_v.explanation,
        marks=latest_v.marks,
        negative_marks=latest_v.negative_marks,
        accessibility_metadata=acc_meta,
    )


def get_candidate_sanitized_question(db: Session, question_id: str) -> QuestionCandidateResponse:
    """
    Retrieve candidate-facing sanitized question.
    CRITICAL: Strips correct_answer, explanation, and examiner internal notes.
    """
    question = db.query(Question).filter(Question.id == question_id, Question.is_active == True).first()
    if not question:
        raise EntityNotFoundException("Question", question_id)

    latest_v = (
        db.query(QuestionVersion)
        .filter(QuestionVersion.question_id == question_id)
        .order_by(QuestionVersion.version_number.desc())
        .first()
    )
    if not latest_v:
        raise EntityNotFoundException("QuestionVersion", f"latest for {question_id}")

    options_data = [QuestionOptionSchema(**opt) for opt in latest_v.options or []]
    acc_meta = AccessibilityMetadataSchema(**(latest_v.accessibility_metadata or {}))

    return QuestionCandidateResponse(
        id=latest_v.id,
        question_id=question.id,
        version_number=latest_v.version_number,
        question_type=question.question_type,
        subject=question.subject,
        topic=question.topic,
        language=question.language,
        question_text=latest_v.question_text,
        options=options_data,
        marks=latest_v.marks,
        negative_marks=latest_v.negative_marks,
        accessibility_metadata=acc_meta,
    )


def list_questions(
    db: Session,
    subject: Optional[str] = None,
    difficulty: Optional[str] = None,
    search: Optional[str] = None,
    page: int = 1,
    limit: int = 20,
) -> tuple[List[QuestionExaminerResponse], int, int]:
    """List questions with filtering and pagination."""
    query = db.query(Question).filter(Question.is_active == True)

    if subject:
        query = query.filter(Question.subject.ilike(f"%{subject}%"))
    if difficulty:
        query = query.filter(Question.difficulty == difficulty.upper())
    if search:
        query = query.filter(
            (Question.subject.ilike(f"%{search}%")) | (Question.topic.ilike(f"%{search}%"))
        )

    questions_page, total, total_pages = paginate(query, page, limit)
    results = [get_examiner_question(db, q.id) for q in questions_page]
    return results, total, total_pages

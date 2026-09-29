import hashlib
import uuid
from datetime import timedelta
from typing import Any, Dict, List, Optional
from sqlalchemy.orm import Session
from app.core.config import settings
from app.core.exceptions import (
    AlreadySubmittedException,
    EntityNotFoundException,
    ExamNotAvailableException,
    ForbiddenException,
    SessionExpiredException,
    ValidationConflictException,
)
from app.models.exam import Exam, ExamStatus
from app.models.exam_answer import ExamAnswer
from app.models.exam_candidate import AttemptStatus, EligibilityStatus, ExamCandidate
from app.models.exam_session import ExamSession, SessionStatus
from app.models.exam_submission import ExamSubmission, SubmissionStatus
from app.models.question import Question
from app.models.question_version import QuestionVersion
from app.models.section import ExamSection, SectionQuestion
from app.schemas.exam import SectionCandidateDetailResponse
from app.schemas.question import (
    AccessibilityMetadataSchema,
    QuestionCandidateResponse,
    QuestionOptionSchema,
)
from app.schemas.session import (
    CandidateAnswerResponse,
    CandidateAnswerUpdate,
    SessionResponse,
    SessionSubmissionResponse,
    SyncStatusResponse,
)
from app.services.audit_service import log_audit_event
from app.utils.datetime import ensure_utc, seconds_until, utc_now


def start_exam_session(db: Session, exam_id: str, candidate_id: str) -> SessionResponse:
    """
    Initialize or resume an official examination session.
    Enforces Section 20, 59 & 60: Server-Authoritative Timing Architecture!
    """
    exam = db.query(Exam).filter(Exam.id == exam_id).first()
    if not exam:
        raise EntityNotFoundException("Exam", exam_id)

    # 1. Verify exam status
    if exam.status not in [ExamStatus.READY.value, ExamStatus.SCHEDULED.value, ExamStatus.LIVE.value]:
        raise ExamNotAvailableException(f"Examination is currently {exam.status} and cannot be taken.")

    now = utc_now()
    if exam.start_at and now < ensure_utc(exam.start_at):
        raise ExamNotAvailableException(f"Examination has not opened yet. Starts at {exam.start_at.isoformat()}.")
    if exam.end_at and now > ensure_utc(exam.end_at):
        raise ExamNotAvailableException(f"Examination window closed at {exam.end_at.isoformat()}.")

    # 2. Check candidate assignment & eligibility
    candidate_assignment = (
        db.query(ExamCandidate)
        .filter(ExamCandidate.exam_id == exam_id, ExamCandidate.candidate_id == candidate_id)
        .first()
    )
    if candidate_assignment and candidate_assignment.eligibility_status != EligibilityStatus.ELIGIBLE.value:
        raise ForbiddenException("Candidate is not eligible to take this examination.")

    # 3. Check for existing session
    existing_session = (
        db.query(ExamSession)
        .filter(ExamSession.exam_id == exam_id, ExamSession.candidate_id == candidate_id)
        .first()
    )

    if existing_session:
        # Check if already submitted
        if existing_session.status == SessionStatus.SUBMITTED.value:
            raise AlreadySubmittedException("Candidate has already submitted this examination.")

        # Check if expired according to official server clock
        if existing_session.server_expires_at and now > ensure_utc(existing_session.server_expires_at):
            existing_session.status = SessionStatus.EXPIRED.value
            db.commit()
            raise SessionExpiredException("This examination session has expired.")

        # Resume existing active session
        session = existing_session
    else:
        # Create new server-authoritative session with candidate accommodation multiplier (1.0x, 1.5x, 2.0x)
        candidate_multiplier = (
            float(candidate_assignment.time_multiplier)
            if (candidate_assignment and candidate_assignment.time_multiplier)
            else 1.0
        )
        total_seconds = int(exam.duration_seconds * candidate_multiplier) + exam.extra_time_seconds
        server_start = now
        server_expiry = server_start + timedelta(seconds=total_seconds)

        session = ExamSession(
            exam_id=exam_id,
            candidate_id=candidate_id,
            status=SessionStatus.ACTIVE.value,
            server_started_at=server_start,
            server_expires_at=server_expiry,
            last_sync_at=server_start,
        )
        db.add(session)

        # Update candidate attempt status
        if candidate_assignment:
            candidate_assignment.attempt_status = AttemptStatus.IN_PROGRESS.value

        db.commit()
        db.refresh(session)

        log_audit_event(
            db,
            action="EXAM_SESSION_START",
            resource_type="ExamSession",
            resource_id=session.id,
            actor_id=candidate_id,
            metadata={
                "exam_id": exam_id,
                "server_expires_at": str(server_expiry),
                "duration_seconds": total_seconds,
                "time_multiplier": candidate_multiplier,
            },
        )

    return get_session_detail(db, session.id, candidate_id)


def get_session_detail(db: Session, session_id: str, candidate_id: str) -> SessionResponse:
    """
    Retrieve candidate session state with sanitized questions and server time.
    Stripped of all answer keys, explanations, and examiner notes.
    """
    session = db.query(ExamSession).filter(ExamSession.id == session_id).first()
    if not session:
        raise EntityNotFoundException("ExamSession", session_id)

    if session.candidate_id != candidate_id:
        raise ForbiddenException("Cannot access another candidate's examination session.")

    now = utc_now()
    remaining = seconds_until(session.server_expires_at)
    if remaining == 0 and session.status == SessionStatus.ACTIVE.value:
        session.status = SessionStatus.EXPIRED.value
        db.commit()

    # Load sections and candidate-sanitized questions
    sections = (
        db.query(ExamSection)
        .filter(ExamSection.exam_id == session.exam_id)
        .order_by(ExamSection.display_order)
        .all()
    )

    section_details: List[SectionCandidateDetailResponse] = []
    for sec in sections:
        sq_list = (
            db.query(SectionQuestion)
            .filter(SectionQuestion.section_id == sec.id)
            .order_by(SectionQuestion.display_order)
            .all()
        )

        cand_questions: List[QuestionCandidateResponse] = []
        for sq in sq_list:
            qv = db.query(QuestionVersion).filter(QuestionVersion.id == sq.question_version_id).first()
            q = db.query(Question).filter(Question.id == sq.question_id).first()
            if not qv or not q:
                continue

            opts = [QuestionOptionSchema(**opt) for opt in (qv.options or [])]
            acc_meta = AccessibilityMetadataSchema(**(qv.accessibility_metadata or {}))

            # Strictly sanitize: exclude correct_answer and explanation
            cand_q = QuestionCandidateResponse(
                id=qv.id,
                question_id=q.id,
                version_number=qv.version_number,
                question_type=q.question_type,
                subject=q.subject,
                topic=q.topic,
                language=q.language,
                question_text=qv.question_text,
                options=opts,
                marks=qv.marks,
                negative_marks=qv.negative_marks,
                accessibility_metadata=acc_meta,
            )
            cand_questions.append(cand_q)

        section_details.append(
            SectionCandidateDetailResponse(
                id=sec.id,
                exam_id=sec.exam_id,
                title=sec.title,
                description=sec.description,
                display_order=sec.display_order,
                duration_seconds=sec.duration_seconds,
                navigation_policy=sec.navigation_policy,
                question_count=len(cand_questions),
                questions=cand_questions,
            )
        )

    # Load existing answers
    saved_answers = {}
    answer_versions = {}
    for ans in session.answers:
        saved_answers[ans.question_id] = ans.selected_answer
        answer_versions[ans.question_id] = ans.version

    cand_assignment = (
        db.query(ExamCandidate)
        .filter(ExamCandidate.exam_id == session.exam_id, ExamCandidate.candidate_id == session.candidate_id)
        .first()
    )
    time_multiplier = float(cand_assignment.time_multiplier) if (cand_assignment and cand_assignment.time_multiplier) else 1.0

    return SessionResponse(
        id=session.id,
        exam_id=session.exam_id,
        candidate_id=session.candidate_id,
        status=session.status,
        server_started_at=session.server_started_at,
        server_expires_at=session.server_expires_at,
        server_time=now,
        remaining_seconds=remaining,
        submitted_at=session.submitted_at,
        last_sync_at=session.last_sync_at,
        time_multiplier=time_multiplier,
        sections=section_details,
        saved_answers=saved_answers,
        answer_versions=answer_versions,
    )


def save_candidate_answer(
    db: Session,
    session_id: str,
    question_id: str,
    answer_update: CandidateAnswerUpdate,
    candidate_id: str,
) -> CandidateAnswerResponse:
    """
    Save candidate's answer with optimistic concurrency and authoritative timer check.
    Enforces Section 22 & 23: Answer Security & Versioning!
    """
    session = db.query(ExamSession).filter(ExamSession.id == session_id).first()
    if not session:
        raise EntityNotFoundException("ExamSession", session_id)

    if session.candidate_id != candidate_id:
        raise ForbiddenException("Candidate is unauthorized to modify another candidate's answers.")

    if session.status == SessionStatus.SUBMITTED.value:
        raise AlreadySubmittedException("Cannot update answers for an already submitted exam session.")

    now = utc_now()
    if session.server_expires_at and now > ensure_utc(session.server_expires_at):
        session.status = SessionStatus.EXPIRED.value
        db.commit()
        raise SessionExpiredException("Official server timer has expired. Answers can no longer be recorded.")

    # Find existing answer record
    existing_answer = (
        db.query(ExamAnswer)
        .filter(ExamAnswer.session_id == session_id, ExamAnswer.question_id == question_id)
        .first()
    )

    if existing_answer:
        # Optimistic concurrency check: ignore stale network packets
        if answer_update.version < existing_answer.version:
            return CandidateAnswerResponse(
                question_id=question_id,
                selected_answer=existing_answer.selected_answer,
                version=existing_answer.version,
                server_received_at=existing_answer.server_received_at,
                is_saved=True,
            )

        existing_answer.selected_answer = answer_update.selected_answer
        existing_answer.version = answer_update.version + 1
        existing_answer.last_saved_at = answer_update.client_timestamp or now
        existing_answer.server_received_at = now
        ans_record = existing_answer
    else:
        ans_record = ExamAnswer(
            session_id=session_id,
            question_id=question_id,
            selected_answer=answer_update.selected_answer,
            version=1,
            last_saved_at=answer_update.client_timestamp or now,
            server_received_at=now,
        )
        db.add(ans_record)

    session.last_sync_at = now
    db.commit()
    db.refresh(ans_record)

    return CandidateAnswerResponse(
        question_id=question_id,
        selected_answer=ans_record.selected_answer,
        version=ans_record.version,
        server_received_at=ans_record.server_received_at,
        is_saved=True,
    )


def sync_candidate_answers(
    db: Session, session_id: str, answers_list: List[Dict[str, Any]], candidate_id: str
) -> SyncStatusResponse:
    """Batch synchronize offline/reconnected answers with server-authoritative clock."""
    session = db.query(ExamSession).filter(ExamSession.id == session_id).first()
    if not session:
        raise EntityNotFoundException("ExamSession", session_id)

    if session.candidate_id != candidate_id:
        raise ForbiddenException("Candidate is unauthorized to modify this session.")

    now = utc_now()
    remaining = seconds_until(session.server_expires_at)
    is_expired = remaining == 0 or session.status in [SessionStatus.EXPIRED.value, SessionStatus.SUBMITTED.value]

    synced_count = 0
    if not is_expired:
        for item in answers_list:
            qid = item.get("question_id")
            val = item.get("selected_answer")
            ver = item.get("version", 1)
            if qid:
                update_dto = CandidateAnswerUpdate(selected_answer=val, version=ver)
                save_candidate_answer(db, session_id, qid, update_dto, candidate_id)
                synced_count += 1

    session.last_sync_at = now
    db.commit()

    return SyncStatusResponse(
        session_id=session_id,
        server_time=now,
        server_expires_at=session.server_expires_at,
        remaining_seconds=remaining,
        is_expired=is_expired,
        synced_answers_count=synced_count,
    )


def submit_exam_session(
    db: Session, session_id: str, candidate_id: str, idempotency_token: Optional[str] = None
) -> SessionSubmissionResponse:
    """
    Official Exam Submission with Idempotency & Transaction Safety.
    Enforces Section 24, 25, 58 & 61!
    """
    session = db.query(ExamSession).filter(ExamSession.id == session_id).first()
    if not session:
        raise EntityNotFoundException("ExamSession", session_id)

    if session.candidate_id != candidate_id:
        raise ForbiddenException("Candidate is unauthorized to submit another's examination session.")

    # Check if already submitted (Idempotency)
    existing_sub = (
        db.query(ExamSubmission).filter(ExamSubmission.session_id == session_id).first()
    )
    if existing_sub:
        return SessionSubmissionResponse(
            session_id=session.id,
            status=existing_sub.status,
            submission_reference=existing_sub.submission_reference,
            submitted_at=existing_sub.submitted_at,
            message="Examination has already been officially submitted.",
        )

    now = utc_now()
    # Check if timer expired beyond grace period
    grace_cutoff = ensure_utc(session.server_expires_at) + timedelta(seconds=settings.SUBMISSION_GRACE_PERIOD_SECONDS)
    if now > grace_cutoff:
        session.status = SessionStatus.EXPIRED.value
        db.commit()
        raise SessionExpiredException("Submission rejected: Examination timer has fully expired beyond grace period.")

    # Generate secure, immutable submission reference
    raw_ref = f"{session_id}-{candidate_id}-{now.isoformat()}-{uuid.uuid4()}"
    submission_reference = f"GW-{hashlib.sha256(raw_ref.encode()).hexdigest()[:12].upper()}"

    submission = ExamSubmission(
        session_id=session_id,
        submitted_at=now,
        status=SubmissionStatus.SUBMITTED.value,
        submission_reference=submission_reference,
    )
    db.add(submission)

    session.status = SessionStatus.SUBMITTED.value
    session.submitted_at = now

    # Update candidate assignment attempt status
    cand_assignment = (
        db.query(ExamCandidate)
        .filter(ExamCandidate.exam_id == session.exam_id, ExamCandidate.candidate_id == candidate_id)
        .first()
    )
    if cand_assignment:
        cand_assignment.attempt_status = AttemptStatus.COMPLETED.value

    db.commit()
    db.refresh(submission)

    # Compute immediate preliminary objective results
    from app.services.result_service import calculate_and_store_results
    calculate_and_store_results(db, session_id)

    log_audit_event(
        db,
        action="EXAM_SESSION_SUBMIT",
        resource_type="ExamSubmission",
        resource_id=submission.id,
        actor_id=candidate_id,
        metadata={"submission_reference": submission_reference, "submitted_at": str(now)},
    )

    return SessionSubmissionResponse(
        session_id=session.id,
        status=submission.status,
        submission_reference=submission.submission_reference,
        submitted_at=submission.submitted_at,
        message="Examination submitted successfully and queued for authoritative evaluation.",
    )

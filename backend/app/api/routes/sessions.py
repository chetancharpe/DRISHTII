from typing import Any, Dict, List
from fastapi import APIRouter, Depends, status
from sqlalchemy.orm import Session
from app.api.deps import get_current_user, get_db
from app.models.user import User
from app.schemas.session import (
    CandidateAnswerResponse,
    CandidateAnswerUpdate,
    SessionResponse,
    SessionSubmissionResponse,
    SessionSubmitRequest,
    SyncAnswersRequest,
    SyncStatusResponse,
)
from app.services.session_service import (
    get_session_detail,
    save_candidate_answer,
    submit_exam_session,
    sync_candidate_answers,
)

router = APIRouter(prefix="/exam-sessions", tags=["Exam Sessions & Authoritative Timer"])


@router.get("/{session_id}", response_model=SessionResponse)
def get_session(
    session_id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """
    Retrieve active session state, current server time, remaining seconds,
    and sanitized question content.
    """
    return get_session_detail(db, session_id, current_user.id)


@router.patch("/{session_id}/answers/{question_id}", response_model=CandidateAnswerResponse)
def save_answer(
    session_id: str,
    question_id: str,
    answer_update: CandidateAnswerUpdate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """
    Persist candidate answer.
    Enforces optimistic concurrency versioning and server-authoritative timer boundary.
    """
    return save_candidate_answer(db, session_id, question_id, answer_update, current_user.id)


@router.post("/{session_id}/sync", response_model=SyncStatusResponse)
def sync_answers(
    session_id: str,
    sync_data: SyncAnswersRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Batch synchronize offline answers and return authoritative server clock timestamp."""
    raw_list = [item.model_dump() for item in sync_data.answers]
    return sync_candidate_answers(db, session_id, raw_list, current_user.id)


@router.post("/{session_id}/submit", response_model=SessionSubmissionResponse)
def submit_session(
    session_id: str,
    submit_data: SessionSubmitRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """
    Finalize examination session.
    Idempotent: prevents duplicate submission and guarantees transaction safety.
    Triggers authoritative server scoring.
    """
    return submit_exam_session(db, session_id, current_user.id, submit_data.idempotency_token)

"""
DRISHTI Educational AI Routes
Provides secure LLM-assisted concept explanations, plain language simplifications,
topic summaries, and alt-text generation with strict active exam isolation.
"""

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.api.deps import get_current_user, get_db
from app.models.exam_session import ExamSession, SessionStatus
from app.models.user import User
from app.schemas.ai import (
    AltTextGenerateRequest,
    AltTextGenerateResponse,
    ConceptExplanationRequest,
    ConceptExplanationResponse,
    SimplifyTextRequest,
    SimplifyTextResponse,
    SummarizeTopicRequest,
    SummarizeTopicResponse,
)
from app.services.ai_service import ai_service

router = APIRouter(prefix="/ai", tags=["Educational AI"])


def _assert_not_in_live_exam(db: Session, user: User, client_declared_live_exam: bool = False):
    """
    Enforces strict exam integrity invariant:
    AI educational assistance must NEVER be accessible during official live examinations.
    Checks both client-declared flag and active database examination sessions.
    """
    if client_declared_live_exam:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="AI assistance is strictly disabled during active live examinations to maintain assessment integrity.",
        )

    # Server-authoritative check: active live examination session in database
    active_session = (
        db.query(ExamSession)
        .filter(
            ExamSession.candidate_id == user.id,
            ExamSession.status.in_([SessionStatus.ACTIVE.value, SessionStatus.CREATED.value]),
        )
        .first()
    )
    if active_session:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="AI assistance is disabled while an official live examination session is active.",
        )


@router.post("/explain", response_model=ConceptExplanationResponse)
def explain_concept(
    data: ConceptExplanationRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """
    Pedagogical Concept Explainer (Learning & Practice modes only).
    Breaks down equations and reasoning step by step with accessibility considerations.
    Strictly blocked during active live examinations.
    """
    _assert_not_in_live_exam(db, current_user, data.is_live_exam)
    return ai_service.explain_concept(
        question_text=data.question_text, topic=data.topic, subject=data.subject
    )


@router.post("/simplify", response_model=SimplifyTextResponse)
def simplify_text(
    data: SimplifyTextRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """
    Plain Language Simplifier (WCAG 2.1 AA cognitive accessibility).
    Rewrites convoluted or academic language into clear, direct prose.
    """
    _assert_not_in_live_exam(db, current_user, data.is_live_exam)
    return ai_service.simplify_text(complex_text=data.complex_text)


@router.post("/summarize", response_model=SummarizeTopicResponse)
def summarize_topic(
    data: SummarizeTopicRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """
    Topic Summary & Revision Notes generator for candidates.
    """
    _assert_not_in_live_exam(db, current_user, data.is_live_exam)
    return ai_service.summarize_topic(topic=data.topic, subject=data.subject)


@router.post("/alt-text", response_model=AltTextGenerateResponse)
def generate_alt_text(
    data: AltTextGenerateRequest,
    current_user: User = Depends(get_current_user),
):
    """
    AI Alt-Text and Long Description Generator for examiners authoring diagrams.
    Enforces WCAG 2.1 Non-Text Content (1.1.1) guidelines.
    """
    return ai_service.generate_alt_text(
        question_context=data.question_context,
        diagram_type=data.diagram_type,
        image_url=data.image_url,
    )

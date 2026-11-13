"""
DRISHTI Educational AI Routes
Provides secure LLM-assisted concept explanations, plain language simplifications,
topic summaries, and alt-text generation with strict active exam isolation.
"""

from typing import Optional
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.api.deps import get_current_user, get_db
from app.models.exam_session import ExamSession, SessionStatus
from app.models.user import User
from app.schemas.ai import (
    AITutorChatRequest,
    AITutorChatResponse,
    AltTextGenerateRequest,
    AltTextGenerateResponse,
    CandidateBriefingResponse,
    CandidateProgressVoiceResponse,
    ConceptExplanationRequest,
    ConceptExplanationResponse,
    NotificationAnnouncementResponse,
    PlatformKnowledgeResponse,
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


@router.post("/tutor-chat", response_model=AITutorChatResponse)
def tutor_chat(
    data: AITutorChatRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """
    Drishti Sarthi AI Tutor & Voice Companion for Candidate Portal.
    Intelligent Mode-Aware Assistant:
    - In Practice / Learning: Explains concepts, answers questions, guides candidate as a supportive friend.
    - In Official Live Exam: Operates as strict Digital Scribe / Reader (reads questions, blocks exam answers).
    """
    candidate_first = (current_user.first_name or "").replace("[DEMO]", "").strip()
    candidate_name = candidate_first or "Student"

    # Server-authoritative check: active live examination session in database
    active_session = (
        db.query(ExamSession)
        .filter(
            ExamSession.candidate_id == current_user.id,
            ExamSession.status.in_([SessionStatus.ACTIVE.value, SessionStatus.CREATED.value]),
        )
        .first()
    )
    context = data.context or {}
    path = str(context.get("path") or "")
    is_in_live_exam = ("/session" in path) or (data.mode == "exam_live") or bool(context.get("isLiveExam"))
    effective_mode = "exam_live" if (is_in_live_exam and (data.mode == "exam_live" or active_session)) else data.mode

    req = data.model_copy(update={"mode": effective_mode, "candidate_name": candidate_name})
    return ai_service.chat_tutor(request=req, candidate_name=candidate_name, db=db)


@router.get("/candidate-briefing", response_model=CandidateBriefingResponse, response_model_by_alias=True)
def get_candidate_briefing(
    language: Optional[str] = "hi",
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """
    Generate personalized spoken onboarding briefing for visually impaired candidate upon login.
    Greets candidate, announces teacher-uploaded exams/tests status, and initiates study plan dialogue.
    """
    return ai_service.generate_candidate_briefing(user=current_user, db=db, language=language or "hi")


@router.get("/platform-knowledge", response_model=PlatformKnowledgeResponse, response_model_by_alias=True)
def get_platform_knowledge(
    language: Optional[str] = "hi",
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """
    Provides real platform curriculum, available mock tests, and question inventory
    for conversational voice discovery by visually impaired candidates.
    """
    return ai_service.get_platform_knowledge(db=db, language=language or "hi")


@router.get("/notifications", response_model=NotificationAnnouncementResponse, response_model_by_alias=True)
def get_notifications(
    language: Optional[str] = "hi",
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """
    Retrieves real platform announcements, uploaded test alerts, and published results
    formatted as accessible voice announcements.
    """
    return ai_service.get_notifications_announcement(user=current_user, db=db, language=language or "hi")


@router.get("/candidate-progress-summary", response_model=CandidateProgressVoiceResponse, response_model_by_alias=True)
def get_candidate_progress_summary(
    language: Optional[str] = "hi",
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """
    Retrieves candidate's real diagnostic performance metrics and weak/strong topics
    to formulate encouraging, supportive spoken feedback.
    """
    return ai_service.get_candidate_progress_summary(user=current_user, db=db, language=language or "hi")

from typing import List, Optional
from fastapi import APIRouter, Depends, Query, status
from sqlalchemy.orm import Session
from app.api.deps import get_db, require_examiner_access
from app.models.user import User
from app.schemas.question import (
    AltTextEvaluationRequest,
    AltTextEvaluationResponse,
    QuestionCreate,
    QuestionExaminerResponse,
    QuestionVersionCreate,
)
from app.utils.validators import evaluate_alt_text_quality
from app.services.question_service import (
    create_question,
    create_question_version,
    get_examiner_question,
    list_questions,
)

router = APIRouter(prefix="/question-bank", tags=["Question Bank"])


@router.get("", response_model=List[QuestionExaminerResponse])
def get_questions(
    subject: Optional[str] = Query(None),
    difficulty: Optional[str] = Query(None),
    search: Optional[str] = Query(None),
    page: int = Query(1, ge=1),
    limit: int = Query(20, ge=1, le=100),
    current_user: User = Depends(require_examiner_access),
    db: Session = Depends(get_db),
):
    """List questions in the question bank with filtering and pagination."""
    questions, _, _ = list_questions(db, subject, difficulty, search, page, limit)
    return questions


@router.post("/questions", response_model=QuestionExaminerResponse, status_code=status.HTTP_201_CREATED)
def create_new_question(
    data: QuestionCreate,
    current_user: User = Depends(require_examiner_access),
    db: Session = Depends(get_db),
):
    """
    Create a new question and version 1.
    Runs independent server-side accessibility validation gate on formulas, images, and tables.
    """
    return create_question(db, data, current_user.id)


@router.get("/questions/{question_id}", response_model=QuestionExaminerResponse)
def get_question(
    question_id: str,
    current_user: User = Depends(require_examiner_access),
    db: Session = Depends(get_db),
):
    """Retrieve full examiner question details including answer key and accessibility status."""
    return get_examiner_question(db, question_id)


@router.post("/questions/{question_id}/versions", response_model=QuestionExaminerResponse, status_code=status.HTTP_201_CREATED)
def add_question_version(
    question_id: str,
    data: QuestionVersionCreate,
    current_user: User = Depends(require_examiner_access),
    db: Session = Depends(get_db),
):
    """Create a new version revision for an existing question with re-validated accessibility."""
    return create_question_version(db, question_id, data, current_user.id)


@router.post("/alt-text/evaluate", response_model=AltTextEvaluationResponse)
def evaluate_question_alt_text(
    data: AltTextEvaluationRequest,
    current_user: User = Depends(require_examiner_access),
):
    """
    AI Alt-Text Verification Gate.
    Analyzes alt-text quality, flags forbidden placeholders, identifies diagram domains,
    and returns automated WCAG 2.2 AA compliant suggestions.
    """
    res = evaluate_alt_text_quality(
        alt_text=data.alt_text,
        long_description=data.long_description or "",
        question_context=data.question_context or "",
        image_url=data.image_url or "",
    )
    return AltTextEvaluationResponse(**res)


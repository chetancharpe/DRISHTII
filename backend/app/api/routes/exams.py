from typing import List
from fastapi import APIRouter, Depends, Query, status
from sqlalchemy.orm import Session
from app.api.deps import get_current_user, get_db, require_examiner_access
from app.models.user import User
from app.schemas.exam import (
    ExamCandidateAssignRequest,
    ExamCandidateResponse,
    ExamCreate,
    ExamExaminerResponse,
    ExamScheduleRequest,
    ExamUpdate,
    SectionCreate,
    SectionResponse,
)
from app.schemas.session import SessionResponse
from app.services.exam_service import (
    add_section_to_exam,
    assign_candidates_to_exam,
    create_exam,
    get_examiner_exam,
    list_candidate_exams,
    list_examiner_exams,
    publish_exam,
    schedule_exam,
    update_exam,
)
from app.services.session_service import start_exam_session

router = APIRouter(tags=["Examinations"])


# --- CANDIDATE ENDPOINTS ---

@router.get("/exams", response_model=List[ExamCandidateResponse])
def get_candidate_exams(
    page: int = Query(1, ge=1),
    limit: int = Query(20, ge=1, le=100),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """List accessible examinations for candidate with eligibility status."""
    exams, _, _ = list_candidate_exams(db, current_user.id, page, limit)
    return exams


@router.post("/exams/{exam_id}/sessions", response_model=SessionResponse, status_code=status.HTTP_201_CREATED)
def start_session(
    exam_id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """
    Start or resume an official examination session.
    Calculates server-authoritative timer: server_started_at and server_expires_at.
    Returns sanitized questions strictly stripped of answer keys and explanations.
    """
    return start_exam_session(db, exam_id, current_user.id)


# --- EXAMINER ENDPOINTS ---

@router.get("/examiner/exams", response_model=List[ExamExaminerResponse])
def get_all_examiner_exams(
    page: int = Query(1, ge=1),
    limit: int = Query(50, ge=1, le=100),
    current_user: User = Depends(require_examiner_access),
    db: Session = Depends(get_db),
):
    """List all examinations for examiner management."""
    return list_examiner_exams(db, page, limit)


@router.post("/examiner/exams", response_model=ExamExaminerResponse, status_code=status.HTTP_201_CREATED)
def create_new_exam(
    data: ExamCreate,
    current_user: User = Depends(require_examiner_access),
    db: Session = Depends(get_db),
):
    """Create a new exam in DRAFT status."""
    return create_exam(db, data, current_user.id)


@router.get("/examiner/exams/{exam_id}", response_model=ExamExaminerResponse)
def get_exam_details(
    exam_id: str,
    current_user: User = Depends(require_examiner_access),
    db: Session = Depends(get_db),
):
    """Retrieve full exam metadata, sections, and candidate counts for examiners."""
    return get_examiner_exam(db, exam_id)


@router.patch("/examiner/exams/{exam_id}", response_model=ExamExaminerResponse)
def update_exam_details(
    exam_id: str,
    data: ExamUpdate,
    current_user: User = Depends(require_examiner_access),
    db: Session = Depends(get_db),
):
    """Update exam details. Structural fields are locked once exam is LIVE."""
    return update_exam(db, exam_id, data, current_user.id)


@router.post("/examiner/exams/{exam_id}/sections", response_model=SectionResponse, status_code=status.HTTP_201_CREATED)
def add_section(
    exam_id: str,
    data: SectionCreate,
    current_user: User = Depends(require_examiner_access),
    db: Session = Depends(get_db),
):
    """Add a section and associate question versions to an examination."""
    return add_section_to_exam(db, exam_id, data, current_user.id)


@router.post("/examiner/exams/{exam_id}/schedule", response_model=ExamExaminerResponse)
def set_exam_schedule(
    exam_id: str,
    schedule: ExamScheduleRequest,
    current_user: User = Depends(require_examiner_access),
    db: Session = Depends(get_db),
):
    """Configure official start and end time windows."""
    return schedule_exam(db, exam_id, schedule, current_user.id)


@router.post("/examiner/exams/{exam_id}/candidates")
def assign_candidates(
    exam_id: str,
    data: ExamCandidateAssignRequest,
    current_user: User = Depends(require_examiner_access),
    db: Session = Depends(get_db),
):
    """Assign candidate users to an examination."""
    assigned_count = assign_candidates_to_exam(db, exam_id, data.candidate_ids, current_user.id)
    return {"message": f"Successfully assigned {assigned_count} candidates.", "assigned_count": assigned_count}


@router.post("/examiner/exams/{exam_id}/publish", response_model=ExamExaminerResponse)
def publish_examination(
    exam_id: str,
    current_user: User = Depends(require_examiner_access),
    db: Session = Depends(get_db),
):
    """
    Publish examination.
    Enforces Section 48 & 49: Independent Server-Side Accessibility Gate!
    Validates alt text, table headers, readable content, and answer configurations.
    """
    return publish_exam(db, exam_id, current_user.id)

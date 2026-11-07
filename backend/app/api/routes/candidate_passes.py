from typing import List
from fastapi import APIRouter, Depends, status
from sqlalchemy.orm import Session

from app.api.deps import get_db, require_examiner_access
from app.models.user import User
from app.schemas.candidate_pass import CandidateAccessPassCreate, CandidateAccessPassResponse
from app.services.candidate_pass_service import (
    create_candidate_pass,
    list_candidate_passes,
    revoke_candidate_pass,
)

router = APIRouter(prefix="/examiner/candidate-passes", tags=["Examiner Candidate Passes"])


@router.get("", response_model=List[CandidateAccessPassResponse])
def get_candidate_passes(
    current_user: User = Depends(require_examiner_access),
    db: Session = Depends(get_db),
):
    """List all candidate access passes issued by examiner/teachers."""
    return list_candidate_passes(db, current_user.id)


@router.post("", response_model=CandidateAccessPassResponse, status_code=status.HTTP_201_CREATED)
def issue_candidate_pass(
    data: CandidateAccessPassCreate,
    current_user: User = Depends(require_examiner_access),
    db: Session = Depends(get_db),
):
    """
    Issue a new unique candidate access pass.
    Allows visually impaired students to access exams and practice tests directly without passwords.
    """
    return create_candidate_pass(db, data, current_user.id)


@router.delete("/{pass_id}", status_code=status.HTTP_200_OK)
def delete_or_revoke_candidate_pass(
    pass_id: str,
    current_user: User = Depends(require_examiner_access),
    db: Session = Depends(get_db),
):
    """Deactivate or revoke an access pass."""
    revoke_candidate_pass(db, pass_id, current_user.id)
    return {"message": "Candidate access pass revoked successfully."}


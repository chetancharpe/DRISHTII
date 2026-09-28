from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from app.api.deps import get_current_user, get_db
from app.models.user import User
from app.schemas.candidate import CandidateDashboardResponse
from app.services.candidate_dashboard_service import get_candidate_dashboard

router = APIRouter(prefix="/candidate", tags=["Candidate Dashboard"])


@router.get("/dashboard", response_model=CandidateDashboardResponse)
def get_dashboard_data(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """
    Retrieve candidate dashboard payload.
    Aggregates learning streak, next actionable practice, subject masteries,
    recommendations, mock tests, and upcoming examinations.
    """
    return get_candidate_dashboard(db=db, user=current_user)

from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from app.api.deps import get_db, require_examiner_access
from app.models.user import User
from app.schemas.analytics import ExamAnalyticsResponse, ExamMonitorSummary
from app.services.analytics_service import get_exam_analytics, get_exam_monitoring_summary

router = APIRouter(prefix="/examiner/exams", tags=["Monitoring & Analytics"])


@router.get("/{exam_id}/monitor", response_model=ExamMonitorSummary)
def monitor_live_exam(
    exam_id: str,
    current_user: User = Depends(require_examiner_access),
    db: Session = Depends(get_db),
):
    """
    Real-time examination telemetry.
    Aggregates active, interrupted, and submitted counts with masked candidate names.
    Preserves candidate privacy.
    """
    return get_exam_monitoring_summary(db, exam_id)


@router.get("/{exam_id}/analytics", response_model=ExamAnalyticsResponse)
def get_analytics(
    exam_id: str,
    current_user: User = Depends(require_examiner_access),
    db: Session = Depends(get_db),
):
    """Retrieve scoring distribution, pass rates, and per-question accuracy analytics."""
    return get_exam_analytics(db, exam_id)

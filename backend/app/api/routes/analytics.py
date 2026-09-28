from fastapi import APIRouter, Depends, Query, Response
from sqlalchemy.orm import Session
from app.api.deps import get_db, require_examiner_access
from app.models.user import User
from app.schemas.analytics import ExamAnalyticsResponse, ExamMonitorSummary
from app.services.analytics_service import (
    generate_exam_analytics_csv,
    get_exam_analytics,
    get_exam_monitoring_summary,
)

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


@router.get("/{exam_id}/analytics/export")
def export_analytics(
    exam_id: str,
    format: str = Query("csv", pattern="^(csv|json)$"),
    current_user: User = Depends(require_examiner_access),
    db: Session = Depends(get_db),
):
    """
    Export comprehensive psychometric assessment report.
    Supports CSV download with item discrimination indices, distractor breakdowns,
    Cronbach's alpha, and candidate accommodation equity analysis.
    """
    if format == "csv":
        csv_data = generate_exam_analytics_csv(db, exam_id)
        return Response(
            content=csv_data,
            media_type="text/csv",
            headers={
                "Content-Disposition": f"attachment; filename=exam_{exam_id}_psychometrics.csv",
                "Cache-Control": "no-cache",
            },
        )
    return get_exam_analytics(db, exam_id)

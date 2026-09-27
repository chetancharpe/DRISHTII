from fastapi import APIRouter, Depends, status
from sqlalchemy.orm import Session
from app.api.deps import get_current_user, get_db, require_admin
from app.models.user import User
from app.schemas.accessibility import (
    AccessibilityAuditReport,
    AccessibilityIssueCreate,
    AccessibilityIssueResponse,
    AccessibilityProfileSchema,
    AccessibilityProfileUpdate,
    AccessibilityResetResponse,
    AccessibilityScorecardResponse,
)
from app.services.accessibility_service import (
    get_accessibility_scorecard,
    get_or_create_accessibility_profile,
    report_accessibility_issue,
    reset_accessibility_profile,
    update_accessibility_profile,
)
from app.services.accessibility_audit_service import (
    audit_question_version,
    audit_exam,
)

router = APIRouter(prefix="/accessibility", tags=["Accessibility"])


@router.get("/profile", response_model=AccessibilityProfileSchema)
def get_profile(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Retrieve personalized accessibility preferences for the authenticated candidate."""
    return get_or_create_accessibility_profile(db, current_user.id)


@router.patch("/profile", response_model=AccessibilityProfileSchema)
def update_profile(
    updates: AccessibilityProfileUpdate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """
    Update accessibility preferences with rigorous server-side validation.
    Persists across sessions and restores on next login.
    """
    return update_accessibility_profile(db, current_user.id, updates)


@router.post("/reset", response_model=AccessibilityResetResponse)
def reset_profile(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Reset accessibility preferences back to baseline standard defaults."""
    return reset_accessibility_profile(db, current_user.id)


@router.post("/report-issue", response_model=AccessibilityIssueResponse, status_code=status.HTTP_201_CREATED)
def report_issue(
    issue_data: AccessibilityIssueCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """
    Report an accessibility barrier or usability friction point.
    Strictly preserves privacy: does not require or collect medical or disability disclosures.
    """
    return report_accessibility_issue(db, issue_data, current_user.id)


@router.get("/scorecard", response_model=AccessibilityScorecardResponse)
def get_scorecard(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Retrieve platform accessibility quality scorecard (alt text, table headers, formula speech)."""
    return get_accessibility_scorecard(db)


@router.get("/audit/question/{version_id}", response_model=AccessibilityAuditReport)
def get_question_audit(
    version_id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Examiner gate: Validate an individual question version against WCAG 2.1 AA before publishing."""
    return audit_question_version(db, version_id)


@router.get("/audit/exam/{exam_id}", response_model=AccessibilityAuditReport)
def get_exam_audit(
    exam_id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Examiner gate: Validate an entire examination against WCAG 2.1 AA before scheduling."""
    return audit_exam(db, exam_id)


from datetime import datetime, timezone
from typing import Optional
import uuid
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
    AccessibilityEventCreate,
    AccessibilityEventResponse,
    CandidatePresenceResult,
    GestureClassificationResult,
)
from app.accessibility import (
    CandidatePresenceDetector,
    HandGestureClassifier,
    InteractionManager,
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


# ========================================================
# AI Accessibility & Interaction Monitoring Telemetry (Requirement #9)
# ========================================================

presence_detector_instance = CandidatePresenceDetector()
gesture_classifier_instance = HandGestureClassifier()
interaction_manager_instance = InteractionManager()


@router.post("/events", response_model=AccessibilityEventResponse, status_code=status.HTTP_201_CREATED)
def record_accessibility_event(
    event: AccessibilityEventCreate,
    db: Session = Depends(get_db),
    current_user: Optional[User] = Depends(get_current_user),
):
    """
    Ingests AI Accessibility & Interaction Monitoring events.
    Strict privacy compliance:
    - Never receives or persists raw camera images or video frames.
    - No biometric markers stored.
    - Captures operational metadata (presence status, detected gestures, keyboard activity).
    """
    event_id = f"evt_{uuid.uuid4().hex[:12]}"
    now = datetime.now(timezone.utc)

    # Determine action taken based on event type
    action = None
    if event.eventType == "GESTURE_DETECTED" and event.gesture:
        res = interaction_manager_instance.handle_gesture(event.gesture, event.questionId)
        action = res.get("action")
    elif event.eventType == "KEYBOARD_ACTION" and event.key:
        res = interaction_manager_instance.handle_keyboard(event.key, event.questionId)
        action = res.get("action")
    elif event.eventType == "CANDIDATE_ABSENT":
        action = "trigger_absence_alert"
    elif event.eventType == "HELP_REQUESTED":
        action = "register_proctor_assistance"

    return AccessibilityEventResponse(
        status="success",
        event_id=event_id,
        received_at=now,
        eventType=event.eventType,
        action_taken=action,
    )


@router.post("/presence", response_model=CandidatePresenceResult)
def evaluate_presence_endpoint(
    present: bool,
    position_shift: float = 0.0,
    face_area_ratio: float = 0.10,
    current_user: Optional[User] = Depends(get_current_user),
):
    """
    Evaluates candidate presence using the temporal window rules.
    Does not alert on a single frame; requires absence >= ABSENCE_THRESHOLD_SECONDS (3.0s).
    """
    result = presence_detector_instance.evaluate_presence(
        present=present,
        position_shift=position_shift,
        face_area_ratio=face_area_ratio,
    )
    return CandidatePresenceResult(**result)



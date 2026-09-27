from datetime import datetime, timezone
from typing import Optional
from sqlalchemy.orm import Session
from app.core.exceptions import EntityNotFoundException
from app.models.accessibility_profile import AccessibilityIssue, AccessibilityProfile
from app.models.question import Question
from app.models.question_version import QuestionVersion
from app.schemas.accessibility import (
    AccessibilityIssueCreate,
    AccessibilityIssueResponse,
    AccessibilityProfileSchema,
    AccessibilityProfileUpdate,
    AccessibilityResetResponse,
    AccessibilityScorecardResponse,
)
from app.services.audit_service import log_audit_event
from app.utils.datetime import utc_now


def get_or_create_accessibility_profile(db: Session, user_id: str) -> AccessibilityProfileSchema:
    """Retrieve existing user accessibility profile or initialize with accessible defaults."""
    profile = db.query(AccessibilityProfile).filter(AccessibilityProfile.user_id == user_id).first()
    if not profile:
        profile = AccessibilityProfile(
            user_id=user_id,
            text_scale="default",
            contrast_mode="standard",
            theme="system",
            reduced_motion=False,
            simplified_interface=False,
            screen_reader_mode=False,
            keyboard_navigation=False,
            audio_assistance=False,
            speech_rate=1.0,
            speech_volume=1.0,
            preferred_language="en",
            timer_announcement_mode="warnings",
            question_reading_mode="question_and_options",
        )
        db.add(profile)
        db.commit()
        db.refresh(profile)

    return AccessibilityProfileSchema.model_validate(profile)


def update_accessibility_profile(
    db: Session, user_id: str, updates: AccessibilityProfileUpdate
) -> AccessibilityProfileSchema:
    """Update accessibility preferences with server-side validation."""
    profile = db.query(AccessibilityProfile).filter(AccessibilityProfile.user_id == user_id).first()
    if not profile:
        profile = AccessibilityProfile(user_id=user_id)
        db.add(profile)

    update_dict = updates.model_dump(exclude_unset=True)
    for field, val in update_dict.items():
        if val is not None:
            setattr(profile, field, val)

    profile.updated_at = utc_now()
    db.commit()
    db.refresh(profile)

    log_audit_event(
        db,
        action="ACCESSIBILITY_PROFILE_UPDATE",
        resource_type="AccessibilityProfile",
        resource_id=profile.id,
        actor_id=user_id,
        metadata={"updated_fields": list(update_dict.keys())},
    )

    return AccessibilityProfileSchema.model_validate(profile)


def reset_accessibility_profile(db: Session, user_id: str) -> AccessibilityResetResponse:
    """Reset accessibility preferences back to baseline standard defaults."""
    profile = db.query(AccessibilityProfile).filter(AccessibilityProfile.user_id == user_id).first()
    if not profile:
        profile = AccessibilityProfile(user_id=user_id)
        db.add(profile)

    profile.text_scale = "default"
    profile.contrast_mode = "standard"
    profile.theme = "system"
    profile.reduced_motion = False
    profile.simplified_interface = False
    profile.screen_reader_mode = False
    profile.keyboard_navigation = False
    profile.audio_assistance = False
    profile.speech_rate = 1.0
    profile.speech_volume = 1.0
    profile.preferred_language = "en"
    profile.timer_announcement_mode = "warnings"
    profile.question_reading_mode = "question_and_options"
    profile.updated_at = utc_now()

    db.commit()
    db.refresh(profile)

    log_audit_event(
        db,
        action="ACCESSIBILITY_PROFILE_RESET",
        resource_type="AccessibilityProfile",
        resource_id=profile.id,
        actor_id=user_id,
    )

    return AccessibilityResetResponse(
        status="success",
        message="Accessibility settings reset to platform defaults.",
        profile=AccessibilityProfileSchema.model_validate(profile),
    )


def report_accessibility_issue(
    db: Session, data: AccessibilityIssueCreate, user_id: Optional[str] = None
) -> AccessibilityIssueResponse:
    """Record an accessibility barrier report without requiring disability disclosure."""
    issue = AccessibilityIssue(
        user_id=user_id,
        page_url=data.page_url.strip(),
        issue_type=data.issue_type,
        description=data.description.strip(),
        status="OPEN",
    )
    db.add(issue)
    db.commit()
    db.refresh(issue)

    log_audit_event(
        db,
        action="ACCESSIBILITY_ISSUE_REPORTED",
        resource_type="AccessibilityIssue",
        resource_id=issue.id,
        actor_id=user_id,
        metadata={"issue_type": issue.issue_type, "page_url": issue.page_url},
    )

    return AccessibilityIssueResponse.model_validate(issue)


def get_accessibility_scorecard(db: Session) -> AccessibilityScorecardResponse:
    """Generate quality scorecard of accessible questions and reported platform issues."""
    versions = db.query(QuestionVersion).all()
    total_q = len(versions)
    if total_q == 0:
        return AccessibilityScorecardResponse(
            total_questions=0,
            alt_text_coverage_percentage=100.0,
            accessible_formula_coverage_percentage=100.0,
            table_header_coverage_percentage=100.0,
            total_reported_issues=0,
            open_issues=0,
            resolved_issues=0,
            readiness_status="EXCELLENT",
        )

    with_alt = sum(1 for v in versions if (v.accessibility_metadata or {}).get("has_alt_text", False))
    with_formula = sum(1 for v in versions if (v.accessibility_metadata or {}).get("has_accessible_formula", False))
    with_tables = sum(1 for v in versions if (v.accessibility_metadata or {}).get("has_table_headers", False))

    issues = db.query(AccessibilityIssue).all()
    total_issues = len(issues)
    open_issues = sum(1 for i in issues if i.status == "OPEN")
    resolved_issues = sum(1 for i in issues if i.status == "RESOLVED")

    alt_cov = round((with_alt / total_q * 100), 1)
    form_cov = round((with_formula / total_q * 100), 1)
    table_cov = round((with_tables / total_q * 100), 1)

    readiness = "EXCELLENT" if open_issues == 0 else "ATTENTION_NEEDED"

    return AccessibilityScorecardResponse(
        total_questions=total_q,
        alt_text_coverage_percentage=alt_cov,
        accessible_formula_coverage_percentage=form_cov,
        table_header_coverage_percentage=table_cov,
        total_reported_issues=total_issues,
        open_issues=open_issues,
        resolved_issues=resolved_issues,
        readiness_status=readiness,
    )

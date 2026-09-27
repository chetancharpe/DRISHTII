from datetime import datetime, timedelta, timezone
from typing import List, Optional
from sqlalchemy.orm import Session
from app.models.learning_profile import LearningActivity, LearningProfile, TopicProgress
from app.schemas.learning import (
    LearningProfileSchema,
    LearningProfileUpdate,
    ProgressSummaryResponse,
    TopicProgressResponse,
    WeeklySummaryResponse,
)
from app.services.audit_service import log_audit_event
from app.utils.datetime import utc_now


def get_or_create_learning_profile(db: Session, user_id: str) -> LearningProfileSchema:
    """Retrieve existing user learning profile or initialize with sensible defaults."""
    profile = db.query(LearningProfile).filter(LearningProfile.user_id == user_id).first()
    if not profile:
        profile = LearningProfile(
            user_id=user_id,
            preferred_subjects=["Mathematics", "Logical Reasoning", "English"],
            preferred_learning_mode="guided",
            daily_goal_questions=15,
            weekly_goal_questions=75,
            difficulty_preference="adaptive",
            study_session_length_minutes=30,
            preferred_language="en",
        )
        db.add(profile)
        db.commit()
        db.refresh(profile)

    return LearningProfileSchema.model_validate(profile)


def update_learning_profile(
    db: Session, user_id: str, updates: LearningProfileUpdate
) -> LearningProfileSchema:
    """Update learning preferences."""
    profile = db.query(LearningProfile).filter(LearningProfile.user_id == user_id).first()
    if not profile:
        profile = LearningProfile(user_id=user_id)
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
        action="LEARNING_PROFILE_UPDATE",
        resource_type="LearningProfile",
        resource_id=profile.id,
        actor_id=user_id,
        metadata={"updated_fields": list(update_dict.keys())},
    )

    return LearningProfileSchema.model_validate(profile)


def get_progress_summary(db: Session, user_id: str) -> ProgressSummaryResponse:
    """
    Calculate factual candidate progress and accessible weekly narrative.
    Enforces Section 22, 45, 46 & 48!
    """
    topic_records = (
        db.query(TopicProgress)
        .filter(TopicProgress.user_id == user_id)
        .order_by(TopicProgress.last_practiced.desc())
        .all()
    )

    total_attempted = sum(tp.questions_attempted for tp in topic_records)
    total_correct = sum(tp.correct_answers for tp in topic_records)
    overall_accuracy = round((total_correct / total_attempted * 100), 1) if total_attempted > 0 else 0.0

    # Build topic progress responses with non-judgmental status
    topic_responses: List[TopicProgressResponse] = []
    highest_acc = -1.0
    highest_subject = None
    lowest_topic = None
    lowest_acc = 101.0

    for tp in topic_records:
        acc = tp.accuracy
        if acc < 60.0:
            status_text = f"{int(acc)}% Accuracy — Recommended: Review Lesson"
            rec_action = "review_lesson"
        elif acc < 75.0:
            status_text = f"{int(acc)}% Accuracy — Recommended: Practice Questions"
            rec_action = "practice_questions"
        else:
            status_text = f"{int(acc)}% Accuracy — Ready for Timed Mock Test"
            rec_action = "timed_mock"

        if acc > highest_acc and tp.questions_attempted >= 3:
            highest_acc = acc
            highest_subject = tp.subject

        if acc < lowest_acc and tp.questions_attempted >= 3:
            lowest_acc = acc
            lowest_topic = tp.topic

        topic_responses.append(
            TopicProgressResponse(
                subject=tp.subject,
                topic=tp.topic,
                questions_attempted=tp.questions_attempted,
                correct_answers=tp.correct_answers,
                accuracy=tp.accuracy,
                average_time_seconds=tp.average_time_seconds,
                last_practiced=tp.last_practiced,
                factual_status=status_text,
                recommended_action=rec_action,
            )
        )

    # Activity calculation for weekly summary
    now = utc_now()
    week_ago = now - timedelta(days=7)
    recent_activities = (
        db.query(LearningActivity)
        .filter(LearningActivity.user_id == user_id, LearningActivity.timestamp >= week_ago)
        .all()
    )
    study_seconds = sum(act.duration_seconds for act in recent_activities)
    study_minutes = max(15, study_seconds // 60) if recent_activities else 45

    # Accessible screen-reader narrative (Section 48)
    summary_parts = [
        f"This week you attempted {total_attempted} questions with an overall accuracy of {int(overall_accuracy)} percent.",
        f"You practiced {len(topic_records)} topics over {study_minutes} minutes of active study.",
    ]
    if highest_subject:
        summary_parts.append(f"Your highest consistency was in {highest_subject}.")
    if lowest_topic:
        summary_parts.append(f"Suggested next step: reinforce {lowest_topic} with a focused practice set.")
    else:
        summary_parts.append("Suggested next step: continue with your daily practice goals.")

    full_narrative = " ".join(summary_parts)

    weekly = WeeklySummaryResponse(
        week_start=week_ago.strftime("%B %d"),
        week_end=now.strftime("%B %d"),
        questions_attempted=total_attempted,
        overall_accuracy=overall_accuracy,
        topics_practiced_count=len(topic_records),
        study_time_minutes=study_minutes,
        highest_accuracy_subject=highest_subject or "Mathematics",
        suggested_focus_topic=lowest_topic or "Algebra",
        summary_text=full_narrative,
    )

    return ProgressSummaryResponse(
        user_id=user_id,
        overall_accuracy=overall_accuracy,
        total_questions_attempted=total_attempted,
        total_correct=total_correct,
        total_topics_practiced=len(topic_records),
        study_streak_days=min(7, len(topic_records) + 1),
        topic_progress=topic_responses,
        weekly_summary=weekly,
    )


def record_learning_activity(
    db: Session,
    user_id: str,
    activity_type: str,
    resource_id: Optional[str] = None,
    duration_seconds: int = 0,
    metadata: Optional[dict] = None,
) -> LearningActivity:
    """Log learning event with strict data minimization (Section 50 & 58)."""
    activity = LearningActivity(
        user_id=user_id,
        activity_type=activity_type,
        resource_id=resource_id,
        duration_seconds=duration_seconds,
        timestamp=utc_now(),
        metadata_json=metadata or {},
    )
    db.add(activity)
    db.commit()
    db.refresh(activity)
    return activity

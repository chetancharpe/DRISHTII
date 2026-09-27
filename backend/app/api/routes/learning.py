from typing import List
from fastapi import APIRouter, Depends, Query, status
from sqlalchemy.orm import Session
from app.api.deps import get_current_user, get_db
from app.models.user import User
from app.schemas.learning import (
    LearningActivityCreate,
    LearningActivityResponse,
    LearningProfileSchema,
    LearningProfileUpdate,
    PersonalizedPracticeSetResponse,
    ProgressSummaryResponse,
    RecommendationResponse,
)
from app.services.learning_service import (
    get_or_create_learning_profile,
    get_progress_summary,
    record_learning_activity,
    update_learning_profile,
)
from app.services.recommendation_service import (
    get_personalized_practice,
    get_recommendations_for_user,
)

router = APIRouter(prefix="", tags=["Learning & Intelligence"])


@router.get("/learning/profile", response_model=LearningProfileSchema)
def get_learning_profile(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Retrieve personalized learning goals, target subjects, and session length."""
    return get_or_create_learning_profile(db, current_user.id)


@router.patch("/learning/profile", response_model=LearningProfileSchema)
def update_profile(
    updates: LearningProfileUpdate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Update preferred subjects and daily study targets."""
    return update_learning_profile(db, current_user.id, updates)


@router.get("/progress", response_model=ProgressSummaryResponse)
def get_progress(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """
    Retrieve candidate practice progress and accessible weekly narrative.
    Includes factual accuracy percentages without judgmental student labeling.
    """
    return get_progress_summary(db, current_user.id)


@router.get("/recommendations", response_model=List[RecommendationResponse])
def get_recommendations(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """
    Retrieve rule-based learning recommendations based on recent topic accuracy.
    Transparent, deterministic reasoning.
    """
    return get_recommendations_for_user(db, current_user.id)


@router.get("/practice/personalized", response_model=PersonalizedPracticeSetResponse)
def get_practice_set(
    limit: int = Query(10, ge=1, le=25),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """
    Generate an adaptive 'Practice for You' question set covering unmastered topics.
    Ensures full question accessibility.
    """
    return get_personalized_practice(db, current_user.id, limit)


@router.post("/activity", response_model=LearningActivityResponse, status_code=status.HTTP_201_CREATED)
def log_activity(
    data: LearningActivityCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Log learning activity event with strict data minimization."""
    act = record_learning_activity(
        db=db,
        user_id=current_user.id,
        activity_type=data.activity_type,
        resource_id=data.resource_id,
        duration_seconds=data.duration_seconds,
        metadata=data.metadata,
    )
    return LearningActivityResponse(
        id=act.id,
        user_id=act.user_id,
        activity_type=act.activity_type,
        resource_id=act.resource_id,
        duration_seconds=act.duration_seconds,
        timestamp=act.timestamp,
        metadata_json=act.metadata_json,
    )

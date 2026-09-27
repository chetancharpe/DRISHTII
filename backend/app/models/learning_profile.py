import uuid
from datetime import datetime, timezone
from sqlalchemy import Boolean, Column, DateTime, Float, ForeignKey, Integer, JSON, String, Text, UniqueConstraint
from sqlalchemy.orm import relationship
from app.db.base import Base


class LearningProfile(Base):
    __tablename__ = "learning_profiles"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    user_id = Column(String(36), ForeignKey("users.id", ondelete="CASCADE"), unique=True, nullable=False, index=True)
    
    preferred_subjects = Column(JSON, default=list, nullable=False)  # ["Mathematics", "Logical Reasoning"]
    preferred_learning_mode = Column(String(50), default="guided", nullable=False)  # guided, self_paced, challenge
    daily_goal_questions = Column(Integer, default=15, nullable=False)
    weekly_goal_questions = Column(Integer, default=75, nullable=False)
    difficulty_preference = Column(String(30), default="adaptive", nullable=False)  # easy, medium, hard, adaptive
    study_session_length_minutes = Column(Integer, default=30, nullable=False)
    preferred_language = Column(String(10), default="en", nullable=False)
    
    updated_at = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc), onupdate=lambda: datetime.now(timezone.utc), nullable=False)

    user = relationship("User")


class TopicProgress(Base):
    __tablename__ = "topic_progress"
    __table_args__ = (
        UniqueConstraint("user_id", "subject", "topic", name="uq_user_subject_topic"),
    )

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    user_id = Column(String(36), ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    subject = Column(String(100), nullable=False, index=True)
    topic = Column(String(100), nullable=False, index=True)
    
    questions_attempted = Column(Integer, default=0, nullable=False)
    correct_answers = Column(Integer, default=0, nullable=False)
    incorrect_answers = Column(Integer, default=0, nullable=False)
    unanswered = Column(Integer, default=0, nullable=False)
    accuracy = Column(Float, default=0.0, nullable=False)
    average_time_seconds = Column(Float, default=0.0, nullable=False)
    
    # Spaced Review metadata
    last_practiced = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc), nullable=False)
    review_count = Column(Integer, default=1, nullable=False)
    next_review_at = Column(DateTime(timezone=True), nullable=True)

    user = relationship("User")


class LearningActivity(Base):
    __tablename__ = "learning_activities"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    user_id = Column(String(36), ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    activity_type = Column(String(50), nullable=False, index=True)
    # Types: lesson_started, lesson_completed, practice_started, practice_completed,
    #        mock_started, mock_completed, exam_completed, question_answered, topic_reviewed
    resource_id = Column(String(100), nullable=True)
    duration_seconds = Column(Integer, default=0, nullable=False)
    timestamp = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc), nullable=False, index=True)
    metadata_json = Column(JSON, default=dict, nullable=False)

    user = relationship("User")


class Recommendation(Base):
    __tablename__ = "recommendations"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    user_id = Column(String(36), ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    recommendation_type = Column(String(50), nullable=False)  # practice, review, mock, pace
    topic = Column(String(100), nullable=False)
    subject = Column(String(100), nullable=False)
    reason = Column(Text, nullable=False)  # Factual, non-judgmental reason
    priority = Column(String(20), default="normal", nullable=False)  # high, normal, low
    is_dismissed = Column(Boolean, default=False, nullable=False)
    created_at = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc), nullable=False)

    user = relationship("User")

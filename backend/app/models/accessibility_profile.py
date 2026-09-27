import uuid
from datetime import datetime, timezone
from sqlalchemy import Boolean, Column, DateTime, Float, ForeignKey, JSON, String, Text
from sqlalchemy.orm import relationship
from app.db.base import Base


class AccessibilityProfile(Base):
    __tablename__ = "accessibility_profiles"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    user_id = Column(String(36), ForeignKey("users.id", ondelete="CASCADE"), unique=True, nullable=False, index=True)
    
    # Visual & Display
    text_scale = Column(String(20), default="default", nullable=False)  # default, large, x-large, maximum
    contrast_mode = Column(String(30), default="standard", nullable=False)  # standard, high_contrast, extra_high_contrast
    theme = Column(String(20), default="system", nullable=False)  # light, dark, system
    reduced_motion = Column(Boolean, default=False, nullable=False)
    simplified_interface = Column(Boolean, default=False, nullable=False)
    
    # Assistive & Navigation
    screen_reader_mode = Column(Boolean, default=False, nullable=False)
    keyboard_navigation = Column(Boolean, default=False, nullable=False)
    
    # Audio & Speech Assistance
    audio_assistance = Column(Boolean, default=False, nullable=False)
    speech_rate = Column(Float, default=1.0, nullable=False)  # 0.75, 1.0, 1.25, 1.5, 1.75, 2.0
    speech_volume = Column(Float, default=1.0, nullable=False)  # 0.0 to 1.0
    preferred_language = Column(String(10), default="en", nullable=False)  # en, hi, etc.
    
    # Exam & Reading Behavior
    timer_announcement_mode = Column(String(30), default="warnings", nullable=False)  # off, warnings, regular
    question_reading_mode = Column(String(30), default="question_and_options", nullable=False)  # question_only, question_and_options
    
    updated_at = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc), onupdate=lambda: datetime.now(timezone.utc), nullable=False)

    user = relationship("User")


class AccessibilityIssue(Base):
    __tablename__ = "accessibility_issues"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    user_id = Column(String(36), ForeignKey("users.id", ondelete="SET NULL"), nullable=True, index=True)
    page_url = Column(String(255), nullable=False)
    issue_type = Column(String(50), nullable=False)  # screen_reader, keyboard, contrast, text_size, audio, other
    description = Column(Text, nullable=False)
    status = Column(String(30), default="OPEN", nullable=False)  # OPEN, IN_REVIEW, RESOLVED
    created_at = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc), nullable=False)
    resolved_at = Column(DateTime(timezone=True), nullable=True)

    user = relationship("User")

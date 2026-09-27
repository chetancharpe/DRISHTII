import uuid
from datetime import datetime, timezone
from enum import Enum
from sqlalchemy import Column, DateTime, ForeignKey, String
from sqlalchemy.orm import relationship
from app.db.base import Base


class SessionStatus(str, Enum):
    CREATED = "CREATED"
    ACTIVE = "ACTIVE"
    INTERRUPTED = "INTERRUPTED"
    SUBMITTING = "SUBMITTING"
    SUBMITTED = "SUBMITTED"
    EXPIRED = "EXPIRED"
    CANCELLED = "CANCELLED"


class ExamSession(Base):
    __tablename__ = "exam_sessions"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    exam_id = Column(String(36), ForeignKey("exams.id", ondelete="CASCADE"), nullable=False, index=True)
    candidate_id = Column(String(36), ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    status = Column(String(50), default=SessionStatus.CREATED.value, nullable=False, index=True)
    
    # Server Authoritative Timer fields
    server_started_at = Column(DateTime(timezone=True), nullable=True)
    server_expires_at = Column(DateTime(timezone=True), nullable=True)
    submitted_at = Column(DateTime(timezone=True), nullable=True)
    last_sync_at = Column(DateTime(timezone=True), nullable=True)
    created_at = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc), nullable=False)

    # Relationships
    exam = relationship("Exam", back_populates="sessions")
    candidate = relationship("User", back_populates="sessions")
    answers = relationship("ExamAnswer", back_populates="session", cascade="all, delete-orphan")
    submission = relationship("ExamSubmission", back_populates="session", uselist=False, cascade="all, delete-orphan")
    result = relationship("Result", back_populates="session", uselist=False, cascade="all, delete-orphan")

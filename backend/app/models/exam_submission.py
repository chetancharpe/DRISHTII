import uuid
from datetime import datetime, timezone
from enum import Enum
from sqlalchemy import Column, DateTime, ForeignKey, String
from sqlalchemy.orm import relationship
from app.db.base import Base


class SubmissionStatus(str, Enum):
    PENDING = "PENDING"
    SUBMITTED = "SUBMITTED"
    FAILED = "FAILED"
    UNDER_REVIEW = "UNDER_REVIEW"
    FINALIZED = "FINALIZED"


class ExamSubmission(Base):
    __tablename__ = "exam_submissions"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    session_id = Column(String(36), ForeignKey("exam_sessions.id", ondelete="CASCADE"), unique=True, nullable=False, index=True)
    submitted_at = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc), nullable=False)
    status = Column(String(50), default=SubmissionStatus.SUBMITTED.value, nullable=False)
    submission_reference = Column(String(64), unique=True, nullable=False, index=True)

    session = relationship("ExamSession", back_populates="submission")
    evaluations = relationship("Evaluation", back_populates="submission", cascade="all, delete-orphan")

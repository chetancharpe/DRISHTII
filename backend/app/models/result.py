import uuid
from datetime import datetime, timezone
from enum import Enum
from sqlalchemy import Column, DateTime, Float, ForeignKey, Integer, String, UniqueConstraint
from sqlalchemy.orm import relationship
from app.db.base import Base


class ResultStatus(str, Enum):
    NOT_READY = "NOT_READY"
    PENDING_EVALUATION = "PENDING_EVALUATION"
    EVALUATED = "EVALUATED"
    PUBLISHED = "PUBLISHED"
    WITHHELD = "WITHHELD"


class Result(Base):
    __tablename__ = "results"
    __table_args__ = (
        UniqueConstraint("exam_id", "candidate_id", name="uq_exam_candidate_result"),
    )

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    exam_id = Column(String(36), ForeignKey("exams.id", ondelete="CASCADE"), nullable=False, index=True)
    candidate_id = Column(String(36), ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    session_id = Column(String(36), ForeignKey("exam_sessions.id", ondelete="CASCADE"), unique=True, nullable=False, index=True)
    
    score = Column(Float, nullable=False, default=0.0)
    maximum_score = Column(Float, nullable=False, default=0.0)
    percentage = Column(Float, nullable=False, default=0.0)
    
    correct_count = Column(Integer, nullable=False, default=0)
    incorrect_count = Column(Integer, nullable=False, default=0)
    unanswered_count = Column(Integer, nullable=False, default=0)
    
    status = Column(String(50), default=ResultStatus.NOT_READY.value, nullable=False, index=True)
    published_at = Column(DateTime(timezone=True), nullable=True)
    created_at = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc), nullable=False)

    exam = relationship("Exam", back_populates="results")
    candidate = relationship("User", back_populates="results")
    session = relationship("ExamSession", back_populates="result")

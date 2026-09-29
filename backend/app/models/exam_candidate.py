import uuid
from datetime import datetime, timezone
from enum import Enum
from sqlalchemy import Column, DateTime, Float, ForeignKey, String, UniqueConstraint
from sqlalchemy.orm import relationship
from app.db.base import Base


class EligibilityStatus(str, Enum):
    ELIGIBLE = "ELIGIBLE"
    INELIGIBLE = "INELIGIBLE"
    PENDING_VERIFICATION = "PENDING_VERIFICATION"


class AttemptStatus(str, Enum):
    NOT_ATTEMPTED = "NOT_ATTEMPTED"
    IN_PROGRESS = "IN_PROGRESS"
    COMPLETED = "COMPLETED"


class ExamCandidate(Base):
    __tablename__ = "exam_candidates"
    __table_args__ = (
        UniqueConstraint("exam_id", "candidate_id", name="uq_exam_candidate"),
    )

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    exam_id = Column(String(36), ForeignKey("exams.id", ondelete="CASCADE"), nullable=False, index=True)
    candidate_id = Column(String(36), ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    eligibility_status = Column(String(50), default=EligibilityStatus.ELIGIBLE.value, nullable=False)
    attempt_status = Column(String(50), default=AttemptStatus.NOT_ATTEMPTED.value, nullable=False)
    time_multiplier = Column(Float, nullable=False, default=1.0)  # PwD compensatory time multiplier (e.g. 1.0, 1.5, 2.0)
    assigned_at = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc), nullable=False)

    exam = relationship("Exam", back_populates="candidates")
    candidate = relationship("User")

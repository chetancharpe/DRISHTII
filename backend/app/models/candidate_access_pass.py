import uuid
from datetime import datetime, timezone, timedelta
from sqlalchemy import Boolean, Column, DateTime, ForeignKey, String
from sqlalchemy.orm import relationship
from app.db.base import Base


class CandidateAccessPass(Base):
    __tablename__ = "candidate_access_passes"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    pass_code = Column(String(64), unique=True, index=True, nullable=False)
    candidate_id = Column(String(36), ForeignKey("users.id", ondelete="CASCADE"), index=True, nullable=False)
    examiner_id = Column(String(36), ForeignKey("users.id", ondelete="SET NULL"), index=True, nullable=True)
    candidate_name = Column(String(100), nullable=False)
    candidate_email = Column(String(255), nullable=False)
    is_active = Column(Boolean, default=True, nullable=False)
    accommodations = Column(String(255), default="audio_assistance;high_contrast;screen_reader", nullable=False)
    created_at = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc), nullable=False)
    expires_at = Column(
        DateTime(timezone=True),
        default=lambda: datetime.now(timezone.utc) + timedelta(days=90),
        nullable=False,
    )
    last_used_at = Column(DateTime(timezone=True), nullable=True)

    candidate = relationship("User", foreign_keys=[candidate_id])
    examiner = relationship("User", foreign_keys=[examiner_id])


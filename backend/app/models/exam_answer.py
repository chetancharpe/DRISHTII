import uuid
from datetime import datetime, timezone
from sqlalchemy import Boolean, Column, DateTime, ForeignKey, Integer, JSON, String, UniqueConstraint
from sqlalchemy.orm import relationship
from app.db.base import Base


class ExamAnswer(Base):
    __tablename__ = "exam_answers"
    __table_args__ = (
        UniqueConstraint("session_id", "question_id", name="uq_session_question_answer"),
    )

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    session_id = Column(String(36), ForeignKey("exam_sessions.id", ondelete="CASCADE"), nullable=False, index=True)
    question_id = Column(String(36), ForeignKey("questions.id", ondelete="CASCADE"), nullable=False, index=True)
    
    # Store candidate answer (e.g. option id "opt-1", list of option ids, or numerical/text string)
    selected_answer = Column(JSON, nullable=True)
    is_final = Column(Boolean, default=False, nullable=False)
    
    # Timestamps
    last_saved_at = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc), nullable=False)
    server_received_at = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc), nullable=False)
    
    # Optimistic Concurrency Control
    version = Column(Integer, default=1, nullable=False)

    session = relationship("ExamSession", back_populates="answers")
    question = relationship("Question")

import uuid
from datetime import datetime, timezone
from sqlalchemy import Column, DateTime, Float, ForeignKey, Integer, JSON, String, Text
from sqlalchemy.orm import relationship
from app.db.base import Base


class QuestionVersion(Base):
    __tablename__ = "question_versions"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    question_id = Column(String(36), ForeignKey("questions.id", ondelete="CASCADE"), nullable=False, index=True)
    version_number = Column(Integer, nullable=False, default=1)
    question_text = Column(Text, nullable=False)
    
    # Options list in JSON format: [{"id": "opt-1", "text": "...", "aria_label": "..."}]
    options = Column(JSON, nullable=False, default=list)
    
    # Official answer key (objective values or array of valid keys) - NEVER leaked to candidate
    correct_answer = Column(JSON, nullable=False)
    
    # Pedagogical / review explanation
    explanation = Column(Text, nullable=True)
    
    # Marking scheme
    marks = Column(Float, nullable=False, default=1.0)
    negative_marks = Column(Float, nullable=False, default=0.0)
    
    # Accessibility metadata
    # {
    #   "has_alt_text": true,
    #   "alt_text": "...",
    #   "long_description": "...",
    #   "has_accessible_formula": false,
    #   "has_table_headers": false,
    #   "language": "en",
    #   "accessibility_validation_status": "VALIDATED",
    #   "accessibility_warnings": [],
    #   "accessibility_errors": []
    # }
    accessibility_metadata = Column(JSON, nullable=False, default=dict)
    
    created_at = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc), nullable=False)
    created_by = Column(String(36), ForeignKey("users.id", ondelete="SET NULL"), nullable=True)

    # Relationships
    question = relationship("Question", back_populates="versions")

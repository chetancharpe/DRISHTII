from sqlalchemy import Boolean, Column, ForeignKey, Integer, String, Text
from sqlalchemy.dialects.postgresql import JSONB
from sqlalchemy.orm import relationship
from sqlalchemy.types import JSON
from app.db.base import Base


class CurriculumSubject(Base):
    __tablename__ = "curriculum_subjects"

    id = Column(String(50), primary_key=True)  # e.g., 'mathematics', 'english'
    exam_id = Column(String(50), default="cds", nullable=False)
    name = Column(String(100), nullable=False)
    code = Column(String(20), nullable=False)
    description = Column(Text, nullable=False)
    icon_name = Column(String(50), nullable=False)
    total_topics_count = Column(Integer, default=3, nullable=False)
    recommended_topic_id = Column(String(50), nullable=True)
    display_order = Column(Integer, default=1, nullable=False)

    # Relationships
    topics = relationship(
        "CurriculumTopic",
        back_populates="subject",
        cascade="all, delete-orphan",
        order_by="CurriculumTopic.display_order",
    )


class CurriculumTopic(Base):
    __tablename__ = "curriculum_topics"

    id = Column(String(50), primary_key=True)  # e.g., 'percentages', 'reading-comprehension'
    subject_id = Column(String(50), ForeignKey("curriculum_subjects.id"), nullable=False, index=True)
    name = Column(String(100), nullable=False)
    short_description = Column(Text, nullable=False)
    completed_lessons = Column(Integer, default=0, nullable=False)
    total_lessons = Column(Integer, default=10, nullable=False)
    estimated_minutes = Column(Integer, default=15, nullable=False)
    is_recommended = Column(Boolean, default=False, nullable=False)
    practice_available = Column(Boolean, default=True, nullable=False)
    practice_count = Column(Integer, default=15, nullable=False)
    display_order = Column(Integer, default=1, nullable=False)

    # Rich educational and accessibility content
    learning_objectives = Column(JSON, default=list, nullable=False)
    overview = Column(Text, nullable=True)
    sections = Column(JSON, default=list, nullable=False)
    quick_recap = Column(JSON, default=list, nullable=True)
    audio_narrative = Column(Text, nullable=True)

    # Relationships
    subject = relationship("CurriculumSubject", back_populates="topics")

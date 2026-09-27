import uuid
from sqlalchemy import Column, ForeignKey, Integer, String, Text
from sqlalchemy.orm import relationship
from app.db.base import Base


class ExamSection(Base):
    __tablename__ = "exam_sections"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    exam_id = Column(String(36), ForeignKey("exams.id", ondelete="CASCADE"), nullable=False, index=True)
    title = Column(String(200), nullable=False)
    description = Column(Text, nullable=True)
    display_order = Column(Integer, nullable=False, default=1)
    duration_seconds = Column(Integer, nullable=True)
    navigation_policy = Column(String(50), default="FREE", nullable=False)  # FREE or SEQUENTIAL
    question_count = Column(Integer, default=0, nullable=False)

    # Relationships
    exam = relationship("Exam", back_populates="sections")
    section_questions = relationship("SectionQuestion", back_populates="section", cascade="all, delete-orphan", order_by="SectionQuestion.display_order")


class SectionQuestion(Base):
    __tablename__ = "section_questions"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    section_id = Column(String(36), ForeignKey("exam_sections.id", ondelete="CASCADE"), nullable=False, index=True)
    question_id = Column(String(36), ForeignKey("questions.id", ondelete="CASCADE"), nullable=False, index=True)
    question_version_id = Column(String(36), ForeignKey("question_versions.id", ondelete="CASCADE"), nullable=False)
    display_order = Column(Integer, nullable=False, default=1)

    section = relationship("ExamSection", back_populates="section_questions")
    question = relationship("Question")
    question_version = relationship("QuestionVersion")

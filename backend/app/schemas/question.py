from datetime import datetime
from typing import Any, Dict, List, Optional
from pydantic import BaseModel, Field


class AccessibilityMetadataSchema(BaseModel):
    has_alt_text: bool = False
    alt_text: Optional[str] = None
    long_description: Optional[str] = None
    has_accessible_formula: bool = False
    formula_spoken_text: Optional[str] = None
    has_table_headers: bool = False
    language: str = "en"
    accessibility_validation_status: str = "VALIDATED"  # VALIDATED, WARNING, ERROR
    accessibility_warnings: List[str] = Field(default_factory=list)
    accessibility_errors: List[str] = Field(default_factory=list)


class QuestionOptionSchema(BaseModel):
    id: str
    text: str
    aria_label: Optional[str] = None
    display_order: int = 1


class QuestionVersionCreate(BaseModel):
    question_text: str
    options: List[QuestionOptionSchema] = Field(default_factory=list)
    correct_answer: Any  # Option id, list of option ids, or numerical/text answer
    explanation: Optional[str] = None
    marks: float = 1.0
    negative_marks: float = 0.0
    accessibility_metadata: Optional[AccessibilityMetadataSchema] = None


class QuestionCreate(BaseModel):
    question_type: str = "MULTIPLE_CHOICE"  # MULTIPLE_CHOICE, MULTI_SELECT, NUMERICAL, FILL_IN_BLANK
    subject: str
    topic: str
    difficulty: str = "MEDIUM"  # EASY, MEDIUM, HARD
    language: str = "en"
    
    # Version 1 initial payload
    question_text: str
    options: List[QuestionOptionSchema] = Field(default_factory=list)
    correct_answer: Any
    explanation: Optional[str] = None
    marks: float = 1.0
    negative_marks: float = 0.0
    accessibility_metadata: Optional[AccessibilityMetadataSchema] = None


class QuestionUpdate(BaseModel):
    question_type: Optional[str] = None
    subject: Optional[str] = None
    topic: Optional[str] = None
    difficulty: Optional[str] = None
    is_active: Optional[bool] = None


# EXAMINER VIEW: Full detail including answer key, explanation, and audit details
class QuestionExaminerResponse(BaseModel):
    id: str
    question_type: str
    subject: str
    topic: str
    difficulty: str
    language: str
    is_active: bool
    created_by: Optional[str] = None
    created_at: datetime
    updated_at: datetime
    
    # Current version content
    version_number: int
    question_text: str
    options: List[QuestionOptionSchema]
    correct_answer: Any
    explanation: Optional[str] = None
    marks: float
    negative_marks: float
    accessibility_metadata: AccessibilityMetadataSchema

    class Config:
        from_attributes = True


# CANDIDATE VIEW: Strictly sanitized. NEVER exposes correct_answer, explanation or examiner notes
class QuestionCandidateResponse(BaseModel):
    id: str
    question_id: str
    version_number: int
    question_type: str
    subject: str
    topic: str
    language: str
    question_text: str
    options: List[QuestionOptionSchema]
    marks: float
    negative_marks: float
    accessibility_metadata: AccessibilityMetadataSchema

    class Config:
        from_attributes = True

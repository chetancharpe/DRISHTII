from datetime import datetime
from typing import Any, List, Optional
from pydantic import BaseModel, Field


class QuestionResultBreakdown(BaseModel):
    question_id: str
    question_text: str
    candidate_answer: Any
    correct_answer: Any
    marks_awarded: float
    max_marks: float
    is_correct: bool
    explanation: Optional[str] = None


class ResultCandidateResponse(BaseModel):
    exam_id: str
    exam_title: str
    status: str  # NOT_READY, PENDING_EVALUATION, EVALUATED, PUBLISHED, WITHHELD
    score: Optional[float] = None
    maximum_score: Optional[float] = None
    percentage: Optional[float] = None
    correct_count: Optional[int] = None
    incorrect_count: Optional[int] = None
    unanswered_count: Optional[int] = None
    published_at: Optional[datetime] = None
    message: Optional[str] = None
    breakdown: Optional[List[QuestionResultBreakdown]] = None

    class Config:
        from_attributes = True


class ResultExaminerResponse(BaseModel):
    id: str
    exam_id: str
    candidate_id: str
    candidate_name: str
    candidate_email: str
    session_id: str
    score: float
    maximum_score: float
    percentage: float
    correct_count: int
    incorrect_count: int
    unanswered_count: int
    status: str
    published_at: Optional[datetime] = None
    created_at: datetime

    class Config:
        from_attributes = True


class EvaluationCreate(BaseModel):
    question_id: str
    marks_awarded: float
    comments: Optional[str] = None


class EvaluationResponse(BaseModel):
    id: str
    submission_id: str
    question_id: str
    examiner_id: Optional[str] = None
    marks_awarded: float
    comments: Optional[str] = None
    status: str
    evaluated_at: datetime

    class Config:
        from_attributes = True


class PublishResultsRequest(BaseModel):
    confirm_publication: bool = True

from datetime import datetime
from typing import List, Optional
from pydantic import BaseModel, Field
from app.schemas.question import QuestionCandidateResponse, QuestionExaminerResponse


class SectionQuestionItem(BaseModel):
    question_id: str
    display_order: int = 1


class SectionCreate(BaseModel):
    title: str
    description: Optional[str] = None
    display_order: int = 1
    duration_seconds: Optional[int] = None
    navigation_policy: str = "FREE"  # FREE, SEQUENTIAL
    question_ids: List[str] = Field(default_factory=list)


class SectionResponse(BaseModel):
    id: str
    exam_id: str
    title: str
    description: Optional[str] = None
    display_order: int
    duration_seconds: Optional[int] = None
    navigation_policy: str
    question_count: int

    class Config:
        from_attributes = True


class SectionCandidateDetailResponse(SectionResponse):
    questions: List[QuestionCandidateResponse] = Field(default_factory=list)


class SectionExaminerDetailResponse(SectionResponse):
    questions: List[QuestionExaminerResponse] = Field(default_factory=list)


class ExamBase(BaseModel):
    title: str
    description: Optional[str] = None
    instructions: Optional[str] = None
    duration_seconds: int = 3600
    extra_time_seconds: int = 0
    language: str = "en"


class ExamCreate(ExamBase):
    organization_id: Optional[str] = None


class ExamUpdate(BaseModel):
    title: Optional[str] = None
    description: Optional[str] = None
    instructions: Optional[str] = None
    duration_seconds: Optional[int] = None
    extra_time_seconds: Optional[int] = None
    language: Optional[str] = None
    status: Optional[str] = None


class ExamScheduleRequest(BaseModel):
    start_at: datetime
    end_at: datetime
    duration_seconds: Optional[int] = None
    extra_time_seconds: Optional[int] = None
    timezone: str = "UTC"


class ExamCandidateAssignRequest(BaseModel):
    candidate_ids: List[str]


# CANDIDATE VIEW: Sanitized metadata for exam listing and registration
class ExamCandidateResponse(ExamBase):
    id: str
    status: str
    start_at: Optional[datetime] = None
    end_at: Optional[datetime] = None
    section_count: int = 0
    total_questions: int = 0
    is_eligible: bool = True
    attempt_status: str = "NOT_ATTEMPTED"

    class Config:
        from_attributes = True


# EXAMINER VIEW: Full administrative details
class ExamExaminerResponse(ExamBase):
    id: str
    organization_id: Optional[str] = None
    status: str
    start_at: Optional[datetime] = None
    end_at: Optional[datetime] = None
    created_by: Optional[str] = None
    published_at: Optional[datetime] = None
    created_at: datetime
    updated_at: datetime
    sections: List[SectionResponse] = Field(default_factory=list)
    candidate_count: int = 0

    class Config:
        from_attributes = True

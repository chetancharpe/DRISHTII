from datetime import datetime
from typing import List, Optional, Any
from pydantic import BaseModel, Field, model_validator
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
    time_multiplier: Optional[float] = 1.0


class ExamCandidateResponse(ExamBase):
    id: str
    status: str
    start_at: Optional[datetime] = None
    end_at: Optional[datetime] = None
    section_count: int = 0
    total_questions: int = 0
    is_eligible: bool = True
    attempt_status: str = "NOT_ATTEMPTED"
    time_multiplier: float = 1.0
    organization_name: Optional[str] = None
    exam_code: Optional[str] = None

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


class RosterCsvImportRequest(BaseModel):
    csv_content: str
    default_group: Optional[str] = "Main Cohort"


class RosterImportResultItem(BaseModel):
    name: str
    email: str
    candidate_id: str
    status: str  # ENROLLED, NEW_USER_ENROLLED, ALREADY_ENROLLED, ERROR
    time_multiplier: float = 1.0
    accommodations_applied: List[str] = Field(default_factory=list)
    error_message: Optional[str] = None


class RosterCsvImportResponse(BaseModel):
    exam_id: str
    total_rows: int = 0
    total_rows_processed: int = 0
    success_count: int = 0
    successfully_enrolled: int = 0
    new_users_provisioned: int = 0
    new_users_created: int = 0
    error_count: int = 0
    skipped_or_errored: int = 0
    results: List[RosterImportResultItem] = Field(default_factory=list)


class PaperQuestionUploadItem(BaseModel):
    question_text: str
    question_type: str = "single_choice"
    subject: str = "General"
    topic: str = "Aptitude"
    difficulty: str = "medium"
    marks: float = 1.0
    negative_marks: float = 0.25
    options: List[dict] = Field(default_factory=list)
    correct_answer: str = "A"
    explanation: Optional[str] = "Standard pedagogical explanation."
    alt_text: Optional[str] = None
    audio_text: Optional[str] = None
    formula: Optional[str] = None

    @model_validator(mode="before")
    @classmethod
    def normalize_question(cls, data: Any) -> Any:
        if isinstance(data, dict):
            # Accept text as question_text
            if "question_text" not in data and "text" in data:
                data["question_text"] = data["text"]
            # Accept list of strings for options: e.g. ["Mumbai", "Kochi", "Goa"]
            opts = data.get("options")
            if isinstance(opts, list) and opts and isinstance(opts[0], str):
                labels = ["A", "B", "C", "D", "E", "F"]
                normalized_opts = []
                for idx, o in enumerate(opts):
                    lbl = labels[idx] if idx < len(labels) else str(idx + 1)
                    normalized_opts.append({"id": lbl, "text": str(o)})
                data["options"] = normalized_opts
                # If correct_answer was option text, map to label A/B/C/D
                correct = data.get("correct_answer")
                if correct and isinstance(correct, str):
                    for no in normalized_opts:
                        if no["text"].strip().lower() == correct.strip().lower():
                            data["correct_answer"] = no["id"]
                            break
        return data


class PaperSectionUploadItem(BaseModel):
    title: str
    description: Optional[str] = None
    display_order: int = 1
    duration_seconds: Optional[int] = None
    questions: List[PaperQuestionUploadItem] = Field(default_factory=list)

    @model_validator(mode="before")
    @classmethod
    def normalize_section(cls, data: Any) -> Any:
        if isinstance(data, dict):
            if "title" not in data and "name" in data:
                data["title"] = data["name"]
            if "display_order" not in data and "order" in data:
                data["display_order"] = data["order"]
            if "duration_seconds" not in data and "duration_minutes" in data:
                data["duration_seconds"] = int(data["duration_minutes"]) * 60
        return data


class ExamPaperUploadRequest(BaseModel):
    title: str
    code: Optional[str] = None
    description: Optional[str] = None
    instructions: Optional[str] = None
    duration_seconds: int = 3600
    extra_time_seconds: int = 1800
    language: str = "en"
    publish_immediately: bool = True
    exam_type: str = "mock_test"
    sections: List[PaperSectionUploadItem] = Field(default_factory=list)

    @model_validator(mode="before")
    @classmethod
    def normalize_request(cls, data: Any) -> Any:
        if isinstance(data, dict):
            if "duration_seconds" not in data and "duration_minutes" in data:
                data["duration_seconds"] = int(data["duration_minutes"]) * 60
        return data


class ExamPaperUploadResponse(BaseModel):
    exam_id: str
    title: str
    status: str
    total_sections: int
    total_questions: int
    published_to_candidates: bool
    message: str


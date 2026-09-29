from datetime import datetime
from typing import Any, Dict, List, Optional
from pydantic import BaseModel, Field
from app.schemas.question import QuestionCandidateResponse
from app.schemas.exam import SectionCandidateDetailResponse


class AnswerItem(BaseModel):
    question_id: str
    selected_answer: Any
    version: int = 1
    last_saved_at: datetime

    class Config:
        from_attributes = True


class CandidateAnswerUpdate(BaseModel):
    selected_answer: Any
    version: int = 1
    client_timestamp: Optional[datetime] = None


class CandidateAnswerResponse(BaseModel):
    question_id: str
    selected_answer: Any
    version: int
    server_received_at: datetime
    is_saved: bool = True


class SyncAnswerItem(BaseModel):
    question_id: str
    selected_answer: Any
    version: int = 1
    client_timestamp: Optional[datetime] = None


class SyncAnswersRequest(BaseModel):
    answers: List[SyncAnswerItem] = Field(default_factory=list)


class SyncStatusResponse(BaseModel):
    session_id: str
    server_time: datetime
    server_expires_at: datetime
    remaining_seconds: int
    is_expired: bool
    synced_answers_count: int


class SessionCreateRequest(BaseModel):
    exam_id: str


class SessionResponse(BaseModel):
    id: str
    exam_id: str
    candidate_id: str
    status: str
    
    # Authoritative server clock fields
    server_started_at: datetime
    server_expires_at: datetime
    server_time: datetime
    remaining_seconds: int
    
    submitted_at: Optional[datetime] = None
    last_sync_at: Optional[datetime] = None
    
    # Examination structural payload (all questions strictly stripped of answers/explanations)
    time_multiplier: float = 1.0
    sections: List[SectionCandidateDetailResponse] = Field(default_factory=list)
    saved_answers: Dict[str, Any] = Field(default_factory=dict)
    answer_versions: Dict[str, int] = Field(default_factory=dict)

    class Config:
        from_attributes = True


class SessionSubmitRequest(BaseModel):
    idempotency_token: Optional[str] = None


class SessionSubmissionResponse(BaseModel):
    session_id: str
    status: str
    submission_reference: str
    submitted_at: datetime
    message: str = "Examination submitted successfully and queued for authoritative evaluation."

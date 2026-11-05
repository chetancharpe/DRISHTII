from datetime import datetime
from typing import Optional
from pydantic import BaseModel, ConfigDict, Field


class CandidateAccessPassCreate(BaseModel):
    candidate_id: Optional[str] = Field(None, description="Existing candidate user ID if available")
    candidate_name: str = Field(..., min_length=2, max_length=100, description="Full name of candidate")
    candidate_email: Optional[str] = Field(None, description="Email of candidate (auto-generated if omitted)")
    custom_pass_code: Optional[str] = Field(None, description="Custom code or leave blank to auto-generate")
    accommodations: Optional[str] = Field(
        "audio_assistance;high_contrast;screen_reader",
        description="Semicolon-separated accessibility accommodations",
    )


class CandidateAccessPassResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: str
    pass_code: str
    candidate_id: str
    candidate_name: str
    candidate_email: str
    is_active: bool
    accommodations: str
    created_at: datetime
    expires_at: datetime
    last_used_at: Optional[datetime] = None
    quick_access_url: Optional[str] = None


class CandidateQuickAccessRequest(BaseModel):
    pass_code: str = Field(..., min_length=3, max_length=64, description="Unique candidate access code")

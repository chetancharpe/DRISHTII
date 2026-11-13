from typing import List, Optional
from pydantic import BaseModel, Field


class FaceAccessChallengeRequest(BaseModel):
    email: Optional[str] = Field(None, description="Candidate email if known")


class FaceAccessChallengeResponse(BaseModel):
    challenge_id: str
    nonce: str
    liveness_sequence: List[str]  # e.g. ["center", "turn_left", "turn_right", "center"]
    liveness_action: str
    instruction_en: str
    instruction_hi: str
    expires_at: int


class FaceAccessVerifyRequest(BaseModel):
    challenge_id: str
    email: str = Field(..., description="Candidate email to verify identity against")
    biometric_token: str = Field(..., description="64-dimensional normalized biometric embedding vector")
    liveness_proof: str = Field(..., description="Proof of completed dynamic liveness challenge")
    liveness_score: float = Field(..., ge=0.0, le=1.0)


class FaceAccessEnrollRequest(BaseModel):
    biometric_token: str = Field(..., description="64-dimensional reference biometric vector to enroll")
    consent_agreed: bool = True


class FaceAccessEnrollResponse(BaseModel):
    status: str
    message: str
    enrolled_at: str
    biometric_dimensions: int

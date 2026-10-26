from typing import List, Optional
from pydantic import BaseModel, Field, ConfigDict


class ConceptExplanationRequest(BaseModel):
    model_config = ConfigDict(populate_by_name=True)
    question_text: str = Field(..., alias="questionText")
    topic: str
    subject: Optional[str] = "General"
    is_live_exam: bool = Field(False, alias="isLiveExam")


class ConceptExplanationResponse(BaseModel):
    model_config = ConfigDict(populate_by_name=True)
    concept_overview: str = Field(..., alias="conceptOverview")
    key_principles: List[str] = Field(..., alias="keyPrinciples")
    simplified_explanation: str = Field(..., alias="simplifiedExplanation")
    practice_tip: str = Field(..., alias="practiceTip")
    source: str = "pedagogical_heuristic"


class SimplifyTextRequest(BaseModel):
    model_config = ConfigDict(populate_by_name=True)
    complex_text: str = Field(..., alias="complexText")
    is_live_exam: bool = Field(False, alias="isLiveExam")


class SimplifyTextResponse(BaseModel):
    model_config = ConfigDict(populate_by_name=True)
    simplified_text: str = Field(..., alias="simplifiedText")
    reading_ease: str = Field("Plain Language (WCAG Level AA)", alias="readingEase")
    source: str = "pedagogical_heuristic"


class SummarizeTopicRequest(BaseModel):
    model_config = ConfigDict(populate_by_name=True)
    topic: str
    subject: Optional[str] = "General"
    is_live_exam: bool = Field(False, alias="isLiveExam")


class SummarizeTopicResponse(BaseModel):
    model_config = ConfigDict(populate_by_name=True)
    summary: str
    key_points: List[str] = Field(..., alias="keyPoints")
    source: str = "pedagogical_heuristic"


class AltTextGenerateRequest(BaseModel):
    model_config = ConfigDict(populate_by_name=True)
    question_context: str = Field(..., alias="questionContext")
    diagram_type: Optional[str] = Field(None, alias="diagramType")
    image_url: Optional[str] = Field(None, alias="imageUrl")


class AltTextGenerateResponse(BaseModel):
    model_config = ConfigDict(populate_by_name=True)
    alt_text: str = Field(..., alias="altText")
    long_description: str = Field(..., alias="longDescription")
    wcag_compliance_notes: List[str] = Field(default_factory=list, alias="wcagComplianceNotes")
    source: str = "pedagogical_heuristic"

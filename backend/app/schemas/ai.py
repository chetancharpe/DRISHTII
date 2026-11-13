from typing import Any, Dict, List, Optional
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


class AITutorChatRequest(BaseModel):
    model_config = ConfigDict(populate_by_name=True)
    message: str = Field(..., min_length=1, description="Candidate voice transcript or question")
    mode: str = Field("learning", description="'learning', 'practice', or 'exam_live'")
    context: Optional[Dict[str, Any]] = Field(default_factory=dict, description="Current page, question or exam context")
    language: str = Field("hi", description="Preferred response language: 'hi' or 'en'")
    candidate_name: Optional[str] = Field("Student", alias="candidateName")


class AITutorChatResponse(BaseModel):
    model_config = ConfigDict(populate_by_name=True)
    reply: str = Field(..., description="Conversational, friendly response for visually impaired candidate")
    speech_text: str = Field(..., alias="speechText", description="Plain speech synthesis text")
    mode: str = Field("learning", description="Current operating mode of tutor")
    suggested_action: Optional[Dict[str, Any]] = Field(None, alias="suggestedAction")
    source: str = "drishti_sarthi_ai"


class CandidateBriefingItem(BaseModel):
    model_config = ConfigDict(populate_by_name=True)
    id: str
    title: str
    status: str
    duration_minutes: int = Field(60, alias="durationMinutes")
    is_live: bool = Field(True, alias="isLive")


class CandidateBriefingResponse(BaseModel):
    model_config = ConfigDict(populate_by_name=True)
    candidate_name: str = Field(..., alias="candidateName")
    preferred_language: str = Field("hi", alias="preferredLanguage")
    greeting_speech: str = Field(..., alias="greetingSpeech")
    greeting_display: str = Field(..., alias="greetingDisplay")
    study_plan_question: str = Field(..., alias="studyPlanQuestion")
    uploaded_exams: List[CandidateBriefingItem] = Field(default_factory=list, alias="uploadedExams")
    total_active_tests: int = Field(0, alias="totalActiveTests")
    prompt_suggestions: List[str] = Field(default_factory=list, alias="promptSuggestions")


class PlatformKnowledgeResponse(BaseModel):
    model_config = ConfigDict(populate_by_name=True)
    total_mock_tests: int = Field(0, alias="totalMockTests")
    total_practice_questions: int = Field(0, alias="totalPracticeQuestions")
    available_subjects: List[Dict[str, Any]] = Field(default_factory=list, alias="availableSubjects")
    active_exam_titles: List[str] = Field(default_factory=list, alias="activeExamTitles")
    spoken_summary: str = Field(..., alias="spokenSummary")
    display_summary: str = Field(..., alias="displaySummary")
    suggested_actions: List[Dict[str, str]] = Field(default_factory=list, alias="suggestedActions")


class NotificationAnnouncementItem(BaseModel):
    model_config = ConfigDict(populate_by_name=True)
    id: str
    title: str
    message: str
    category: str = Field("system", description="'exam', 'mock_test', 'result', 'announcement', 'system'")
    timestamp: str
    is_urgent: bool = Field(False, alias="isUrgent")


class NotificationAnnouncementResponse(BaseModel):
    model_config = ConfigDict(populate_by_name=True)
    notifications: List[NotificationAnnouncementItem] = Field(default_factory=list)
    unread_count: int = Field(0, alias="unreadCount")
    spoken_announcement: str = Field(..., alias="spokenAnnouncement")
    display_announcement: str = Field(..., alias="displayAnnouncement")


class CandidateProgressVoiceResponse(BaseModel):
    model_config = ConfigDict(populate_by_name=True)
    candidate_name: str = Field(..., alias="candidateName")
    average_accuracy: int = Field(0, alias="averageAccuracy")
    tests_completed: int = Field(0, alias="testsCompleted")
    questions_attempted: int = Field(0, alias="questionsAttempted")
    weak_subjects: List[str] = Field(default_factory=list, alias="weakSubjects")
    strong_subjects: List[str] = Field(default_factory=list, alias="strongSubjects")
    recommended_next: Dict[str, str] = Field(default_factory=dict, alias="recommendedNext")
    spoken_progress_review: str = Field(..., alias="spokenProgressReview")
    display_progress_review: str = Field(..., alias="displayProgressReview")

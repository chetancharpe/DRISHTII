from datetime import datetime
from typing import List, Optional
from pydantic import BaseModel, Field, field_validator


VALID_TEXT_SCALES = {"default", "large", "x-large", "maximum"}
VALID_CONTRAST_MODES = {"standard", "high_contrast", "extra_high_contrast"}
VALID_THEMES = {"light", "dark", "system"}
VALID_ANNOUNCEMENT_MODES = {"off", "warnings", "regular"}
VALID_READING_MODES = {"question_only", "question_and_options"}
VALID_LANGUAGES = {"en", "hi", "bn", "ta", "te", "mr", "gu", "kn"}


class AccessibilityProfileSchema(BaseModel):
    id: str
    user_id: str
    text_scale: str = "default"
    contrast_mode: str = "standard"
    theme: str = "system"
    reduced_motion: bool = False
    simplified_interface: bool = False
    screen_reader_mode: bool = False
    keyboard_navigation: bool = False
    audio_assistance: bool = False
    speech_rate: float = 1.0
    speech_volume: float = 1.0
    preferred_language: str = "en"
    timer_announcement_mode: str = "warnings"
    question_reading_mode: str = "question_and_options"
    updated_at: datetime

    class Config:
        from_attributes = True


class AccessibilityProfileUpdate(BaseModel):
    text_scale: Optional[str] = None
    contrast_mode: Optional[str] = None
    theme: Optional[str] = None
    reduced_motion: Optional[bool] = None
    simplified_interface: Optional[bool] = None
    screen_reader_mode: Optional[bool] = None
    keyboard_navigation: Optional[bool] = None
    audio_assistance: Optional[bool] = None
    speech_rate: Optional[float] = None
    speech_volume: Optional[float] = None
    preferred_language: Optional[str] = None
    timer_announcement_mode: Optional[str] = None
    question_reading_mode: Optional[str] = None

    @field_validator("text_scale")
    def validate_text_scale(cls, v):
        if v is not None and v.lower() not in VALID_TEXT_SCALES:
            raise ValueError(f"text_scale must be one of: {', '.join(VALID_TEXT_SCALES)}")
        return v.lower() if v else v

    @field_validator("contrast_mode")
    def validate_contrast(cls, v):
        if v is not None and v.lower() not in VALID_CONTRAST_MODES:
            raise ValueError(f"contrast_mode must be one of: {', '.join(VALID_CONTRAST_MODES)}")
        return v.lower() if v else v

    @field_validator("theme")
    def validate_theme(cls, v):
        if v is not None and v.lower() not in VALID_THEMES:
            raise ValueError(f"theme must be one of: {', '.join(VALID_THEMES)}")
        return v.lower() if v else v

    @field_validator("speech_rate")
    def validate_speech_rate(cls, v):
        if v is not None and not (0.5 <= v <= 2.5):
            raise ValueError("speech_rate must be between 0.5 and 2.5")
        return v

    @field_validator("speech_volume")
    def validate_speech_volume(cls, v):
        if v is not None and not (0.0 <= v <= 1.0):
            raise ValueError("speech_volume must be between 0.0 and 1.0")
        return v

    @field_validator("timer_announcement_mode")
    def validate_timer_announcement_mode(cls, v):
        if v is not None and v.lower() not in VALID_ANNOUNCEMENT_MODES:
            raise ValueError(f"timer_announcement_mode must be one of: {', '.join(VALID_ANNOUNCEMENT_MODES)}")
        return v.lower() if v else v


class AccessibilityResetResponse(BaseModel):
    status: str = "success"
    message: str = "Accessibility settings reset to platform defaults."
    profile: AccessibilityProfileSchema


class AccessibilityIssueCreate(BaseModel):
    page_url: str
    issue_type: str  # screen_reader, keyboard, contrast, text_size, audio, question_format, other
    description: str


class AccessibilityIssueResponse(BaseModel):
    id: str
    user_id: Optional[str] = None
    page_url: str
    issue_type: str
    description: str
    status: str
    created_at: datetime
    resolved_at: Optional[datetime] = None

    class Config:
        from_attributes = True


class AccessibilityScorecardResponse(BaseModel):
    total_questions: int
    alt_text_coverage_percentage: float
    accessible_formula_coverage_percentage: float
    table_header_coverage_percentage: float
    total_reported_issues: int
    open_issues: int
    resolved_issues: int
    readiness_status: str  # EXCELLENT, ATTENTION_NEEDED


class AccessibilityAuditFinding(BaseModel):
    id: str
    criterion: str
    wcag_reference: str
    principle: str  # Perceivable, Operable, Understandable, Robust
    severity: str   # INFO, WARNING, BLOCKING
    element: Optional[str] = None
    message: str
    remediation: str


class AccessibilityAuditReport(BaseModel):
    target: str
    timestamp: datetime
    total_findings: int
    blocking_count: int
    warning_count: int
    info_count: int
    findings: List[AccessibilityAuditFinding]
    scorecard_status: str  # PASS, ATTENTION_NEEDED, FAIL


# ========================================================
# AI Accessibility & Interaction Monitoring Schemas
# ========================================================

class AccessibilityEventType(str):
    CAMERA_CONNECTED = "CAMERA_CONNECTED"
    CANDIDATE_DETECTED = "CANDIDATE_DETECTED"
    CANDIDATE_ABSENT = "CANDIDATE_ABSENT"
    POSITION_SHIFTED = "POSITION_SHIFTED"
    GESTURE_DETECTED = "GESTURE_DETECTED"
    KEYBOARD_ACTION = "KEYBOARD_ACTION"
    HELP_REQUESTED = "HELP_REQUESTED"
    VOICE_FEEDBACK = "VOICE_FEEDBACK"


class AccessibilityEventCreate(BaseModel):
    eventType: str
    gesture: Optional[str] = None
    confidence: Optional[float] = None
    questionId: Optional[str] = None
    key: Optional[str] = None
    timestamp: Optional[int] = None
    sessionId: Optional[str] = None
    details: Optional[dict] = None


class AccessibilityEventResponse(BaseModel):
    status: str = "success"
    event_id: str
    received_at: datetime
    eventType: str
    action_taken: Optional[str] = None


class CandidatePresenceResult(BaseModel):
    present: bool
    face_count: int = 0
    distance_status: str = "normal"  # "normal", "too_far", "too_close"
    position_shift: float = 0.0      # Normalized offset from center [-1.0 to 1.0]
    absence_duration_seconds: float = 0.0
    alert_triggered: bool = False
    alert_message: Optional[str] = None
    timestamp: int


class GestureClassificationResult(BaseModel):
    gesture: str                     # "OPTION_1", "OPTION_2", "OPTION_3", "OPTION_4", "HELP", "CONFIRM", "UNKNOWN"
    confidence: float
    fingers_extended: List[str] = [] # e.g. ["INDEX", "MIDDLE"]
    action: Optional[str] = None     # e.g. "select_option_2"
    timestamp: int


class ChildModeSettings(BaseModel):
    larger_controls: bool = True
    slower_voice: bool = True
    simplified_navigation: bool = True
    gesture_interaction: bool = True
    voice_first_interaction: bool = True
    speech_rate_multiplier: float = 0.8



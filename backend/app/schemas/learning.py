from datetime import datetime
from typing import Any, Dict, List, Optional
from pydantic import BaseModel, Field


class LearningProfileSchema(BaseModel):
    id: str
    user_id: str
    preferred_subjects: List[str] = Field(default_factory=list)
    preferred_learning_mode: str = "guided"
    daily_goal_questions: int = 15
    weekly_goal_questions: int = 75
    difficulty_preference: str = "adaptive"
    study_session_length_minutes: int = 30
    preferred_language: str = "en"
    updated_at: datetime

    class Config:
        from_attributes = True


class LearningProfileUpdate(BaseModel):
    preferred_subjects: Optional[List[str]] = None
    preferred_learning_mode: Optional[str] = None
    daily_goal_questions: Optional[int] = None
    weekly_goal_questions: Optional[int] = None
    difficulty_preference: Optional[str] = None
    study_session_length_minutes: Optional[int] = None
    preferred_language: Optional[str] = None


class TopicProgressResponse(BaseModel):
    subject: str
    topic: str
    questions_attempted: int
    correct_answers: int
    accuracy: float  # Percentage (e.g. 54.0)
    average_time_seconds: float
    last_practiced: datetime
    # Factual status note without judgmental labels
    factual_status: str
    recommended_action: str  # "review_lesson", "practice_questions", "timed_mock"

    class Config:
        from_attributes = True


class WeeklySummaryResponse(BaseModel):
    week_start: str
    week_end: str
    questions_attempted: int
    overall_accuracy: float
    topics_practiced_count: int
    study_time_minutes: int
    highest_accuracy_subject: Optional[str] = None
    suggested_focus_topic: Optional[str] = None
    summary_text: str  # Screen-reader accessible full text equivalent


class ProgressSummaryResponse(BaseModel):
    user_id: str
    overall_accuracy: float
    total_questions_attempted: int
    total_correct: int
    total_topics_practiced: int
    study_streak_days: int
    topic_progress: List[TopicProgressResponse] = Field(default_factory=list)
    weekly_summary: WeeklySummaryResponse


class RecommendationResponse(BaseModel):
    id: str
    type: str  # practice, review, mock, pace
    topic: str
    subject: str
    reason: str
    priority: str  # high, normal, low
    created_at: datetime

    class Config:
        from_attributes = True


class PersonalizedPracticeQuestion(BaseModel):
    question_id: str
    version_number: int
    subject: str
    topic: str
    difficulty: str
    question_text: str
    options: List[Dict[str, Any]]
    marks: float
    negative_marks: float
    accessibility_metadata: Dict[str, Any]


class PersonalizedPracticeSetResponse(BaseModel):
    set_id: str
    title: str
    description: str
    total_questions: int
    target_topics: List[str]
    questions: List[PersonalizedPracticeQuestion]


class LearningActivityCreate(BaseModel):
    activity_type: str  # lesson_started, lesson_completed, practice_started, etc.
    resource_id: Optional[str] = None
    duration_seconds: int = 0
    metadata: Dict[str, Any] = Field(default_factory=dict)


class LearningActivityResponse(BaseModel):
    id: str
    user_id: str
    activity_type: str
    resource_id: Optional[str] = None
    duration_seconds: int
    timestamp: datetime
    metadata_json: Dict[str, Any]

    class Config:
        from_attributes = True


# --- Curriculum & Practice Schemas for Frontend Integration ---

class LearningTopicSummary(BaseModel):
    id: str
    subjectId: str
    name: str
    shortDescription: str
    progressPercent: int = 0
    completedLessons: int = 0
    totalLessons: int = 10
    estimatedMinutes: int = 15
    isRecommended: Optional[bool] = False
    practiceAvailable: bool = True
    practiceCount: int = 15


class LearningSubjectResponse(BaseModel):
    id: str
    examId: str = "cds"
    name: str
    code: str
    description: str
    iconName: str
    progressPercent: int = 0
    completedTopicsCount: int = 0
    totalTopicsCount: int = 3
    topics: List[LearningTopicSummary] = Field(default_factory=list)
    recommendedTopicId: Optional[str] = None


class LessonFormula(BaseModel):
    id: str
    visualText: str
    accessibleText: str
    explanation: Optional[str] = None


class LessonExample(BaseModel):
    id: str
    question: str
    steps: List[str]
    answer: str
    explanation: Optional[str] = None


class LessonSection(BaseModel):
    id: str
    title: str
    paragraphs: List[str] = Field(default_factory=list)
    formulas: Optional[List[LessonFormula]] = None
    examples: Optional[List[LessonExample]] = None
    keyPoints: Optional[List[str]] = None


class LearningTopicDetailResponse(BaseModel):
    id: str
    subjectId: str
    name: str
    shortDescription: str
    progressPercent: int = 0
    completedLessons: int = 0
    totalLessons: int = 10
    estimatedMinutes: int = 15
    isRecommended: Optional[bool] = False
    practiceAvailable: bool = True
    practiceCount: int = 15
    learningObjectives: List[str] = Field(default_factory=list)
    overview: str
    sections: List[LessonSection] = Field(default_factory=list)
    quickRecap: Optional[List[str]] = None
    audioNarrative: Optional[str] = None


class PracticeQuestionOption(BaseModel):
    id: str
    label: str
    text: str


class PracticeQuestionSanitized(BaseModel):
    id: str
    subjectId: str
    subjectName: str
    topicId: str
    topicName: str
    type: str = "single_choice"
    difficulty: str = "medium"
    questionText: str
    options: List[PracticeQuestionOption]
    hint: Optional[str] = None
    audioDescription: Optional[str] = None


class PracticeAnswerVerificationRequest(BaseModel):
    question_id: str
    selected_option_ids: List[str]
    time_spent_seconds: int = 0


class PracticeAnswerVerificationResponse(BaseModel):
    question_id: str
    is_correct: bool
    correct_option_ids: List[str]
    explanation: str


class PracticeHistoryItemResponse(BaseModel):
    id: str
    sessionId: str
    date: str
    formattedDate: str
    subjectId: str
    subjectName: str
    topicId: str
    topicName: str
    questionsCount: int
    scoreFormatted: str
    accuracyPercent: int
    timeUsedFormatted: str
    difficulty: str


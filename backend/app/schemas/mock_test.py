from typing import Any, Dict, List, Optional
from pydantic import BaseModel, ConfigDict, Field, model_validator


class MockTestQuestionOption(BaseModel):
    id: str
    label: str
    text: str


class MockTestQuestionSanitized(BaseModel):
    id: str
    sectionId: str
    questionNumber: int
    text: str
    type: str = "single_choice"
    difficulty: str = "medium"
    options: List[MockTestQuestionOption]
    audioText: Optional[str] = None
    formula: Optional[Dict[str, Any]] = None
    table: Optional[Dict[str, Any]] = None


class MockTestSectionSanitized(BaseModel):
    id: str
    name: str
    title: Optional[str] = None
    code: str
    description: str
    totalQuestions: int
    questions: List[MockTestQuestionSanitized] = Field(default_factory=list)


class MockTestSectionHeader(BaseModel):
    id: str
    name: str
    title: Optional[str] = None
    code: str
    description: str
    totalQuestions: int
    questions: List[MockTestQuestionSanitized] = Field(default_factory=list)


class MockTestMarkingScheme(BaseModel):
    correctMarks: float = 1.0
    incorrectPenalty: float = 0.33
    unansweredMarks: float = 0.0


class MockTestListItem(BaseModel):
    id: str
    title: str
    examName: str
    examCode: str
    description: str
    totalQuestions: int
    durationMinutes: int
    difficulty: str
    status: str = "not_started"
    isRecommended: Optional[bool] = False
    markingScheme: MockTestMarkingScheme
    instructionsSummary: List[str]
    accessibilityHighlights: Dict[str, str]
    sections: List[MockTestSectionHeader] = Field(default_factory=list)


class MockTestDetailResponse(MockTestListItem):
    sections: List[MockTestSectionSanitized] = Field(default_factory=list)


class MockTestUserAnswer(BaseModel):
    model_config = ConfigDict(extra="ignore")
    selectedOptionIds: List[str] = Field(default_factory=list)
    timeSpentSeconds: int = 0
    markedForReview: bool = False

    @model_validator(mode="before")
    @classmethod
    def parse_user_answer(cls, data: Any) -> Any:
        if isinstance(data, list):
            return {"selectedOptionIds": [str(x) for x in data]}
        if isinstance(data, str):
            return {"selectedOptionIds": [data]}
        if isinstance(data, dict):
            # Support various key conventions from frontend / mobile clients
            clean_data = dict(data)
            if "selectedOptionIds" not in clean_data:
                if "selectedOptionId" in clean_data and clean_data["selectedOptionId"]:
                    clean_data["selectedOptionIds"] = [str(clean_data["selectedOptionId"])]
                elif "selectedOptions" in clean_data:
                    clean_data["selectedOptionIds"] = [str(x) for x in clean_data["selectedOptions"]]
                elif "answer" in clean_data and clean_data["answer"]:
                    ans = clean_data["answer"]
                    clean_data["selectedOptionIds"] = [str(ans)] if isinstance(ans, str) else [str(x) for x in ans]
            return clean_data
        return data


class MockTestSubmitRequest(BaseModel):
    test_id: str
    answers: Dict[str, MockTestUserAnswer] = Field(default_factory=dict)
    duration_seconds: int = 2700
    seconds_remaining: int = 0


class MockTestQuestionReview(BaseModel):
    questionId: str
    questionNumber: int
    text: str
    sectionId: str
    selectedOptionIds: List[str] = Field(default_factory=list)
    correctOptionIds: List[str] = Field(default_factory=list)
    options: List[MockTestQuestionOption] = Field(default_factory=list)
    isCorrect: bool
    isSkipped: bool
    markedForReview: bool
    explanation: str
    timeSpentSeconds: int = 0


class SectionPerformance(BaseModel):
    sectionId: str
    sectionName: str
    totalQuestions: int
    attemptedCount: int
    correctCount: int
    incorrectCount: int
    unansweredCount: int
    score: float
    accuracyPercent: float


class MockTestResultResponse(BaseModel):
    resultId: str
    testId: str
    testTitle: str
    candidateId: str
    completedAt: str
    durationSeconds: int
    timeUsedSeconds: int
    totalQuestions: int
    attemptedCount: int
    correctCount: int
    incorrectCount: int
    unansweredCount: int
    markedForReviewCount: int
    totalScore: float
    maximumScore: float
    percentage: float
    isPassed: bool
    passingPercentage: float
    sections: List[SectionPerformance] = Field(default_factory=list)
    sectionPerformances: List[SectionPerformance] = Field(default_factory=list)
    reviews: List[MockTestQuestionReview] = Field(default_factory=list)


class MockTestHistoryItemResponse(BaseModel):
    id: str
    attemptId: Optional[str] = None
    sessionId: Optional[str] = None
    testId: str
    title: str
    testTitle: Optional[str] = None
    examName: Optional[str] = "CDS Examination"
    date: Optional[str] = None
    completedAt: str
    formattedDate: str
    scoreFormatted: str
    score: Optional[float] = None
    maxScore: Optional[float] = None
    percentage: Optional[float] = None
    scorePercentage: float
    isPassed: bool
    timeUsedFormatted: str
    status: Optional[str] = "completed"

from typing import Any, Dict, List, Optional
from pydantic import BaseModel, Field


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


class MockTestSectionSanitized(BaseModel):
    id: str
    name: str
    code: str
    description: str
    totalQuestions: int
    questions: List[MockTestQuestionSanitized]


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


class MockTestDetailResponse(MockTestListItem):
    sections: List[MockTestSectionSanitized]


class MockTestUserAnswer(BaseModel):
    selectedOptionIds: List[str] = Field(default_factory=list)
    timeSpentSeconds: int = 0
    markedForReview: bool = False


class MockTestSubmitRequest(BaseModel):
    test_id: str
    answers: Dict[str, MockTestUserAnswer]
    duration_seconds: int = 2700
    seconds_remaining: int = 0


class MockTestQuestionReview(BaseModel):
    questionId: str
    questionNumber: int
    text: str
    sectionId: str
    selectedOptionIds: List[str]
    correctOptionIds: List[str]
    isCorrect: bool
    isSkipped: bool
    markedForReview: bool
    explanation: str
    timeSpentSeconds: int


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
    sections: List[SectionPerformance]
    reviews: List[MockTestQuestionReview]


class MockTestHistoryItemResponse(BaseModel):
    id: str
    testId: str
    title: str
    completedAt: str
    formattedDate: str
    scoreFormatted: str
    scorePercentage: float
    isPassed: bool
    timeUsedFormatted: str

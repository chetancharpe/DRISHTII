from typing import List, Optional
from pydantic import BaseModel, Field


class CandidateProfileSchema(BaseModel):
    id: str
    name: str
    email: str
    targetExam: str = "Combined Defence Services (CDS) 2026"
    avatarUrl: Optional[str] = None
    role: str = "candidate"


class NextActionItemSchema(BaseModel):
    id: str
    title: str
    subject: str
    topic: str
    completedQuestions: int
    totalQuestions: int
    estimatedMinutesRemaining: int
    ctaLabel: str
    ctaRoute: str


class DailyGoalSchema(BaseModel):
    questionsCompleted: int
    questionsTarget: int
    timeMinutesPracticed: int
    targetMinutes: int
    topicsCompleted: int
    topicsTarget: int
    streakDays: int
    streakSupportiveMessage: str


class QuickActionItemSchema(BaseModel):
    id: str
    title: str
    description: str
    route: str
    iconName: str
    badge: Optional[str] = None


class DashboardStatsSchema(BaseModel):
    overallProgressPercent: int
    questionsPracticedCount: int
    mockTestsCompletedCount: int
    averageScorePercent: int


class SubjectProgressItemSchema(BaseModel):
    id: str
    subject: str
    progressPercent: int
    masteredTopics: int
    totalTopics: int
    practiceRoute: str


class LearningProgressItemSchema(BaseModel):
    id: str
    subject: str
    topic: str
    completedLessons: int
    totalLessons: int
    nextLessonTitle: str
    continueRoute: str


class PracticeRecommendationItemSchema(BaseModel):
    id: str
    subject: str
    topic: str
    questionCount: int
    difficulty: str
    estimatedMinutes: int
    practiceRoute: str


class MockTestDashboardItemSchema(BaseModel):
    id: str
    title: str
    questionCount: int
    durationMinutes: int
    difficulty: str
    accessibilitySupport: str
    testRoute: str
    isNew: Optional[bool] = False


class UpcomingExamDashboardItemSchema(BaseModel):
    id: str
    title: str
    dateFormatted: str
    durationMinutes: int
    status: str
    detailsRoute: str
    registrationNumber: Optional[str] = None


class PerformanceRecordItemSchema(BaseModel):
    id: str
    testTitle: str
    scorePercent: int
    dateFormatted: str
    isPassed: bool
    viewRoute: str


class PerformanceTrendDataSchema(BaseModel):
    testLabels: List[str]
    scores: List[int]
    textAlternative: str
    trendDescription: str


class WeakAreaTopicItemSchema(BaseModel):
    id: str
    topic: str
    subject: str
    accuracyPercent: int
    practiceRoute: str


class RecentActivityItemSchema(BaseModel):
    id: str
    title: str
    timestamp: str
    type: str


class CandidateDashboardResponse(BaseModel):
    profile: CandidateProfileSchema
    nextAction: NextActionItemSchema
    dailyGoal: DailyGoalSchema
    quickActions: List[QuickActionItemSchema]
    overviewStats: DashboardStatsSchema
    subjectProgress: List[SubjectProgressItemSchema]
    continueLearning: Optional[LearningProgressItemSchema] = None
    recommendations: List[PracticeRecommendationItemSchema] = Field(default_factory=list)
    mockTests: List[MockTestDashboardItemSchema] = Field(default_factory=list)
    upcomingExams: List[UpcomingExamDashboardItemSchema] = Field(default_factory=list)
    recentPerformance: List[PerformanceRecordItemSchema] = Field(default_factory=list)
    performanceTrend: PerformanceTrendDataSchema
    weakAreas: List[WeakAreaTopicItemSchema] = Field(default_factory=list)
    recentActivity: List[RecentActivityItemSchema] = Field(default_factory=list)

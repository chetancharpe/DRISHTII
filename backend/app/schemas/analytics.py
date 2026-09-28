from typing import Dict, List, Optional
from pydantic import BaseModel, Field


class ExamMonitorCandidateStatus(BaseModel):
    candidate_id: str
    masked_name: str
    status: str  # NOT_STARTED, ACTIVE, INTERRUPTED, SUBMITTED, EXPIRED
    remaining_seconds: Optional[int] = None
    answered_count: int = 0
    total_questions: int = 0
    last_sync_seconds_ago: Optional[int] = None


class ExamMonitorSummary(BaseModel):
    exam_id: str
    total_assigned: int
    not_started: int
    active: int
    interrupted: int
    submitted: int
    expired: int
    candidates: List[ExamMonitorCandidateStatus] = Field(default_factory=list)


class QuestionPerformanceItem(BaseModel):
    question_id: str
    question_text_preview: str
    correct_attempts: int
    total_attempts: int
    accuracy_percentage: float
    # Psychometric item indicators
    item_difficulty_p: float = 0.0
    difficulty_tier: str = "OPTIMAL"  # "EASY", "OPTIMAL", "DIFFICULT"
    discrimination_index_d: float = 0.0
    discrimination_tier: str = "GOOD"  # "EXCELLENT", "GOOD", "MARGINAL", "POOR"
    point_biserial_r: float = 0.0
    distractor_distribution: Dict[str, int] = Field(default_factory=dict)


class ExamAnalyticsResponse(BaseModel):
    exam_id: str
    exam_title: str
    total_submissions: int
    evaluated_count: int
    average_score: float
    highest_score: float
    lowest_score: float
    average_percentage: float
    pass_rate_percentage: float
    question_performance: List[QuestionPerformanceItem] = Field(default_factory=list)
    # Psychometric test-level reliability & equity metrics
    cronbach_alpha: float = 0.0
    reliability_tier: str = "ACCEPTABLE"  # "EXCELLENT", "GOOD", "ACCEPTABLE", "QUESTIONABLE"
    equity_accommodated_avg_score: Optional[float] = None
    equity_standard_avg_score: Optional[float] = None
    equity_difference_pct: Optional[float] = None

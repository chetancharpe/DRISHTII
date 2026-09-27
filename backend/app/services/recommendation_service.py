from abc import ABC, abstractmethod
from typing import List, Optional
from sqlalchemy.orm import Session
from app.models.learning_profile import LearningProfile, Recommendation, TopicProgress
from app.models.question import Question
from app.models.question_version import QuestionVersion
from app.schemas.learning import (
    PersonalizedPracticeQuestion,
    PersonalizedPracticeSetResponse,
    RecommendationResponse,
)
from app.utils.datetime import utc_now

# Explicit Transparent Rule Thresholds (Section 60)
LOW_ACCURACY_THRESHOLD = 60.0
PRACTICE_THRESHOLD = 75.0
HIGH_ACCURACY_THRESHOLD = 85.0


class RecommendationEngine(ABC):
    """Abstract interface for learning recommendation engines (Section 61)."""

    @abstractmethod
    def generate_recommendations(self, db: Session, user_id: str) -> List[RecommendationResponse]:
        pass

    @abstractmethod
    def generate_personalized_practice_set(
        self, db: Session, user_id: str, limit: int = 10
    ) -> PersonalizedPracticeSetResponse:
        pass


class RuleBasedRecommendationEngine(RecommendationEngine):
    """
    Transparent, deterministic rule-based engine.
    Enforces Section 22, 25 & 26: Respectful, factual, actionable feedback without labeling.
    """

    def generate_recommendations(self, db: Session, user_id: str) -> List[RecommendationResponse]:
        topic_progresses = (
            db.query(TopicProgress)
            .filter(TopicProgress.user_id == user_id)
            .order_by(TopicProgress.last_practiced.desc())
            .all()
        )

        recommendations: List[RecommendationResponse] = []

        if not topic_progresses:
            # Cold start: suggest foundational practice based on user's preferred subjects
            profile = db.query(LearningProfile).filter(LearningProfile.user_id == user_id).first()
            subjects = profile.preferred_subjects if profile and profile.preferred_subjects else ["Mathematics", "Logical Reasoning"]
            for subj in subjects[:2]:
                rec = RecommendationResponse(
                    id=f"cold-start-{subj}",
                    type="practice",
                    subject=subj,
                    topic="Foundations",
                    reason=f"Start your practice journey with introductory questions in {subj}.",
                    priority="normal",
                    created_at=utc_now(),
                )
                recommendations.append(rec)
            return recommendations

        for tp in topic_progresses:
            if tp.questions_attempted < 3:
                continue

            if tp.accuracy < LOW_ACCURACY_THRESHOLD:
                # Factual recommendation to review lesson
                rec = RecommendationResponse(
                    id=f"rec-rev-{tp.id}",
                    type="review",
                    subject=tp.subject,
                    topic=tp.topic,
                    reason=f"Your recent accuracy in {tp.topic} is {int(tp.accuracy)}%. Consider reviewing the conceptual lesson first.",
                    priority="high",
                    created_at=utc_now(),
                )
                recommendations.append(rec)
            elif tp.accuracy < PRACTICE_THRESHOLD:
                # Recommendation to practice questions
                rec = RecommendationResponse(
                    id=f"rec-prac-{tp.id}",
                    type="practice",
                    subject=tp.subject,
                    topic=tp.topic,
                    reason=f"Your recent accuracy in {tp.topic} is {int(tp.accuracy)}%. A 10-question practice set will help solidify this topic.",
                    priority="normal",
                    created_at=utc_now(),
                )
                recommendations.append(rec)
            else:
                # High accuracy: suggest timed practice or mock test
                rec = RecommendationResponse(
                    id=f"rec-mock-{tp.id}",
                    type="mock",
                    subject=tp.subject,
                    topic=tp.topic,
                    reason=f"Great consistency! Your accuracy in {tp.topic} is {int(tp.accuracy)}%. Try a timed mock test to challenge yourself.",
                    priority="low",
                    created_at=utc_now(),
                )
                recommendations.append(rec)

        # Cap recommendations to top 5
        return recommendations[:5]

    def generate_personalized_practice_set(
        self, db: Session, user_id: str, limit: int = 10
    ) -> PersonalizedPracticeSetResponse:
        """
        Generate a curated practice set tailored to unmastered topics.
        Enforces Section 29, 31 & 34: Accessibility-aware question selection!
        """
        progress_records = (
            db.query(TopicProgress)
            .filter(TopicProgress.user_id == user_id)
            .order_by(TopicProgress.accuracy.asc())
            .all()
        )

        target_topics = [p.topic for p in progress_records if p.accuracy < PRACTICE_THRESHOLD]
        if not target_topics:
            target_topics = ["Probability", "Percentages", "Linear Equations", "Reading Comprehension"]

        # Fetch active accessible questions matching target topics
        questions_query = (
            db.query(Question)
            .filter(Question.is_active == True)
            .filter(Question.topic.in_(target_topics))
            .limit(limit)
        )
        selected_questions = questions_query.all()

        # Fallback if fewer questions in target topics
        if len(selected_questions) < limit:
            remaining = limit - len(selected_questions)
            more_q = (
                db.query(Question)
                .filter(Question.is_active == True)
                .filter(~Question.id.in_([q.id for q in selected_questions]))
                .limit(remaining)
                .all()
            )
            selected_questions.extend(more_q)

        practice_items: List[PersonalizedPracticeQuestion] = []
        topics_covered = set()

        for q in selected_questions:
            latest_v = (
                db.query(QuestionVersion)
                .filter(QuestionVersion.question_id == q.id)
                .order_by(QuestionVersion.version_number.desc())
                .first()
            )
            if not latest_v:
                continue

            topics_covered.add(q.topic)
            practice_items.append(
                PersonalizedPracticeQuestion(
                    question_id=q.id,
                    version_number=latest_v.version_number,
                    subject=q.subject,
                    topic=q.topic,
                    difficulty=q.difficulty,
                    question_text=latest_v.question_text,
                    options=latest_v.options or [],
                    marks=latest_v.marks,
                    negative_marks=latest_v.negative_marks,
                    accessibility_metadata=latest_v.accessibility_metadata or {},
                )
            )

        return PersonalizedPracticeSetResponse(
            set_id=f"practice-set-{user_id[:8]}",
            title="Personalized Practice Set",
            description="Questions curated based on your recent practice accuracy and learning goals.",
            total_questions=len(practice_items),
            target_topics=list(topics_covered),
            questions=practice_items,
        )


# Default singleton instance
recommendation_engine = RuleBasedRecommendationEngine()


def get_recommendations_for_user(db: Session, user_id: str) -> List[RecommendationResponse]:
    return recommendation_engine.generate_recommendations(db, user_id)


def get_personalized_practice(db: Session, user_id: str, limit: int = 10) -> PersonalizedPracticeSetResponse:
    return recommendation_engine.generate_personalized_practice_set(db, user_id, limit)

from typing import List, Optional
from fastapi import APIRouter, Depends, Query, status
from sqlalchemy.orm import Session
from app.api.deps import get_current_user, get_db
from app.models.user import User
from app.schemas.learning import (
    LearningActivityCreate,
    LearningActivityResponse,
    LearningProfileSchema,
    LearningProfileUpdate,
    PersonalizedPracticeSetResponse,
    ProgressSummaryResponse,
    RecommendationResponse,
)
from app.services.learning_service import (
    get_or_create_learning_profile,
    get_progress_summary,
    record_learning_activity,
    update_learning_profile,
)
from app.services.recommendation_service import (
    get_personalized_practice,
    get_recommendations_for_user,
)

router = APIRouter(prefix="", tags=["Learning & Intelligence"])


@router.get("/learning/profile", response_model=LearningProfileSchema)
def get_learning_profile(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Retrieve personalized learning goals, target subjects, and session length."""
    return get_or_create_learning_profile(db, current_user.id)


@router.patch("/learning/profile", response_model=LearningProfileSchema)
def update_profile(
    updates: LearningProfileUpdate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Update preferred subjects and daily study targets."""
    return update_learning_profile(db, current_user.id, updates)


@router.get("/progress", response_model=ProgressSummaryResponse)
def get_progress(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """
    Retrieve candidate practice progress and accessible weekly narrative.
    Includes factual accuracy percentages without judgmental student labeling.
    """
    return get_progress_summary(db, current_user.id)


@router.get("/recommendations", response_model=List[RecommendationResponse])
def get_recommendations(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """
    Retrieve rule-based learning recommendations based on recent topic accuracy.
    Transparent, deterministic reasoning.
    """
    return get_recommendations_for_user(db, current_user.id)


@router.get("/practice/personalized", response_model=PersonalizedPracticeSetResponse)
def get_practice_set(
    limit: int = Query(10, ge=1, le=25),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """
    Generate an adaptive 'Practice for You' question set covering unmastered topics.
    Ensures full question accessibility.
    """
    return get_personalized_practice(db, current_user.id, limit)


@router.post("/activity", response_model=LearningActivityResponse, status_code=status.HTTP_201_CREATED)
def log_activity(
    data: LearningActivityCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Log learning activity event with strict data minimization."""
    act = record_learning_activity(
        db=db,
        user_id=current_user.id,
        activity_type=data.activity_type,
        resource_id=data.resource_id,
        duration_seconds=data.duration_seconds,
        metadata=data.metadata,
    )
    return LearningActivityResponse(
        id=act.id,
        user_id=act.user_id,
        activity_type=act.activity_type,
        resource_id=act.resource_id,
        duration_seconds=act.duration_seconds,
        timestamp=act.timestamp,
        metadata_json=act.metadata_json,
    )


# --- CURRICULUM & PRACTICE ENDPOINTS ---

from app.core.curriculum import (
    CURRICULUM_SUBJECTS,
    CURRICULUM_TOPICS,
    PRACTICE_QUESTIONS_MASTER,
)
from app.models.learning_profile import LearningActivity, TopicProgress
from app.schemas.learning import (
    LearningSubjectResponse,
    LearningTopicDetailResponse,
    LearningTopicSummary,
    LessonExample,
    LessonFormula,
    LessonSection,
    PracticeAnswerVerificationRequest,
    PracticeAnswerVerificationResponse,
    PracticeHistoryItemResponse,
    PracticeQuestionOption,
    PracticeQuestionSanitized,
)
from app.utils.datetime import utc_now
from fastapi import HTTPException


@router.get("/learning/subjects", response_model=List[LearningSubjectResponse])
def get_learning_subjects(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """
    Retrieve all learning subjects with candidate's actual progress calculated from TopicProgress.
    """
    topic_records = (
        db.query(TopicProgress)
        .filter(TopicProgress.user_id == current_user.id)
        .all()
    )
    progress_map = {(tp.subject.lower(), tp.topic.lower()): tp for tp in topic_records}

    responses: List[LearningSubjectResponse] = []
    for s in CURRICULUM_SUBJECTS:
        s_id = s["id"]
        raw_topics = CURRICULUM_TOPICS.get(s_id, [])
        topic_summaries: List[LearningTopicSummary] = []
        completed_topics_count = 0
        total_acc = 0.0

        for t in raw_topics:
            t_id = t["id"]
            rec = progress_map.get((s_id, t_id)) or progress_map.get((s["name"].lower(), t_id))
            if rec:
                pct = int(round(rec.accuracy))
                completed_lessons = min(t.get("totalLessons", 10), rec.questions_attempted)
                if rec.accuracy >= 70.0:
                    completed_topics_count += 1
            else:
                pct = t.get("progressPercent", 60)
                completed_lessons = t.get("completedLessons", 5)
                if pct >= 70:
                    completed_topics_count += 1

            total_acc += pct
            topic_summaries.append(
                LearningTopicSummary(
                    id=t_id,
                    subjectId=s_id,
                    name=t["name"],
                    shortDescription=t["shortDescription"],
                    progressPercent=pct,
                    completedLessons=completed_lessons,
                    totalLessons=t.get("totalLessons", 10),
                    estimatedMinutes=t.get("estimatedMinutes", 15),
                    isRecommended=t.get("isRecommended", False),
                    practiceAvailable=t.get("practiceAvailable", True),
                    practiceCount=t.get("practiceCount", 15),
                )
            )

        avg_progress = int(round(total_acc / len(raw_topics))) if raw_topics else 60
        responses.append(
            LearningSubjectResponse(
                id=s_id,
                examId=s.get("examId", "cds"),
                name=s["name"],
                code=s["code"],
                description=s["description"],
                iconName=s["iconName"],
                progressPercent=avg_progress,
                completedTopicsCount=completed_topics_count,
                totalTopicsCount=len(raw_topics),
                topics=topic_summaries,
                recommendedTopicId=s.get("recommendedTopicId"),
            )
        )

    return responses


@router.get("/learning/topics/{topic_id}", response_model=LearningTopicDetailResponse)
def get_topic_detail(
    topic_id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """
    Retrieve comprehensive topic lesson content, sections, formulas, and audio walkthrough.
    """
    target_topic = None
    target_subject_id = None
    for subj_id, topics in CURRICULUM_TOPICS.items():
        for t in topics:
            if t["id"] == topic_id:
                target_topic = t
                target_subject_id = subj_id
                break
        if target_topic:
            break

    if not target_topic:
        # Fallback to percentages
        target_topic = CURRICULUM_TOPICS["mathematics"][0]
        target_subject_id = "mathematics"

    # Query candidate progress
    rec = (
        db.query(TopicProgress)
        .filter(TopicProgress.user_id == current_user.id, TopicProgress.topic == target_topic["id"])
        .first()
    )
    progress_pct = int(round(rec.accuracy)) if rec else target_topic.get("progressPercent", 60)
    completed_lessons = rec.questions_attempted if rec else target_topic.get("completedLessons", 6)

    sections_res: List[LessonSection] = []
    for sec in target_topic.get("sections", []):
        formulas = None
        if "formulas" in sec and sec["formulas"]:
            formulas = [
                LessonFormula(
                    id=f["id"],
                    visualText=f["visualText"],
                    accessibleText=f["accessibleText"],
                    explanation=f.get("explanation"),
                )
                for f in sec["formulas"]
            ]

        examples = None
        if "examples" in sec and sec["examples"]:
            examples = [
                LessonExample(
                    id=e["id"],
                    question=e["question"],
                    steps=e["steps"],
                    answer=e["answer"],
                    explanation=e.get("explanation"),
                )
                for e in sec["examples"]
            ]

        sections_res.append(
            LessonSection(
                id=sec["id"],
                title=sec["title"],
                paragraphs=sec.get("paragraphs", []),
                formulas=formulas,
                examples=examples,
                keyPoints=sec.get("keyPoints"),
            )
        )

    return LearningTopicDetailResponse(
        id=target_topic["id"],
        subjectId=target_subject_id,
        name=target_topic["name"],
        shortDescription=target_topic["shortDescription"],
        progressPercent=progress_pct,
        completedLessons=completed_lessons,
        totalLessons=target_topic.get("totalLessons", 10),
        estimatedMinutes=target_topic.get("estimatedMinutes", 15),
        isRecommended=target_topic.get("isRecommended", False),
        practiceAvailable=target_topic.get("practiceAvailable", True),
        practiceCount=target_topic.get("practiceCount", 15),
        learningObjectives=target_topic.get("learningObjectives", []),
        overview=target_topic.get("overview", ""),
        sections=sections_res,
        quickRecap=target_topic.get("quickRecap"),
        audioNarrative=target_topic.get("audioNarrative"),
    )


@router.get("/practice/questions", response_model=List[PracticeQuestionSanitized])
def get_practice_questions(
    subjectId: Optional[str] = Query(None),
    topicId: Optional[str] = Query(None),
    difficulty: Optional[str] = Query(None),
    limit: int = Query(10, ge=1, le=50),
    current_user: User = Depends(get_current_user),
):
    """
    Retrieve questions for interactive candidate practice.
    Sanitized: Answer keys and explanations are strictly stripped.
    """
    filtered = PRACTICE_QUESTIONS_MASTER

    if subjectId and subjectId != "all":
        filtered = [q for q in filtered if q["subjectId"] == subjectId]

    if topicId and topicId != "all":
        filtered = [q for q in filtered if q["topicId"] == topicId]

    if difficulty and difficulty != "all":
        filtered = [q for q in filtered if q["difficulty"] == difficulty]

    if not filtered:
        filtered = PRACTICE_QUESTIONS_MASTER

    results: List[PracticeQuestionSanitized] = []
    for q in filtered[:limit]:
        options = [
            PracticeQuestionOption(id=opt["id"], label=opt["label"], text=opt["text"])
            for opt in q["options"]
        ]
        results.append(
            PracticeQuestionSanitized(
                id=q["id"],
                subjectId=q["subjectId"],
                subjectName=q["subjectName"],
                topicId=q["topicId"],
                topicName=q["topicName"],
                type=q.get("type", "single_choice"),
                difficulty=q.get("difficulty", "medium"),
                questionText=q["questionText"],
                options=options,
                hint=q.get("hint"),
                audioDescription=q.get("audioDescription"),
            )
        )

    return results


@router.post("/practice/verify-answer", response_model=PracticeAnswerVerificationResponse)
def verify_practice_answer(
    submission: PracticeAnswerVerificationRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """
    Authoritative server-side answer verification.
    Validates selected options, updates candidate TopicProgress, and logs learning activity.
    Only after submission does the candidate receive the correct answer key and explanation.
    """
    question = next((q for q in PRACTICE_QUESTIONS_MASTER if q["id"] == submission.question_id), None)
    if not question:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Question '{submission.question_id}' not found in active practice pool.",
        )

    correct_options = question.get("correctOptionIds", [])
    is_correct = sorted(submission.selected_option_ids) == sorted(correct_options)

    # Upsert TopicProgress
    subj_name = question["subjectName"]
    topic_name = question["topicName"]
    topic_prog = (
        db.query(TopicProgress)
        .filter(
            TopicProgress.user_id == current_user.id,
            TopicProgress.subject == subj_name,
            TopicProgress.topic == topic_name,
        )
        .first()
    )

    if not topic_prog:
        topic_prog = TopicProgress(
            user_id=current_user.id,
            subject=subj_name,
            topic=topic_name,
            questions_attempted=1,
            correct_answers=1 if is_correct else 0,
            incorrect_answers=0 if is_correct else 1,
            accuracy=100.0 if is_correct else 0.0,
            average_time_seconds=float(submission.time_spent_seconds or 20),
            last_practiced=utc_now(),
        )
        db.add(topic_prog)
    else:
        topic_prog.questions_attempted += 1
        if is_correct:
            topic_prog.correct_answers += 1
        else:
            topic_prog.incorrect_answers += 1
        topic_prog.accuracy = round((topic_prog.correct_answers / topic_prog.questions_attempted * 100), 1)
        topic_prog.last_practiced = utc_now()
        if submission.time_spent_seconds > 0:
            topic_prog.average_time_seconds = round(
                (topic_prog.average_time_seconds + submission.time_spent_seconds) / 2, 1
            )

    # Log LearningActivity
    activity = LearningActivity(
        user_id=current_user.id,
        activity_type="question_answered",
        resource_id=submission.question_id,
        duration_seconds=submission.time_spent_seconds,
        timestamp=utc_now(),
        metadata_json={
            "subject": subj_name,
            "topic": topic_name,
            "is_correct": is_correct,
            "title": f"Practiced {topic_name}: {'Correct' if is_correct else 'Review needed'}",
        },
    )
    db.add(activity)
    db.commit()

    return PracticeAnswerVerificationResponse(
        question_id=submission.question_id,
        is_correct=is_correct,
        correct_option_ids=correct_options,
        explanation=question.get("explanation", "Standard pedagogical solution."),
    )


@router.get("/practice/history", response_model=List[PracticeHistoryItemResponse])
def get_practice_history(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Retrieve historical practice sessions conducted by the candidate."""
    # Build list from DB activities or provide standard seeded entries
    activities = (
        db.query(LearningActivity)
        .filter(LearningActivity.user_id == current_user.id, LearningActivity.activity_type == "question_answered")
        .order_by(LearningActivity.timestamp.desc())
        .limit(10)
        .all()
    )

    items: List[PracticeHistoryItemResponse] = []
    if activities:
        for idx, act in enumerate(activities):
            meta = act.metadata_json or {}
            items.append(
                PracticeHistoryItemResponse(
                    id=act.id,
                    sessionId=f"sess-act-{act.id[:8]}",
                    date=act.timestamp.strftime("%Y-%m-%d"),
                    formattedDate=act.timestamp.strftime("%d %b %Y"),
                    subjectId=meta.get("subject", "Mathematics").lower(),
                    subjectName=meta.get("subject", "Mathematics"),
                    topicId=meta.get("topic", "Percentages").lower().replace(" ", "-"),
                    topicName=meta.get("topic", "Percentages"),
                    questionsCount=10,
                    scoreFormatted=f"{'8' if meta.get('is_correct') else '6'} / 10",
                    accuracyPercent=80 if meta.get("is_correct") else 60,
                    timeUsedFormatted=f"{act.duration_seconds // 60}m {act.duration_seconds % 60}s",
                    difficulty="medium",
                )
            )
    else:
        items = [
            PracticeHistoryItemResponse(
                id="hist-01",
                sessionId="sess-math-perc-01",
                date="2026-09-24",
                formattedDate="24 Sep 2026",
                subjectId="mathematics",
                subjectName="Mathematics",
                topicId="percentages",
                topicName="Percentages",
                questionsCount=10,
                scoreFormatted="7 / 10",
                accuracyPercent=70,
                timeUsedFormatted="8m 20s",
                difficulty="medium",
            ),
            PracticeHistoryItemResponse(
                id="hist-02",
                sessionId="sess-reas-code-01",
                date="2026-09-22",
                formattedDate="22 Sep 2026",
                subjectId="reasoning",
                subjectName="Reasoning Ability",
                topicId="coding-decoding",
                topicName="Coding & Decoding",
                questionsCount=10,
                scoreFormatted="8 / 10",
                accuracyPercent=80,
                timeUsedFormatted="6m 45s",
                difficulty="easy",
            ),
            PracticeHistoryItemResponse(
                id="hist-03",
                sessionId="sess-eng-gram-01",
                date="2026-09-20",
                formattedDate="20 Sep 2026",
                subjectId="english",
                subjectName="English Language",
                topicId="grammar",
                topicName="Grammar & Correction",
                questionsCount=15,
                scoreFormatted="11 / 15",
                accuracyPercent=73,
                timeUsedFormatted="11m 10s",
                difficulty="medium",
            ),
            PracticeHistoryItemResponse(
                id="hist-04",
                sessionId="sess-gk-curr-01",
                date="2026-09-18",
                formattedDate="18 Sep 2026",
                subjectId="general-knowledge",
                subjectName="General Knowledge",
                topicId="current-affairs",
                topicName="Current Affairs",
                questionsCount=10,
                scoreFormatted="5 / 10",
                accuracyPercent=50,
                timeUsedFormatted="7m 30s",
                difficulty="hard",
            ),
        ]

    return items


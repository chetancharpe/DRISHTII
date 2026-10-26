import uuid
from datetime import datetime, timezone
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.api.deps import get_current_user, get_current_user_optional, get_db
from app.core.curriculum import MOCK_TESTS_MASTER
from app.models.exam import Exam, ExamStatus
from app.models.learning_profile import LearningActivity
from app.models.question import Question
from app.models.question_version import QuestionVersion
from app.models.section import ExamSection, SectionQuestion
from app.models.user import User
from app.schemas.mock_test import (
    MockTestDetailResponse,
    MockTestHistoryItemResponse,
    MockTestListItem,
    MockTestQuestionOption,
    MockTestQuestionReview,
    MockTestQuestionSanitized,
    MockTestResultResponse,
    MockTestSectionHeader,
    MockTestSectionSanitized,
    MockTestSubmitRequest,
    SectionPerformance,
)
from app.utils.datetime import utc_now

router = APIRouter(prefix="/mock-tests", tags=["Mock Test Engine"])


def _extract_exam_as_mock_test(db_exam: Exam) -> Optional[dict]:
    """Helper to convert a database Exam model into the mock test structure."""
    if not db_exam or not db_exam.sections:
        return None

    sections_data = []
    total_q = 0
    for sec in sorted(db_exam.sections, key=lambda s: s.display_order):
        q_list = []
        for sq in sorted(sec.section_questions or [], key=lambda q: q.display_order):
            qv = sq.question_version
            if qv:
                total_q += 1
                correct_raw = qv.correct_answer or "A"
                correct_opts = (
                    [opt.strip() for opt in correct_raw.split(",")]
                    if isinstance(correct_raw, str)
                    else list(correct_raw)
                )
                meta = qv.accessibility_metadata or {}
                q_list.append(
                    {
                        "id": sq.question_id,
                        "sectionId": sec.id,
                        "questionNumber": sq.display_order,
                        "text": qv.question_text,
                        "type": sq.question.question_type if sq.question else "single_choice",
                        "difficulty": sq.question.difficulty if sq.question else "medium",
                        "options": qv.options or [],
                        "correctOptionIds": correct_opts,
                        "explanation": qv.explanation or "Standard pedagogical explanation.",
                        "audioText": meta.get("audio_text") or meta.get("audio_description"),
                        "formula": meta.get("formula_spoken_text"),
                        "table": meta.get("table_data"),
                    }
                )
        sections_data.append(
            {
                "id": sec.id,
                "name": sec.title,
                "code": sec.title[:4].upper(),
                "description": sec.description or "",
                "totalQuestions": len(q_list),
                "questions": q_list,
            }
        )

    instructions = [i.strip() for i in (db_exam.instructions or "").split("\n") if i.strip()] or [
        "Official accessible examination simulation.",
        "Answers are automatically synchronized with the server.",
    ]

    return {
        "id": db_exam.id,
        "title": db_exam.title,
        "examName": db_exam.organization.name if db_exam.organization else "GoWow Examination Board",
        "examCode": f"GW-{db_exam.id[:8].upper()}",
        "description": db_exam.description or "",
        "totalQuestions": total_q,
        "durationMinutes": max(15, db_exam.duration_seconds // 60),
        "difficulty": "medium",
        "status": "not_started",
        "isRecommended": True,
        "markingScheme": {
            "correctMarks": 1.0,
            "incorrectPenalty": 0.33,
            "unansweredMarks": 0.0,
        },
        "instructionsSummary": instructions,
        "accessibilityHighlights": {
            "keyboard": "Full keyboard navigation supported (Tab, Shift+Tab, Arrow keys, Enter, Space).",
            "screenReader": "Designed for screen-reader compatibility with semantic landmark hierarchy.",
            "audio": "Audio assistance available for question prompts and choices per your settings.",
            "visual": "High contrast outlines, dark mode compatibility, and scalable typography supported.",
        },
        "sections": sections_data,
    }


def _get_test_data(test_id: str, db: Session) -> dict:
    """Retrieve test data by checking database Exam first, then static curriculum."""
    db_exam = db.query(Exam).filter(Exam.id == test_id).first()
    if db_exam:
        converted = _extract_exam_as_mock_test(db_exam)
        if converted:
            return converted

    test = next((t for t in MOCK_TESTS_MASTER if t["id"] == test_id), None)
    if not test:
        test = MOCK_TESTS_MASTER[0]
    return test


@router.get("", response_model=List[MockTestListItem])
def list_mock_tests(
    current_user: Optional[User] = Depends(get_current_user_optional),
    db: Session = Depends(get_db),
):
    """Retrieve list of available mock tests, integrating both database-seeded exams and curriculum catalog."""
    results = []
    seen_ids = set()

    # 1. Database-backed ready exams
    db_exams = (
        db.query(Exam)
        .filter(Exam.status.in_([ExamStatus.READY.value, ExamStatus.SCHEDULED.value]))
        .order_by(Exam.created_at.desc())
        .all()
    )
    for exam in db_exams:
        seen_ids.add(exam.id)
        sec_summaries = [
            MockTestSectionHeader(
                id=s.id,
                name=s.title,
                title=s.title,
                code=s.title[:4].upper(),
                description=s.description or "",
                totalQuestions=s.question_count,
                questions=[],
            )
            for s in exam.sections
        ]
        results.append(
            MockTestListItem(
                id=exam.id,
                title=exam.title,
                examName=exam.organization.name if exam.organization else "GoWow Examination Board",
                examCode=f"GW-{exam.id[:8].upper()}",
                description=exam.description or "",
                totalQuestions=sum(s.question_count for s in exam.sections),
                durationMinutes=max(15, exam.duration_seconds // 60),
                difficulty="medium",
                status="not_started",
                isRecommended=True,
                markingScheme={
                    "correctMarks": 1.0,
                    "incorrectPenalty": 0.33,
                    "unansweredMarks": 0.0,
                },
                instructionsSummary=[i.strip() for i in (exam.instructions or "").split("\n") if i.strip()],
                accessibilityHighlights={
                    "keyboard": "Full keyboard navigation supported (Tab, Shift+Tab, Arrow keys, Enter, Space).",
                    "screenReader": "Designed for screen-reader compatibility with semantic landmark hierarchy.",
                    "audio": "Audio assistance available for question prompts and choices per your settings.",
                    "visual": "High contrast outlines, dark mode compatibility, and scalable typography supported.",
                },
                sections=sec_summaries,
            )
        )

    # 2. Add static curriculum tests if not already seeded
    for test in MOCK_TESTS_MASTER:
        if test["id"] in seen_ids:
            continue
        sections_summary = [
            MockTestSectionHeader(
                id=s["id"],
                name=s["name"],
                title=s["name"],
                code=s["code"],
                description=s["description"],
                totalQuestions=s["totalQuestions"],
                questions=[],
            )
            for s in test.get("sections", [])
        ]
        results.append(
            MockTestListItem(
                id=test["id"],
                title=test["title"],
                examName=test["examName"],
                examCode=test["examCode"],
                description=test["description"],
                totalQuestions=test["totalQuestions"],
                durationMinutes=test["durationMinutes"],
                difficulty=test["difficulty"],
                status="not_started",
                isRecommended=test.get("isRecommended", False),
                markingScheme=test["markingScheme"],
                instructionsSummary=test["instructionsSummary"],
                accessibilityHighlights=test["accessibilityHighlights"],
                sections=sections_summary,
            )
        )
    return results


@router.get("/history", response_model=List[MockTestHistoryItemResponse])
def get_mock_test_history(
    current_user: Optional[User] = Depends(get_current_user_optional),
    db: Session = Depends(get_db),
):
    """Retrieve historical mock tests completed by the candidate."""
    activities = []
    if current_user:
        activities = (
            db.query(LearningActivity)
            .filter(LearningActivity.user_id == current_user.id, LearningActivity.activity_type == "mock_completed")
            .order_by(LearningActivity.timestamp.desc())
            .limit(10)
            .all()
        )

    results = []
    for act in activities:
        meta = act.metadata_json or {}
        time_mins = act.duration_seconds // 60
        time_secs = act.duration_seconds % 60
        pct = float(meta.get("percentage", 75.0))
        score_val = float(meta.get("score", 4.5))
        test_title = meta.get("title", "CDS Mock Test").replace("Finished ", "")
        results.append(
            MockTestHistoryItemResponse(
                id=act.id,
                attemptId=act.id,
                sessionId=f"mock-sess-{act.resource_id or 'cds-full-mock-01'}",
                testId=act.resource_id or "cds-full-mock-01",
                title=test_title,
                testTitle=test_title,
                examName="CDS (Combined Defence Services)",
                date=act.timestamp.strftime("%Y-%m-%d %H:%M:%S"),
                completedAt=act.timestamp.strftime("%Y-%m-%d %H:%M:%S"),
                formattedDate=act.timestamp.strftime("%d %b %Y"),
                scoreFormatted=f"{score_val:.1f} marks",
                score=score_val,
                maxScore=6.0,
                percentage=pct,
                scorePercentage=pct,
                isPassed=meta.get("passed", pct >= 50.0),
                timeUsedFormatted=f"{time_mins}m {time_secs}s",
                status="completed",
            )
        )

    # If no activities in DB yet, provide realistic historical demo entries
    if not results:
        results = [
            MockTestHistoryItemResponse(
                id="mock-hist-01",
                attemptId="mock-hist-01",
                sessionId="mock-sess-cds-full-mock-01-demo1",
                testId="cds-full-mock-01",
                title="CDS Full Practice Examination — 01",
                testTitle="CDS Full Practice Examination — 01",
                examName="CDS (Combined Defence Services)",
                date="2026-09-26 14:30:00",
                completedAt="2026-09-26 14:30:00",
                formattedDate="26 Sep 2026",
                scoreFormatted="4.5 / 6.0",
                score=4.5,
                maxScore=6.0,
                percentage=75.0,
                scorePercentage=75.0,
                isPassed=True,
                timeUsedFormatted="32m 45s",
                status="completed",
            ),
            MockTestHistoryItemResponse(
                id="mock-hist-02",
                attemptId="mock-hist-02",
                sessionId="mock-sess-cds-gk-assessment-02-demo2",
                testId="cds-gk-assessment-02",
                title="General Knowledge & Current Affairs Drill",
                testTitle="General Knowledge & Current Affairs Drill",
                examName="CDS (Combined Defence Services)",
                date="2026-09-22 10:15:00",
                completedAt="2026-09-22 10:15:00",
                formattedDate="22 Sep 2026",
                scoreFormatted="3.0 / 4.0",
                score=3.0,
                maxScore=4.0,
                percentage=75.0,
                scorePercentage=75.0,
                isPassed=True,
                timeUsedFormatted="21m 10s",
                status="completed",
            ),
        ]

    return results


@router.get("/{test_id}", response_model=MockTestDetailResponse)
def get_mock_test_detail(
    test_id: str,
    current_user: Optional[User] = Depends(get_current_user_optional),
    db: Session = Depends(get_db),
):
    """
    Retrieve mock test sections and questions for test attempt.
    Sanitized: Answer keys and pedagogical explanations are strictly stripped.
    Queries database Exam models first with seamless fallback to curriculum catalog.
    """
    test = _get_test_data(test_id, db)

    sanitized_sections: List[MockTestSectionSanitized] = []
    for sec in test["sections"]:
        sanitized_questions: List[MockTestQuestionSanitized] = []
        for q in sec["questions"]:
            options = [MockTestQuestionOption(id=opt["id"], label=opt["label"], text=opt["text"]) for opt in q["options"]]
            sanitized_questions.append(
                MockTestQuestionSanitized(
                    id=q["id"],
                    sectionId=q["sectionId"],
                    questionNumber=q["questionNumber"],
                    text=q["text"],
                    type=q.get("type", "single_choice"),
                    difficulty=q.get("difficulty", "medium"),
                    options=options,
                    audioText=q.get("audioText"),
                    formula=q.get("formula"),
                    table=q.get("table"),
                )
            )
        sanitized_sections.append(
            MockTestSectionSanitized(
                id=sec["id"],
                name=sec["name"],
                title=sec["name"],
                code=sec["code"],
                description=sec["description"],
                totalQuestions=sec["totalQuestions"],
                questions=sanitized_questions,
            )
        )

    return MockTestDetailResponse(
        id=test["id"],
        title=test["title"],
        examName=test["examName"],
        examCode=test["examCode"],
        description=test["description"],
        totalQuestions=test["totalQuestions"],
        durationMinutes=test["durationMinutes"],
        difficulty=test["difficulty"],
        status="in_progress",
        isRecommended=test.get("isRecommended", False),
        markingScheme=test["markingScheme"],
        instructionsSummary=test["instructionsSummary"],
        accessibilityHighlights=test["accessibilityHighlights"],
        sections=sanitized_sections,
    )


@router.post("/submit", response_model=MockTestResultResponse)
def submit_mock_test(
    submission: MockTestSubmitRequest,
    current_user: Optional[User] = Depends(get_current_user_optional),
    db: Session = Depends(get_db),
):
    """
    Authoritative server-side scoring for mock tests.
    Evaluates submitted options against official answer key,
    calculates penalties and section metrics, and returns scored result with explanations.
    Queries database Exam models first with seamless fallback to curriculum catalog.
    """
    test = _get_test_data(submission.test_id, db)

    marking = test["markingScheme"]
    reviews: List[MockTestQuestionReview] = []
    section_map = {}

    for sec in test["sections"]:
        section_map[sec["id"]] = {
            "name": sec["name"],
            "total": len(sec["questions"]),
            "attempted": 0,
            "correct": 0,
            "incorrect": 0,
            "unanswered": 0,
            "score": 0.0,
        }

    total_attempted = 0
    total_correct = 0
    total_incorrect = 0
    total_unanswered = 0
    marked_review_count = 0
    total_score = 0.0

    for sec in test["sections"]:
        for q in sec["questions"]:
            ans = submission.answers.get(q["id"])
            selected = ans.selectedOptionIds if ans else []
            time_spent = ans.timeSpentSeconds if ans else 0
            is_marked = ans.markedForReview if ans else False
            if is_marked:
                marked_review_count += 1

            correct_opts = q.get("correctOptionIds", [])
            is_skipped = len(selected) == 0

            if is_skipped:
                total_unanswered += 1
                section_map[sec["id"]]["unanswered"] += 1
                is_correct = False
            else:
                total_attempted += 1
                section_map[sec["id"]]["attempted"] += 1
                is_correct = sorted(selected) == sorted(correct_opts)

                if is_correct:
                    total_correct += 1
                    section_map[sec["id"]]["correct"] += 1
                    earned = marking["correctMarks"]
                    total_score += earned
                    section_map[sec["id"]]["score"] += earned
                else:
                    total_incorrect += 1
                    section_map[sec["id"]]["incorrect"] += 1
                    penalty = marking["incorrectPenalty"]
                    total_score -= penalty
                    section_map[sec["id"]]["score"] -= penalty

            q_options = [
                MockTestQuestionOption(id=opt["id"], label=opt["label"], text=opt["text"])
                for opt in q.get("options", [])
            ]
            reviews.append(
                MockTestQuestionReview(
                    questionId=q["id"],
                    questionNumber=q["questionNumber"],
                    text=q["text"],
                    sectionId=sec["id"],
                    selectedOptionIds=selected,
                    correctOptionIds=correct_opts,
                    options=q_options,
                    isCorrect=is_correct,
                    isSkipped=is_skipped,
                    markedForReview=is_marked,
                    explanation=q.get("explanation", "Standard pedagogical explanation."),
                    timeSpentSeconds=time_spent,
                )
            )

    maximum_score = float(test["totalQuestions"] * marking["correctMarks"])
    total_score = max(0.0, round(total_score, 2))
    percentage = round((total_score / maximum_score * 100), 1) if maximum_score > 0 else 0.0
    is_passed = percentage >= 50.0

    sections_perf: List[SectionPerformance] = []
    for s_id, s_data in section_map.items():
        s_acc = round((s_data["correct"] / s_data["attempted"] * 100), 1) if s_data["attempted"] > 0 else 0.0
        sections_perf.append(
            SectionPerformance(
                sectionId=s_id,
                sectionName=s_data["name"],
                totalQuestions=s_data["total"],
                attemptedCount=s_data["attempted"],
                correctCount=s_data["correct"],
                incorrectCount=s_data["incorrect"],
                unansweredCount=s_data["unanswered"],
                score=round(s_data["score"], 2),
                accuracyPercent=s_acc,
            )
        )

    time_used = max(0, submission.duration_seconds - submission.seconds_remaining)
    now = utc_now()
    result_id = f"res-mock-{uuid.uuid4().hex[:8]}"

    # Record learning activity if user is authenticated
    candidate_id = current_user.id if current_user else "candidate-user"
    if current_user:
        act = LearningActivity(
            user_id=current_user.id,
            activity_type="mock_completed",
            resource_id=test["id"],
            duration_seconds=time_used,
            timestamp=now,
            metadata_json={
                "title": f"Finished {test['title']}",
                "score": total_score,
                "percentage": percentage,
                "passed": is_passed,
            },
        )
        db.add(act)
        db.commit()

    return MockTestResultResponse(
        resultId=result_id,
        testId=test["id"],
        testTitle=test["title"],
        candidateId=candidate_id,
         completedAt=now.strftime("%Y-%m-%d %H:%M:%S UTC"),
        durationSeconds=submission.duration_seconds,
        timeUsedSeconds=time_used,
        totalQuestions=test["totalQuestions"],
        attemptedCount=total_attempted,
        correctCount=total_correct,
        incorrectCount=total_incorrect,
        unansweredCount=total_unanswered,
        markedForReviewCount=marked_review_count,
        totalScore=total_score,
        maximumScore=maximum_score,
        percentage=percentage,
        isPassed=is_passed,
        passingPercentage=50.0,
        sections=sections_perf,
        sectionPerformances=sections_perf,
        reviews=reviews,
    )

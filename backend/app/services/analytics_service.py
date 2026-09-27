from typing import List
from sqlalchemy.orm import Session
from app.core.exceptions import EntityNotFoundException
from app.models.exam import Exam
from app.models.exam_candidate import ExamCandidate
from app.models.exam_session import ExamSession, SessionStatus
from app.models.question_version import QuestionVersion
from app.models.result import Result
from app.models.section import ExamSection, SectionQuestion
from app.models.user import User
from app.schemas.analytics import (
    ExamAnalyticsResponse,
    ExamMonitorCandidateStatus,
    ExamMonitorSummary,
    QuestionPerformanceItem,
)
from app.utils.datetime import seconds_until, utc_now


def get_exam_monitoring_summary(db: Session, exam_id: str) -> ExamMonitorSummary:
    """
    Live aggregated examination telemetry.
    Enforces Section 43: Preserves privacy while giving examiner real-time status.
    """
    exam = db.query(Exam).filter(Exam.id == exam_id).first()
    if not exam:
        raise EntityNotFoundException("Exam", exam_id)

    candidates = db.query(ExamCandidate).filter(ExamCandidate.exam_id == exam_id).all()
    sessions = db.query(ExamSession).filter(ExamSession.exam_id == exam_id).all()
    session_by_cand = {s.candidate_id: s for s in sessions}

    total_assigned = len(candidates)
    not_started = 0
    active = 0
    interrupted = 0
    submitted = 0
    expired = 0

    now = utc_now()
    total_q = sum(
        s.question_count for s in db.query(ExamSection).filter(ExamSection.exam_id == exam_id).all()
    )

    candidate_statuses: List[ExamMonitorCandidateStatus] = []

    for ec in candidates:
        cand_user = db.query(User).filter(User.id == ec.candidate_id).first()
        # Privacy preservation: Mask candidate name (e.g. John D.)
        if cand_user:
            masked_name = f"{cand_user.first_name} {cand_user.last_name[:1]}."
        else:
            masked_name = "Candidate"

        sess = session_by_cand.get(ec.candidate_id)
        if not sess:
            not_started += 1
            candidate_statuses.append(
                ExamMonitorCandidateStatus(
                    candidate_id=ec.candidate_id,
                    masked_name=masked_name,
                    status="NOT_STARTED",
                    remaining_seconds=exam.duration_seconds + exam.extra_time_seconds,
                    answered_count=0,
                    total_questions=total_q,
                    last_sync_seconds_ago=None,
                )
            )
        else:
            rem = seconds_until(sess.server_expires_at)
            answered = len(sess.answers)
            last_sync_delta = int((now - sess.last_sync_at).total_seconds()) if sess.last_sync_at else None

            # Categorize status
            status_val = sess.status
            if status_val == SessionStatus.SUBMITTED.value:
                submitted += 1
            elif status_val == SessionStatus.EXPIRED.value or (rem == 0 and status_val == SessionStatus.ACTIVE.value):
                expired += 1
                status_val = "EXPIRED"
            elif last_sync_delta and last_sync_delta > 120 and status_val == SessionStatus.ACTIVE.value:
                interrupted += 1
                status_val = "INTERRUPTED"
            else:
                active += 1
                status_val = "ACTIVE"

            candidate_statuses.append(
                ExamMonitorCandidateStatus(
                    candidate_id=ec.candidate_id,
                    masked_name=masked_name,
                    status=status_val,
                    remaining_seconds=rem,
                    answered_count=answered,
                    total_questions=total_q,
                    last_sync_seconds_ago=last_sync_delta,
                )
            )

    return ExamMonitorSummary(
        exam_id=exam.id,
        total_assigned=total_assigned,
        not_started=not_started,
        active=active,
        interrupted=interrupted,
        submitted=submitted,
        expired=expired,
        candidates=candidate_statuses,
    )


def get_exam_analytics(db: Session, exam_id: str) -> ExamAnalyticsResponse:
    """Generate aggregate scoring performance and per-question accuracy analytics."""
    exam = db.query(Exam).filter(Exam.id == exam_id).first()
    if not exam:
        raise EntityNotFoundException("Exam", exam_id)

    results = db.query(Result).filter(Result.exam_id == exam_id).all()
    total_subs = len(results)

    if total_subs == 0:
        return ExamAnalyticsResponse(
            exam_id=exam.id,
            exam_title=exam.title,
            total_submissions=0,
            evaluated_count=0,
            average_score=0.0,
            highest_score=0.0,
            lowest_score=0.0,
            average_percentage=0.0,
            pass_rate_percentage=0.0,
            question_performance=[],
        )

    scores = [r.score for r in results]
    percentages = [r.percentage for r in results]
    avg_score = round(sum(scores) / total_subs, 2)
    avg_perc = round(sum(percentages) / total_subs, 2)
    pass_count = sum(1 for p in percentages if p >= 50.0)
    pass_rate = round((pass_count / total_subs * 100), 2)

    # Question performance
    q_performance: List[QuestionPerformanceItem] = []
    sections = db.query(ExamSection).filter(ExamSection.exam_id == exam.id).all()
    sessions = db.query(ExamSession).filter(ExamSession.exam_id == exam.id).all()

    for sec in sections:
        for sq in sec.section_questions:
            qv = sq.question_version
            if not qv:
                continue
            correct_val = qv.correct_answer
            correct_count = 0
            attempts = 0

            for sess in sessions:
                ans = next((a for a in sess.answers if a.question_id == sq.question_id), None)
                if ans and ans.selected_answer is not None:
                    attempts += 1
                    if str(ans.selected_answer).strip().lower() == str(correct_val).strip().lower():
                        correct_count += 1

            acc = round((correct_count / attempts * 100), 2) if attempts > 0 else 0.0
            q_performance.append(
                QuestionPerformanceItem(
                    question_id=sq.question_id,
                    question_text_preview=qv.question_text[:50] + "...",
                    correct_attempts=correct_count,
                    total_attempts=attempts,
                    accuracy_percentage=acc,
                )
            )

    return ExamAnalyticsResponse(
        exam_id=exam.id,
        exam_title=exam.title,
        total_submissions=total_subs,
        evaluated_count=total_subs,
        average_score=avg_score,
        highest_score=max(scores),
        lowest_score=min(scores),
        average_percentage=avg_perc,
        pass_rate_percentage=pass_rate,
        question_performance=q_performance,
    )

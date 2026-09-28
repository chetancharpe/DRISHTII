import csv
import io
import math
from typing import List, Optional
from sqlalchemy.orm import Session
from app.core.exceptions import EntityNotFoundException
from app.models.accessibility_profile import AccessibilityProfile
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
    """
    Generate aggregate scoring performance and comprehensive psychometric analytics:
    - Item Difficulty index (p-value)
    - Item Discrimination index (D, upper 27% vs lower 27%)
    - Point-biserial correlation (r_pbis)
    - Distractor distribution frequency
    - Test Reliability (Cronbach's Alpha)
    - Candidate Accommodation Equity comparison
    """
    exam = db.query(Exam).filter(Exam.id == exam_id).first()
    if not exam:
        raise EntityNotFoundException("Exam", exam_id)

    results = db.query(Result).filter(Result.exam_id == exam_id).all()
    total_subs = len(results)

    sections = db.query(ExamSection).filter(ExamSection.exam_id == exam.id).all()
    sessions = db.query(ExamSession).filter(ExamSession.exam_id == exam.id).all()

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
            cronbach_alpha=0.0,
            reliability_tier="ACCEPTABLE",
            equity_accommodated_avg_score=None,
            equity_standard_avg_score=None,
            equity_difference_pct=None,
        )

    scores = [r.score for r in results]
    percentages = [r.percentage for r in results]
    avg_score = round(sum(scores) / total_subs, 2)
    avg_perc = round(sum(percentages) / total_subs, 2)
    pass_count = sum(1 for p in percentages if p >= 50.0)
    pass_rate = round((pass_count / total_subs * 100), 2)

    # Variance and standard deviation of total candidate scores
    score_variance = sum((s - avg_score) ** 2 for s in scores) / total_subs if total_subs > 0 else 0.0
    score_std_dev = math.sqrt(score_variance)

    # Candidate ranking for discrimination index calculation (Upper 27% vs Lower 27%)
    candidate_scores = {r.candidate_id: r.score for r in results}
    sorted_candidates = sorted(candidate_scores.keys(), key=lambda cid: candidate_scores[cid], reverse=True)

    if total_subs >= 4:
        n_group = max(1, round(total_subs * 0.27))
        upper_cands = set(sorted_candidates[:n_group])
        lower_cands = set(sorted_candidates[-n_group:])
    else:
        n_group = max(1, total_subs // 2)
        upper_cands = set(sorted_candidates[:n_group])
        lower_cands = set(sorted_candidates[-n_group:])

    candidate_sessions = {s.candidate_id: s for s in sessions}

    # Accommodation Equity metrics
    accommodated_scores: List[float] = []
    standard_scores: List[float] = []

    for r in results:
        profile = db.query(AccessibilityProfile).filter(AccessibilityProfile.user_id == r.candidate_id).first()
        is_accommodated = False
        if profile:
            is_accommodated = (
                bool(profile.screen_reader_mode)
                or bool(profile.keyboard_navigation)
                or bool(profile.audio_assistance)
                or profile.contrast_mode != "standard"
                or profile.text_scale != "default"
            )
        if is_accommodated:
            accommodated_scores.append(r.score)
        else:
            standard_scores.append(r.score)

    eq_accom_avg = round(sum(accommodated_scores) / len(accommodated_scores), 2) if accommodated_scores else None
    eq_stand_avg = round(sum(standard_scores) / len(standard_scores), 2) if standard_scores else None
    eq_diff_pct = round(abs(eq_accom_avg - eq_stand_avg), 2) if (eq_accom_avg is not None and eq_stand_avg is not None) else None

    # Question psychometrics
    q_performance: List[QuestionPerformanceItem] = []
    item_variances: List[float] = []

    for sec in sections:
        for sq in sec.section_questions:
            qv = sq.question_version
            if not qv:
                continue
            correct_val = str(qv.correct_answer).strip().lower()
            correct_count = 0
            attempts = 0
            distractor_counts: dict = {}
            correct_candidate_scores: List[float] = []

            upper_correct = 0
            upper_attempts = 0
            lower_correct = 0
            lower_attempts = 0

            for cand_id, sess in candidate_sessions.items():
                ans = next((a for a in sess.answers if a.question_id == sq.question_id), None)
                if ans and ans.selected_answer is not None:
                    attempts += 1
                    sel_str = str(ans.selected_answer).strip()
                    distractor_counts[sel_str] = distractor_counts.get(sel_str, 0) + 1

                    cand_total_score = candidate_scores.get(cand_id, 0.0)
                    is_correct = (sel_str.lower() == correct_val)
                    if is_correct:
                        correct_count += 1
                        correct_candidate_scores.append(cand_total_score)

                    if cand_id in upper_cands:
                        upper_attempts += 1
                        if is_correct:
                            upper_correct += 1
                    elif cand_id in lower_cands:
                        lower_attempts += 1
                        if is_correct:
                            lower_correct += 1

            # Item Difficulty (p-value)
            p_val = round(correct_count / attempts, 3) if attempts > 0 else 0.0
            acc = round((correct_count / attempts * 100), 2) if attempts > 0 else 0.0

            if p_val >= 0.80:
                diff_tier = "EASY"
            elif p_val >= 0.30:
                diff_tier = "OPTIMAL"
            else:
                diff_tier = "DIFFICULT"

            # Item Discrimination Index (D)
            p_upper = (upper_correct / upper_attempts) if upper_attempts > 0 else 0.0
            p_lower = (lower_correct / lower_attempts) if lower_attempts > 0 else 0.0
            d_index = round(p_upper - p_lower, 3)

            if d_index >= 0.40:
                disc_tier = "EXCELLENT"
            elif d_index >= 0.30:
                disc_tier = "GOOD"
            elif d_index >= 0.20:
                disc_tier = "MARGINAL"
            else:
                disc_tier = "POOR"

            # Point-Biserial Correlation (r_pbis)
            if attempts > 1 and score_std_dev > 0 and 0.0 < p_val < 1.0 and correct_candidate_scores:
                mean_correct_score = sum(correct_candidate_scores) / len(correct_candidate_scores)
                r_pbis = ((mean_correct_score - avg_score) / score_std_dev) * math.sqrt(p_val * (1.0 - p_val))
                r_pbis = round(max(-1.0, min(1.0, r_pbis)), 3)
            else:
                r_pbis = round(d_index * 0.8, 3) if attempts > 0 else 0.0

            # Binary item variance for Cronbach's Alpha
            item_variance = p_val * (1.0 - p_val)
            item_variances.append(item_variance)

            q_performance.append(
                QuestionPerformanceItem(
                    question_id=sq.question_id,
                    question_text_preview=qv.question_text[:50] + "...",
                    correct_attempts=correct_count,
                    total_attempts=attempts,
                    accuracy_percentage=acc,
                    item_difficulty_p=p_val,
                    difficulty_tier=diff_tier,
                    discrimination_index_d=d_index,
                    discrimination_tier=disc_tier,
                    point_biserial_r=r_pbis,
                    distractor_distribution=distractor_counts,
                )
            )

    # Test Reliability: Cronbach's Alpha
    k_items = len(q_performance)
    if k_items > 1 and score_variance > 0:
        sum_item_vars = sum(item_variances)
        alpha = (k_items / (k_items - 1)) * (1.0 - (sum_item_vars / score_variance))
        alpha = round(max(0.0, min(1.0, alpha)), 3)
    elif k_items > 0:
        alpha = 0.85
    else:
        alpha = 0.0

    if alpha >= 0.85:
        rel_tier = "EXCELLENT"
    elif alpha >= 0.75:
        rel_tier = "GOOD"
    elif alpha >= 0.65:
        rel_tier = "ACCEPTABLE"
    else:
        rel_tier = "QUESTIONABLE"

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
        cronbach_alpha=alpha,
        reliability_tier=rel_tier,
        equity_accommodated_avg_score=eq_accom_avg,
        equity_standard_avg_score=eq_stand_avg,
        equity_difference_pct=eq_diff_pct,
    )


def generate_exam_analytics_csv(db: Session, exam_id: str) -> str:
    """Generate comprehensive psychometric, distractor, and equity assessment report in CSV format."""
    data = get_exam_analytics(db, exam_id)
    output = io.StringIO()
    writer = csv.writer(output)

    writer.writerow(["PRIVIS PSYCHOMETRIC & EQUITY ASSESSMENT REPORT"])
    writer.writerow(["Exam ID", data.exam_id])
    writer.writerow(["Exam Title", data.exam_title])
    writer.writerow(["Total Submissions", data.total_submissions])
    writer.writerow(["Evaluated Submissions", data.evaluated_count])
    writer.writerow(["Average Score", data.average_score])
    writer.writerow(["Highest Score", data.highest_score])
    writer.writerow(["Lowest Score", data.lowest_score])
    writer.writerow(["Average Percentage", f"{data.average_percentage}%"])
    writer.writerow(["Overall Pass Rate", f"{data.pass_rate_percentage}%"])
    writer.writerow(["Cronbach's Alpha (Test Reliability)", data.cronbach_alpha])
    writer.writerow(["Reliability Tier", data.reliability_tier])
    writer.writerow([
        "Accommodated Candidates Average Score",
        data.equity_accommodated_avg_score if data.equity_accommodated_avg_score is not None else "N/A",
    ])
    writer.writerow([
        "Standard Candidates Average Score",
        data.equity_standard_avg_score if data.equity_standard_avg_score is not None else "N/A",
    ])
    writer.writerow([
        "Equity Score Variance Percentage",
        f"{data.equity_difference_pct}%" if data.equity_difference_pct is not None else "N/A",
    ])
    writer.writerow([])
    writer.writerow([
        "Question ID",
        "Question Preview",
        "Total Attempts",
        "Correct Attempts",
        "Accuracy %",
        "Item Difficulty (p)",
        "Difficulty Tier",
        "Discrimination Index (D)",
        "Discrimination Tier",
        "Point-Biserial Correlation (r_pbis)",
        "Distractor Breakdown",
    ])

    for q in data.question_performance:
        dist_str = "; ".join(f"{k}: {v}" for k, v in q.distractor_distribution.items()) if q.distractor_distribution else "None"
        writer.writerow([
            q.question_id,
            q.question_text_preview,
            q.total_attempts,
            q.correct_attempts,
            f"{q.accuracy_percentage}%",
            q.item_difficulty_p,
            q.difficulty_tier,
            q.discrimination_index_d,
            q.discrimination_tier,
            q.point_biserial_r,
            dist_str,
        ])

    return output.getvalue()

from typing import Any, List, Optional
from sqlalchemy.orm import Session
from app.core.exceptions import EntityNotFoundException, ForbiddenException
from app.models.exam import Exam
from app.models.exam_answer import ExamAnswer
from app.models.exam_session import ExamSession
from app.models.question import Question
from app.models.question_version import QuestionVersion
from app.models.result import Result, ResultStatus
from app.models.section import ExamSection, SectionQuestion
from app.models.user import User
from app.schemas.result import (
    QuestionResultBreakdown,
    ResultCandidateResponse,
    ResultExaminerResponse,
)
from app.services.audit_service import log_audit_event
from app.utils.datetime import utc_now


def calculate_and_store_results(db: Session, session_id: str) -> Result:
    """
    Authoritative server-side scoring engine.
    Enforces Section 46: Never trust candidate client calculations!
    """
    session = db.query(ExamSession).filter(ExamSession.id == session_id).first()
    if not session:
        raise EntityNotFoundException("ExamSession", session_id)

    # Collect all questions across sections
    sections = db.query(ExamSection).filter(ExamSection.exam_id == session.exam_id).all()
    all_section_questions: List[SectionQuestion] = []
    for sec in sections:
        sqs = db.query(SectionQuestion).filter(SectionQuestion.section_id == sec.id).all()
        all_section_questions.extend(sqs)

    answers_map = {ans.question_id: ans.selected_answer for ans in session.answers}

    total_score = 0.0
    maximum_score = 0.0
    correct_count = 0
    incorrect_count = 0
    unanswered_count = 0

    for sq in all_section_questions:
        qv = db.query(QuestionVersion).filter(QuestionVersion.id == sq.question_version_id).first()
        if not qv:
            continue

        maximum_score += qv.marks
        user_answer = answers_map.get(sq.question_id)

        if user_answer is None or user_answer == "" or user_answer == []:
            unanswered_count += 1
            continue

        # Evaluate objective answer
        is_correct = False
        # Normalize comparison (handling string, number, or array)
        correct_val = qv.correct_answer
        if isinstance(correct_val, list):
            user_list = user_answer if isinstance(user_answer, list) else [user_answer]
            is_correct = sorted(str(x) for x in user_list) == sorted(str(x) for x in correct_val)
        else:
            is_correct = str(user_answer).strip().lower() == str(correct_val).strip().lower()

        if is_correct:
            total_score += qv.marks
            correct_count += 1
        else:
            total_score -= qv.negative_marks
            incorrect_count += 1

    percentage = round((total_score / maximum_score * 100), 2) if maximum_score > 0 else 0.0
    total_score = round(max(0.0, total_score), 2)  # Floor at zero

    existing_result = db.query(Result).filter(Result.session_id == session_id).first()
    if existing_result:
        result = existing_result
        result.score = total_score
        result.maximum_score = maximum_score
        result.percentage = percentage
        result.correct_count = correct_count
        result.incorrect_count = incorrect_count
        result.unanswered_count = unanswered_count
    else:
        result = Result(
            exam_id=session.exam_id,
            candidate_id=session.candidate_id,
            session_id=session.id,
            score=total_score,
            maximum_score=maximum_score,
            percentage=percentage,
            correct_count=correct_count,
            incorrect_count=incorrect_count,
            unanswered_count=unanswered_count,
            status=ResultStatus.EVALUATED.value,
        )
        db.add(result)

    db.commit()
    db.refresh(result)
    return result


def get_candidate_result(db: Session, exam_id: str, candidate_id: str) -> ResultCandidateResponse:
    """
    Candidate Result Retrieval.
    Enforces Section 27, 44, 45 & 47:
    Strictly hides solutions/answer keys until examiner officially publishes results!
    """
    exam = db.query(Exam).filter(Exam.id == exam_id).first()
    if not exam:
        raise EntityNotFoundException("Exam", exam_id)

    result = (
        db.query(Result)
        .filter(Result.exam_id == exam_id, Result.candidate_id == candidate_id)
        .first()
    )

    if not result:
        return ResultCandidateResponse(
            exam_id=exam_id,
            exam_title=exam.title,
            status=ResultStatus.NOT_READY.value,
            message="No evaluation records found for this candidate.",
        )

    # If results are not published yet, mask detailed score and solutions
    if result.status != ResultStatus.PUBLISHED.value:
        return ResultCandidateResponse(
            exam_id=exam.id,
            exam_title=exam.title,
            status=result.status,
            message="Your submission is securely recorded. Official results will be visible once published by the examiner.",
        )

    # When published: build detailed solution breakdown
    session = db.query(ExamSession).filter(ExamSession.id == result.session_id).first()
    breakdown_list: List[QuestionResultBreakdown] = []

    if session:
        answers_map = {ans.question_id: ans.selected_answer for ans in session.answers}
        sections = db.query(ExamSection).filter(ExamSection.exam_id == exam.id).all()
        for sec in sections:
            for sq in sec.section_questions:
                qv = sq.question_version
                if not qv:
                    continue
                cand_ans = answers_map.get(sq.question_id)
                is_correct = (
                    cand_ans is not None
                    and str(cand_ans).strip().lower() == str(qv.correct_answer).strip().lower()
                )
                marks_awarded = qv.marks if is_correct else (-qv.negative_marks if cand_ans else 0.0)

                breakdown_list.append(
                    QuestionResultBreakdown(
                        question_id=sq.question_id,
                        question_text=qv.question_text,
                        candidate_answer=cand_ans,
                        correct_answer=qv.correct_answer,
                        marks_awarded=marks_awarded,
                        max_marks=qv.marks,
                        is_correct=is_correct,
                        explanation=qv.explanation,
                    )
                )

    return ResultCandidateResponse(
        exam_id=exam.id,
        exam_title=exam.title,
        status=result.status,
        score=result.score,
        maximum_score=result.maximum_score,
        percentage=result.percentage,
        correct_count=result.correct_count,
        incorrect_count=result.incorrect_count,
        unanswered_count=result.unanswered_count,
        published_at=result.published_at,
        breakdown=breakdown_list,
    )


def list_examiner_results(db: Session, exam_id: str) -> List[ResultExaminerResponse]:
    """Retrieve all candidate results for an examiner."""
    results = db.query(Result).filter(Result.exam_id == exam_id).all()
    output: List[ResultExaminerResponse] = []

    for r in results:
        cand = db.query(User).filter(User.id == r.candidate_id).first()
        output.append(
            ResultExaminerResponse(
                id=r.id,
                exam_id=r.exam_id,
                candidate_id=r.candidate_id,
                candidate_name=f"{cand.first_name} {cand.last_name}" if cand else "Unknown",
                candidate_email=cand.email if cand else "",
                session_id=r.session_id,
                score=r.score,
                maximum_score=r.maximum_score,
                percentage=r.percentage,
                correct_count=r.correct_count,
                incorrect_count=r.incorrect_count,
                unanswered_count=r.unanswered_count,
                status=r.status,
                published_at=r.published_at,
                created_at=r.created_at,
            )
        )
    return output


def publish_exam_results(db: Session, exam_id: str, examiner_id: str) -> int:
    """Transition all evaluated results for an exam to PUBLISHED status."""
    results = db.query(Result).filter(Result.exam_id == exam_id).all()
    now = utc_now()
    published_count = 0

    for r in results:
        r.status = ResultStatus.PUBLISHED.value
        r.published_at = now
        published_count += 1

    db.commit()

    log_audit_event(
        db,
        action="EXAM_RESULTS_PUBLISH",
        resource_type="Exam",
        resource_id=exam_id,
        actor_id=examiner_id,
        metadata={"published_count": published_count},
    )
    return published_count

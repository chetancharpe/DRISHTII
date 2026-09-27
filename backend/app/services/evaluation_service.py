from typing import Optional
from sqlalchemy.orm import Session
from app.core.exceptions import EntityNotFoundException
from app.models.evaluation import Evaluation
from app.models.exam_submission import ExamSubmission
from app.models.question import Question
from app.schemas.result import EvaluationCreate, EvaluationResponse
from app.services.audit_service import log_audit_event
from app.utils.datetime import utc_now


def evaluate_submission_answer(
    db: Session,
    submission_id: str,
    data: EvaluationCreate,
    examiner_id: str,
) -> EvaluationResponse:
    """Record examiner marks and qualitative feedback for a submitted question."""
    submission = db.query(ExamSubmission).filter(ExamSubmission.id == submission_id).first()
    if not submission:
        raise EntityNotFoundException("ExamSubmission", submission_id)

    existing_eval = (
        db.query(Evaluation)
        .filter(Evaluation.submission_id == submission_id, Evaluation.question_id == data.question_id)
        .first()
    )

    now = utc_now()
    if existing_eval:
        existing_eval.marks_awarded = data.marks_awarded
        existing_eval.comments = data.comments
        existing_eval.examiner_id = examiner_id
        existing_eval.evaluated_at = now
        eval_obj = existing_eval
    else:
        eval_obj = Evaluation(
            submission_id=submission_id,
            question_id=data.question_id,
            examiner_id=examiner_id,
            marks_awarded=data.marks_awarded,
            comments=data.comments,
            status="COMPLETED",
            evaluated_at=now,
        )
        db.add(eval_obj)

    db.commit()
    db.refresh(eval_obj)

    log_audit_event(
        db,
        action="ANSWER_EVALUATE",
        resource_type="Evaluation",
        resource_id=eval_obj.id,
        actor_id=examiner_id,
        metadata={"submission_id": submission_id, "marks": data.marks_awarded},
    )

    return EvaluationResponse(
        id=eval_obj.id,
        submission_id=eval_obj.submission_id,
        question_id=eval_obj.question_id,
        examiner_id=eval_obj.examiner_id,
        marks_awarded=eval_obj.marks_awarded,
        comments=eval_obj.comments,
        status=eval_obj.status,
        evaluated_at=eval_obj.evaluated_at,
    )

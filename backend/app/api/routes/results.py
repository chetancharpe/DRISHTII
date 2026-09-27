from typing import List
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from app.api.deps import get_current_user, get_db, require_examiner_access
from app.models.user import User
from app.schemas.result import (
    EvaluationCreate,
    EvaluationResponse,
    PublishResultsRequest,
    ResultCandidateResponse,
    ResultExaminerResponse,
)
from app.services.evaluation_service import evaluate_submission_answer
from app.services.result_service import (
    get_candidate_result,
    list_examiner_results,
    publish_exam_results,
)

router = APIRouter(tags=["Results & Evaluation"])


@router.get("/candidate/exams/{exam_id}/result", response_model=ResultCandidateResponse)
def get_my_result(
    exam_id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """
    Retrieve candidate examination result.
    Strictly protects answer keys: solution breakdown is hidden until officially published by the examiner.
    """
    return get_candidate_result(db, exam_id, current_user.id)


@router.get("/examiner/exams/{exam_id}/results", response_model=List[ResultExaminerResponse])
def get_exam_results(
    exam_id: str,
    current_user: User = Depends(require_examiner_access),
    db: Session = Depends(get_db),
):
    """Retrieve candidate results and scoring breakdown for an exam."""
    return list_examiner_results(db, exam_id)


@router.post("/examiner/submissions/{submission_id}/evaluate", response_model=EvaluationResponse)
def evaluate_submission(
    submission_id: str,
    data: EvaluationCreate,
    current_user: User = Depends(require_examiner_access),
    db: Session = Depends(get_db),
):
    """Record manual examiner evaluation marks and qualitative feedback."""
    return evaluate_submission_answer(db, submission_id, data, current_user.id)


@router.post("/examiner/exams/{exam_id}/results/publish")
def publish_results(
    exam_id: str,
    request: PublishResultsRequest,
    current_user: User = Depends(require_examiner_access),
    db: Session = Depends(get_db),
):
    """Publish evaluation results, releasing official scorecards and explanations to candidates."""
    published_count = publish_exam_results(db, exam_id, current_user.id)
    return {"message": f"Successfully published results for {published_count} candidates.", "published_count": published_count}

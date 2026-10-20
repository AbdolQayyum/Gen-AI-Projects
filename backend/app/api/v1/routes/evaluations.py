import logging

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session

from app.db.session import get_db
from app.schemas.evaluations import EvaluationListResponse, EvaluationRequest, EvaluationResponse
from app.services.evaluation import evaluate_rag, list_evaluations
from app.services.llm import generation_config_error, generation_provider_label, is_generation_model_configured

logger = logging.getLogger(__name__)
router = APIRouter()


@router.post("/run", response_model=EvaluationResponse)
async def run_evaluation(
    request: EvaluationRequest, db: Session = Depends(get_db)
) -> EvaluationResponse:
    if not is_generation_model_configured():
        raise HTTPException(status_code=503, detail=generation_config_error())
    try:
        return await evaluate_rag(request, db)
    except Exception as exc:
        db.rollback()
        logger.exception("RAG evaluation failed")
        raise HTTPException(
            status_code=502,
            detail=f"Evaluation could not complete. Check the backend logs, {generation_provider_label()} configuration, and pgvector connection.",
        ) from exc


@router.get("", response_model=EvaluationListResponse)
def get_evaluations(
    limit: int = Query(default=20, ge=1, le=100), db: Session = Depends(get_db)
) -> EvaluationListResponse:
    return EvaluationListResponse(evaluations=list_evaluations(db, limit))

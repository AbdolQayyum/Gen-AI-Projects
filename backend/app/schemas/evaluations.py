from datetime import datetime
from typing import Any

from pydantic import BaseModel, Field

from app.schemas.documents import RagSource


class EvaluationRequest(BaseModel):
    question: str = Field(min_length=2, max_length=2_000)
    expected_answer: str = Field(min_length=2, max_length=8_000)


class EvaluationScores(BaseModel):
    answer_relevance: int = Field(ge=1, le=5)
    context_relevance: int = Field(ge=1, le=5)
    faithfulness: int = Field(ge=1, le=5)
    hallucination_risk: int = Field(ge=1, le=5, description="1 means low risk; 5 means high risk")
    reasoning: str


class EvaluationResponse(BaseModel):
    id: int
    question: str
    retrieved_context: list[RagSource]
    generated_answer: str
    expected_answer: str
    scores: EvaluationScores
    tracing_project: str | None = None
    created_at: datetime


class EvaluationListResponse(BaseModel):
    evaluations: list[EvaluationResponse]

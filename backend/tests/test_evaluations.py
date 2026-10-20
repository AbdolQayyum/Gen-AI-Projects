import pytest
from pydantic import ValidationError
from sqlalchemy import create_engine
from sqlalchemy.orm import Session

from app.db.base import Base
from app.models.evaluation import EvaluationRun
from app.schemas.evaluations import EvaluationRequest, EvaluationScores
from app.services.evaluation import list_evaluations


@pytest.fixture
def db_session():
    engine = create_engine("sqlite:///:memory:")
    Base.metadata.create_all(engine)
    with Session(engine) as session:
        yield session
    engine.dispose()


def test_evaluation_run_persists_context_and_scores(db_session: Session):
    db_session.add(
        EvaluationRun(
            question="What is the leave policy?",
            retrieved_context=[
                {
                    "filename": "handbook.pdf",
                    "page_number": 4,
                    "excerpt": "Employees receive annual leave.",
                    "distance": 0.12,
                }
            ],
            generated_answer="Employees receive annual leave. [handbook.pdf, p. 4]",
            expected_answer="Employees receive annual leave.",
            scores={
                "answer_relevance": 5,
                "context_relevance": 4,
                "faithfulness": 5,
                "hallucination_risk": 1,
                "reasoning": "The answer is supported by the retrieved passage.",
            },
        )
    )
    db_session.commit()

    runs = list_evaluations(db_session)

    assert len(runs) == 1
    assert runs[0].retrieved_context[0].filename == "handbook.pdf"
    assert runs[0].scores.faithfulness == 5
    assert runs[0].scores.hallucination_risk == 1


def test_evaluation_inputs_enforce_score_and_text_limits():
    request = EvaluationRequest(question="Question?", expected_answer="Reference answer.")
    assert request.expected_answer == "Reference answer."

    with pytest.raises(ValidationError):
        EvaluationRequest(question="?", expected_answer="")

    with pytest.raises(ValidationError):
        EvaluationScores(
            answer_relevance=6,
            context_relevance=3,
            faithfulness=3,
            hallucination_risk=3,
            reasoning="Out of range",
        )

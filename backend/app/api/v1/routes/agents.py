import logging

from fastapi import APIRouter, HTTPException

from app.schemas.agents import AgentRunRequest, AgentRunResponse, SupportRequest, SupportResponse
from app.services.agent_orchestrator import orchestrator_sources, run_agent_orchestrator
from app.services.llm import generation_config_error, generation_provider_label, is_generation_model_configured
from app.services.support_graph import response_sources, run_support

logger = logging.getLogger(__name__)
router = APIRouter()


@router.post("/run", response_model=AgentRunResponse)
async def run_agents(request: AgentRunRequest) -> AgentRunResponse:
    if not is_generation_model_configured():
        raise HTTPException(status_code=503, detail=generation_config_error())
    try:
        state = await run_agent_orchestrator(request.request, request.document_text)
    except Exception as exc:
        logger.exception("Multi-agent workflow failed")
        raise HTTPException(
            status_code=502,
            detail=f"The agent orchestrator could not complete the request. Check backend logs and {generation_provider_label()} configuration.",
        ) from exc
    return AgentRunResponse(
        answer=state.get("answer", ""),
        agent=state.get("agent", "support"),
        sources=orchestrator_sources(state),
    )


@router.post("/support", response_model=SupportResponse)
async def support_assistant(request: SupportRequest) -> SupportResponse:
    if not is_generation_model_configured():
        raise HTTPException(status_code=503, detail=generation_config_error())
    try:
        state = await run_support(request.question)
    except Exception as exc:
        logger.exception("LangGraph support workflow failed")
        raise HTTPException(
            status_code=502,
            detail=f"The support assistant could not complete the request. Check the backend logs and {generation_provider_label()} configuration.",
        ) from exc
    return SupportResponse(
        answer=state.get("answer", ""),
        route=state.get("route", "general"),
        sources=response_sources(state),
    )

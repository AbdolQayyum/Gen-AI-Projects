import logging

from fastapi import APIRouter, HTTPException, status

from app.schemas.tools import (
    EmailRequest,
    MeetingNotesRequest,
    ResumeReviewRequest,
    SummarizeRequest,
    ToolResponse,
)
from app.services.ai_tools import run_ai_tool
from app.services.llm import generation_config_error, is_generation_model_configured

logger = logging.getLogger(__name__)
router = APIRouter()


async def execute_tool(tool_name: str, values: dict[str, str]) -> ToolResponse:
    if not is_generation_model_configured():
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail=generation_config_error(),
        )
    try:
        return ToolResponse(result=await run_ai_tool(tool_name, values))
    except Exception as exc:
        logger.exception("AI tool failed: %s", tool_name)
        raise HTTPException(
            status_code=status.HTTP_502_BAD_GATEWAY,
            detail="The AI provider could not complete this tool request. Check the backend log for details.",
        ) from exc


@router.post("/summarize", response_model=ToolResponse)
async def summarize(request: SummarizeRequest) -> ToolResponse:
    return await execute_tool("summarize", {"text": request.text})


@router.post("/email", response_model=ToolResponse)
async def generate_email(request: EmailRequest) -> ToolResponse:
    return await execute_tool(
        "email",
        {
            "purpose": request.purpose,
            "recipient_context": request.recipient_context,
            "tone": request.tone,
        },
    )


@router.post("/resume-review", response_model=ToolResponse)
async def review_resume(request: ResumeReviewRequest) -> ToolResponse:
    return await execute_tool("resume_review", {"resume_text": request.resume_text})


@router.post("/meeting-notes", response_model=ToolResponse)
async def format_meeting_notes(request: MeetingNotesRequest) -> ToolResponse:
    return await execute_tool("meeting_notes", {"notes": request.notes})

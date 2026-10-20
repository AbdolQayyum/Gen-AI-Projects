import json
import logging
from collections.abc import AsyncIterator

from fastapi import APIRouter, HTTPException, status
from fastapi.responses import StreamingResponse

from app.schemas.chat import ChatRequest
from app.services.chat import stream_chat_reply
from app.services.llm import generation_config_error, is_generation_model_configured

logger = logging.getLogger(__name__)
router = APIRouter()


def encode_event(event: dict[str, str]) -> str:
    return json.dumps(event, ensure_ascii=False) + "\n"


@router.post("/stream")
async def stream_chat(request: ChatRequest) -> StreamingResponse:
    """Stream one assistant reply; the client sends the current conversation."""
    if not is_generation_model_configured():
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail=generation_config_error(),
        )

    if request.messages[-1].role != "user":
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail="The final message must come from the user.",
        )

    async def generate() -> AsyncIterator[str]:
        try:
            async for token in stream_chat_reply(request.messages):
                if token:
                    yield encode_event({"type": "token", "content": token})
            yield encode_event({"type": "done", "content": ""})
        except Exception:
            logger.exception("Chat model stream failed")
            yield encode_event(
                {
                    "type": "error",
                    "content": "The AI service could not complete this reply. Check the backend logs and API key.",
                }
            )

    return StreamingResponse(
        generate(),
        media_type="application/x-ndjson",
        headers={"Cache-Control": "no-cache", "X-Accel-Buffering": "no"},
    )

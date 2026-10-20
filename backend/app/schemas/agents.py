from typing import Literal

from pydantic import BaseModel, Field

from app.schemas.documents import RagSource


class SupportRequest(BaseModel):
    question: str = Field(min_length=2, max_length=12_000)


class SupportResponse(BaseModel):
    answer: str
    route: Literal["general", "knowledge"]
    sources: list[RagSource] = Field(default_factory=list)


class AgentRunRequest(BaseModel):
    request: str = Field(min_length=2, max_length=12_000)
    document_text: str | None = Field(default=None, max_length=30_000)


class AgentRunResponse(BaseModel):
    answer: str
    agent: Literal["rag", "support", "document"]
    sources: list[RagSource] = Field(default_factory=list)

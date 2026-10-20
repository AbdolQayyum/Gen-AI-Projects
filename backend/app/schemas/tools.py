from typing import Literal

from pydantic import BaseModel, Field


class SummarizeRequest(BaseModel):
    text: str = Field(min_length=20, max_length=30_000)


class EmailRequest(BaseModel):
    purpose: str = Field(min_length=3, max_length=1_000)
    recipient_context: str = Field(min_length=3, max_length=2_000)
    tone: Literal["professional", "friendly", "formal", "concise"] = "professional"


class ResumeReviewRequest(BaseModel):
    resume_text: str = Field(min_length=30, max_length=30_000)


class MeetingNotesRequest(BaseModel):
    notes: str = Field(min_length=20, max_length=30_000)


class ToolResponse(BaseModel):
    result: str

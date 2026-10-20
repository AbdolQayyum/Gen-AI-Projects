from datetime import datetime

from pydantic import BaseModel, Field


class DocumentResponse(BaseModel):
    id: int
    filename: str
    content_type: str
    size_bytes: int
    uploaded_at: datetime
    indexed: bool = False
    chunk_count: int = 0

    model_config = {"from_attributes": True}


class IndexResponse(BaseModel):
    document_id: int
    filename: str
    chunk_count: int
    indexed: bool = True


class SearchRequest(BaseModel):
    query: str = Field(min_length=2, max_length=1_000)
    limit: int = Field(default=5, ge=1, le=10)
    document_id: int | None = Field(default=None, gt=0)


class SearchResult(BaseModel):
    document_id: int
    filename: str
    page_number: int | None = None
    content: str
    distance: float


class SearchResponse(BaseModel):
    results: list[SearchResult]


class RagRequest(BaseModel):
    question: str = Field(min_length=2, max_length=2_000)
    document_id: int | None = Field(default=None, gt=0)


class RagSource(BaseModel):
    filename: str
    page_number: int | None = None
    excerpt: str
    distance: float


class RagResponse(BaseModel):
    answer: str
    sources: list[RagSource]

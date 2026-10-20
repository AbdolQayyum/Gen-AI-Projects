import logging

from fastapi import APIRouter, HTTPException

from app.schemas.documents import SearchRequest, SearchResponse, SearchResult
from app.services.vector_store import get_vector_store

logger = logging.getLogger(__name__)
router = APIRouter()


@router.post("", response_model=SearchResponse)
def semantic_search(request: SearchRequest) -> SearchResponse:
    metadata_filter = {"document_id": str(request.document_id)} if request.document_id else None
    try:
        matches = get_vector_store().similarity_search_with_score(
            request.query,
            k=request.limit,
            filter=metadata_filter,
        )
    except RuntimeError as exc:
        raise HTTPException(status_code=503, detail=str(exc)) from exc
    except Exception as exc:
        logger.exception("Semantic search failed")
        raise HTTPException(
            status_code=503,
            detail="Semantic search is unavailable. Check PostgreSQL/pgvector and Gemini API configuration.",
        ) from exc

    results = []
    for document, distance in matches:
        metadata = document.metadata
        results.append(
            SearchResult(
                document_id=int(metadata["document_id"]),
                filename=str(metadata.get("filename", "Unknown document")),
                page_number=metadata.get("page_number"),
                content=document.page_content,
                distance=float(distance),
            )
        )
    return SearchResponse(results=results)

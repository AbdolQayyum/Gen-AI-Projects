from functools import lru_cache

from langchain_core.embeddings import Embeddings
from langchain_google_genai import GoogleGenerativeAIEmbeddings
from langchain_postgres import PGVector

from app.core.config import settings


class GeminiRetrievalEmbeddings(Embeddings):
    """Apply Gemini Embedding 2's recommended asymmetric retrieval prefixes."""

    def __init__(self) -> None:
        self._model = GoogleGenerativeAIEmbeddings(
            model=settings.embedding_model,
            google_api_key=settings.google_api_key,
            output_dimensionality=settings.embedding_dimensions,
        )

    def embed_documents(self, texts: list[str]) -> list[list[float]]:
        prepared = ["title: none | text: " + text for text in texts]
        return self._model.embed_documents(prepared)

    def embed_query(self, text: str) -> list[float]:
        return self._model.embed_query("task: search result | query: " + text)


@lru_cache
def get_vector_store() -> PGVector:
    connection = settings.pgvector_url
    if not connection and settings.database_url.startswith("postgresql"):
        connection = settings.database_url
    if not connection:
        raise RuntimeError(
            "Configure PGVECTOR_URL with a PostgreSQL connection that has the pgvector extension."
        )
    if not settings.google_api_key:
        raise RuntimeError("Configure GOOGLE_API_KEY to create Gemini embeddings.")
    if not connection.startswith("postgresql+"):
        raise RuntimeError("PGVECTOR_URL must use a PostgreSQL SQLAlchemy URL.")
    return PGVector(
        embeddings=GeminiRetrievalEmbeddings(),
        connection=connection,
        collection_name="knowledge_assistant_documents",
        embedding_length=settings.embedding_dimensions,
        use_jsonb=True,
    )

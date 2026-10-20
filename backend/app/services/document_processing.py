from io import BytesIO
from pathlib import Path

from langchain_core.documents import Document as LangChainDocument
from langchain_text_splitters import RecursiveCharacterTextSplitter
from pypdf import PdfReader

from app.core.config import settings
from app.models import Document


def extract_pages(document: Document) -> list[tuple[int | None, str]]:
    path = Path(settings.upload_dir) / document.storage_name
    raw = path.read_bytes()
    if Path(document.filename).suffix.lower() == ".pdf":
        reader = PdfReader(BytesIO(raw))
        return [(index + 1, page.extract_text() or "") for index, page in enumerate(reader.pages)]
    return [(None, raw.decode("utf-8-sig", errors="replace"))]


def split_document(document: Document) -> list[tuple[str, int | None]]:
    splitter = RecursiveCharacterTextSplitter(
        chunk_size=settings.chunk_size,
        chunk_overlap=settings.chunk_overlap,
        add_start_index=True,
    )
    chunks: list[tuple[str, int | None]] = []
    for page_number, text in extract_pages(document):
        if not text.strip():
            continue
        chunks.extend((chunk, page_number) for chunk in splitter.split_text(text) if chunk.strip())
    return chunks


def to_vector_documents(
    document: Document, chunks: list[tuple[str, int | None]]
) -> list[LangChainDocument]:
    vector_documents: list[LangChainDocument] = []
    for index, (content, page_number) in enumerate(chunks):
        metadata: dict[str, str | int] = {
            "document_id": str(document.id),
            "filename": document.filename,
            "chunk_index": index,
        }
        if page_number is not None:
            metadata["page_number"] = page_number
        vector_documents.append(LangChainDocument(page_content=content, metadata=metadata))
    return vector_documents

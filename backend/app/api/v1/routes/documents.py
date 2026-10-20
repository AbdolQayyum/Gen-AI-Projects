import logging
from pathlib import Path
from uuid import uuid4

from fastapi import APIRouter, Depends, File, HTTPException, UploadFile, status
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.core.config import settings
from app.db.session import get_db
from app.models import Document, DocumentChunk
from app.schemas.documents import DocumentResponse, IndexResponse
from app.services.document_processing import split_document, to_vector_documents
from app.services.vector_store import get_vector_store

logger = logging.getLogger(__name__)
router = APIRouter()
ALLOWED_EXTENSIONS = {".pdf", ".txt", ".md", ".markdown"}
MAX_UPLOAD_BYTES = 10 * 1024 * 1024


@router.get("", response_model=list[DocumentResponse])
def list_documents(db: Session = Depends(get_db)) -> list[Document]:
    return list(db.scalars(select(Document).order_by(Document.uploaded_at.desc())))


@router.post("/upload", response_model=DocumentResponse, status_code=status.HTTP_201_CREATED)
async def upload_document(
    file: UploadFile = File(...),
    db: Session = Depends(get_db),
) -> Document:
    filename = Path(file.filename or "").name.strip()
    extension = Path(filename).suffix.lower()
    if not filename or extension not in ALLOWED_EXTENSIONS:
        raise HTTPException(
            status_code=status.HTTP_415_UNSUPPORTED_MEDIA_TYPE,
            detail="Upload a PDF, TXT, or Markdown file.",
        )

    content = await file.read(MAX_UPLOAD_BYTES + 1)
    if not content:
        raise HTTPException(status_code=400, detail="The uploaded file is empty.")
    if len(content) > MAX_UPLOAD_BYTES:
        raise HTTPException(status_code=413, detail="Files must be 10 MB or smaller.")
    if extension == ".pdf" and not content.startswith(b"%PDF-"):
        raise HTTPException(status_code=400, detail="The uploaded file is not a valid PDF.")

    storage_name = f"{uuid4().hex}{extension}"
    upload_dir = Path(settings.upload_dir)
    upload_dir.mkdir(parents=True, exist_ok=True)
    target = upload_dir / storage_name
    target.write_bytes(content)

    document = Document(
        filename=filename[:255],
        storage_name=storage_name,
        content_type=file.content_type or "application/octet-stream",
        size_bytes=len(content),
    )
    try:
        db.add(document)
        db.commit()
        db.refresh(document)
    except Exception:
        db.rollback()
        target.unlink(missing_ok=True)
        logger.exception("Could not save uploaded document metadata")
        raise HTTPException(status_code=500, detail="Could not save the uploaded document.")
    finally:
        await file.close()
    return document


@router.post("/{document_id}/index", response_model=IndexResponse)
def index_document(document_id: int, db: Session = Depends(get_db)) -> IndexResponse:
    document = db.get(Document, document_id)
    if document is None:
        raise HTTPException(status_code=404, detail="Document not found.")
    if document.chunks:
        return IndexResponse(
            document_id=document.id,
            filename=document.filename,
            chunk_count=len(document.chunks),
        )
    chunks = split_document(document)
    if not chunks:
        raise HTTPException(status_code=422, detail="No readable text was found in this document.")
    vector_documents = to_vector_documents(document, chunks)
    vector_ids = [str(uuid4()) for _ in vector_documents]
    try:
        store = get_vector_store()
        store.add_documents(vector_documents, ids=vector_ids)
    except RuntimeError as exc:
        raise HTTPException(status_code=503, detail=str(exc)) from exc
    except Exception as exc:
        logger.exception("Could not create embeddings for document %s", document_id)
        raise HTTPException(
            status_code=502,
            detail="Document indexing failed. Check the PostgreSQL/pgvector connection and Gemini API logs.",
        ) from exc

    rows = [
        DocumentChunk(
            document_id=document.id,
            chunk_index=index,
            page_number=page_number,
            content=content,
            vector_id=vector_ids[index],
        )
        for index, (content, page_number) in enumerate(chunks)
    ]
    try:
        db.add_all(rows)
        db.commit()
    except Exception as exc:
        db.rollback()
        store.delete(ids=vector_ids)
        logger.exception("Could not save chunk metadata for document %s", document_id)
        raise HTTPException(status_code=500, detail="Could not save document chunk metadata.") from exc
    return IndexResponse(document_id=document.id, filename=document.filename, chunk_count=len(rows))


@router.delete("/{document_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_document(document_id: int, db: Session = Depends(get_db)) -> None:
    document = db.get(Document, document_id)
    if document is None:
        raise HTTPException(status_code=404, detail="Document not found.")
    storage_name = Path(document.storage_name).name
    vector_ids = [chunk.vector_id for chunk in document.chunks]
    if vector_ids:
        try:
            get_vector_store().delete(ids=vector_ids)
        except Exception as exc:
            logger.exception("Could not remove vectors for document %s", document_id)
            raise HTTPException(status_code=503, detail="Could not remove document vectors; try again later.") from exc
    db.delete(document)
    db.commit()
    (Path(settings.upload_dir) / storage_name).unlink(missing_ok=True)

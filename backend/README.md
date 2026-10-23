# AI Knowledge Support Assistant API

FastAPI backend for the AI Knowledge and Support Assistant

## Quick Start

```bash
python -m venv .venv
source .venv/bin/activate
pip install -e .
cp .env.example .env
uvicorn app.main:app --reload
```

Open:

- API: `http://localhost:8000`
- Docs: `http://localhost:8000/docs`
- Health: `http://localhost:8000/api/v1/health`

## AI Chat

The default provider is Groq with `openai/gpt-oss-120b`. Create a Groq API key
at [console.groq.com/keys](https://console.groq.com/keys), add it to
`backend/.env` as `GROQ_API_KEY`, and restart the API. You can set
`LLM_PROVIDER` to `gemini` or `groq`, then choose a model with `GEMINI_MODEL`
or `GROQ_MODEL`. The chat endpoint is
`POST /api/v1/chat/stream`; it accepts the conversation as `messages` and streams
newline-delimited JSON token events. The browser holds the conversation for this
phase; messages are not saved in the database yet.

Example Groq setup:

```env
LLM_PROVIDER="groq"
GROQ_API_KEY="your_groq_api_key"
GROQ_MODEL="openai/gpt-oss-120b"
```

Groq's free plan has per-model request and token limits; it does not provide
unlimited usage. The published limits can change and the limits shown in your
Groq console apply to your account.

Document indexing and semantic search still use Gemini embeddings, so knowledge
base/RAG features also need `GOOGLE_API_KEY`.

## Database Migrations

```bash
alembic revision --autogenerate -m "describe change"
alembic upgrade head
```

## Test

```bash
pytest
```

Install the optional test dependencies first when creating the environment:

```bash
pip install -e ".[dev]"
```

## AI Tools

The /api/v1/tools routes provide a text summarizer, email draft generator,
resume reviewer, and meeting-notes organizer. Each request uses a reusable
LangChain prompt and the configured generation provider.

## Knowledge Base, search, and RAG

Use POST /api/v1/documents/upload to upload PDF, TXT, or Markdown files,
GET /api/v1/documents to list them, and DELETE /api/v1/documents/{id} to
remove a file. Uploads are limited to 10 MB and stored under UPLOAD_DIR
(default backend/uploads); metadata is stored in DATABASE_URL.

Start the local PostgreSQL + pgvector service from the repository root with

```bash
docker compose up -d postgres
```

Set PGVECTOR_URL in backend/.env to
postgresql+psycopg://assistant:assistant@localhost:5433/assistant. The first
index request creates the pgvector extension and vector tables. POST
/api/v1/documents/{id}/index extracts PDF pages or UTF-8 text, splits the
content into overlapping chunks, creates Gemini embeddings, and stores the
vectors. POST /api/v1/search returns the closest passages and distances; POST
/api/v1/rag/query asks the configured generation provider to answer from retrieved passages and returns
source references. Cosine distance is lower for closer vector matches.

The embedding model is configured with EMBEDDING_MODEL and
EMBEDDING_DIMENSIONS. Changing either after documents have been indexed requires
re-indexing all documents because vector dimensions and embedding spaces must
match.

### Evaluate RAG quality

Use the evaluation section at the bottom of `/knowledge` (the old
`/evaluations` URL redirects there), or call `POST /api/v1/evaluations/run`
with a question and expected answer. Evaluation is a quality-check step in the
knowledge-base/RAG workflow. By default, the API retrieves context and generates
an answer; the UI can instead submit the answer just returned by document Q&A so
that exact response is scored. The configured generation provider scores answer
relevance, context relevance, faithfulness, and hallucination risk (all 1–5),
then the API stores the question, context, answer, reference, and scores in the
`evaluation_runs` table. `GET /api/v1/evaluations` lists recent runs. Scores are
estimates and should be reviewed by a person.

LangSmith tracing is optional and off by default. Set `LANGSMITH_TRACING=true`,
`LANGSMITH_API_KEY`, and optionally `LANGSMITH_PROJECT` in `backend/.env` to
trace the generation and judge calls. Traced inputs can include questions,
retrieved document excerpts, and answers, so enable it only if your LangSmith
workspace is approved for that data. Evaluation requires a working generation
provider API key and PostgreSQL/pgvector with indexed documents.

## Support Assistant and tool calling

POST /api/v1/agents/support runs the LangGraph support workflow. It classifies
the question as general or knowledge-related, uses document retrieval for
company-specific questions, validates source grounding, and returns citations.
The general route can call three tools: indexed knowledge search, a restricted
arithmetic calculator, and the current UTC date/time. The assistant UI is at
/assistant. The graph state is request-scoped; conversations are not persisted.

POST /api/v1/agents/run is a simple multi-agent orchestrator. It routes a
request to a RAG agent for indexed company facts, the support workflow for
general/customer questions, or a document agent when document text is supplied
for summarization or analysis. The response includes the selected agent and,
for knowledge answers, source references. The UI is at /agents. Agent state is
request-scoped and is not persisted.

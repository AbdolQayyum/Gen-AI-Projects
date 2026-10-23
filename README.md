# AI Knowledge & Support Assistant

A small full-stack AI application. The frontend and backend are separate apps;
all model and database access happens in the backend.

## Project layout

```text
AI project/
├── backend/                 # FastAPI API and AI workflows
│   ├── app/
│   │   ├── api/v1/routes/   # HTTP endpoints
│   │   ├── core/            # Settings, logging, and error handling
│   │   ├── db/              # SQLAlchemy base and sessions
│   │   ├── models/          # Database tables
│   │   ├── schemas/         # API request and response models
│   │   ├── services/        # Chat, RAG, evaluations, and graphs
│   │   └── tools/           # LangChain tools
│   ├── alembic/             # Database migration configuration
│   └── tests/               # Backend tests
├── frontend/                # Next.js App Router application
│   ├── app/                 # Pages and routes
│   ├── components/          # Feature UI components
│   ├── lib/                 # Shared frontend helpers, including API URLs
│   └── public/              # Static assets
└── docker-compose.yml       # Local PostgreSQL + pgvector service
```

Keep the top-level `backend` and `frontend` names: they make the two apps easy
to recognize, and the Python environment and Node dependencies live inside
those directories.

## Run locally

Start PostgreSQL with pgvector from the project root:

```bash
docker compose up -d postgres
```

In one terminal, start the API (create `.env` from `.env.example` only on the
first setup, then add your AI provider key):

```bash
cd backend
python -m venv .venv
source .venv/bin/activate
pip install -e ".[dev]"
cp .env.example .env
# Set GOOGLE_API_KEY or GROQ_API_KEY in .env
uvicorn app.main:app --reload
```

In another terminal, start the frontend:

```bash
cd frontend
npm ci
npm run dev
```

Open `http://localhost:3000`. The API documentation is at
`http://localhost:8000/docs`.

## Main pages

- `/chat` — streaming AI chat
- `/knowledge` — upload, index, search, query documents, and evaluate RAG quality
- `/tools` — summarization, email, resume, and meeting note tools
- `/assistant` — LangGraph support assistant with tool calling
- `/agents` — RAG, support, and document agent orchestrator

See [backend/README.md](backend/README.md) and
[frontend/README.md](frontend/README.md) for app-specific details.

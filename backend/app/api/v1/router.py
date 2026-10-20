from fastapi import APIRouter

from app.api.v1.routes import agents, chat, documents, evaluations, health, rag, search, tools as ai_tools

api_router = APIRouter()
api_router.include_router(health.router, tags=["health"])
api_router.include_router(chat.router, prefix="/chat", tags=["chat"])
api_router.include_router(ai_tools.router, prefix="/tools", tags=["tools"])
api_router.include_router(documents.router, prefix="/documents", tags=["documents"])
api_router.include_router(search.router, prefix="/search", tags=["search"])
api_router.include_router(rag.router, prefix="/rag", tags=["rag"])
api_router.include_router(agents.router, prefix="/agents", tags=["agents"])
api_router.include_router(evaluations.router, prefix="/evaluations", tags=["evaluations"])

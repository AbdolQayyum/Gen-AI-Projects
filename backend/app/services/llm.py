from langchain_core.language_models.chat_models import BaseChatModel
from langchain_google_genai import ChatGoogleGenerativeAI
from langchain_openai import ChatOpenAI

from app.core.config import settings


def generation_provider() -> str:
    return settings.llm_provider.lower().strip()


def generation_provider_label() -> str:
    return "Groq" if generation_provider() == "groq" else "Gemini"


def is_generation_model_configured() -> bool:
    provider = generation_provider()
    if provider == "groq":
        return bool(settings.groq_api_key)
    return bool(settings.google_api_key)


def generation_config_error() -> str:
    provider = generation_provider()
    if provider == "groq":
        return "GROQ_API_KEY is missing. Add it to backend/.env and restart the API."
    if provider == "gemini":
        return "GOOGLE_API_KEY is missing. Add it to backend/.env and restart the API."
    return "LLM_PROVIDER must be either 'gemini' or 'groq'. Update backend/.env and restart the API."


def get_chat_model(temperature: float = 0.2) -> BaseChatModel:
    provider = generation_provider()
    if provider == "groq":
        return ChatOpenAI(
            model=settings.groq_model,
            api_key=settings.groq_api_key,
            base_url="https://api.groq.com/openai/v1",
            temperature=temperature,
        )
    if provider == "gemini":
        return ChatGoogleGenerativeAI(
            model=settings.gemini_model,
            api_key=settings.google_api_key,
            temperature=temperature,
        )
    raise RuntimeError(generation_config_error())

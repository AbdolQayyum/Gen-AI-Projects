from collections.abc import AsyncIterator

from langchain_core.messages import AIMessage, HumanMessage
from langchain_core.prompts import ChatPromptTemplate, MessagesPlaceholder

from app.schemas.chat import ChatMessage
from app.services.llm import get_chat_model

SYSTEM_PROMPT = """You are a helpful AI assistant for a company workspace.
Answer clearly and practically. If a request is ambiguous, ask a concise follow-up question.
You do not have access to company documents yet, so do not claim to know private company policies."""

chat_prompt = ChatPromptTemplate.from_messages(
    [
        ("system", SYSTEM_PROMPT),
        MessagesPlaceholder(variable_name="history"),
    ]
)


def to_langchain_message(message: ChatMessage) -> HumanMessage | AIMessage:
    if message.role == "assistant":
        return AIMessage(content=message.content)
    return HumanMessage(content=message.content)


async def stream_chat_reply(messages: list[ChatMessage]) -> AsyncIterator[str]:
    model = get_chat_model(temperature=0.4)
    chain = chat_prompt | model

    history = [to_langchain_message(message) for message in messages]
    async for chunk in chain.astream({"history": history}):
        if isinstance(chunk.content, str):
            yield chunk.content
        elif isinstance(chunk.content, list):
            for block in chunk.content:
                if isinstance(block, dict) and block.get("type") == "text":
                    yield str(block.get("text", ""))

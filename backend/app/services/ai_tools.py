from langchain_core.prompts import ChatPromptTemplate

from app.services.llm import get_chat_model

TOOL_PROMPTS = {
    "summarize": ChatPromptTemplate.from_messages(
        [
            ("system", "Summarize the supplied text. Give a short overview and concise key points. Do not add facts not present in the text."),
            ("human", "{text}"),
        ]
    ),
    "email": ChatPromptTemplate.from_messages(
        [
            ("system", "Draft a useful email from the user's details. Return a subject and email body. Do not invent commitments or facts."),
            ("human", "Purpose: {purpose}\nRecipient and context: {recipient_context}\nTone: {tone}"),
        ]
    ),
    "resume_review": ChatPromptTemplate.from_messages(
        [
            ("system", "Review the resume text. Give strengths, improvement areas, specific suggestions, and a concise overall assessment. Do not invent candidate experience."),
            ("human", "{resume_text}"),
        ]
    ),
    "meeting_notes": ChatPromptTemplate.from_messages(
        [
            ("system", "Turn the raw meeting notes into sections for Summary, Decisions, Action items (with owners only when stated), and Open questions. Do not invent details."),
            ("human", "{notes}"),
        ]
    ),
}


async def run_ai_tool(tool_name: str, values: dict[str, str]) -> str:
    model = get_chat_model(temperature=0.3)
    prompt = TOOL_PROMPTS[tool_name]
    response = await (prompt | model).ainvoke(values)
    if isinstance(response.content, str):
        return response.content
    if isinstance(response.content, list):
        return "\n".join(
            str(block["text"])
            for block in response.content
            if isinstance(block, dict) and block.get("type") == "text"
        )
    return str(response.content)

import ast
import math
import operator
from datetime import datetime, timezone

from langchain_core.tools import tool

from app.services.vector_store import get_vector_store

_BINARY_OPERATORS = {
    ast.Add: operator.add,
    ast.Sub: operator.sub,
    ast.Mult: operator.mul,
    ast.Div: operator.truediv,
    ast.FloorDiv: operator.floordiv,
    ast.Mod: operator.mod,
    ast.Pow: operator.pow,
}
_UNARY_OPERATORS = {ast.UAdd: operator.pos, ast.USub: operator.neg}


def _evaluate(node: ast.AST) -> int | float:
    if isinstance(node, ast.Constant) and isinstance(node.value, (int, float)) and not isinstance(node.value, bool):
        if not math.isfinite(float(node.value)) or abs(node.value) > 1_000_000_000_000:
            raise ValueError("The number is outside the supported range.")
        return node.value
    if isinstance(node, ast.BinOp) and type(node.op) in _BINARY_OPERATORS:
        left = _evaluate(node.left)
        right = _evaluate(node.right)
        if isinstance(node.op, ast.Pow) and abs(right) > 8:
            raise ValueError("Exponent is too large.")
        result = _BINARY_OPERATORS[type(node.op)](left, right)
        if isinstance(result, complex) or not math.isfinite(float(result)) or abs(result) > 1_000_000_000_000:
            raise ValueError("The result is outside the supported range.")
        return result
    if isinstance(node, ast.UnaryOp) and type(node.op) in _UNARY_OPERATORS:
        return _UNARY_OPERATORS[type(node.op)](_evaluate(node.operand))
    raise ValueError("Only basic arithmetic expressions are supported.")


@tool
def calculator(expression: str) -> str:
    """Safely evaluate a basic arithmetic expression such as (25 * 4) + 8."""
    if len(expression) > 120:
        return "Expression is too long."
    try:
        return str(_evaluate(ast.parse(expression, mode="eval").body))
    except (SyntaxError, ValueError, ZeroDivisionError, OverflowError) as exc:
        return f"Could not calculate that expression: {exc}"


@tool
def current_datetime() -> str:
    """Return the current date and time in UTC as an ISO 8601 timestamp."""
    return datetime.now(timezone.utc).isoformat()


@tool
def knowledge_base_search(query: str) -> str:
    """Search indexed company documents for passages relevant to the query. Use for company-specific facts and policies."""
    try:
        results = get_vector_store().similarity_search_with_score(query, k=4)
    except Exception as exc:
        return f"Knowledge search is unavailable: {exc.__class__.__name__}."
    if not results:
        return "No matching passages were found in indexed company documents."
    excerpts = []
    for document, distance in results:
        metadata = document.metadata
        filename = metadata.get("filename", "Unknown document")
        page = metadata.get("page_number")
        citation = f", p. {page}" if page is not None else ""
        excerpts.append(f"[{filename}{citation}] distance={distance:.3f}\n{document.page_content}")
    return "\n\n---\n\n".join(excerpts)


SUPPORT_TOOLS = [knowledge_base_search, calculator, current_datetime]

import re
import hashlib
import json

from django.core.cache import cache
from .prompt_builder import build_system_prompt, AIContext
from decouple import config
from google import genai
from google.genai import types
from google.genai.errors import ClientError

try:
    from langdetect import detect
    from langdetect.lang_detect_exception import LangDetectException
except Exception:  # pragma: no cover - fallback when dependency is missing
    detect = None
    LangDetectException = Exception


SOFT_SKILLS_TOPICS = {
    "communication",
    "leadership",
    "teamwork",
    "conflict",
    "time management",
    "emotional intelligence",
    "critical thinking",
    "adaptability",
    "public speaking",
    "negotiation",
    "productivity",
    "career growth",
    "personal development",
    "soft skills",
}

OFF_TOPIC_HINTS = {
    "crypto",
    "stock",
    "politics",
    "sports betting",
    "adult",
    "hacking",
    "malware",
    "torrent",
}

_client = None


def detect_user_language(text: str) -> str:
    clean = re.sub(r"\s+", " ", str(text or "")).strip()
    if len(clean) < 12 or detect is None:
        return "en"
    try:
        code = detect(clean)
        return "ha" if code == "ha" else "en"
    except LangDetectException:
        return "en"
    except Exception:
        return "en"


def _build_response_language_instruction(source_text: str = "", response_language: str | None = None) -> str:
    lang = (response_language or "").strip().lower() or detect_user_language(source_text)
    if lang == "ha":
        return (
            "Respond in Hausa (Hausa language), clear and natural. "
            "If technical words are better in English, keep them minimal and explain in Hausa."
        )
    return "Respond in clear English."


def _build_generation_config(temperature=0.4, max_output_tokens=None):
    kwargs = {"temperature": temperature}
    if max_output_tokens is not None:
        kwargs["max_output_tokens"] = max_output_tokens
    # Keep thinking budget off for faster responses and to avoid token budget
    # being consumed by internal reasoning before user-visible output.
    kwargs["thinking_config"] = types.ThinkingConfig(
        thinking_budget=config("GEMINI_THINKING_BUDGET", default=0, cast=int)
    )
    return types.GenerateContentConfig(**kwargs)

# cache and context-aware function

def _cache_key(
    context: AIContext,
    user_id: int,
    query: str,
    page_data: dict,
    response_language: str = "en",
) -> str:
    """Generate a unique cache key for a query."""
    data_str = json.dumps(page_data, sort_keys=True)
    unique = f"{context.value}:{user_id}:{response_language}:{query}:{data_str}"
    return hashlib.md5(unique.encode()).hexdigest()

def ask_gemini_with_context(
    query: str,
    context: AIContext,
    page_data: dict,
    user_id: int,
    max_tokens: int = 12000,
    temperature: float = 0.3,
    use_cache: bool = True,
    response_language: str = "en",
) -> str:
    """Context-aware AI call with caching."""
    cache_key = (
        _cache_key(context, user_id, query, page_data, response_language=response_language)
        if use_cache
        else None
    )
    if use_cache:
        cached = cache.get(cache_key)
        if cached:
            return cached

    system = build_system_prompt(context, page_data, language=response_language)
    language_instruction = _build_response_language_instruction(
        source_text=query,
        response_language=response_language,
    )
    full_prompt = f"{system}\n\nLanguage policy: {language_instruction}\n\nUser: {query}\nAI:"
    
    result = ask_gemini(
        full_prompt,
        max_output_tokens=max_tokens,
        temperature=temperature,
        source_text=query,
        response_language=response_language,
    )
    
    if use_cache and result and not result.startswith("I could not reach"):
        cache.set(cache_key, result, timeout=3600)  # 1 hour cache
    return result

def stream_gemini_with_context(
    query: str,
    context: AIContext,
    page_data: dict,
    user_id: int,
    max_tokens: int = 12000,
    temperature: float = 0.3,
    response_language: str = "en",
):
    """Stream the response chunk by chunk."""
    system = build_system_prompt(context, page_data, language=response_language)
    language_instruction = _build_response_language_instruction(
        source_text=query,
        response_language=response_language,
    )
    full_prompt = f"{system}\n\nLanguage policy: {language_instruction}\n\nUser: {query}\nAI:"
    
    client = _get_client()
    if not client:
        yield "AI service not configured."
        return

    try:
        response = client.models.generate_content_stream(
            model=config("GEMINI_MODEL", default="gemini-2.5-flash"),
            contents=full_prompt,
            config=_build_generation_config(
                temperature=temperature,
                max_output_tokens=max_tokens,
            ),
        )
        for chunk in response:
            if chunk.text:
                yield chunk.text
    except Exception as e:
        yield f"Error: {str(e)}"

def is_off_topic(user_prompt):
    normalized = re.sub(r"\s+", " ", user_prompt.lower()).strip()
    if detect_user_language(normalized) == "ha":
        return False
    if any(term in normalized for term in OFF_TOPIC_HINTS):
        return True
    return not any(topic in normalized for topic in SOFT_SKILLS_TOPICS)


def preprocess_user_prompt(user_prompt):
    system_instruction = "You are an AI that only discusses soft skills and personal development."
    if is_off_topic(user_prompt):
        return (
            f"{system_instruction} The user asked an off-topic question: {user_prompt}. "
            "Respond politely redirecting to soft skills."
        )
    return f"{system_instruction} {user_prompt}"


def _get_client():
    global _client
    api_key = config("GEMINI_API_KEY", default="")
    if not api_key:
        return None

    if _client is None:
        _client = genai.Client(api_key=api_key)
    return _client


def ask_gemini(
    prompt,
    max_output_tokens=12000,
    temperature=0.4,
    timeout_seconds=12,
    source_text="",
    response_language="en",
):
    client = _get_client()
    if client is None:
        return "I can help with soft skills coaching, but the AI service key is not configured yet."

    language_instruction = _build_response_language_instruction(
        source_text=source_text,
        response_language=response_language,
    )
    full_prompt = f"Language policy: {language_instruction}\n\n{prompt}"

    try:
        response = client.models.generate_content(
            model=config("GEMINI_MODEL", default="gemini-2.5-flash"),
            contents=full_prompt,
            config=_build_generation_config(
                temperature=temperature,
                max_output_tokens=max_output_tokens,
            ),
        )
        return (
            getattr(response, "text", "")
            or "I can help you improve communication, leadership, and other soft skills."
        ).strip()
    except ClientError as exc:
        status_code = getattr(exc, "code", None) or getattr(exc, "status_code", None)
        message = str(exc).lower()
        if status_code == 404 or "not found" in message:
            return "AI model configuration error. Please contact support."
        if status_code == 429 or "quota" in message or "resource_exhausted" in message:
            return "AI usage limit reached for this project. Please check Gemini billing/quota and try again."
        if status_code == 401 or status_code == 403 or "permission" in message:
            return "AI service authentication failed. Please verify the Gemini API key."
        return "I could not reach the AI service right now. Please try again in a moment."
    except Exception:
        return "I could not reach the AI service right now. Please try again in a moment."

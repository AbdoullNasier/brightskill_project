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
RETRY_ATTEMPTS = 1
FAB_CACHE_VERSION = "v3"


def _normalize_model_name(model_name: str) -> str:
    clean = str(model_name or "").strip().lower()
    if not clean:
        return "gemini-2.5-flash"
    clean = clean.replace("_", "-")
    clean = re.sub(r"\s+", "-", clean)
    clean = re.sub(r"-{2,}", "-", clean)
    if clean.startswith("models/"):
        clean = clean.split("/", 1)[1]
    if clean.startswith("gemini") and not clean.startswith("gemini-"):
        clean = clean.replace("gemini", "gemini-", 1)
    return clean.strip("-") or "gemini-2.5-flash"


def _candidate_model_names() -> list[str]:
    configured = _normalize_model_name(config("GEMINI_MODEL", default="gemini-2.5-flash"))
    candidates: list[str] = [configured]

    if "2.5-flash" in configured:
        candidates.extend(["gemini-2.5-flash", "gemini-2.5-flash-002", "gemini-2.5-flash-001"])
    elif "1.5-flash" in configured:
        candidates.extend(["gemini-1.5-flash", "gemini-1.5-flash-002", "gemini-1.5-flash-001"])
    else:
        candidates.extend(["gemini-2.5-flash", "gemini-1.5-flash"])

    deduped: list[str] = []
    for candidate in candidates:
        normalized = _normalize_model_name(candidate)
        if normalized and normalized not in deduped:
            deduped.append(normalized)
    return deduped


def _is_temporary_error(message: str) -> bool:
    clean = str(message or "").lower()
    return any(
        token in clean
        for token in [
            "quota",
            "resource_exhausted",
            "429",
            "timeout",
            "timed out",
            "deadline",
            "connection",
            "tempor",
            "network",
            "unavailable",
            "reset",
        ]
    )


def _is_model_not_found_error(exc: Exception) -> bool:
    status_code = getattr(exc, "code", None) or getattr(exc, "status_code", None)
    message = str(exc).lower()
    return status_code == 404 or "not found" in message or "unsupported model" in message


def _classify_client_error(exc: Exception) -> tuple[str, bool]:
    status_code = getattr(exc, "code", None) or getattr(exc, "status_code", None)
    message = str(exc).lower()
    if status_code == 404 or "not found" in message:
        return "The AI model is misconfigured right now. Please contact support.", False
    if status_code in {401, 403} or "permission" in message:
        return "The AI service is not authorized right now. Please contact support.", False
    if status_code == 429 or "quota" in message or "resource_exhausted" in message:
        return "The AI is busy right now. Please try again shortly.", True
    if _is_temporary_error(message):
        return "I’m having trouble reaching the AI right now. Please try again in a moment.", True
    return "I’m having trouble reaching the AI right now. Please try again in a moment.", False


def sanitize_ai_response(text: str) -> str:
    clean = str(text or "").replace("\r\n", "\n").strip()
    if not clean:
        return clean

    clean = re.sub(r"(?im)^\s*(ai|fodiye)\s*:\s*", "", clean)
    clean = re.sub(r"\*+", "", clean)
    clean = re.sub(r"(?im)^#{1,6}\s*", "", clean)
    clean = re.sub(r"(?im)^[-•]\s*", "", clean)
    clean = re.sub(r"(?is)\n*\s*feedback\s*:\s*.*$", "", clean)
    clean = re.sub(r"(?is)\n*\s*clarity\s*:\s*.*$", "", clean)
    clean = re.sub(r"(?is)\n*\s*specificity\s*:\s*.*$", "", clean)
    clean = re.sub(r"\n{3,}", "\n\n", clean)
    return clean.strip()


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


def _build_identity_instruction(response_language: str | None = None) -> str:
    lang = (response_language or "").strip().lower()
    if lang == "ha":
        return (
            "Sunanka na dindindin Fodiye ne. "
            "Idan mai amfani ya tambayi sunanka, ka ce sunanka Fodiye ne. "
            "Kada ka ce sunanka AI ne, ChatGPT ne, ko kuma ba ka da suna."
        )
    return (
        "Your fixed name is Fodiye. "
        "If the user asks your name, reply that your name is Fodiye. "
        "Never say your name is AI, ChatGPT, OpenAI, or that you do not have a name."
    )


def _build_generation_config(temperature=0.4, max_output_tokens=None):
    kwargs = {"temperature": temperature}
    if max_output_tokens is not None:
        kwargs["max_output_tokens"] = max_output_tokens
    thinking_budget = config("GEMINI_THINKING_BUDGET", default=0, cast=int)
    if thinking_budget > 0:
        kwargs["thinking_config"] = types.ThinkingConfig(thinking_budget=thinking_budget)
    return types.GenerateContentConfig(**kwargs)

# cache and context-aware function

def _cache_key(
    context: AIContext,
    user_id: int,
    query: str,
    page_data: dict,
    max_tokens: int | None = None,
    temperature: float | None = None,
    response_language: str = "en",
) -> str:
    """Generate a unique cache key for a query."""
    data_str = json.dumps(page_data, sort_keys=True)
    unique = (
        f"{FAB_CACHE_VERSION}:{context.value}:{user_id}:{response_language}:"
        f"{max_tokens}:{temperature}:{query}:{data_str}"
    )
    return hashlib.md5(unique.encode()).hexdigest()


def _looks_incomplete_response(text: str) -> bool:
    clean = str(text or "").strip()
    if not clean:
        return True
    if len(clean.split()) <= 2:
        return True
    if clean.endswith((" It", " And", " But", " Or", " So", " Because", "If", "When")):
        return True
    return bool(re.search(r"\b(it|and|but|or|so|because|if|when|that|which)\s*$", clean, re.IGNORECASE))

def ask_gemini_with_context(
    query: str,
    context: AIContext,
    page_data: dict,
    user_id: int,
    max_tokens: int = 500,
    temperature: float = 0.3,
    use_cache: bool = True,
    response_language: str = "en",
) -> str:
    cache_key = (
        _cache_key(
            context,
            user_id,
            query,
            page_data,
            max_tokens=max_tokens,
            temperature=temperature,
            response_language=response_language,
        )
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
    full_prompt = f"{system}\n\nLanguage policy: {language_instruction}\n\nUser message: {query}\nRespond directly."

    result = ask_gemini(
        full_prompt,
        max_output_tokens=max_tokens,
        temperature=temperature,
        source_text=query,
        response_language=response_language,
    )
    result = sanitize_ai_response(result)

    if _looks_incomplete_response(result):
        retry_tokens = max(max_tokens * 2, 220)
        retry_prompt = (
            f"{full_prompt}\n\n"
            "Your previous answer was too short or cut off. "
            "Reply again with a complete answer that finishes naturally and stays specific to the current page context."
        )
        retry_result = ask_gemini(
            retry_prompt,
            max_output_tokens=retry_tokens,
            temperature=temperature,
            source_text=query,
            response_language=response_language,
        )
        retry_result = sanitize_ai_response(retry_result)
        if retry_result and not _looks_incomplete_response(retry_result):
            result = retry_result
    
    if (
        use_cache
        and result
        and not _looks_incomplete_response(result)
        and "trouble reaching the ai" not in result.lower()
        and "busy right now" not in result.lower()
    ):
        cache.set(cache_key, result, timeout=86400)  # 24 hour cache
    return result

def stream_gemini_with_context(
    query: str,
    context: AIContext,
    page_data: dict,
    user_id: int,
    max_tokens: int = 300,
    temperature: float = 0.3,
    response_language: str = "en",
):
    system = build_system_prompt(context, page_data, language=response_language)
    language_instruction = _build_response_language_instruction(
        source_text=query,
        response_language=response_language,
    )
    full_prompt = f"{system}\n\nLanguage policy: {language_instruction}\n\nUser message: {query}\nRespond directly."

    client = _get_client()
    if not client:
        yield "AI service not configured."
        return

    candidate_models = _candidate_model_names()
    for attempt in range(RETRY_ATTEMPTS):
        for model_name in candidate_models:
            try:
                response = client.models.generate_content_stream(
                    model=model_name,
                    contents=full_prompt,
                    config=_build_generation_config(
                        temperature=temperature,
                        max_output_tokens=max_tokens,
                    ),
                )
                for chunk in response:
                    if chunk.text:
                        yield chunk.text
                return
            except ClientError as exc:
                print(
                    f"stream_gemini_with_context ClientError model={model_name} attempt={attempt + 1}: {exc}"
                )
                if _is_model_not_found_error(exc):
                    continue
                message, retryable = _classify_client_error(exc)
                if retryable and attempt < RETRY_ATTEMPTS - 1:
                    break
                yield message
                return
            except Exception as exc:
                print(
                    f"stream_gemini_with_context Exception model={model_name} attempt={attempt + 1}: {exc}"
                )
                if _is_temporary_error(str(exc)) and attempt < RETRY_ATTEMPTS - 1:
                    break
                yield "I'm having trouble reaching the AI right now. Please try again in a moment."
                return
        else:
            continue
        continue

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
    api_key = config("GEMINI_API_KEY", default="") or config("GOOGLE_API_KEY", default="")
    if not api_key:
        return None

    if _client is None:
        _client = genai.Client(api_key=api_key)
    return _client


def ask_gemini(
    prompt,
    max_output_tokens=300,
    temperature=0.2,
    timeout_seconds=12,
    source_text="",
    response_language="en",
):
    client = _get_client()
    if client is None:
        return "The AI service is not configured right now."

    language_instruction = _build_response_language_instruction(
        source_text=source_text,
        response_language=response_language,
    )
    identity_instruction = _build_identity_instruction(response_language=response_language)
    full_prompt = f"Identity policy: {identity_instruction}\nLanguage policy: {language_instruction}\n\n{prompt}"

    candidate_models = _candidate_model_names()
    for attempt in range(RETRY_ATTEMPTS):
        for model_name in candidate_models:
            try:
                response = client.models.generate_content(
                    model=model_name,
                    contents=full_prompt,
                    config=_build_generation_config(
                        temperature=temperature,
                        max_output_tokens=max_output_tokens,
                    ),
                )
                return sanitize_ai_response(
                    getattr(response, "text", "")
                    or "I can help you improve communication, leadership, and other soft skills."
                ).strip()
            except ClientError as exc:
                print(f"ask_gemini ClientError model={model_name} attempt={attempt + 1}: {exc}")
                if _is_model_not_found_error(exc):
                    continue
                message, retryable = _classify_client_error(exc)
                if retryable and attempt < RETRY_ATTEMPTS - 1:
                    break
                return message
            except Exception as exc:
                print(f"ask_gemini Exception model={model_name} attempt={attempt + 1}: {exc}")
                if _is_temporary_error(str(exc)) and attempt < RETRY_ATTEMPTS - 1:
                    break
                return "I'm having trouble reaching the AI right now. Please try again in a moment."
        else:
            continue
        continue

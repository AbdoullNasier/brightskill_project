import json
import re

from ai_engine.catalog import SUPPORTED_PLATFORM_SKILLS, normalize_focus_area, normalize_focus_areas
from ai_engine.services import ask_gemini
from .models import BookRecommendation


AI_SERVICE_ERROR_MARKERS = (
    "AI usage limit reached",
    "I could not reach the AI service",
    "AI service authentication failed",
    "AI model configuration error",
    "AI service not configured",
    "AI service is not authorized",
    "The AI is busy right now",
    "I'm having trouble reaching the AI right now",
    "having trouble reaching the AI",
)


def _is_ai_service_error(text):
    clean = str(text or "").strip().lower()
    return any(marker.lower() in clean for marker in AI_SERVICE_ERROR_MARKERS)


def _compact_text(value, max_length=1800):
    clean = re.sub(r"\s+", " ", str(value or "")).strip()
    return clean[:max_length].rstrip()


def _extract_json_payload(raw_text):
    text = str(raw_text or "").strip()
    if not text:
        return {}
    try:
        parsed = json.loads(text)
        return parsed if isinstance(parsed, dict) else {}
    except Exception:
        pass

    start = text.find("{")
    end = text.rfind("}")
    if start != -1 and end != -1 and end > start:
        try:
            parsed = json.loads(text[start : end + 1])
            return parsed if isinstance(parsed, dict) else {}
        except Exception:
            return {}
    return {}


def _infer_skill_from_context(topic="", context_text="", focus_areas=None):
    normalized_focus = normalize_focus_areas(focus_areas or [])
    if normalized_focus:
        return normalized_focus[0]

    topic_skill = normalize_focus_area(topic)
    if topic_skill:
        return topic_skill

    context_skill = normalize_focus_area(context_text)
    if context_skill:
        return context_skill

    combined = f"{topic} {context_text}".lower()
    for skill in SUPPORTED_PLATFORM_SKILLS:
        if skill.lower() in combined:
            return skill
    return "Communication"


def _build_book_prompt(skill, topic="", context_text="", source_type="", response_language="en"):
    language_name = "Hausa" if response_language == "ha" else "English"
    return (
        "You are an expert learning coach and librarian for BrightSkill.\n"
        "Recommend exactly ONE real, well-known, high-quality book for this learner.\n"
        "The recommendation must be personalized from the learner context, not a fixed default.\n"
        "Return JSON only with this exact schema:\n"
        "{"
        '"title":"...",'
        '"author":"...",'
        '"reason":"..."'
        "}\n"
        "Rules:\n"
        "- Recommend a real published book, not a course, article, podcast, or imaginary title.\n"
        "- Choose the book that best fits the learner's current soft-skill need, challenge, confidence, and goal.\n"
        "- Stay focused on the selected skill and BrightSkill learning context.\n"
        "- The reason must explain why this specific book fits this specific learner.\n"
        "- Keep the reason practical and concise, 2 to 4 sentences.\n"
        f"- Write the reason in {language_name}. Keep the book title and author in their official names.\n\n"
        f"Selected skill: {skill}\n"
        f"Topic/source topic: {_compact_text(topic, 300)}\n"
        f"Source type: {source_type}\n"
        f"Learner context: {_compact_text(context_text)}"
    )


def _generate_ai_book_payload(
    *,
    skill,
    topic="",
    source_type="",
    context_text="",
    response_language="en",
):
    prompt = _build_book_prompt(
        skill=skill,
        topic=topic,
        context_text=context_text,
        source_type=source_type,
        response_language=response_language,
    )
    raw = ask_gemini(
        prompt,
        max_output_tokens=420,
        temperature=0.35,
        response_language=response_language,
    )
    if _is_ai_service_error(raw):
        raise RuntimeError(str(raw))

    payload = _extract_json_payload(raw)
    title = str(payload.get("title", "")).strip()
    author = str(payload.get("author", "")).strip()
    reason = str(payload.get("reason", "")).strip()
    if not title or not author or not reason:
        raise ValueError("AI returned an invalid book recommendation payload.")

    return {
        "title": title[:255],
        "author": author[:255],
        "reason": reason,
    }


def create_book_recommendation(
    user,
    topic,
    source_type,
    source_id,
    context_text="",
    focus_areas=None,
    response_language="en",
):
    skill = _infer_skill_from_context(topic=topic, context_text=context_text, focus_areas=focus_areas)
    parsed = _generate_ai_book_payload(
        skill=skill,
        topic=topic,
        source_type=source_type,
        context_text=context_text,
        response_language=response_language,
    )
    return BookRecommendation.objects.create(
        user=user,
        source_type=source_type,
        source_id=source_id,
        title=parsed["title"],
        author=parsed["author"],
        reason=parsed["reason"],
    )

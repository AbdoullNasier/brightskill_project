import json
from .models import BookRecommendation
from ai_engine.catalog import SUPPORTED_PLATFORM_SKILLS, normalize_focus_area, normalize_focus_areas


CURATED_BOOKS = {
    "Communication": {
        "title": "Crucial Conversations",
        "author": "Kerry Patterson, Joseph Grenny, Ron McMillan, and Al Switzler",
    },
    "Leadership": {
        "title": "Leaders Eat Last",
        "author": "Simon Sinek",
    },
    "Emotional Intelligence": {
        "title": "Emotional Intelligence 2.0",
        "author": "Travis Bradberry and Jean Greaves",
    },
    "Critical Thinking": {
        "title": "Thinking, Fast and Slow",
        "author": "Daniel Kahneman",
    },
    "Time Management": {
        "title": "Deep Work",
        "author": "Cal Newport",
    },
    "Adaptability": {
        "title": "Who Moved My Cheese?",
        "author": "Spencer Johnson",
    },
}


def parse_book_payload(raw_text):
    # Prefer structured json but allow plain fallback from model output.
    try:
        parsed = json.loads(raw_text)
        return {
            "title": parsed.get("title", "The 7 Habits of Highly Effective People"),
            "author": parsed.get("author", "Stephen R. Covey"),
            "reason": parsed.get("reason", "Practical habits for communication and leadership growth."),
        }
    except Exception:
        lines = [line.strip() for line in raw_text.splitlines() if line.strip()]
        title = "The 7 Habits of Highly Effective People"
        author = "Stephen R. Covey"
        reason = "Practical habits for communication and leadership growth."
        for line in lines:
            if line.lower().startswith("title:"):
                title = line.split(":", 1)[1].strip()
            elif line.lower().startswith("author:"):
                author = line.split(":", 1)[1].strip()
            elif line.lower().startswith("reason:"):
                reason = line.split(":", 1)[1].strip()
        return {"title": title, "author": author, "reason": reason}


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


def _build_contextual_reason(skill, topic="", context_text="", response_language="en"):
    topic_text = str(topic or "").strip()
    context_preview = str(context_text or "").strip()[:180]
    if response_language == "ha":
        reasons = {
            "Communication": "An zaɓi wannan littafi ne domin zai taimaka maka ko miki wajen inganta bayyana ra'ayi, sauraro, da sadarwa mai tasiri a yanayin aikinki.",
            "Leadership": "An zaɓi wannan littafi ne domin yana taimaka wa mai koyo ya gina jagoranci, tasiri, da kyakkyawar hulɗa da ƙungiya.",
            "Emotional Intelligence": "An zaɓi wannan littafi ne domin yana taimakawa wajen fahimtar ji, sarrafa halayya, da kyautata hulɗa da mutane.",
            "Critical Thinking": "An zaɓi wannan littafi ne domin yana taimakawa wajen nazari, yanke shawara, da warware matsaloli cikin tsari.",
            "Time Management": "An zaɓi wannan littafi ne domin yana taimaka maka ko miki wajen tsara lokaci, fifita aiki, da mayar da hankali.",
            "Adaptability": "An zaɓi wannan littafi ne domin yana koyar da yadda ake sabawa da sauyi da aiki da kyau a yanayi mai canzawa.",
        }
        return reasons.get(skill, "An zaɓi wannan littafi ne domin ya dace da manufar bunkasa soft skills dinki.")

    reasons = {
        "Communication": "Recommended because it directly supports clearer communication, stronger listening, and better high-stakes conversations.",
        "Leadership": "Recommended because it fits your need to build influence, team trust, and practical leadership habits.",
        "Emotional Intelligence": "Recommended because it supports self-awareness, emotional control, and stronger interpersonal relationships.",
        "Critical Thinking": "Recommended because it helps strengthen analysis, judgment, and structured problem solving.",
        "Time Management": "Recommended because it supports focus, prioritization, and more disciplined use of time.",
        "Adaptability": "Recommended because it helps you respond better to change, uncertainty, and shifting work demands.",
    }
    reason = reasons.get(skill, "Recommended because it fits your current soft-skills growth goal.")
    if topic_text:
        reason = f"{reason} It matches your current focus on {topic_text.lower()}."
    elif context_preview:
        reason = f"{reason} It aligns with the needs described in your interview."
    return reason


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
    selected = CURATED_BOOKS.get(skill, CURATED_BOOKS["Communication"])
    parsed = {
        "title": selected["title"],
        "author": selected["author"],
        "reason": _build_contextual_reason(
            skill,
            topic=topic,
            context_text=context_text,
            response_language=response_language,
        ),
    }
    recommendation = BookRecommendation.objects.create(
        user=user,
        source_type=source_type,
        source_id=source_id,
        title=parsed["title"],
        author=parsed["author"],
        reason=parsed["reason"],
    )
    return recommendation

import re

from langdetect import detect
from langdetect.lang_detect_exception import LangDetectException


SUPPORTED_LANGUAGES = {"en", "ha"}
HAUSA_HINTS = {
    "sannu",
    "nagode",
    "ina",
    "yaya",
    "yadda",
    "zan",
    "zai",
    "koyi",
    "don",
    "saboda",
    "gaskiya",
    "akwai",
    "bana",
    "nake",
}


def _normalize_language(code: str | None) -> str:
    code = str(code or "").strip().lower()
    if code == "ha":
        return "ha"
    return "en"


def detect_user_language(text: str) -> str:
    clean = re.sub(r"\s+", " ", str(text or "")).strip().lower()
    if not clean:
        return "en"

    if any(hint in clean for hint in HAUSA_HINTS):
        return "ha"

    if len(clean) < 12:
        return "en"

    try:
        return _normalize_language(detect(clean))
    except LangDetectException:
        return "en"
    except Exception:
        return "en"


def resolve_language(user, user_message: str = "") -> str:
    detected_lang = detect_user_language(user_message)
    if detected_lang in SUPPORTED_LANGUAGES:
        return detected_lang

    preferred_language = getattr(user, "preferred_language", None)
    return _normalize_language(preferred_language)

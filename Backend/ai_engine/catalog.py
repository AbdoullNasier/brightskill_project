SUPPORTED_PLATFORM_SKILLS = [
    "Communication",
    "Leadership",
    "Emotional Intelligence",
    "Critical Thinking",
    "Time Management",
    "Adaptability",
]

SKILL_ALIASES = {
    "Communication": [
        "communication",
        "communicate",
        "conversation",
        "public speaking",
        "presentation",
        "speaking",
        "confidence",
        "interview",
        "negotiation",
        "sadarwa",
        "jawabi",
        "gabatarwa",
        "magana",
    ],
    "Leadership": [
        "leadership",
        "lead",
        "leading",
        "manager",
        "management",
        "team lead",
        "supervisor",
        "jagoranci",
        "shugabanci",
        "jagora",
        "Tsarin gudanarwa",
    ],
    "Emotional Intelligence": [
        "emotional intelligence",
        "emotion",
        "empathy",
        "self awareness",
        "self-awareness",
        "relationship management",
        "fahimta na ji",
        "tausayawa",
        "sanin kai",
        "sarrafawa ji",
        "sababu",
        "tausayi",
        "fahimtar juna",
    ],
    "Critical Thinking": [
        "critical thinking",
        "problem solving",
        "complex problem",
        "analysis",
        "decision making",
        "reasoning",
        "tunani mai zurfi",
        "warware matsala",
        "nazari",
        "yanke shawara",
        "hujja",
        "tunani mai ma'ana",
        "tunani mai kyau",
        "hangen nesa",
    ],
    "Time Management": [
        "time management",
        "productivity",
        "focus",
        "prioritization",
        "planning",
        "deadline",
        "lokaci",
        "tsara lokaci",
        "shirye-shirye",
        "mayar da hankali",
        "tsarin fifiko",
        "tsari",
        "lokacin aiki",
        "Muhimmancin lokaci",
        "Tsadar lokaci",
    ],
    "Adaptability": [
        "adaptability",
        "adapt",
        "change",
        "resilience",
        "flexibility",
        "uncertainty",
        "daidaitawa",
        "sauyi",
        "jurewa",
        "sassauci",
        "canjin yanayi",
        "canjin aiki",
    ],
}


def normalize_focus_area(text: str) -> str | None:
    needle = str(text or "").strip().lower()
    if not needle:
        return None

    for skill in SUPPORTED_PLATFORM_SKILLS:
        if needle == skill.lower():
            return skill

    for skill, aliases in SKILL_ALIASES.items():
        if any(alias in needle for alias in aliases):
            return skill

    return None


def normalize_focus_areas(items) -> list[str]:
    normalized = []
    seen = set()
    for item in items or []:
        skill = normalize_focus_area(str(item))
        if skill and skill not in seen:
            seen.add(skill)
            normalized.append(skill)
    return normalized

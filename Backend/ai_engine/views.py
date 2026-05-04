import json
import re

from django.db import transaction
from django.db.models import Max, Q
from django.utils import timezone
from rest_framework.exceptions import APIException
from rest_framework import generics, permissions, status
from rest_framework.response import Response

from books.services import create_book_recommendation
from courses.models import Course
from progress.models import ModuleCompletion
from .services import ask_gemini_with_context, ask_gemini
from .models import (
    Conversation,
    Message,
    RolePlaySession,
    RolePlayMessage,
    InterviewAssessment,
    InterviewResponse,
    LearningPath,
    UserSkillProfile,
    LearningRoadmap,
    RoadmapStage,
)
from .prompt_builder import AIContext
from .serializers import (
    FABRequestSerializer,
    RolePlaySessionSerializer,
    RolePlaySessionUpdateSerializer,
    InterviewStartSerializer,
    InterviewAnswerSerializer,
    InterviewFinishSerializer,
    OnboardingSelectSkillSerializer,
    OnboardingInterviewSerializer,
    OnboardingGenerateRoadmapSerializer,
    LearningRoadmapSerializer,
    InterviewAssessmentSerializer,
    RolePlayStartSerializer,
    RolePlayMessageRequestSerializer,
    RolePlayRequestSerializer,
    LearningPathSerializer,
    SELECTABLE_SOFT_SKILLS,
)
from .utils import resolve_language

MIN_INTERVIEW_RESPONSES = 4
MAX_AI_INTERVIEW_QUESTIONS = 3
MAX_INTERVIEW_RESPONSES = MIN_INTERVIEW_RESPONSES + MAX_AI_INTERVIEW_QUESTIONS
INTERVIEW_AI_MAX_RETRIES = 1

INITIAL_QUESTIONS_BY_SKILL = {
    "communication": [
        {"type": "text", "question_key": "goal", "question_text": "What is your main goal in improving communication?"},
        {"type": "text", "question_key": "challenge", "question_text": "Where do you struggle most in communication?"},
        {"type": "mcq", "question_key": "confidence", "question_text": "Rate your confidence level.", "options": ["1-3", "4-6", "7-10"]},
        {"type": "text", "question_key": "real_situation", "question_text": "Describe a recent communication situation that did not go well."},
    ],
    "leadership": [
        {"type": "text", "question_key": "goal", "question_text": "What is your main goal in improving leadership?"},
        {"type": "text", "question_key": "challenge", "question_text": "Where do you struggle most when leading others?"},
        {"type": "mcq", "question_key": "confidence", "question_text": "Rate your confidence level as a leader.", "options": ["1-3", "4-6", "7-10"]},
        {"type": "text", "question_key": "real_situation", "question_text": "Describe a recent leadership situation that did not go well."},
    ],
    "emotional intelligence": [
        {"type": "text", "question_key": "goal", "question_text": "What is your main goal in improving emotional intelligence?"},
        {"type": "text", "question_key": "challenge", "question_text": "Where do you struggle most with understanding or managing emotions?"},
        {"type": "mcq", "question_key": "confidence", "question_text": "Rate your emotional intelligence confidence level.", "options": ["1-3", "4-6", "7-10"]},
        {"type": "text", "question_key": "real_situation", "question_text": "Describe a recent situation where emotions affected the outcome."},
    ],
    "critical thinking": [
        {"type": "text", "question_key": "goal", "question_text": "What is your main goal in improving critical thinking?"},
        {"type": "text", "question_key": "challenge", "question_text": "Where do you struggle most when analyzing problems or making decisions?"},
        {"type": "mcq", "question_key": "confidence", "question_text": "Rate your critical thinking confidence level.", "options": ["1-3", "4-6", "7-10"]},
        {"type": "text", "question_key": "real_situation", "question_text": "Describe a recent decision or problem that did not go well."},
    ],
    "time management": [
        {"type": "text", "question_key": "goal", "question_text": "What is your main goal in improving time management?"},
        {"type": "text", "question_key": "challenge", "question_text": "Where do you struggle most with managing your time?"},
        {"type": "mcq", "question_key": "confidence", "question_text": "Rate your time management confidence level.", "options": ["1-3", "4-6", "7-10"]},
        {"type": "text", "question_key": "real_situation", "question_text": "Describe a recent situation where poor time management affected your result."},
    ],
    "adaptability": [
        {"type": "text", "question_key": "goal", "question_text": "What is your main goal in improving adaptability?"},
        {"type": "text", "question_key": "challenge", "question_text": "Where do you struggle most when plans or situations change?"},
        {"type": "mcq", "question_key": "confidence", "question_text": "Rate your adaptability confidence level.", "options": ["1-3", "4-6", "7-10"]},
        {"type": "text", "question_key": "real_situation", "question_text": "Describe a recent change or unexpected situation that did not go well."},
    ],
}

INITIAL_QUESTIONS_BY_SKILL_HA = {
    "communication": [
        {"type": "text", "question_key": "goal", "question_text": "Menene babban burinka wajen inganta sadarwa?"},
        {"type": "text", "question_key": "challenge", "question_text": "A wane bangare ne ka fi samun matsala wajen sadarwa?"},
        {"type": "mcq", "question_key": "confidence", "question_text": "Ka kimanta matakin kwarin gwiwarka.", "options": ["1-3", "4-6", "7-10"]},
        {"type": "text", "question_key": "real_situation", "question_text": "Ka bayyana wani yanayin sadarwa na baya-bayan nan da bai tafi yadda ya kamata ba."},
    ],
    "leadership": [
        {"type": "text", "question_key": "goal", "question_text": "Menene babban burinka wajen inganta jagoranci?"},
        {"type": "text", "question_key": "challenge", "question_text": "A wane bangare ne ka fi samun matsala idan kana jagorantar wasu?"},
        {"type": "mcq", "question_key": "confidence", "question_text": "Ka kimanta kwarin gwiwarka a matsayin jagora.", "options": ["1-3", "4-6", "7-10"]},
        {"type": "text", "question_key": "real_situation", "question_text": "Ka bayyana wani yanayin jagoranci na baya-bayan nan da bai tafi yadda ya kamata ba."},
    ],
    "emotional intelligence": [
        {"type": "text", "question_key": "goal", "question_text": "Menene babban burinka wajen inganta fahimtar motsin rai?"},
        {"type": "text", "question_key": "challenge", "question_text": "A ina kake fi samun matsala wajen fahimta ko sarrafa motsin rai?"},
        {"type": "mcq", "question_key": "confidence", "question_text": "Ka kimanta kwarin gwiwarka a fahimtar motsin rai.", "options": ["1-3", "4-6", "7-10"]},
        {"type": "text", "question_key": "real_situation", "question_text": "Ka bayyana wani yanayi na baya-bayan nan inda motsin rai ya shafi sakamako."},
    ],
    "critical thinking": [
        {"type": "text", "question_key": "goal", "question_text": "Menene babban burinka wajen inganta tunani mai zurfi?"},
        {"type": "text", "question_key": "challenge", "question_text": "A ina kake fi samun matsala wajen nazarin matsala ko yanke shawara?"},
        {"type": "mcq", "question_key": "confidence", "question_text": "Ka kimanta kwarin gwiwarka a tunani mai zurfi.", "options": ["1-3", "4-6", "7-10"]},
        {"type": "text", "question_key": "real_situation", "question_text": "Ka bayyana wata shawara ko matsala ta baya-bayan nan da ba ta tafi yadda ya kamata ba."},
    ],
    "time management": [
        {"type": "text", "question_key": "goal", "question_text": "Menene babban burinka wajen inganta sarrafa lokaci?"},
        {"type": "text", "question_key": "challenge", "question_text": "A ina kake fi samun matsala wajen sarrafa lokacinka?"},
        {"type": "mcq", "question_key": "confidence", "question_text": "Ka kimanta kwarin gwiwarka wajen sarrafa lokaci.", "options": ["1-3", "4-6", "7-10"]},
        {"type": "text", "question_key": "real_situation", "question_text": "Ka bayyana wani yanayi na baya-bayan nan inda rashin sarrafa lokaci ya shafi sakamakonka."},
    ],
    "adaptability": [
        {"type": "text", "question_key": "goal", "question_text": "Menene babban burinka wajen inganta iya daidaitawa da canji?"},
        {"type": "text", "question_key": "challenge", "question_text": "A ina kake fi samun matsala idan tsari ko yanayi ya canza?"},
        {"type": "mcq", "question_key": "confidence", "question_text": "Ka kimanta kwarin gwiwarka wajen daidaitawa da canji.", "options": ["1-3", "4-6", "7-10"]},
        {"type": "text", "question_key": "real_situation", "question_text": "Ka bayyana wani canji ko yanayi na bazata da bai tafi yadda ya kamata ba."},
    ],
}

INTERVIEW_DIAGNOSTIC_AREAS = [
    "current level",
    "main challenges",
    "goals",
    "confidence",
    "habits",
    "real-life situations",
]

INTERVIEW_FALLBACK_PROMPTS = {
    "current level": "How would you describe your current {skill} level in real situations?",
    "main challenges": "What is the hardest part of {skill} for you right now?",
    "goals": "What would success in {skill} look like for you over the next month?",
    "confidence": "How confident do you feel using {skill} when the pressure is high?",
    "habits": "What habits or routines currently help or hurt your {skill} development?",
    "real-life situations": "Tell me about a recent real-life situation where stronger {skill} would have helped you.",
}

AI_SERVICE_ERROR_MARKERS = (
    "AI usage limit reached",
    "I could not reach the AI service",
    "AI service authentication failed",
    "AI model configuration error",
    "AI service not configured",
    "AI service is not authorized",
    "The AI is busy right now",
    "I’m having trouble reaching the AI right now",
    "I'm having trouble reaching the AI right now",
)
# ---------------------------------------------


class InterviewGenerationError(Exception):
    pass


def _extract_json_payload(raw_text):
    text = (raw_text or "").strip()
    if not text:
        return {}
    try:
        return json.loads(text)
    except Exception:
        pass

    start = text.find("{")
    end = text.rfind("}")
    if start != -1 and end != -1 and end > start:
        try:
            return json.loads(text[start : end + 1])
        except Exception:
            return {}
    return {}


def _extract_json_array(raw_text):
    text = (raw_text or "").strip()
    if not text:
        return []
    try:
        parsed = json.loads(text)
        return parsed if isinstance(parsed, list) else []
    except Exception:
        pass

    start = text.find("[")
    end = text.rfind("]")
    if start != -1 and end != -1 and end > start:
        try:
            parsed = json.loads(text[start : end + 1])
            return parsed if isinstance(parsed, list) else []
        except Exception:
            return []
    return []


def _match_course_for_stage(selected_skill, stage_payload):
    hint = " ".join(
        [
            str(selected_skill or ""),
            str(stage_payload.get("stage_title", "")),
            str(stage_payload.get("stage_objective", "")),
            str(stage_payload.get("course_hint", "")),
        ]
    ).strip()
    query = (
        Course.objects.filter(is_active=True, is_published=True)
        .select_related("skill")
        .filter(
            Q(skill__name__icontains=selected_skill)
            | Q(title__icontains=hint)
            | Q(description__icontains=hint)
        )
        .order_by("title")
    )
    return query.first()


def _normalize_question_text(value):
    return re.sub(r"[^a-z0-9]+", " ", str(value or "").lower()).strip()


def _normalize_selected_skill(selected_skill):
    clean = re.sub(r"\s+", " ", str(selected_skill or "").strip().lower())
    return clean if clean in INITIAL_QUESTIONS_BY_SKILL else "communication"


def _normalize_interview_language(language):
    return "ha" if str(language or "").strip().lower() == "ha" else "en"


def _interview_language_name(language):
    return "Hausa" if _normalize_interview_language(language) == "ha" else "English"


def _initial_questions_for_skill(selected_skill, language="en"):
    skill = _normalize_selected_skill(selected_skill)
    source = INITIAL_QUESTIONS_BY_SKILL_HA if _normalize_interview_language(language) == "ha" else INITIAL_QUESTIONS_BY_SKILL
    return [dict(question) for question in source.get(skill, source["communication"])]


def _serialize_interview_question(question):
    if not question:
        return {}
    return {
        "question_key": str(question.get("question_key", "")).strip(),
        "question": str(question.get("question_text", "")).strip(),
        "question_text": str(question.get("question_text", "")).strip(),
        "question_type": str(question.get("type", "text")).strip() or "text",
        "options": list(question.get("options", []) or []),
    }


def _slug_question_key(value, prefix="ai"):
    clean = _normalize_question_text(value)
    if not clean:
        return prefix
    return f"{prefix}_{'_'.join(clean.split()[:8])}"[:100]


def _question_key_from_text(selected_skill, language, question_text):
    normalized = _normalize_question_text(question_text)
    for question in _initial_questions_for_skill(selected_skill, language):
        if _normalize_question_text(question["question_text"]) == normalized:
            return question["question_key"]
    return _slug_question_key(question_text)


def _next_structured_question(assessment):
    selected_skill = _normalize_selected_skill(assessment.selected_skill)
    language = _normalize_interview_language(assessment.interview_language)
    answered_keys = set(
        assessment.responses.exclude(question_key="")
        .values_list("question_key", flat=True)
    )
    answered_texts = {
        _normalize_question_text(text)
        for text in assessment.responses.values_list("question_text", flat=True)
    }

    for question in _initial_questions_for_skill(selected_skill, language):
        if question["question_key"] in answered_keys:
            continue
        if _normalize_question_text(question["question_text"]) in answered_texts:
            continue
        return question
    return None


def _ai_question_count(assessment):
    return assessment.responses.filter(question_key__startswith="ai_").count()


def _build_interview_transcript(assessment):
    return [
        {
            "sequence_order": item.sequence_order,
            "question_key": item.question_key,
            "question_text": item.question_text,
            "response_text": item.response_text,
        }
        for item in assessment.responses.order_by("sequence_order", "id")
    ]


def _extract_question_from_raw_text(raw_text):
    text = str(raw_text or "").strip()
    if not text:
        return ""
    if any(marker.lower() in text.lower() for marker in AI_SERVICE_ERROR_MARKERS):
        return ""

    lines = [line.strip(" -*\t") for line in text.splitlines() if line.strip()]
    for line in lines:
        if "{" in line or "}" in line:
            continue
        if "question_text" in line.lower() or "is_complete" in line.lower():
            continue
        if len(line) >= 12:
            return line.strip(' "\'')
    return ""


def _build_personalized_roadmap_fallback(selected_skill, transcript, response_language="en"):
    language = _normalize_interview_language(response_language)
    responses = [row.get("response_text", "").strip() for row in transcript if row.get("response_text")]
    latest_response = responses[-1] if responses else ""
    first_response = responses[0] if responses else ""

    if language == "ha":
        summary = (
            f"Wannan taswirar koyo tana taimaka maka ka inganta {selected_skill} ta hanyar atisaye, tunani, da amfani a rayuwa ta yau da kullum."
        )
        if first_response or latest_response:
            summary = (
                f"Wannan taswirar koyo ta dogara da amsoshinka game da {selected_skill}, "
                "tare da mai da hankali kan abin da kake so ka inganta, kalubale, da atisaye mai ma'ana."
            )

        stages = [
            {
                "stage_title": "Fahimtar Matsayinka",
                "stage_objective": f"Fahimci karfinka, raunin ka, da abubuwan da ke hana ci gaba a {selected_skill}.",
                "learner_actions": f"Ka rubuta yanayi uku da suka nuna yadda kake amfani da {selected_skill} a yanzu.",
                "practical_exercise": f"Ka yi tunani bayan wani yanayi na {selected_skill} a wannan makon.",
                "habit_action": "Ka ware minti 10 a kowace rana domin nazarin abin da ya faru da abin da za ka gyara.",
                "course_hint": selected_skill,
                "ai_support_note": "Tambayi FAB ya mayar da tunaninka zuwa jerin ayyukan mako.",
            },
            {
                "stage_title": "Atisaye Mai Jagora",
                "stage_objective": f"Ka fara amfani da {selected_skill} a kananan yanayi masu sauki.",
                "learner_actions": f"Ka zabi yanayi biyu a mako inda za ka yi atisaye da {selected_skill}.",
                "practical_exercise": f"Ka yi role-play guda biyu da suka shafi {selected_skill}.",
                "habit_action": "Ka rubuta abin da ka shirya, abin da ka yi, da abin da ya sauya.",
                "course_hint": selected_skill,
                "ai_support_note": "Tambayi FAB ya baka drills da suka dace da matakinka.",
            },
            {
                "stage_title": "Amfani a Rayuwa",
                "stage_objective": f"Ka yi amfani da {selected_skill} a muhimman yanayi na gaskiya.",
                "learner_actions": "Ka yi amfani da dabara daya a tattaunawa, aiki, ko wani yanayi mai muhimmanci kowane mako.",
                "practical_exercise": "Ka rubuta misali daya a mako sannan ka tantance abin da ya inganta.",
                "habit_action": "Ka nemi gajeren feedback daga mutum daya da ka yarda da shi.",
                "course_hint": selected_skill,
                "ai_support_note": "Tambayi FAB ya duba misalinka ya bada shawarar mataki na gaba.",
            },
            {
                "stage_title": "Dorewa da Ci Gaba",
                "stage_objective": f"Ka gina dabi'u masu dorewa domin samun cigaba a {selected_skill}.",
                "learner_actions": "Ka sa burin mako daya, ka duba cigaba, sannan ka gyara tsarin idan ya dace.",
                "practical_exercise": "Ka maimaita wani yanayi mai muhimmanci ka kwatanta sakamakonka.",
                "habit_action": "Ka yi bitar mako: nasara, matsala, da abin da za ka fi maida hankali a kai.",
                "course_hint": selected_skill,
                "ai_support_note": "Tambayi FAB ya baka shawarwarin mataki na gaba bisa cigabanka.",
            },
        ]
        return {
            "title": f"Taswirar Kwarewa a {selected_skill.title()}",
            "summary": summary,
            "stages": stages,
        }

    summary = (
        f"This roadmap focuses on improving {selected_skill} through structured practice, reflection, and real-world application."
    )
    if first_response or latest_response:
        summary = (
            f"This roadmap targets your {selected_skill} growth based on the interview themes you shared, "
            "with extra attention on practical application, confidence building, and repeatable habits."
        )

    stages = [
        {
            "stage_title": "Baseline and Awareness",
            "stage_objective": f"Understand your current {selected_skill} strengths, weak spots, and triggers.",
            "learner_actions": (
                f"Review recent situations where {selected_skill} went well or poorly, and write down 3 recurring patterns."
            ),
            "practical_exercise": f"Complete one reflection after a real {selected_skill} moment this week.",
            "habit_action": "Spend 10 minutes at the end of each day reviewing one interaction or decision.",
            "course_hint": selected_skill,
            "ai_support_note": "Ask FAB to turn your reflections into a weekly improvement checklist.",
        },
        {
            "stage_title": "Guided Skill Practice",
            "stage_objective": f"Practice {selected_skill} deliberately in lower-risk situations.",
            "learner_actions": (
                f"Choose 2 small weekly situations where you can intentionally apply better {selected_skill} behaviors."
            ),
            "practical_exercise": f"Run two short practice drills or role-plays focused on {selected_skill}.",
            "habit_action": "Track what you planned, what you did, and what changed.",
            "course_hint": selected_skill,
            "ai_support_note": "Ask FAB for scenario drills tailored to your current difficulty level.",
        },
        {
            "stage_title": "Real-World Application",
            "stage_objective": f"Use {selected_skill} more effectively in meaningful real-life situations.",
            "learner_actions": (
                "Apply one concrete technique in a live conversation, meeting, project, or deadline-driven task each week."
            ),
            "practical_exercise": "Capture one real example per week and evaluate what improved.",
            "habit_action": "Ask for brief feedback from one trusted person after an important situation.",
            "course_hint": selected_skill,
            "ai_support_note": "Ask FAB to review your example and suggest one sharper next move.",
        },
        {
            "stage_title": "Consistency and Growth",
            "stage_objective": f"Build reliable long-term {selected_skill} habits and measurable progress.",
            "learner_actions": "Set one weekly target, review progress, and adjust your plan based on results.",
            "practical_exercise": "Repeat a high-value scenario and compare your performance over time.",
            "habit_action": "Run a weekly retrospective on wins, blockers, and the next focus area.",
            "course_hint": selected_skill,
            "ai_support_note": "Ask FAB for a weekly progress review and next-step recommendations.",
        },
    ]

    return {
        "title": f"{selected_skill.title()} Mastery Roadmap",
        "summary": summary,
        "stages": stages,
    }


def _is_ai_service_error(text):
    clean = str(text or "").strip().lower()
    return any(marker.lower() in clean for marker in AI_SERVICE_ERROR_MARKERS)


def _build_ai_service_unavailable_payload(detail_message, base_message, **extra):
    payload = {"detail": base_message, **extra}
    return payload


def _build_fab_primary_prompt(prompt, selected_skill, page, compact_context, response_language):
    page = (page or "general").strip().lower()
    compact_context = compact_context or {}

    if page == "dashboard":
        page_instruction_en = (
            "The user is on the dashboard. Use the context to explain visible progress, roadmap state, "
            "XP, completed modules, widgets, recommendations, and the most useful next step."
        )
        page_instruction_ha = (
            "Mai amfani yana dashboard. Ka yi amfani da context wajen bayyana progress, matsayin roadmap, "
            "XP, modules da aka kammala, widgets, recommendations, da mataki mafi amfani na gaba."
        )

    elif page == "lesson":
        lesson_mode = str(compact_context.get("lesson_mode", "content")).strip().lower()

        if lesson_mode == "quiz":
            page_instruction_en = (
                "The user is on the lesson page and currently viewing the quiz popup. "
                "Focus on the current lesson, the quiz context, question understanding, and concept clarification. "
                "Give hints only. Never reveal direct answers."
            )
            page_instruction_ha = (
                "Mai amfani yana shafin lesson kuma yanzu yana kallon popup na quiz. "
                "Ka fi mayar da hankali kan lesson na yanzu, context na quiz, fahimtar tambaya, da bayanin concept. "
                "Ka bada hint kawai. Kada ka bada amsa kai tsaye."
            )
        elif lesson_mode == "exam":
            page_instruction_en = (
                "The user is on the lesson page and currently viewing the exam popup. "
                "Focus on exam context, concept clarification, confidence support, and revision guidance. "
                "Do not reveal direct answers."
            )
            page_instruction_ha = (
                "Mai amfani yana shafin lesson kuma yanzu yana kallon popup na exam. "
                "Ka fi mayar da hankali kan context na exam, bayanin concept, taimakon kwarin gwiwa, da revision guidance. "
                "Kada ka bada amsa kai tsaye."
            )
        else:
            page_instruction_en = (
                "The user is on a lesson page. Focus on the current course, module, lesson content, learning objective, "
                "and how this lesson connects to the selected skill."
            )
            page_instruction_ha = (
                "Mai amfani yana shafin lesson. Ka fi mayar da hankali kan course na yanzu, module, abun cikin lesson, "
                "manufar koyon, da yadda lesson din ke hade da skill din da aka zaba."
            )

    elif page == "roadmap":
        page_instruction_en = (
            "The user is on the roadmap page. Focus on the current stage, stage objective, learner actions, "
            "practical exercise, habit action, and what they should do next."
        )
        page_instruction_ha = (
            "Mai amfani yana shafin roadmap. Ka fi mayar da hankali kan stage na yanzu, manufar stage, learner actions, "
            "practical exercise, habit action, da abin da ya kamata ya yi na gaba."
        )

    elif page == "roleplay":
        page_instruction_en = (
            "The user is on the role-play page. Focus on the scenario, selected skill, current stage, "
            "and how the user can practice effectively in this simulation."
        )
        page_instruction_ha = (
            "Mai amfani yana shafin role-play. Ka fi mayar da hankali kan scenario, selected skill, current stage, "
            "da yadda zai yi atisaye yadda ya dace a wannan simulation."
        )

    else:
        page_instruction_en = (
            "Use the page context as the visible interface state and answer based on what the user is currently seeing."
        )
        page_instruction_ha = (
            "Yi amfani da page context a matsayin abin da ke bayyane a interface, kuma ka amsa bisa abin da mai amfani yake gani yanzu."
        )

    if response_language == "ha":
        return (
            "Kai ne BrightSkill AI assistant.\n"
            "Ka amsa kai tsaye ga sakon mai amfani cikin Hausa mai sauki.\n"
            "Ka yi amfani da page context a matsayin abin da ke bayyane a interface yanzu.\n"
            "Idan mai amfani ya tambayi abin da yake gani a page, ka yi bayani bisa context da aka ba ka.\n"
            "Kada ka yi amsa mai janar idan context ya nuna cikakken abin da ke shafin.\n"
            "Kada ka yi amfani da salon amsa mai maimaituwa.\n"
            "Ka zama mai amfani, takamaimai, kuma mai fahimtar page.\n"
            f"Umarnin page: {page_instruction_ha}\n\n"
            f"Page: {page}\n"
            f"Selected skill: {selected_skill}\n"
            f"Visible interface context: {json.dumps(compact_context, ensure_ascii=False)}\n"
            f"User message: {prompt}"
        )

    return (
        "You are the BrightSkill AI assistant.\n"
        "Reply directly to the user's actual message in natural English.\n"
        "Treat the page context as the visible interface state.\n"
        "If the user asks about what is on the page, explain it using the provided context.\n"
        "If context contains progress, roadmap, lesson, quiz, exam, metrics, modules, widgets, or actions, use them directly.\n"
        "Do not give generic answers when page context clearly contains relevant interface information.\n"
        "Do not use repetitive coaching templates or filler.\n"
        "Be specific, page-aware, and useful.\n"
        f"Page instruction: {page_instruction_en}\n\n"
        f"Page: {page}\n"
        f"Selected skill: {selected_skill}\n"
        f"Visible interface context: {json.dumps(compact_context, ensure_ascii=False)}\n"
        f"User message: {prompt}"
    )


def _compact_prompt_value(value, max_length=300):
    if value in (None, "", [], {}, ()):
        return ""
    if isinstance(value, (list, tuple, set)):
        items = []
        for item in list(value)[:4]:
            item_text = _compact_prompt_value(item, max_length=120)
            if item_text:
                items.append(item_text)
        return ", ".join(items)[:max_length].rstrip(" ,")
    if isinstance(value, dict):
        pairs = []
        for key, item in list(value.items())[:4]:
            item_text = _compact_prompt_value(item, max_length=120)
            if item_text:
                pairs.append(f"{key}: {item_text}")
        return "; ".join(pairs)[:max_length].rstrip(" ;")
    clean = re.sub(r"\s+", " ", str(value)).strip()
    return clean[:max_length].rstrip(" .,;:")


def _build_fab_page_context(page, selected_skill, enriched_context):
    compact_context = {}
    for key, value in (enriched_context or {}).items():
        compact_value = _compact_prompt_value(value)
        if compact_value:
            compact_context[key] = compact_value
    compact_context["selected_skill"] = selected_skill
    compact_context["page"] = page
    return compact_context


def _build_fab_retry_prompt(prompt, selected_skill, page, compact_context, response_language):
    if response_language == "ha":
        return (
            "Kai ne BrightSkill AI assistant.\n"
            "Ka yi amfani da page context a matsayin abin da ke bayyane a interface.\n"
            "Ka amsa sakon mai amfani kai tsaye da Hausa mai sauki.\n"
            "Ka fi mayar da hankali kan abin da ke shafin yanzu.\n"
            "Kada ka yi amfani da amsa mai janar ko mai maimaituwa.\n\n"
            f"Page: {page}\n"
            f"Selected skill: {selected_skill}\n"
            f"Visible interface context: {json.dumps(compact_context, ensure_ascii=False)}\n"
            f"User message: {prompt}"
        )

    return (
        "You are the BrightSkill AI assistant.\n"
        "Use the page context as the visible interface state.\n"
        "Reply directly in clear English.\n"
        "Focus on what is actually on the page right now.\n"
        "Do not use generic or repetitive coaching language.\n\n"
        f"Page: {page}\n"
        f"Selected skill: {selected_skill}\n"
        f"Visible interface context: {json.dumps(compact_context, ensure_ascii=False)}\n"
        f"User message: {prompt}"
    )


def _infer_covered_diagnostic_areas(transcript):
    covered = set()
    combined_text = " ".join(
        f"{row.get('question_text', '')} {row.get('response_text', '')}"
        for row in transcript
    ).lower()

    keyword_map = {
        "current level": ["level", "beginner", "intermediate", "advanced", "current ability", "experience"],
        "main challenges": ["challenge", "difficult", "struggle", "hard", "problem", "issue"],
        "goals": ["goal", "want", "improve", "achieve", "target"],
        "confidence": ["confident", "confidence", "nervous", "hesitant", "comfortable"],
        "habits": ["habit", "routine", "practice", "prepare", "consistently"],
        "real-life situations": ["situation", "example", "meeting", "work", "school", "project", "team", "conversation"],
    }

    for area, keywords in keyword_map.items():
        if any(keyword in combined_text for keyword in keywords):
            covered.add(area)
    return covered


def _build_fallback_interview_question(selected_skill, transcript):
    asked_normalized = {_normalize_question_text(row["question_text"]) for row in transcript}
    covered = _infer_covered_diagnostic_areas(transcript)
    ordered_areas = [area for area in INTERVIEW_DIAGNOSTIC_AREAS if area not in covered] or INTERVIEW_DIAGNOSTIC_AREAS

    for area in ordered_areas:
        template = INTERVIEW_FALLBACK_PROMPTS[area]
        question_text = template.format(skill=selected_skill).strip()
        if _normalize_question_text(question_text) not in asked_normalized:
            return question_text

    response_count = len(transcript) + 1
    return f"What is one specific {selected_skill} situation you want to handle better next?"


def _build_interview_generation_prompt(selected_skill, transcript, interview_language, attempt_number):
    asked_questions = [row["question_text"] for row in transcript]
    asked_keys = [row.get("question_key", "") for row in transcript if row.get("question_key")]
    language_name = _interview_language_name(interview_language)
    attempt_instruction = ""
    if attempt_number > 1:
        attempt_instruction = (
            f"\nPrevious attempt {attempt_number - 1} was rejected because it was empty, invalid, repetitive, or too broad. "
            "Produce a different and more specific result."
        )

    return (
        "You are a precise diagnostic interviewer for BrightSkill, a soft-skills learning platform.\n"
        "The structured base interview is already complete. Your job is to ask one controlled follow-up question only when it adds diagnostic value.\n"
        "Return JSON only with this schema:\n"
        '{'
        '"is_complete": false,'
        '"question_key": "ai_specific_short_key",'
        '"question_text": "...",'
        '"completion_reason": ""'
        "}\n"
        "Rules:\n"
        "- Stay strictly focused on the selected skill.\n"
        "- Ask exactly ONE question when is_complete is false.\n"
        "- The question must be practical, diagnostic, concise, and specific to the learner's previous answers.\n"
        "- Do not ask multi-part or compound questions.\n"
        "- Do not repeat or paraphrase any earlier question.\n"
        "- Do not reuse any earlier question_key.\n"
        "- Probe only missing information about current level, goals, challenges, confidence, habits, real situations, blockers, or preferred practice style.\n"
        "- Stay within soft skills and the selected skill only.\n"
        f"- Write the entire question in {language_name} only. Do not mix Hausa and English.\n"
        "- If enough information exists, set is_complete to true.\n"
        "- When is_complete is true, leave question_text as an empty string and explain why in completion_reason.\n"
        "- Do not mention JSON, schemas, or internal reasoning.\n"
        f"{attempt_instruction}\n\n"
        f"Selected skill: {selected_skill}\n"
        f"Interview language: {language_name}\n"
        f"Diagnostic areas to cover: {INTERVIEW_DIAGNOSTIC_AREAS}\n"
        f"Question keys already used: {json.dumps(asked_keys, ensure_ascii=False)}\n"
        f"Questions already asked: {json.dumps(asked_questions, ensure_ascii=False)}\n"
        f"Transcript so far: {json.dumps(transcript, ensure_ascii=False)}"
    )


def _generate_next_interview_question(selected_skill, transcript, interview_language="en"):
    response_count = len(transcript)
    if response_count >= MAX_INTERVIEW_RESPONSES:
        return {"is_complete": True, "completion_reason": "Maximum interview length reached."}

    asked_normalized = {_normalize_question_text(row["question_text"]) for row in transcript}
    asked_keys = {str(row.get("question_key", "")).strip() for row in transcript if row.get("question_key")}
    language = _normalize_interview_language(interview_language)

    for attempt in range(1, INTERVIEW_AI_MAX_RETRIES + 1):
        prompt = _build_interview_generation_prompt(selected_skill, transcript, language, attempt)
        raw = ask_gemini(
            prompt,
            max_output_tokens=200,
            temperature=0.15,
            response_language=language,
        )
        payload = _extract_json_payload(raw)
        if not payload:
            plain_question = _extract_question_from_raw_text(raw)
            normalized_plain_question = _normalize_question_text(plain_question)
            if (
                plain_question
                and normalized_plain_question
                and normalized_plain_question not in asked_normalized
                and plain_question.count("?") <= 1
            ):
                question_key = _slug_question_key(plain_question)
                if question_key not in asked_keys:
                    return {"is_complete": False, "question_key": question_key, "question_text": plain_question}
            continue

        is_complete = bool(payload.get("is_complete", False))
        if response_count < MIN_INTERVIEW_RESPONSES:
            is_complete = False
        if is_complete:
            return {
                "is_complete": True,
                "completion_reason": str(payload.get("completion_reason", "")).strip()
                or "Sufficient information collected for a personalized learning path.",
            }

        question_key = str(payload.get("question_key", "")).strip() or _slug_question_key(payload.get("question_text", ""))
        question_key = _slug_question_key(question_key, prefix="ai") if not question_key.startswith("ai_") else question_key[:100]
        question_text = str(payload.get("question_text", "")).strip()
        normalized_question = _normalize_question_text(question_text)
        if not question_text or not normalized_question:
            continue
        if normalized_question in asked_normalized:
            continue
        if question_key in asked_keys:
            continue
        if question_text.count("?") > 1:
            continue

        return {"is_complete": False, "question_key": question_key, "question_text": question_text}

    if response_count >= MIN_INTERVIEW_RESPONSES:
        return {"is_complete": True, "completion_reason": "Sufficient information collected for a personalized learning path."}
    fallback_question = _build_fallback_interview_question(selected_skill, transcript)
    return {"is_complete": False, "question_key": _slug_question_key(fallback_question), "question_text": fallback_question}


def _request_dynamic_interview_turn(selected_skill, transcript, response_language="en"):
    return _generate_next_interview_question(selected_skill, transcript, response_language)


def _generate_roadmap_payload(selected_skill, transcript, response_language="en"):
    language = _normalize_interview_language(response_language)
    language_name = _interview_language_name(language)
    prompt = (
        "You are an expert soft-skills coach for BrightSkill.\n"
        "Build a practical, personalized, multi-stage learning roadmap for exactly one selected soft skill.\n"
        "Return JSON only with this exact schema:\n"
        "{"
        '"title":"...",'
        '"summary":"...",'
        '"stages":[{'
        '"stage_title":"...",'
        '"stage_objective":"...",'
        '"learner_actions":"...",'
        '"practical_exercise":"...",'
        '"habit_action":"...",'
        '"course_hint":"...",'
        '"ai_support_note":"..."'
        "}]"
        "}\n"
        "Rules:\n"
        "- Provide 4 to 6 stages.\n"
        "- Keep every stage tied to the selected skill only.\n"
        "- Use the interview transcript to personalize the roadmap around the learner's level, goals, blockers, confidence, habits, and real-life situations.\n"
        "- Make actions concrete and executable.\n"
        f"- Write every user-facing value in {language_name} only. Do not mix Hausa and English.\n"
        "- Keep JSON keys exactly in English as specified, but translate the values according to the interview language.\n\n"
        f"Selected skill: {selected_skill}\n"
        f"Interview language: {language_name}\n"
        f"Interview transcript: {json.dumps(transcript, ensure_ascii=False)}\n"
    )
    raw = ask_gemini(prompt, max_output_tokens=2000, temperature=0.25, response_language=language)
    if any(marker.lower() in str(raw).lower() for marker in AI_SERVICE_ERROR_MARKERS):
        return _build_personalized_roadmap_fallback(selected_skill, transcript, response_language=language)
    payload = _extract_json_payload(raw)

    title = str(payload.get("title", "")).strip() or f"{selected_skill.title()} Mastery Roadmap"
    summary = str(payload.get("summary", "")).strip() or f"Structured roadmap to build mastery in {selected_skill}."
    stages = payload.get("stages", [])

    if not isinstance(stages, list) or len(stages) < 3:
        if language == "ha":
            return _build_personalized_roadmap_fallback(selected_skill, transcript, response_language=language)
        stages = [
            {
                "stage_title": "Foundation",
                "stage_objective": f"Build core {selected_skill} principles.",
                "learner_actions": "Study key concepts and self-assess current gaps.",
                "practical_exercise": "Run one weekly scenario practice.",
                "habit_action": "10-minute reflection after each working day.",
                "course_hint": selected_skill,
                "ai_support_note": "Ask FAB to break this stage into daily tasks.",
            },
            {
                "stage_title": "Guided Practice",
                "stage_objective": f"Apply {selected_skill} in real interactions.",
                "learner_actions": "Use structured practice drills with measurable targets.",
                "practical_exercise": "Complete two role-play exercises weekly.",
                "habit_action": "Track wins and mistakes in a short log.",
                "course_hint": selected_skill,
                "ai_support_note": "Ask FAB for feedback on your practice transcript.",
            },
            {
                "stage_title": "Mastery",
                "stage_objective": f"Demonstrate consistent {selected_skill} performance.",
                "learner_actions": "Lead a real scenario and collect feedback.",
                "practical_exercise": "Simulate high-pressure cases with AI role-play.",
                "habit_action": "Weekly retrospective and next-week planning.",
                "course_hint": selected_skill,
                "ai_support_note": "Ask FAB for personalized next-step recommendations.",
            },
        ]

    return {"title": title, "summary": summary, "stages": stages}


def _serialize_roadmap_with_progress(user, roadmap):
    data = LearningRoadmapSerializer(roadmap).data
    completed_modules = list(
        ModuleCompletion.objects.filter(user=user).values_list("module_id", flat=True)
    )
    data["completed_modules"] = completed_modules
    return data


class FABAssistView(generics.GenericAPIView):
    permission_classes = [permissions.IsAuthenticated]
    serializer_class = FABRequestSerializer

    def post(self, request):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        prompt = serializer.validated_data["prompt"]
        language = resolve_language(request.user, prompt)
        page = serializer.validated_data.get("page", "general")
        page_context = serializer.validated_data.get("page_context", {})
        conversation_id = serializer.validated_data.get("conversation_id")

        profile = UserSkillProfile.objects.filter(user=request.user).first()
        selected_skill = (profile.selected_skill if profile else "").strip() or serializer.validated_data.get("skill") or "soft skills"

        roadmap = LearningRoadmap.objects.filter(user=request.user).prefetch_related("stages").first()
        current_stage = None
        if roadmap and profile:
            current_stage = roadmap.stages.filter(order_index=profile.current_stage_index).first()

        enriched_context = {
            **(page_context or {}),
            "lesson_mode": (page_context or {}).get("lesson_mode", ""),
            "selected_skill": selected_skill,
            "current_stage": current_stage.stage_title if current_stage else "",
            "current_stage_objective": current_stage.stage_objective if current_stage else "",
            "current_stage_actions": current_stage.learner_actions if current_stage else "",
            "current_stage_practical_exercise": current_stage.practical_exercise if current_stage else "",
            "roadmap_title": roadmap.title if roadmap else "",
            "total_roadmap_stages": roadmap.stages.count() if roadmap else 0,
            "roadmap_tasks": [
                stage.habit_action for stage in (roadmap.stages.all() if roadmap else []) if stage.habit_action
            ][:6],
            "completed_modules_count": ModuleCompletion.objects.filter(user=request.user).count(),
        }
        compact_context = _build_fab_page_context(page, selected_skill, enriched_context)

        conversation = None
        if conversation_id:
            conversation = Conversation.objects.filter(id=conversation_id, user=request.user).first()
        if not conversation:
            conversation = Conversation.objects.create(user=request.user, skill=selected_skill)

        Message.objects.create(conversation=conversation, sender=Message.Sender.USER, content=prompt)
        try:
            context_enum = AIContext(page)
        except ValueError:
            context_enum = AIContext.GENERAL
        
        reply = ask_gemini_with_context(
            query=prompt,
            context=context_enum,
            page_data=compact_context,
            user_id=request.user.id,
            max_tokens=220,
            temperature=0.35,
            use_cache=True,
            response_language=language,
        )
        if _is_ai_service_error(reply):
            print(f"FABAssistView AI error: {reply}")
            return Response(
                _build_ai_service_unavailable_payload(
                    reply,
                    "The BrightSkill AI assistant is unavailable right now. Please try again shortly.",
                    conversation_id=conversation.id,
                ),
                status=status.HTTP_503_SERVICE_UNAVAILABLE,
            )
        Message.objects.create(conversation=conversation, sender=Message.Sender.AI, content=reply)

        payload = {"reply": reply, "conversation_id": conversation.id}
        return Response(payload, status=status.HTTP_200_OK)


class OnboardingSelectSkillView(generics.GenericAPIView):
    permission_classes = [permissions.IsAuthenticated]
    serializer_class = InterviewStartSerializer

    def post(self, request):
        try:
            serializer = self.get_serializer(data=request.data)
            serializer.is_valid(raise_exception=True)

            selected_skill = serializer.validated_data["selected_skill"]
            interview_language = resolve_language(request.user)
            UserSkillProfile.objects.update_or_create(
                user=request.user,
                defaults={"selected_skill": selected_skill, "current_stage_index": 1},
            )
            assessment = InterviewAssessment.objects.create(
                user=request.user,
                selected_skill=selected_skill,
                interview_language=interview_language,
                is_completed=False,
            )
            first_question = _next_structured_question(assessment)
            if not first_question:
                raise InterviewGenerationError("No structured interview questions are available for this skill.")
        except InterviewGenerationError as exc:
            if 'assessment' in locals():
                assessment.delete()
            return Response({"detail": str(exc)}, status=status.HTTP_503_SERVICE_UNAVAILABLE)
        except APIException:
            if 'assessment' in locals():
                assessment.delete()
            raise
        except Exception:
            if 'assessment' in locals():
                assessment.delete()
            return Response(
                {"detail": "Unable to start the interview right now."},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR,
            )

        return Response(
            {
                "assessment_id": assessment.id,
                "selected_skill": selected_skill,
                "interview_language": assessment.interview_language,
                "question": first_question["question_text"],
                "question_key": first_question["question_key"],
                "question_type": first_question.get("type", "text"),
                "options": first_question.get("options", []),
                "question_object": _serialize_interview_question(first_question),
                "is_complete": False,
                "skills": SELECTABLE_SOFT_SKILLS,
            },
            status=status.HTTP_201_CREATED,
        )


class OnboardingInterviewView(generics.GenericAPIView):
    permission_classes = [permissions.IsAuthenticated]
    serializer_class = InterviewAnswerSerializer

    @transaction.atomic
    def post(self, request):
        try:
            serializer = self.get_serializer(data=request.data)
            serializer.is_valid(raise_exception=True)

            assessment = InterviewAssessment.objects.filter(
                id=serializer.validated_data["assessment_id"],
                user=request.user,
            ).first()
            if not assessment:
                return Response({"detail": "Assessment not found."}, status=status.HTTP_404_NOT_FOUND)
            if assessment.is_completed:
                return Response({"detail": "Assessment already completed."}, status=status.HTTP_400_BAD_REQUEST)

            question_text = serializer.validated_data["question_text"].strip()
            question_key = serializer.validated_data.get("question_key", "").strip()
            response_text = serializer.validated_data["response_text"].strip()
            selected_skill = (
                assessment.selected_skill
                or UserSkillProfile.objects.filter(user=request.user).values_list("selected_skill", flat=True).first()
                or "communication"
            ).strip().lower()
            interview_language = _normalize_interview_language(assessment.interview_language)
            if not question_key:
                question_key = _question_key_from_text(selected_skill, interview_language, question_text)
            normalized_question = _normalize_question_text(question_text)
            if not normalized_question:
                return Response({"detail": "Question text is invalid."}, status=status.HTTP_400_BAD_REQUEST)

            existing_questions = {
                _normalize_question_text(item.question_text): item.sequence_order
                for item in assessment.responses.order_by("sequence_order", "id")
            }
            if normalized_question in existing_questions:
                return Response({"detail": "This interview question has already been answered."}, status=status.HTTP_400_BAD_REQUEST)
            if question_key and assessment.responses.filter(question_key=question_key).exists():
                return Response({"detail": "This interview question has already been answered."}, status=status.HTTP_400_BAD_REQUEST)

            next_sequence = (
                assessment.responses.aggregate(max_sequence=Max("sequence_order")).get("max_sequence") or 0
            ) + 1
            InterviewResponse.objects.create(
                assessment=assessment,
                sequence_order=next_sequence,
                question_key=question_key,
                question_text=question_text,
                response_text=response_text,
            )

            transcript = _build_interview_transcript(assessment)
            next_structured_question = _next_structured_question(assessment)
            if next_structured_question:
                next_turn = {
                    "is_complete": False,
                    "phase": "structured",
                    **_serialize_interview_question(next_structured_question),
                }
            elif _ai_question_count(assessment) >= MAX_AI_INTERVIEW_QUESTIONS:
                assessment.is_completed = True
                assessment.save(update_fields=["is_completed"])
                next_turn = {
                    "is_complete": True,
                    "completion_reason": "Maximum AI follow-up questions completed.",
                }
            else:
                next_turn = _generate_next_interview_question(
                    selected_skill=selected_skill,
                    transcript=transcript,
                    interview_language=interview_language,
                )
                if next_turn["is_complete"]:
                    assessment.is_completed = True
                    assessment.save(update_fields=["is_completed"])
                else:
                    next_turn = {
                        "phase": "ai",
                        "question": next_turn["question_text"],
                        "question_text": next_turn["question_text"],
                        "question_key": next_turn["question_key"],
                        "question_type": "text",
                        "options": [],
                        **next_turn,
                    }
        except InterviewGenerationError as exc:
            return Response({"detail": str(exc)}, status=status.HTTP_503_SERVICE_UNAVAILABLE)
        except APIException:
            raise
        except Exception:
            return Response(
                {"detail": "Unable to process this interview answer right now."},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR,
            )

        payload = {
            "assessment_id": assessment.id,
            "is_complete": next_turn["is_complete"],
        }
        if next_turn["is_complete"]:
            payload["completion_reason"] = next_turn.get("completion_reason", "")
        else:
            payload["next_question"] = next_turn["question_text"]
            payload["next_question_key"] = next_turn.get("question_key", "")
            payload["next_question_type"] = next_turn.get("question_type", "text")
            payload["options"] = next_turn.get("options", [])
            payload["phase"] = next_turn.get("phase", "")
            payload["question_object"] = {
                "question_key": next_turn.get("question_key", ""),
                "question": next_turn["question_text"],
                "question_text": next_turn["question_text"],
                "question_type": next_turn.get("question_type", "text"),
                "options": next_turn.get("options", []),
            }
        return Response(payload, status=status.HTTP_200_OK)


class OnboardingGenerateRoadmapView(generics.GenericAPIView):
    permission_classes = [permissions.IsAuthenticated]
    serializer_class = InterviewFinishSerializer

    @transaction.atomic
    def post(self, request):
        try:
            serializer = self.get_serializer(data=request.data)
            serializer.is_valid(raise_exception=True)

            assessment = (
                InterviewAssessment.objects.filter(id=serializer.validated_data["assessment_id"], user=request.user)
                .prefetch_related("responses")
                .first()
            )
            if not assessment:
                return Response({"detail": "Assessment not found."}, status=status.HTTP_404_NOT_FOUND)
            if assessment.is_completed and hasattr(assessment, "roadmap"):
                return Response(
                    {
                        "message": "Learning path already generated.",
                        "assessment": InterviewAssessmentSerializer(assessment).data,
                        "roadmap": _serialize_roadmap_with_progress(request.user, assessment.roadmap),
                    },
                    status=status.HTTP_200_OK,
                )
            if assessment.responses.count() < MIN_INTERVIEW_RESPONSES:
                return Response(
                    {"detail": f"At least {MIN_INTERVIEW_RESPONSES} interview answers are required."},
                    status=status.HTTP_400_BAD_REQUEST,
                )

            selected_skill = assessment.selected_skill or UserSkillProfile.objects.filter(user=request.user).values_list(
                "selected_skill", flat=True
            ).first()
            selected_skill = _normalize_selected_skill(selected_skill)

            transcript = _build_interview_transcript(assessment)
            payload = _generate_roadmap_payload(
                selected_skill=selected_skill,
                transcript=transcript,
                response_language=assessment.interview_language,
            )
        except APIException:
            raise
        except Exception:
            return Response(
                {"detail": "Unable to generate the learning path right now."},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR,
            )

        roadmap = LearningRoadmap.objects.create(
            user=request.user,
            assessment=assessment,
            selected_skill=selected_skill,
            title=payload["title"],
            summary=payload["summary"],
        )

        stage_titles = []
        for index, stage_payload in enumerate(payload["stages"], start=1):
            course = _match_course_for_stage(selected_skill, stage_payload)
            course_link = f"/lesson/{course.id}" if course else ""
            RoadmapStage.objects.create(
                roadmap=roadmap,
                order_index=index,
                stage_title=str(stage_payload.get("stage_title", f"Stage {index}")).strip(),
                stage_objective=str(stage_payload.get("stage_objective", "")).strip(),
                learner_actions=str(stage_payload.get("learner_actions", "")).strip(),
                practical_exercise=str(stage_payload.get("practical_exercise", "")).strip(),
                habit_action=str(stage_payload.get("habit_action", "")).strip(),
                course=course,
                course_link=course_link,
                ai_support_note=str(stage_payload.get("ai_support_note", "")).strip(),
            )
            stage_titles.append(str(stage_payload.get("stage_title", f"Stage {index}")).strip())

        assessment.is_completed = True
        assessment.save(update_fields=["is_completed"])

        UserSkillProfile.objects.update_or_create(
            user=request.user,
            defaults={"selected_skill": selected_skill, "current_stage_index": 1},
        )

        LearningPath.objects.update_or_create(
            user=request.user,
            assessment=assessment,
            defaults={
                "title": payload["title"],
                "summary": payload["summary"],
                "weekly_plan": "; ".join(stage_titles),
                "focus_areas": [selected_skill.title()],
            },
        )

        try:
            create_book_recommendation(
                user=request.user,
                topic=selected_skill,
                source_type="conversation",
                source_id=assessment.id,
                context_text=json.dumps(transcript, ensure_ascii=False),
                focus_areas=[selected_skill],
                response_language=assessment.interview_language,
            )
        except Exception:
            pass

        roadmap.refresh_from_db()
        return Response(
            {
                "message": "Roadmap generated successfully.",
                "assessment": InterviewAssessmentSerializer(assessment).data,
                "roadmap": _serialize_roadmap_with_progress(request.user, roadmap),
            },
            status=status.HTTP_201_CREATED,
        )


class LearningRoadmapView(generics.GenericAPIView):
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        roadmap = LearningRoadmap.objects.filter(user=request.user).prefetch_related("stages").first()
        if not roadmap:
            return Response({"detail": "No roadmap found."}, status=status.HTTP_404_NOT_FOUND)
        return Response(_serialize_roadmap_with_progress(request.user, roadmap), status=status.HTTP_200_OK)


class RolePlayStartView(generics.GenericAPIView):
    permission_classes = [permissions.IsAuthenticated]
    serializer_class = RolePlayStartSerializer

    def post(self, request):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        selected_skill = serializer.validated_data["selected_skill"]
        difficulty = serializer.validated_data.get("difficulty", "intermediate")
        compact_mode = serializer.validated_data.get("compact_mode", False)
        stage = None
        stage_id = serializer.validated_data.get("roadmap_stage_id")
        if stage_id:
            stage = RoadmapStage.objects.filter(id=stage_id, roadmap__user=request.user).first()

        scenario = serializer.validated_data.get("scenario", "").strip()
        if not scenario:
            scenario = f"Practice {selected_skill} in a realistic workplace situation."

        title = f"{selected_skill.title()} role-play ({difficulty})"
        session = RolePlaySession.objects.create(
            user=request.user,
            title=title[:140],
            selected_skill=selected_skill,
            difficulty=difficulty,
            roadmap_stage=stage,
        )

        opener_prompt = (
            "You are an AI role-play partner for soft skills practice.\n"
            f"Selected skill: {selected_skill}\n"
            f"Difficulty: {difficulty}\n"
            f"Scenario: {scenario}\n"
            + (
                "Open with one very short realistic setup and one concise question. "
                "Keep the full reply under 35 words."
                if compact_mode
                else "Open with a realistic scene and one concise question to the learner."
            )
        )
        language = resolve_language(request.user, scenario)
        # FIXED: compact_mode -> fewer tokens
        opener = ask_gemini(
            opener_prompt,
            max_output_tokens=150 if compact_mode else 250,
            temperature=0.35,
            response_language=language,
        )
        if _is_ai_service_error(opener):
            print(f"RolePlayStartView AI error: {opener}")
            return Response(
                _build_ai_service_unavailable_payload(
                    opener,
                    "The AI role-play service is unavailable right now.",
                ),
                status=status.HTTP_503_SERVICE_UNAVAILABLE,
            )
        RolePlayMessage.objects.create(session=session, role=RolePlayMessage.Role.AI, content=opener)

        return Response(
            {
                "session_id": session.id,
                "selected_skill": selected_skill,
                "difficulty": difficulty,
                "scenario": scenario,
                "reply": opener,
            },
            status=status.HTTP_201_CREATED,
        )


class RolePlayMessageView(generics.GenericAPIView):
    permission_classes = [permissions.IsAuthenticated]
    serializer_class = RolePlayMessageRequestSerializer

    def post(self, request):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        session = RolePlaySession.objects.filter(
            id=serializer.validated_data["session_id"], user=request.user
        ).prefetch_related("messages").first()
        if not session:
            return Response({"detail": "Role-play session not found."}, status=status.HTTP_404_NOT_FOUND)

        end_session = serializer.validated_data.get("end_session", False)
        message = serializer.validated_data.get("message", "").strip()
        compact_mode = serializer.validated_data.get("compact_mode", False)
        language = resolve_language(request.user, message)

        if message:
            RolePlayMessage.objects.create(session=session, role=RolePlayMessage.Role.USER, content=message)
            history_rows = list(session.messages.order_by("-timestamp")[:8])
            history_rows.reverse()
            history = "\n".join([f"{row.role}: {row.content}" for row in history_rows])

            prompt = (
                "You are an AI role-play partner.\n"
                f"Selected skill: {session.selected_skill}\n"
                f"Difficulty: {session.difficulty}\n"
                f"Conversation history:\n{history}\n\n"
                + (
                    "Stay fully in character and reply naturally as the other participant in the scenario. "
                    "Keep it under 45 words total. Ask at most one concise follow-up question. "
                    "No coaching, no feedback, no long explanations."
                    if compact_mode
                    else (
                        "Stay fully in character and respond like the other participant in the scenario. "
                        "Do not give coaching, tips, or feedback unless the user explicitly asks for it."
                    )
                )
            )
            # FIXED: compact_mode -> fewer tokens
            reply = ask_gemini(
                prompt,
                max_output_tokens=180 if compact_mode else 300,
                temperature=0.35,
                response_language=language,
            )
            if _is_ai_service_error(reply):
                print(f"RolePlayMessageView AI error: {reply}")
                return Response(
                    _build_ai_service_unavailable_payload(
                        reply,
                        "The AI role-play service is unavailable right now.",
                        session_id=session.id,
                    ),
                    status=status.HTTP_503_SERVICE_UNAVAILABLE,
                )
            RolePlayMessage.objects.create(session=session, role=RolePlayMessage.Role.AI, content=reply)
        else:
            reply = "Please send a message to continue role-play."

        feedback = ""
        if end_session:
            session.ended_at = timezone.now()
            session.save(update_fields=["ended_at"])
            feedback_prompt = (
                "Provide concise feedback for the learner after this role-play.\n"
                f"Skill: {session.selected_skill}\n"
                "Give: strengths, gaps, and 3 next actions."
            )
            feedback = ask_gemini(feedback_prompt, max_output_tokens=500, temperature=0.25, response_language=language)

        return Response(
            {
                "session_id": session.id,
                "reply": reply,
                "ended_at": session.ended_at,
                "feedback": feedback,
            },
            status=status.HTTP_200_OK,
        )


class RolePlayHistoryView(generics.ListAPIView):
    permission_classes = [permissions.IsAuthenticated]
    serializer_class = RolePlaySessionSerializer

    def get_queryset(self):
        queryset = RolePlaySession.objects.filter(user=self.request.user).prefetch_related("messages")
        query = (self.request.query_params.get("q") or "").strip()
        if query:
            queryset = queryset.filter(
                Q(title__icontains=query)
                | Q(selected_skill__icontains=query)
                | Q(messages__content__icontains=query)
            ).distinct()
        return queryset


class RolePlaySessionManageView(generics.GenericAPIView):
    permission_classes = [permissions.IsAuthenticated]
    serializer_class = RolePlaySessionUpdateSerializer

    def patch(self, request, session_id):
        session = RolePlaySession.objects.filter(id=session_id, user=request.user).first()
        if not session:
            return Response({"detail": "Session not found."}, status=status.HTTP_404_NOT_FOUND)
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        session.title = serializer.validated_data["title"].strip()
        session.save(update_fields=["title"])
        return Response({"id": session.id, "title": session.title}, status=status.HTTP_200_OK)

    def delete(self, request, session_id):
        session = RolePlaySession.objects.filter(id=session_id, user=request.user).first()
        if not session:
            return Response({"detail": "Session not found."}, status=status.HTTP_404_NOT_FOUND)
        session.delete()
        return Response(status=status.HTTP_204_NO_CONTENT)


class RolePlayView(generics.GenericAPIView):
    permission_classes = [permissions.IsAuthenticated]
    serializer_class = RolePlayRequestSerializer

    def post(self, request):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        session_id = serializer.validated_data.get("session_id")
        prompt = serializer.validated_data.get("prompt", "")
        end_session = serializer.validated_data.get("end_session", False)
        scenario = serializer.validated_data.get("scenario", "")
        context = serializer.validated_data.get("context", {}) or {}

        session = None
        if session_id:
            session = RolePlaySession.objects.filter(id=session_id, user=request.user).first()
        if not session:
            skill = context.get("selected_skill") or "communication"
            difficulty = context.get("difficulty") or "intermediate"
            start_payload = {
                "selected_skill": skill if skill in SELECTABLE_SOFT_SKILLS else "communication",
                "difficulty": difficulty if difficulty in {"beginner", "intermediate", "advanced"} else "intermediate",
                "scenario": scenario or "",
            }
            start_serializer = RolePlayStartSerializer(data=start_payload)
            start_serializer.is_valid(raise_exception=True)
            session = RolePlaySession.objects.create(
                user=request.user,
                title=f"{start_payload['selected_skill'].title()} role-play ({start_payload['difficulty']})"[:140],
                selected_skill=start_payload["selected_skill"],
                difficulty=start_payload["difficulty"],
            )
        language = resolve_language(request.user, prompt)
        if prompt:
            RolePlayMessage.objects.create(session=session, role=RolePlayMessage.Role.USER, content=prompt)
            history_rows = list(session.messages.order_by("-timestamp")[:8])
            history_rows.reverse()
            history = "\n".join([f"{row.role}: {row.content}" for row in history_rows])
            rp_prompt = (
                "You are an AI role-play partner.\n"
                f"Selected skill: {session.selected_skill}\n"
                f"Difficulty: {session.difficulty}\n"
                f"Conversation history:\n{history}\n\n"
                "Stay fully in character and respond like the other participant in the scenario. "
                "Do not give coaching, tips, or feedback unless the user explicitly asks for it."
            )
            reply = ask_gemini(rp_prompt, max_output_tokens=300, temperature=0.35, response_language=language)
            if _is_ai_service_error(reply):
                print(f"RolePlayView AI error: {reply}")
                return Response(
                    _build_ai_service_unavailable_payload(
                        reply,
                        "The AI role-play service is unavailable right now.",
                        session_id=session.id,
                    ),
                    status=status.HTTP_503_SERVICE_UNAVAILABLE,
                )
            RolePlayMessage.objects.create(session=session, role=RolePlayMessage.Role.AI, content=reply)
        else:
            reply = "Share your scenario and I will role-play it with you."

        feedback = ""
        if end_session:
            session.ended_at = timezone.now()
            session.save(update_fields=["ended_at"])
            feedback_prompt = (
                "Provide concise feedback for the learner after this role-play.\n"
                f"Skill: {session.selected_skill}\n"
                "Give: strengths, gaps, and 3 next actions."
            )
            feedback = ask_gemini(feedback_prompt, max_output_tokens=500, temperature=0.25, response_language=language)

        return Response(
            {"session_id": session.id, "reply": reply, "ended_at": session.ended_at, "feedback": feedback},
            status=status.HTTP_200_OK,
        )


class InterviewStartView(OnboardingSelectSkillView):
    serializer_class = InterviewStartSerializer


class InterviewAnswerView(OnboardingInterviewView):
    serializer_class = InterviewAnswerSerializer


class InterviewFinishView(OnboardingGenerateRoadmapView):
    serializer_class = InterviewFinishSerializer


class InterviewSubmitView(generics.GenericAPIView):
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request):
        return Response(
            {"detail": "Use /interview/start/, /interview/answer/, and /interview/finish/."},
            status=status.HTTP_400_BAD_REQUEST,
        )


class InterviewQuestionsView(generics.GenericAPIView):
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        return Response({"skills": SELECTABLE_SOFT_SKILLS}, status=status.HTTP_200_OK)


class LatestLearningPathView(generics.GenericAPIView):
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        roadmap = LearningRoadmap.objects.filter(user=request.user).prefetch_related("stages").first()
        if roadmap:
            return Response(_serialize_roadmap_with_progress(request.user, roadmap), status=status.HTTP_200_OK)

        path = LearningPath.objects.filter(user=request.user).order_by("-generated_at").first()
        if not path:
            return Response({"detail": "No learning path found."}, status=status.HTTP_404_NOT_FOUND)
        return Response(LearningPathSerializer(path).data, status=status.HTTP_200_OK)

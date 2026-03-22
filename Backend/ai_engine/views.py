import json

from django.db import transaction
from django.db.models import Q
from django.utils import timezone
from rest_framework import generics, permissions, status
from rest_framework.response import Response

from books.services import create_book_recommendation
from courses.models import Course
from progress.models import ModuleCompletion
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
from .services import ask_gemini, ask_gemini_with_context
from .utils import resolve_language

MIN_INTERVIEW_QUESTIONS = 5
MAX_INTERVIEW_QUESTIONS = 8


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


def _generate_first_question(selected_skill, response_language="en"):
    prompt = (
        "You are an adaptive onboarding interviewer for soft skills. "
        "Return JSON only with schema "
        '{"question_key":"...", "question_text":"..."}.\n'
        f"Selected skill: {selected_skill}.\n"
        "Generate the best first diagnostic question for this selected skill only."
    )
    raw = ask_gemini(prompt, max_output_tokens=280, temperature=0.25, response_language=response_language)
    payload = _extract_json_payload(raw)
    question_text = str(payload.get("question_text", "")).strip()
    question_key = str(payload.get("question_key", "")).strip().lower()

    if not question_text:
        question_text = f"What is your biggest challenge right now in {selected_skill} at work or school?"
    if not question_key:
        question_key = "primary_challenge"

    return {"question_key": question_key, "question_text": question_text}


def _generate_next_question(assessment, response_language="en"):
    responses = list(assessment.responses.order_by("id").values("question_key", "question_text", "response_text"))
    asked_keys = {row["question_key"] for row in responses}

    if len(responses) >= MAX_INTERVIEW_QUESTIONS:
        return {"is_complete": True}

    prompt = (
        "You are an adaptive onboarding interviewer for one selected soft skill.\n"
        "Generate the next best follow-up question and return JSON only:\n"
        '{"question_key":"...", "question_text":"...", "is_complete": false}\n'
        "Rules:\n"
        "- Focus strictly on the selected skill.\n"
        "- Do not repeat question keys.\n"
        "- Ask practical diagnostics for building a staged roadmap.\n"
        "- Set is_complete=true only when enough data is gathered.\n\n"
        f"Selected skill: {assessment.selected_skill}\n"
        f"Already asked keys: {sorted(list(asked_keys))}\n"
        f"Transcript: {responses}\n"
    )
    raw = ask_gemini(prompt, max_output_tokens=350, temperature=0.25, response_language=response_language)
    payload = _extract_json_payload(raw)

    is_complete = bool(payload.get("is_complete", False))
    if len(responses) < MIN_INTERVIEW_QUESTIONS:
        is_complete = False
    if is_complete:
        return {"is_complete": True}

    question_text = str(payload.get("question_text", "")).strip()
    question_key = str(payload.get("question_key", "")).strip().lower()
    if not question_text or not question_key or question_key in asked_keys:
        fallback_key = f"follow_up_{len(responses) + 1}"
        fallback_text = (
            f"What specific situation in {assessment.selected_skill} do you want to handle better in the next 2 weeks?"
        )
        return {"is_complete": False, "question_key": fallback_key, "question_text": fallback_text}

    return {"is_complete": False, "question_key": question_key, "question_text": question_text}


def _generate_roadmap_payload(selected_skill, responses_map, response_language="en"):
    prompt = (
        "You are an expert soft-skills coach. Build a practical multi-stage mastery roadmap.\n"
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
        "- Make actions concrete and executable.\n\n"
        f"Selected skill: {selected_skill}\n"
        f"Interview responses: {responses_map}\n"
    )
    raw = ask_gemini(prompt, max_output_tokens=2800, temperature=0.25, response_language=response_language)
    payload = _extract_json_payload(raw)

    title = str(payload.get("title", "")).strip() or f"{selected_skill.title()} Mastery Roadmap"
    summary = str(payload.get("summary", "")).strip() or f"Structured roadmap to build mastery in {selected_skill}."
    stages = payload.get("stages", [])

    if not isinstance(stages, list) or len(stages) < 3:
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
            "selected_skill": selected_skill,
            "current_stage": current_stage.stage_title if current_stage else "",
            "roadmap_tasks": [
                stage.habit_action for stage in (roadmap.stages.all() if roadmap else []) if stage.habit_action
            ][:6],
            "completed_modules_count": ModuleCompletion.objects.filter(user=request.user).count(),
        }

        try:
            ai_context = AIContext(page)
        except Exception:
            ai_context = AIContext.GENERAL

        conversation = None
        if conversation_id:
            conversation = Conversation.objects.filter(id=conversation_id, user=request.user).first()
        if not conversation:
            conversation = Conversation.objects.create(user=request.user, skill=selected_skill)

        Message.objects.create(conversation=conversation, sender=Message.Sender.USER, content=prompt)
        reply = ask_gemini_with_context(
            query=prompt,
            context=ai_context,
            page_data=enriched_context,
            user_id=request.user.id,
            max_tokens=900,
            temperature=0.3,
            use_cache=True,
            response_language=language,
        )
        Message.objects.create(conversation=conversation, sender=Message.Sender.AI, content=reply)

        payload = {"reply": reply, "conversation_id": conversation.id}
        return Response(payload, status=status.HTTP_200_OK)


class OnboardingSelectSkillView(generics.GenericAPIView):
    permission_classes = [permissions.IsAuthenticated]
    serializer_class = OnboardingSelectSkillSerializer

    def post(self, request):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        selected_skill = serializer.validated_data["selected_skill"]
        UserSkillProfile.objects.update_or_create(
            user=request.user,
            defaults={"selected_skill": selected_skill, "current_stage_index": 1},
        )
        assessment = InterviewAssessment.objects.create(user=request.user, selected_skill=selected_skill, is_completed=False)
        first_question = _generate_first_question(selected_skill, response_language=resolve_language(request.user, selected_skill))

        return Response(
            {
                "assessment_id": assessment.id,
                "selected_skill": selected_skill,
                "question": first_question,
                "is_complete": False,
                "skills": SELECTABLE_SOFT_SKILLS,
            },
            status=status.HTTP_201_CREATED,
        )


class OnboardingInterviewView(generics.GenericAPIView):
    permission_classes = [permissions.IsAuthenticated]
    serializer_class = OnboardingInterviewSerializer

    @transaction.atomic
    def post(self, request):
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

        question_key = serializer.validated_data["question_key"].strip().lower()
        if assessment.responses.filter(question_key=question_key).exists():
            return Response({"detail": "This question is already answered."}, status=status.HTTP_400_BAD_REQUEST)

        InterviewResponse.objects.create(
            assessment=assessment,
            question_key=question_key,
            question_text=serializer.validated_data["question_text"].strip(),
            response_text=serializer.validated_data["response_text"].strip(),
        )

        next_question = _generate_next_question(
            assessment=assessment,
            response_language=resolve_language(request.user, serializer.validated_data["response_text"]),
        )
        payload = {"assessment_id": assessment.id, "is_complete": next_question["is_complete"]}
        if not next_question["is_complete"]:
            payload["next_question"] = {
                "question_key": next_question["question_key"],
                "question_text": next_question["question_text"],
            }
        return Response(payload, status=status.HTTP_200_OK)


class OnboardingGenerateRoadmapView(generics.GenericAPIView):
    permission_classes = [permissions.IsAuthenticated]
    serializer_class = OnboardingGenerateRoadmapSerializer

    @transaction.atomic
    def post(self, request):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        assessment = (
            InterviewAssessment.objects.filter(id=serializer.validated_data["assessment_id"], user=request.user)
            .prefetch_related("responses")
            .first()
        )
        if not assessment:
            return Response({"detail": "Assessment not found."}, status=status.HTTP_404_NOT_FOUND)
        if assessment.responses.count() < MIN_INTERVIEW_QUESTIONS:
            return Response(
                {"detail": f"At least {MIN_INTERVIEW_QUESTIONS} answers are required."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        selected_skill = assessment.selected_skill or UserSkillProfile.objects.filter(user=request.user).values_list(
            "selected_skill", flat=True
        ).first()
        selected_skill = (selected_skill or "communication").strip().lower()

        responses_map = {item.question_key: item.response_text for item in assessment.responses.order_by("id")}
        payload = _generate_roadmap_payload(
            selected_skill=selected_skill,
            responses_map=responses_map,
            response_language=resolve_language(request.user, " ".join(responses_map.values())),
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
            "Open with a realistic scene and one concise question to the learner."
        )
        language = resolve_language(request.user, scenario)
        opener = ask_gemini(opener_prompt, max_output_tokens=450, temperature=0.35, response_language=language)
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
        language = resolve_language(request.user, message)

        if message:
            RolePlayMessage.objects.create(session=session, role=RolePlayMessage.Role.USER, content=message)
            history_rows = list(session.messages.order_by("-timestamp")[:8])
            history_rows.reverse()
            history = "\n".join([f"{row.role}: {row.content}" for row in history_rows])

            prompt = (
                "You are an AI role-play partner and soft-skills coach.\n"
                f"Selected skill: {session.selected_skill}\n"
                f"Difficulty: {session.difficulty}\n"
                f"Conversation history:\n{history}\n\n"
                "Respond in-role first, then give short actionable feedback."
            )
            reply = ask_gemini(prompt, max_output_tokens=700, temperature=0.35, response_language=language)
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
                "You are an AI role-play partner and soft-skills coach.\n"
                f"Selected skill: {session.selected_skill}\n"
                f"Difficulty: {session.difficulty}\n"
                f"Conversation history:\n{history}\n\n"
                "Respond in-role first, then provide short actionable feedback."
            )
            reply = ask_gemini(rp_prompt, max_output_tokens=700, temperature=0.35, response_language=language)
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
    def post(self, request):
        data = {"selected_skill": request.data.get("selected_skill") or "communication"}
        serializer = OnboardingSelectSkillSerializer(data=data)
        serializer.is_valid(raise_exception=True)

        selected_skill = serializer.validated_data["selected_skill"]
        UserSkillProfile.objects.update_or_create(
            user=request.user,
            defaults={"selected_skill": selected_skill, "current_stage_index": 1},
        )
        assessment = InterviewAssessment.objects.create(user=request.user, selected_skill=selected_skill, is_completed=False)
        first_question = _generate_first_question(selected_skill, response_language=resolve_language(request.user, selected_skill))
        return Response(
            {"assessment_id": assessment.id, "question": first_question, "is_complete": False},
            status=status.HTTP_201_CREATED,
        )


class InterviewAnswerView(OnboardingInterviewView):
    pass


class InterviewFinishView(OnboardingGenerateRoadmapView):
    pass


class InterviewSubmitView(generics.GenericAPIView):
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request):
        return Response(
            {"detail": "Use onboarding endpoints: /onboarding/select-skill/, /onboarding/interview/, /onboarding/generate-roadmap/."},
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

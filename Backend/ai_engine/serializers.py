from rest_framework import serializers

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


SELECTABLE_SOFT_SKILLS = [
    "communication",
    "leadership",
    "emotional intelligence",
    "critical thinking",
    "time management",
    "adaptability",
]


class FABRequestSerializer(serializers.Serializer):
    prompt = serializers.CharField()
    skill = serializers.CharField(required=False, allow_blank=True)
    conversation_id = serializers.IntegerField(required=False)
    page = serializers.CharField(required=False, default="general")
    page_context = serializers.JSONField(required=False, default=dict)


class MessageSerializer(serializers.ModelSerializer):
    class Meta:
        model = Message
        fields = ["id", "conversation", "sender", "content", "timestamp"]


class ConversationSerializer(serializers.ModelSerializer):
    messages = MessageSerializer(many=True, read_only=True)

    class Meta:
        model = Conversation
        fields = ["id", "user", "skill", "started_at", "messages"]


class RolePlayMessageSerializer(serializers.ModelSerializer):
    class Meta:
        model = RolePlayMessage
        fields = ["id", "session", "role", "content", "timestamp"]


class RolePlaySessionSerializer(serializers.ModelSerializer):
    messages = RolePlayMessageSerializer(many=True, read_only=True)

    class Meta:
        model = RolePlaySession
        fields = [
            "id",
            "user",
            "title",
            "selected_skill",
            "difficulty",
            "roadmap_stage",
            "started_at",
            "ended_at",
            "messages",
        ]


class RolePlaySessionUpdateSerializer(serializers.Serializer):
    title = serializers.CharField(max_length=140, allow_blank=False)


class LearningPathSerializer(serializers.ModelSerializer):
    class Meta:
        model = LearningPath
        fields = [
            "id",
            "user",
            "assessment",
            "title",
            "summary",
            "weekly_plan",
            "focus_areas",
            "generated_at",
        ]


class InterviewResponseSerializer(serializers.ModelSerializer):
    class Meta:
        model = InterviewResponse
        fields = ["question_key", "question_text", "response_text"]


class InterviewAssessmentSerializer(serializers.ModelSerializer):
    responses = InterviewResponseSerializer(many=True, read_only=True)

    class Meta:
        model = InterviewAssessment
        fields = ["id", "user", "selected_skill", "is_completed", "created_at", "responses"]


class RoadmapStageSerializer(serializers.ModelSerializer):
    course_title = serializers.CharField(source="course.title", read_only=True)

    class Meta:
        model = RoadmapStage
        fields = [
            "id",
            "order_index",
            "stage_title",
            "stage_objective",
            "learner_actions",
            "practical_exercise",
            "habit_action",
            "course",
            "course_title",
            "course_link",
            "ai_support_note",
            "is_completed",
        ]


class LearningRoadmapSerializer(serializers.ModelSerializer):
    stages = RoadmapStageSerializer(many=True, read_only=True)

    class Meta:
        model = LearningRoadmap
        fields = ["id", "user", "assessment", "selected_skill", "title", "summary", "generated_at", "stages"]


class UserSkillProfileSerializer(serializers.ModelSerializer):
    class Meta:
        model = UserSkillProfile
        fields = ["selected_skill", "current_stage_index", "updated_at"]


class OnboardingSelectSkillSerializer(serializers.Serializer):
    selected_skill = serializers.ChoiceField(choices=SELECTABLE_SOFT_SKILLS)


class OnboardingInterviewSerializer(serializers.Serializer):
    assessment_id = serializers.IntegerField()
    question_key = serializers.CharField(max_length=120)
    question_text = serializers.CharField()
    response_text = serializers.CharField(allow_blank=False)

    def validate_response_text(self, value):
        clean = str(value).strip()
        if not clean:
            raise serializers.ValidationError("Response cannot be empty.")
        return clean


class OnboardingGenerateRoadmapSerializer(serializers.Serializer):
    assessment_id = serializers.IntegerField()


class RolePlayStartSerializer(serializers.Serializer):
    selected_skill = serializers.ChoiceField(choices=SELECTABLE_SOFT_SKILLS)
    difficulty = serializers.ChoiceField(choices=["beginner", "intermediate", "advanced"], required=False, default="intermediate")
    roadmap_stage_id = serializers.IntegerField(required=False)
    scenario = serializers.CharField(required=False, allow_blank=True, default="")


class RolePlayMessageRequestSerializer(serializers.Serializer):
    session_id = serializers.IntegerField()
    message = serializers.CharField(required=False, allow_blank=True, default="")
    end_session = serializers.BooleanField(required=False, default=False)


class RolePlayRequestSerializer(serializers.Serializer):
    prompt = serializers.CharField(required=False, allow_blank=True, default="")
    session_id = serializers.IntegerField(required=False)
    end_session = serializers.BooleanField(required=False, default=False)
    scenario = serializers.CharField(required=False, allow_blank=True, default="")
    context = serializers.JSONField(required=False, default=dict)

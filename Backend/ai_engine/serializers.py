from rest_framework import serializers
from .models import (
    Conversation,
    Message,
    RolePlaySession,
    RolePlayMessage,
    InterviewAssessment,
    InterviewResponse,
    LearningPath,
)

REQUIRED_INTERVIEW_QUESTIONS = {
    "career_goal": "What career goal are you trying to achieve in the next 6 months?",
    "current_challenges": "What are your top soft-skill challenges right now?",
    "communication_situations": "In which situations do you struggle most with communication?",
    "confidence_level": "How would you rate your confidence in professional interactions (1-10), and why?",
    "leadership_experience": "Describe your current leadership or teamwork responsibilities.",
    "feedback_pattern": "What feedback have you repeatedly received from peers/managers?",
    "time_commitment": "How many hours per week can you commit to soft-skills development?",
    "preferred_learning_style": "How do you learn best (reading, practice, role-play, coaching)?",
    "motivation": "Why is improving these skills important to you personally?",
    "success_definition": "What would measurable success look like after 8 weeks?",
}


class FABRequestSerializer(serializers.Serializer):
    prompt = serializers.CharField()
    skill = serializers.CharField(required=False, allow_blank=True)
    conversation_id = serializers.IntegerField(required=False)
    page = serializers.CharField(required=False, default='general')
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
        fields = ["id", "user", "title", "started_at", "ended_at", "messages"]


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
    learning_path = LearningPathSerializer(read_only=True)

    class Meta:
        model = InterviewAssessment
        fields = ["id", "user", "created_at", "responses", "learning_path"]


class FABRequestSerializer(serializers.Serializer):
    prompt = serializers.CharField()
    skill = serializers.CharField(required=False, allow_blank=True)
    conversation_id = serializers.IntegerField(required=False)


class RolePlayRequestSerializer(serializers.Serializer):
    prompt = serializers.CharField(required=False, allow_blank=True)
    session_id = serializers.IntegerField(required=False)
    end_session = serializers.BooleanField(required=False, default=False)
    scenario = serializers.CharField(required=False, allow_blank=True)
    context = serializers.JSONField(required=False, default=dict)


class InterviewSubmitSerializer(serializers.Serializer):
    responses = serializers.DictField(child=serializers.CharField(), allow_empty=False)

    def validate_responses(self, value):
        missing = [key for key in REQUIRED_INTERVIEW_QUESTIONS if not str(value.get(key, "")).strip()]
        if missing:
            raise serializers.ValidationError(
                {"missing_required_questions": missing, "required_questions": REQUIRED_INTERVIEW_QUESTIONS}
            )
        return value

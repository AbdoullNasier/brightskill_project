from rest_framework import serializers
from .models import Enrollment, Progress, Quiz, QuizAttempt, ModuleCompletion, QuizQuestion, QuizOption


class EnrollmentSerializer(serializers.ModelSerializer):
    class Meta:
        model = Enrollment
        fields = ["id", "user", "course", "enrolled_at"]
        read_only_fields = ["id", "user", "enrolled_at"]


class ProgressSerializer(serializers.ModelSerializer):
    class Meta:
        model = Progress
        fields = [
            "id",
            "user",
            "course",
            "completed_modules",
            "completion_percentage",
            "last_updated",
        ]
        read_only_fields = ["id", "user", "completion_percentage", "last_updated"]


class ModuleCompletionSerializer(serializers.ModelSerializer):
    class Meta:
        model = ModuleCompletion
        fields = ["id", "user", "module", "completed_at"]
        read_only_fields = ["id", "user", "completed_at"]


class QuizOptionSerializer(serializers.ModelSerializer):
    class Meta:
        model = QuizOption
        fields = ["id", "option_text", "is_correct"]
        read_only_fields = ["id"]


class QuizQuestionSerializer(serializers.ModelSerializer):
    options = QuizOptionSerializer(many=True)

    class Meta:
        model = QuizQuestion
        fields = ["id", "prompt", "order_index", "options"]
        read_only_fields = ["id"]

    def validate_options(self, value):
        if len(value) < 2:
            raise serializers.ValidationError("Each question must have at least two options.")
        if not any(option.get("is_correct") for option in value):
            raise serializers.ValidationError("Each question must have at least one correct option.")
        return value


class QuizSerializer(serializers.ModelSerializer):
    course_title = serializers.CharField(source="course.title", read_only=True)
    module_title = serializers.CharField(source="module.title", read_only=True)
    questions = QuizQuestionSerializer(many=True)

    class Meta:
        model = Quiz
        fields = [
            "id",
            "course",
            "course_title",
            "module",
            "module_title",
            "title",
            "quiz_type",
            "pass_score",
            "questions",
        ]
        read_only_fields = ["id"]

    def validate(self, attrs):
        course = attrs.get("course") or getattr(self.instance, "course", None)
        module = attrs.get("module") if "module" in attrs else getattr(self.instance, "module", None)
        quiz_type = attrs.get("quiz_type") or getattr(self.instance, "quiz_type", Quiz.QuizType.MODULE)

        if quiz_type == Quiz.QuizType.MODULE:
            if module is None:
                raise serializers.ValidationError({"module": "Module quiz must be linked to a module."})
            if course and module.course_id != course.id:
                raise serializers.ValidationError({"module": "Selected module does not belong to this course."})
        elif quiz_type == Quiz.QuizType.EXAM:
            attrs["module"] = None

        return attrs

    def validate_questions(self, value):
        if not value:
            raise serializers.ValidationError("At least one question is required.")
        return value

    def create(self, validated_data):
        questions_data = validated_data.pop("questions", [])
        quiz = Quiz.objects.create(**validated_data)
        self._save_questions(quiz, questions_data)
        return quiz

    def update(self, instance, validated_data):
        questions_data = validated_data.pop("questions", None)
        for attr, value in validated_data.items():
            setattr(instance, attr, value)
        instance.save()

        if questions_data is not None:
            instance.questions.all().delete()
            self._save_questions(instance, questions_data)
        return instance

    def _save_questions(self, quiz, questions_data):
        for question_data in questions_data:
            options_data = question_data.pop("options", [])
            question = QuizQuestion.objects.create(quiz=quiz, **question_data)
            QuizOption.objects.bulk_create(
                [QuizOption(question=question, **option_data) for option_data in options_data]
            )


class QuizAttemptSerializer(serializers.ModelSerializer):
    class Meta:
        model = QuizAttempt
        fields = ["id", "user", "quiz", "score", "attempt_date"]
        read_only_fields = ["id", "user", "attempt_date"]


class EnrollmentRequestSerializer(serializers.Serializer):
    course_id = serializers.IntegerField()


class ModuleCompletionRequestSerializer(serializers.Serializer):
    course_id = serializers.IntegerField(required=False)
    module_id = serializers.IntegerField()


class QuizAttemptRequestSerializer(serializers.Serializer):
    quiz_id = serializers.IntegerField(required=False)
    quiz = serializers.IntegerField(required=False)
    score = serializers.DecimalField(max_digits=5, decimal_places=2)

    def validate(self, attrs):
        quiz_id = attrs.get("quiz_id") or attrs.get("quiz")
        if not quiz_id:
            raise serializers.ValidationError({"quiz_id": "quiz_id is required."})
        attrs["quiz_id"] = quiz_id
        return attrs

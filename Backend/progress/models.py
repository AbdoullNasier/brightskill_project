from django.conf import settings
from django.db import models
from courses.models import Course, Module


class Enrollment(models.Model):
    user = models.ForeignKey(settings.AUTH_USER_MODEL, related_name="enrollments", on_delete=models.CASCADE)
    course = models.ForeignKey(Course, related_name="enrollments", on_delete=models.CASCADE)
    enrolled_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["-enrolled_at"]
        constraints = [
            models.UniqueConstraint(fields=["user", "course"], name="unique_user_course_enrollment"),
        ]

    def __str__(self):
        return f"{self.user} -> {self.course}"


class Progress(models.Model):
    user = models.ForeignKey(settings.AUTH_USER_MODEL, related_name="course_progress", on_delete=models.CASCADE)
    course = models.ForeignKey(Course, related_name="progress_records", on_delete=models.CASCADE)
    completed_modules = models.JSONField(default=list, blank=True)
    completion_percentage = models.DecimalField(max_digits=5, decimal_places=2, default=0)
    last_updated = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ["-last_updated"]
        constraints = [
            models.UniqueConstraint(fields=["user", "course"], name="unique_user_course_progress"),
        ]

    def __str__(self):
        return f"{self.user} - {self.course} ({self.completion_percentage}%)"


class Quiz(models.Model):
    class QuizType(models.TextChoices):
        MODULE = "module", "Module Quiz"
        EXAM = "exam", "Course Exam"

    course = models.ForeignKey(Course, related_name="quizzes", on_delete=models.CASCADE)
    module = models.ForeignKey(Module, related_name="quiz", on_delete=models.CASCADE, null=True, blank=True)
    title = models.CharField(max_length=200)
    quiz_type = models.CharField(max_length=10, choices=QuizType.choices, default=QuizType.MODULE)
    pass_score = models.DecimalField(max_digits=5, decimal_places=2, default=70)

    class Meta:
        ordering = ["title"]

    def __str__(self):
        return f"{self.course}: {self.title}"


class QuizQuestion(models.Model):
    quiz = models.ForeignKey(Quiz, related_name="questions", on_delete=models.CASCADE)
    prompt = models.TextField()
    order_index = models.PositiveIntegerField(default=1)

    class Meta:
        ordering = ["order_index", "id"]
        constraints = [
            models.UniqueConstraint(fields=["quiz", "order_index"], name="unique_quiz_question_order"),
        ]

    def __str__(self):
        return f"{self.quiz.title} - Q{self.order_index}"


class QuizOption(models.Model):
    question = models.ForeignKey(QuizQuestion, related_name="options", on_delete=models.CASCADE)
    option_text = models.CharField(max_length=255)
    is_correct = models.BooleanField(default=False)

    class Meta:
        ordering = ["id"]

    def __str__(self):
        return f"{self.question} - {self.option_text[:40]}"


class QuizAttempt(models.Model):
    user = models.ForeignKey(settings.AUTH_USER_MODEL, related_name="quiz_attempts", on_delete=models.CASCADE)
    quiz = models.ForeignKey(Quiz, related_name="attempts", on_delete=models.CASCADE)
    score = models.DecimalField(max_digits=5, decimal_places=2)
    attempt_date = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["-attempt_date"]

    def __str__(self):
        return f"{self.user} - {self.quiz} ({self.score})"


class ModuleCompletion(models.Model):
    user = models.ForeignKey(settings.AUTH_USER_MODEL, related_name="module_completions", on_delete=models.CASCADE)
    module = models.ForeignKey(Module, related_name="completions", on_delete=models.CASCADE)
    completed_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["-completed_at"]
        constraints = [
            models.UniqueConstraint(fields=["user", "module"], name="unique_user_module_completion"),
        ]

    def __str__(self):
        return f"{self.user} completed {self.module}"

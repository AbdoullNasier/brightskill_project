from django.conf import settings
from django.db import models


class Conversation(models.Model):
    user = models.ForeignKey(settings.AUTH_USER_MODEL, related_name="conversations", on_delete=models.CASCADE)
    skill = models.CharField(max_length=120)
    started_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["-started_at"]


class Message(models.Model):
    class Sender(models.TextChoices):
        USER = "user", "User"
        AI = "ai", "AI"

    conversation = models.ForeignKey(Conversation, related_name="messages", on_delete=models.CASCADE)
    sender = models.CharField(max_length=10, choices=Sender.choices)
    content = models.TextField()
    timestamp = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["timestamp"]


class RolePlaySession(models.Model):
    user = models.ForeignKey(settings.AUTH_USER_MODEL, related_name="roleplay_sessions", on_delete=models.CASCADE)
    title = models.CharField(max_length=140, blank=True, default="")
    started_at = models.DateTimeField(auto_now_add=True)
    ended_at = models.DateTimeField(blank=True, null=True)

    class Meta:
        ordering = ["-started_at"]


class RolePlayMessage(models.Model):
    class Role(models.TextChoices):
        USER = "user", "User"
        AI = "ai", "AI"

    session = models.ForeignKey(RolePlaySession, related_name="messages", on_delete=models.CASCADE)
    role = models.CharField(max_length=10, choices=Role.choices)
    content = models.TextField()
    timestamp = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["timestamp"]


class InterviewAssessment(models.Model):
    user = models.ForeignKey(settings.AUTH_USER_MODEL, related_name="interview_assessments", on_delete=models.CASCADE)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["-created_at"]


class InterviewResponse(models.Model):
    assessment = models.ForeignKey(InterviewAssessment, related_name="responses", on_delete=models.CASCADE)
    question_key = models.CharField(max_length=100)
    question_text = models.TextField()
    response_text = models.TextField()
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["id"]
        constraints = [
            models.UniqueConstraint(fields=["assessment", "question_key"], name="unique_question_per_assessment"),
        ]


class LearningPath(models.Model):
    user = models.ForeignKey(settings.AUTH_USER_MODEL, related_name="learning_paths", on_delete=models.CASCADE)
    assessment = models.OneToOneField(InterviewAssessment, related_name="learning_path", on_delete=models.CASCADE)
    title = models.CharField(max_length=255)
    summary = models.TextField()
    weekly_plan = models.TextField()
    focus_areas = models.JSONField(default=list, blank=True)
    generated_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["-generated_at"]

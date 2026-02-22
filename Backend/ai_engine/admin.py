from django.contrib import admin

from .models import (
    Conversation,
    InterviewAssessment,
    InterviewResponse,
    LearningPath,
    Message,
    RolePlayMessage,
    RolePlaySession,
)


@admin.register(Conversation)
class ConversationAdmin(admin.ModelAdmin):
    list_display = ("id", "user", "skill", "started_at")
    list_filter = ("started_at",)
    search_fields = ("user__username", "user__email", "skill")
    autocomplete_fields = ("user",)
    ordering = ("-started_at",)


@admin.register(Message)
class MessageAdmin(admin.ModelAdmin):
    list_display = ("id", "conversation", "sender", "timestamp")
    list_filter = ("sender", "timestamp")
    search_fields = ("content", "conversation__user__username")
    autocomplete_fields = ("conversation",)
    ordering = ("-timestamp",)


@admin.register(RolePlaySession)
class RolePlaySessionAdmin(admin.ModelAdmin):
    list_display = ("id", "user", "started_at", "ended_at")
    list_filter = ("started_at", "ended_at")
    search_fields = ("user__username", "user__email")
    autocomplete_fields = ("user",)
    ordering = ("-started_at",)


@admin.register(RolePlayMessage)
class RolePlayMessageAdmin(admin.ModelAdmin):
    list_display = ("id", "session", "role", "timestamp")
    list_filter = ("role", "timestamp")
    search_fields = ("content", "session__user__username")
    autocomplete_fields = ("session",)
    ordering = ("-timestamp",)


@admin.register(InterviewAssessment)
class InterviewAssessmentAdmin(admin.ModelAdmin):
    list_display = ("id", "user", "created_at")
    list_filter = ("created_at",)
    search_fields = ("user__username", "user__email")
    autocomplete_fields = ("user",)
    ordering = ("-created_at",)


@admin.register(InterviewResponse)
class InterviewResponseAdmin(admin.ModelAdmin):
    list_display = ("id", "assessment", "question_key", "created_at")
    list_filter = ("question_key", "created_at")
    search_fields = ("question_key", "question_text", "response_text", "assessment__user__username")
    autocomplete_fields = ("assessment",)
    ordering = ("assessment", "id")


@admin.register(LearningPath)
class LearningPathAdmin(admin.ModelAdmin):
    list_display = ("id", "title", "user", "assessment", "generated_at")
    list_filter = ("generated_at",)
    search_fields = ("title", "summary", "user__username", "user__email")
    autocomplete_fields = ("user", "assessment")
    ordering = ("-generated_at",)

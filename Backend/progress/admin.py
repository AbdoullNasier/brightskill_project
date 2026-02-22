from django.contrib import admin

from .models import Enrollment, LessonCompletion, Progress, Quiz, QuizAttempt


@admin.register(Enrollment)
class EnrollmentAdmin(admin.ModelAdmin):
    list_display = ("id", "user", "course", "enrolled_at")
    list_filter = ("enrolled_at", "course")
    search_fields = ("user__username", "user__email", "course__title")
    autocomplete_fields = ("user", "course")
    ordering = ("-enrolled_at",)


@admin.register(Progress)
class ProgressAdmin(admin.ModelAdmin):
    list_display = ("id", "user", "course", "completion_percentage", "last_updated")
    list_filter = ("last_updated", "course")
    search_fields = ("user__username", "user__email", "course__title")
    autocomplete_fields = ("user", "course")
    ordering = ("-last_updated",)


@admin.register(Quiz)
class QuizAdmin(admin.ModelAdmin):
    list_display = ("id", "title", "course", "pass_score")
    list_filter = ("course",)
    search_fields = ("title", "course__title")
    autocomplete_fields = ("course",)
    ordering = ("title",)


@admin.register(QuizAttempt)
class QuizAttemptAdmin(admin.ModelAdmin):
    list_display = ("id", "user", "quiz", "score", "attempt_date")
    list_filter = ("attempt_date", "quiz")
    search_fields = ("user__username", "user__email", "quiz__title")
    autocomplete_fields = ("user", "quiz")
    ordering = ("-attempt_date",)


@admin.register(LessonCompletion)
class LessonCompletionAdmin(admin.ModelAdmin):
    list_display = ("id", "user", "lesson", "completed_at")
    list_filter = ("completed_at", "lesson__course")
    search_fields = ("user__username", "user__email", "lesson__title", "lesson__course__title")
    autocomplete_fields = ("user", "lesson")
    ordering = ("-completed_at",)

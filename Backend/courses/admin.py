from django.contrib import admin

from .models import Course, Lesson, Skill


@admin.register(Skill)
class SkillAdmin(admin.ModelAdmin):
    list_display = ("id", "name")
    search_fields = ("name", "description")
    ordering = ("name",)


@admin.register(Course)
class CourseAdmin(admin.ModelAdmin):
    list_display = ("id", "title", "skill", "difficulty", "created_at", "updated_at")
    list_filter = ("difficulty", "skill", "created_at")
    search_fields = ("title", "description", "skill__name")
    autocomplete_fields = ("skill",)
    ordering = ("title",)


@admin.register(Lesson)
class LessonAdmin(admin.ModelAdmin):
    list_display = ("id", "title", "course", "order")
    list_filter = ("course",)
    search_fields = ("title", "content", "course__title")
    autocomplete_fields = ("course",)
    ordering = ("course", "order", "id")

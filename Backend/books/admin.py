from django.contrib import admin

from .models import BookRecommendation


@admin.register(BookRecommendation)
class BookRecommendationAdmin(admin.ModelAdmin):
    list_display = ("id", "title", "author", "user", "source_type", "source_id", "recommended_at")
    list_filter = ("source_type", "recommended_at")
    search_fields = ("title", "author", "user__username", "user__email")
    autocomplete_fields = ("user",)
    ordering = ("-recommended_at",)

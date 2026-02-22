from django.contrib import admin

from .models import Certificate


@admin.register(Certificate)
class CertificateAdmin(admin.ModelAdmin):
    list_display = ("id", "certificate_id", "user", "course", "issued_at")
    list_filter = ("issued_at", "course")
    search_fields = ("certificate_id", "user__username", "user__email", "course__title")
    autocomplete_fields = ("user", "course")
    ordering = ("-issued_at",)

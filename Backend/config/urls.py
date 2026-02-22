from django.contrib import admin
from django.urls import include, path

admin.site.site_header = "BrightSkill Administration"
admin.site.site_title = "BrightSkill Admin"
admin.site.index_title = "Platform Dashboard"

urlpatterns = [
    path("admin/", admin.site.urls),
    path("api/", include("core.urls")),
    path("api/auth/", include("accounts.urls")),
    path("api/courses/", include("courses.urls")),
    path("api/progress/", include("progress.urls")),
    path("api/certificates/", include("certificates.urls")),
    path("api/books/", include("books.urls")),
    path("api/", include("ai_engine.urls")),
]

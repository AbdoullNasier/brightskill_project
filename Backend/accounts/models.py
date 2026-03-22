from django.contrib.auth.models import AbstractUser
from django.conf import settings
from django.db import models


class User(AbstractUser):
    class PreferredLanguage(models.TextChoices):
        ENGLISH = "en", "English"
        HAUSA = "ha", "Hausa"

    class Roles(models.TextChoices):
        ADMIN = "admin", "Admin"
        TUTOR = "tutor", "Tutor"
        LEARNER = "learner", "Learner"

    role = models.CharField(max_length=20, choices=Roles.choices, default=Roles.LEARNER)
    bio = models.TextField(blank=True, null=True)
    avatar = models.URLField(blank=True, null=True, help_text="URL to profile picture")
    job_title = models.CharField(max_length=120, blank=True, default="")
    location = models.CharField(max_length=150, blank=True, default="")
    phone = models.CharField(max_length=20, blank=True, default="")
    preferred_language = models.CharField(
        max_length=5,
        choices=PreferredLanguage.choices,
        default=PreferredLanguage.ENGLISH,
    )

    def __str__(self):
        return f"{self.username} ({self.role})"


class TutorApplication(models.Model):
    class Status(models.TextChoices):
        PENDING = "pending", "Pending"
        APPROVED = "approved", "Approved"
        REJECTED = "rejected", "Rejected"

    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="tutor_applications",
    )
    phone = models.CharField(max_length=20)
    location = models.CharField(max_length=150)
    qualification = models.CharField(max_length=150)
    field_of_study = models.CharField(max_length=150)
    experience_years = models.IntegerField()
    skills = models.TextField()
    teaching_level = models.CharField(max_length=50)
    bio = models.TextField()
    cv = models.FileField(upload_to="tutor_cvs/")
    status = models.CharField(max_length=20, choices=Status.choices, default=Status.PENDING)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        constraints = [
            models.UniqueConstraint(
                fields=["user"],
                condition=models.Q(status="pending"),
                name="unique_pending_tutor_application_per_user",
            )
        ]

    def __str__(self):
        email = getattr(self.user, "email", "") or self.user.username
        return f"{email} - {self.status}"

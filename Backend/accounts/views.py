import logging
import threading
from datetime import timedelta

from django.conf import settings
from django.contrib.auth import get_user_model
from django.contrib.auth.tokens import PasswordResetTokenGenerator
from django.core.mail import send_mail
from django.db import IntegrityError
from django.db.models import Q, Count
from django.template.loader import render_to_string
from django.utils import timezone
from django.utils.html import strip_tags
from django.utils.http import urlsafe_base64_encode
from django.utils.encoding import force_bytes
from rest_framework import generics, permissions, status
from rest_framework.exceptions import PermissionDenied, ValidationError
from rest_framework.response import Response
from rest_framework_simplejwt.tokens import RefreshToken
from rest_framework_simplejwt.views import TokenObtainPairView

from core.permissions import IsPlatformAdmin
from courses.models import Course
from progress.models import Progress, Enrollment, ModuleCompletion
from certificates.models import Certificate
from ai_engine.models import LearningPath
from .models import TutorApplication
from .serializers import (
    UserSerializer,
    RegisterSerializer,
    CustomTokenObtainPairSerializer,
    AdminUserSerializer,
    AdminUserUpdateSerializer,
    ProfileSettingsSerializer,
    TutorApplicationSerializer,
    TutorApplicationAdminSerializer,
    PasswordResetRequestSerializer,
    PasswordResetConfirmSerializer,
    ChangePasswordSerializer,
)

User = get_user_model()
logger = logging.getLogger(__name__)


def _send_notification_email(subject, html_body, recipient):
    plain_body = strip_tags(html_body)
    send_mail(
        subject=subject,
        message=plain_body,
        from_email=settings.DEFAULT_FROM_EMAIL,
        recipient_list=[recipient],
        html_message=html_body,
        fail_silently=False,
    )


def _build_user_badges(xp, completed_courses, modules_completed, certificates_count, has_learning_path):
    badges = []

    if modules_completed >= 1:
        badges.append(
            {
                "id": "first-module",
                "name": "First Step",
                "icon": "MdPlayCircle",
                "description": "Completed your first learning module.",
            }
        )
    if modules_completed >= 5:
        badges.append(
            {
                "id": "module-marathon",
                "name": "Consistent Learner",
                "icon": "MdAutoGraph",
                "description": "Completed 5 or more modules.",
            }
        )
    if completed_courses >= 1:
        badges.append(
            {
                "id": "course-finisher",
                "name": "Course Finisher",
                "icon": "MdSchool",
                "description": "Completed at least one full course.",
            }
        )
    if certificates_count >= 1:
        badges.append(
            {
                "id": "certified",
                "name": "Certified Learner",
                "icon": "MdWorkspacePremium",
                "description": "Earned your first certificate.",
            }
        )
    if xp >= 1000:
        badges.append(
            {
                "id": "xp-1000",
                "name": "Level Up",
                "icon": "MdTrendingUp",
                "description": "Reached 1000 XP.",
            }
        )
    if has_learning_path:
        badges.append(
            {
                "id": "pathfinder",
                "name": "Pathfinder",
                "icon": "MdPsychology",
                "description": "Completed interview and generated a learning path.",
            }
        )

    return badges


class RegisterView(generics.CreateAPIView):
    queryset = User.objects.all()
    permission_classes = (permissions.AllowAny,)
    serializer_class = RegisterSerializer

    def create(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        user = serializer.save()

        def _send_welcome_email_async():
            try:
                _send_notification_email(
                    subject="Welcome to BrightSkill",
                    html_body=(
                        f"<p>Hi {user.first_name or user.username},</p>"
                        "<p>Thank you for registering on BrightSkill.</p>"
                        "<p>You can now log in and start your learning journey.</p>"
                    ),
                    recipient=user.email,
                )
            except Exception:
                logger.exception("Welcome email failed for user_id=%s", user.id)

        threading.Thread(target=_send_welcome_email_async, daemon=True).start()

        refresh = RefreshToken.for_user(user)
        return Response(
            {
                "user": UserSerializer(user).data,
                "access": str(refresh.access_token),
                "refresh": str(refresh),
                "message": "Registration successful",
            },
            status=status.HTTP_201_CREATED,
        )


class CustomTokenObtainPairView(TokenObtainPairView):
    serializer_class = CustomTokenObtainPairSerializer


class UserDetailView(generics.RetrieveUpdateAPIView):
    queryset = User.objects.all()
    permission_classes = (permissions.IsAuthenticated,)
    serializer_class = UserSerializer

    def get_object(self):
        return self.request.user


class ProfileSettingsView(generics.RetrieveUpdateAPIView):
    queryset = User.objects.all()
    permission_classes = (permissions.IsAuthenticated,)
    serializer_class = ProfileSettingsSerializer

    def get_object(self):
        return User.objects.prefetch_related("tutor_applications").get(pk=self.request.user.pk)


class ChangePasswordView(generics.GenericAPIView):
    permission_classes = (permissions.IsAuthenticated,)
    serializer_class = ChangePasswordSerializer

    def post(self, request):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        user = request.user
        if not user.check_password(serializer.validated_data["current_password"]):
            raise ValidationError({"current_password": "Current password is incorrect."})

        user.set_password(serializer.validated_data["new_password"])
        user.save(update_fields=["password"])

        return Response({"message": "Password updated successfully."}, status=status.HTTP_200_OK)


class TutorApplicationCreateView(generics.CreateAPIView):
    serializer_class = TutorApplicationSerializer
    permission_classes = (permissions.IsAuthenticated,)

    def create(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        self.perform_create(serializer)
        headers = self.get_success_headers(serializer.data)
        return Response(
            {
                "message": "Tutor application submitted successfully.",
                "application": serializer.data,
            },
            status=status.HTTP_201_CREATED,
            headers=headers,
        )

    def perform_create(self, serializer):
        user = self.request.user

        if user.role != User.Roles.LEARNER:
            raise PermissionDenied("Only learners can apply to become tutors.")

        has_pending = TutorApplication.objects.filter(
            user=user,
            status=TutorApplication.Status.PENDING,
        ).exists()
        if has_pending:
            raise ValidationError({"detail": "You already have a pending tutor application."})

        try:
            serializer.save(user=user, status=TutorApplication.Status.PENDING)
        except IntegrityError:
            raise ValidationError({"detail": "You already have a pending tutor application."})


class AdminTutorApplicationListView(generics.ListAPIView):
    permission_classes = (IsPlatformAdmin,)
    serializer_class = TutorApplicationAdminSerializer

    def get_queryset(self):
        return TutorApplication.objects.select_related("user").order_by("-created_at")


class AdminTutorApplicationApproveView(generics.GenericAPIView):
    permission_classes = (IsPlatformAdmin,)
    serializer_class = TutorApplicationAdminSerializer

    def patch(self, request, application_id):
        application = generics.get_object_or_404(TutorApplication.objects.select_related("user"), pk=application_id)
        application.status = TutorApplication.Status.APPROVED
        application.save(update_fields=["status"])

        if application.user.role != User.Roles.TUTOR:
            application.user.role = User.Roles.TUTOR
            application.user.save(update_fields=["role"])

        try:
            _send_notification_email(
                subject="Tutor Application Approved",
                html_body=(
                    f"<p>Hi {application.user.first_name or application.user.username},</p>"
                    "<p>Congratulations. Your tutor application has been approved.</p>"
                    "<p>You can now access your Tutor Dashboard and start creating lessons.</p>"
                ),
                recipient=application.user.email,
            )
        except Exception:
            logger.exception("Tutor approved email failed for application_id=%s", application.id)

        return Response(
            {
                "message": "Tutor application approved.",
                "application": self.get_serializer(application).data,
            },
            status=status.HTTP_200_OK,
        )


class AdminTutorApplicationRejectView(generics.GenericAPIView):
    permission_classes = (IsPlatformAdmin,)
    serializer_class = TutorApplicationAdminSerializer

    def patch(self, request, application_id):
        application = generics.get_object_or_404(TutorApplication.objects.select_related("user"), pk=application_id)
        application.status = TutorApplication.Status.REJECTED
        application.save(update_fields=["status"])

        if application.user.role != User.Roles.LEARNER:
            application.user.role = User.Roles.LEARNER
            application.user.save(update_fields=["role"])

        try:
            _send_notification_email(
                subject="Tutor Application Update",
                html_body=(
                    f"<p>Hi {application.user.first_name or application.user.username},</p>"
                    "<p>Thank you for your interest in becoming a tutor.</p>"
                    "<p>At this time, your application was not approved."
                    " We encourage you to continue improving your profile and apply again later.</p>"
                ),
                recipient=application.user.email,
            )
        except Exception:
            logger.exception("Tutor rejected email failed for application_id=%s", application.id)

        return Response(
            {
                "message": "Tutor application rejected.",
                "application": self.get_serializer(application).data,
            },
            status=status.HTTP_200_OK,
        )


class PasswordResetRequestView(generics.GenericAPIView):
    permission_classes = (permissions.AllowAny,)
    serializer_class = PasswordResetRequestSerializer

    def post(self, request):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        email = serializer.validated_data["email"]
        user = User.objects.filter(email__iexact=email).first()
        if not user:
            raise ValidationError({"email": "No account is registered with this email address."})

        uid = urlsafe_base64_encode(force_bytes(user.pk))
        token = PasswordResetTokenGenerator().make_token(user)
        reset_link = f"{settings.FRONTEND_URL.rstrip('/')}/reset-password/{uid}/{token}/"

        context = {
            "user": user,
            "reset_link": reset_link,
        }
        html_body = render_to_string("registration/password_reset_email.html", context)
        # Non-blocking SMTP send so API response remains fast.
        def _send_reset_email_async():
            try:
                _send_notification_email(
                    subject="Reset your BrightSkill password",
                    html_body=html_body,
                    recipient=user.email,
                )
            except Exception:
                logger.exception("Password reset email failed for user_id=%s", user.id)

        threading.Thread(target=_send_reset_email_async, daemon=True).start()

        return Response(
            {"message": "Password reset request accepted. Please check your inbox shortly."},
            status=status.HTTP_200_OK,
        )


class PasswordResetConfirmView(generics.GenericAPIView):
    permission_classes = (permissions.AllowAny,)
    serializer_class = PasswordResetConfirmSerializer

    def post(self, request, uidb64, token):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        user = serializer.validate_user(uidb64)
        if not user or not serializer.validate_token(user, token):
            raise ValidationError({"detail": "Invalid or expired password reset link."})

        user.set_password(serializer.validated_data["new_password"])
        user.save(update_fields=["password"])

        return Response({"message": "Password reset successful."}, status=status.HTTP_200_OK)


class AdminDashboardStatsView(generics.GenericAPIView):
    permission_classes = (IsPlatformAdmin,)

    def get(self, request):
        total_users = User.objects.count()
        active_learners = User.objects.filter(role=User.Roles.LEARNER, is_active=True).count()
        active_courses_qs = Course.objects.filter(is_active=True)
        total_courses = active_courses_qs.count()
        completed_courses = Progress.objects.filter(course__is_active=True, completion_percentage=100).count()

        completion_rate = 0
        if total_users > 0 and total_courses > 0:
            completion_rate = round((completed_courses / (total_users * total_courses)) * 100, 2)

        recent_signups = User.objects.order_by("-date_joined")[:5]
        popular_courses = (
            active_courses_qs.annotate(total_enrollments=Count("enrollments"))
            .order_by("-total_enrollments", "title")[:5]
        )

        return Response(
            {
                "total_users": total_users,
                "active_learners": active_learners,
                "total_courses": total_courses,
                "completion_rate": completion_rate,
                "lessons_completed": ModuleCompletion.objects.count(),
                "certificates_issued": Certificate.objects.count(),
                "enrollments": Enrollment.objects.count(),
                "recent_signups": AdminUserSerializer(recent_signups, many=True).data,
                "course_popularity": [
                    {
                        "course_id": c.id,
                        "course_title": c.title,
                        "enrolled_users": c.total_enrollments,
                    }
                    for c in popular_courses
                ],
            }
        )


class AdminUserListView(generics.ListAPIView):
    permission_classes = (IsPlatformAdmin,)
    serializer_class = AdminUserSerializer

    def get_queryset(self):
        queryset = User.objects.all().order_by("-date_joined")
        role = self.request.query_params.get("role")
        search = self.request.query_params.get("search")

        if role:
            queryset = queryset.filter(role=role)
        if search:
            queryset = queryset.filter(Q(username__icontains=search) | Q(email__icontains=search))

        return queryset


class AdminUserDetailView(generics.RetrieveUpdateDestroyAPIView):
    permission_classes = (IsPlatformAdmin,)
    queryset = User.objects.all()
    lookup_url_kwarg = "user_id"

    def get_serializer_class(self):
        if self.request.method in ["PUT", "PATCH"]:
            return AdminUserUpdateSerializer
        return AdminUserSerializer

    def perform_destroy(self, instance):
        if instance.id == self.request.user.id:
            raise PermissionDenied("You cannot delete your own account from admin panel.")
        instance.delete()


class UserDashboardView(generics.GenericAPIView):
    permission_classes = (permissions.IsAuthenticated,)

    def get(self, request):
        user = request.user
        progress_qs = Progress.objects.filter(user=user).select_related("course")
        completed_courses = progress_qs.filter(completion_percentage=100).count()
        total_lessons_completed = ModuleCompletion.objects.filter(user=user).count()
        certificates_count = Certificate.objects.filter(user=user).count()
        enrollments_count = Enrollment.objects.filter(user=user).count()
        latest_path = LearningPath.objects.filter(user=user).order_by("-generated_at").first()
        has_learning_path = latest_path is not None

        xp = (completed_courses * 500) + (total_lessons_completed * 50) + (certificates_count * 200)
        level = max(1, (xp // 1000) + 1)
        badges = _build_user_badges(
            xp=xp,
            completed_courses=completed_courses,
            modules_completed=total_lessons_completed,
            certificates_count=certificates_count,
            has_learning_path=has_learning_path,
        )

        active_progress = progress_qs.exclude(completion_percentage=100).order_by("-last_updated").first()
        continue_learning = None
        if active_progress:
            continue_learning = {
                "course_id": active_progress.course_id,
                "course_title": active_progress.course.title,
                "difficulty": active_progress.course.difficulty,
                "completion_percentage": float(active_progress.completion_percentage),
            }

        return Response(
            {
                "stats": {
                    "xp": xp,
                    "level": level,
                    "completed_courses": completed_courses,
                    "enrollments": enrollments_count,
                    "certificates": certificates_count,
                    "lessons_completed": total_lessons_completed,
                },
                "continue_learning": continue_learning,
                "has_learning_path": has_learning_path,
                "badges": badges,
            }
        )


class LeaderboardView(generics.GenericAPIView):
    permission_classes = (permissions.IsAuthenticated,)

    def get(self, request):
        now = timezone.now()
        week_start = (now - timedelta(days=now.weekday())).replace(
            hour=0,
            minute=0,
            second=0,
            microsecond=0,
        )
        users = User.objects.filter(is_active=True).order_by("id")
        rows = []
        for user in users:
            completed_courses = Progress.objects.filter(
                user=user,
                completion_percentage=100,
                last_updated__gte=week_start,
            ).count()
            modules_completed = ModuleCompletion.objects.filter(
                user=user,
                completed_at__gte=week_start,
            ).count()
            certificates_count = Certificate.objects.filter(
                user=user,
                issued_at__gte=week_start,
            ).count()
            xp = (completed_courses * 500) + (modules_completed * 50) + (certificates_count * 200)
            rows.append(
                {
                    "user_id": user.id,
                    "username": user.username,
                    "display_name": f"{user.first_name} {user.last_name}".strip() or user.username,
                    "xp": xp,
                    "is_current_user": user.id == request.user.id,
                }
            )

        rows.sort(key=lambda item: item["xp"], reverse=True)
        for index, row in enumerate(rows, start=1):
            row["rank"] = index

        return Response(rows[:6])

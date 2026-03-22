from django.urls import include, path
from rest_framework.routers import DefaultRouter
from .views import ProgressViewSet, EnrollmentViewSet, QuizViewSet, QuizAttemptViewSet

router = DefaultRouter()
router.register(r"enrollments", EnrollmentViewSet, basename="enrollment")
router.register(r"quiz", QuizViewSet, basename="quiz")
router.register(r"quiz-attempts", QuizAttemptViewSet, basename="quiz-attempt")
router.register(r"", ProgressViewSet, basename="progress")

quiz_list = QuizViewSet.as_view({"get": "list", "post": "create"})
quiz_detail = QuizViewSet.as_view({"get": "retrieve", "put": "update", "patch": "partial_update", "delete": "destroy"})
quiz_attempt_submit = QuizAttemptViewSet.as_view({"post": "submit"})

urlpatterns = [
    # Compatibility aliases
    path("quizzes/", quiz_list, name="quiz-list-alias"),
    path("quizzes/<int:pk>/", quiz_detail, name="quiz-detail-alias"),
    path("attempts/", quiz_attempt_submit, name="quiz-attempt-submit-alias"),
    path("", include(router.urls)),
]

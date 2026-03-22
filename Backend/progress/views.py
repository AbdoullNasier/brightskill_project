from django.shortcuts import get_object_or_404
from rest_framework import status, viewsets
from rest_framework.decorators import action
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.exceptions import PermissionDenied
from .models import Enrollment, Progress, Quiz, QuizAttempt

# permission helpers imported from courses.permissions so we can reuse them
from courses.permissions import is_admin, is_tutor, is_student
from .serializers import (
    EnrollmentSerializer,
    ProgressSerializer,
    QuizSerializer,
    QuizAttemptSerializer,
    EnrollmentRequestSerializer,
    ModuleCompletionRequestSerializer,
    QuizAttemptRequestSerializer,
)
from .services import enroll_user_in_course, mark_module_complete, handle_quiz_submission


class ProgressViewSet(viewsets.GenericViewSet):
    permission_classes = [IsAuthenticated]

    @action(detail=False, methods=["post"], url_path="enroll")
    def enroll(self, request):
        serializer = EnrollmentRequestSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        enrollment = enroll_user_in_course(request.user, serializer.validated_data["course_id"])
        return Response(
            {
                "message": "Enrollment successful",
                "enrollment_id": enrollment.id,
            },
            status=status.HTTP_201_CREATED,
        )

    @action(detail=False, methods=["post"], url_path="complete-module")
    def complete_module(self, request):
        serializer = ModuleCompletionRequestSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        progress, certificate, recommendation = mark_module_complete(
            request.user,
            serializer.validated_data.get("course_id"),
            serializer.validated_data["module_id"],
        )

        payload = {
            "message": "Module completion updated",
            "progress": ProgressSerializer(progress).data,
        }
        if certificate:
            payload["certificate"] = {
                "certificate_id": str(certificate.certificate_id),
                "issued_at": certificate.issued_at,
            }
        if recommendation:
            payload["book_recommendation"] = {
                "id": recommendation.id,
                "title": recommendation.title,
                "author": recommendation.author,
                "reason": recommendation.reason,
            }
        return Response(payload, status=status.HTTP_200_OK)

    @action(detail=False, methods=["get"], url_path="my-progress")
    def my_progress(self, request):
        queryset = Progress.objects.filter(user=request.user).select_related("course", "course__skill")
        serializer = ProgressSerializer(queryset, many=True)
        return Response(serializer.data)


class EnrollmentViewSet(viewsets.ReadOnlyModelViewSet):
    serializer_class = EnrollmentSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        return Enrollment.objects.filter(user=self.request.user).select_related("course", "course__skill")


class QuizViewSet(viewsets.ModelViewSet):
    serializer_class = QuizSerializer
    permission_classes = [IsAuthenticated]
    queryset = Quiz.objects.select_related("course", "course__skill", "module").prefetch_related("questions__options")

    def get_queryset(self):
        queryset = super().get_queryset()
        user = self.request.user
        # admins see everything
        if is_admin(user):
            return queryset
        # tutors only their own course quizzes
        if is_tutor(user):
            return queryset.filter(course__created_by=user)
        # students only see published course quizzes
        if is_student(user):
            return queryset.filter(course__is_published=True)
        return queryset.none()

    def perform_create(self, serializer):
        user = self.request.user
        course = serializer.validated_data.get("course")
        if not (is_admin(user) or is_tutor(user)):
            raise PermissionDenied("Only admins or tutors can create quizzes.")
        if is_tutor(user) and course and course.created_by_id != user.id:
            raise PermissionDenied("You can only create quizzes for your own courses.")
        serializer.save()

    def perform_update(self, serializer):
        instance = self.get_object()
        user = self.request.user
        if not (is_admin(user) or (is_tutor(user) and instance.course.created_by_id == user.id)):
            raise PermissionDenied("Only admins or the course creator can update this quiz.")
        serializer.save()

    def perform_destroy(self, instance):
        user = self.request.user
        if not (is_admin(user) or (is_tutor(user) and instance.course.created_by_id == user.id)):
            raise PermissionDenied("Only admins or the course creator can delete this quiz.")
        instance.delete()


class QuizAttemptViewSet(viewsets.GenericViewSet):
    permission_classes = [IsAuthenticated]

    @action(detail=False, methods=["post"], url_path="submit")
    def submit(self, request):
        serializer = QuizAttemptRequestSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        quiz = get_object_or_404(Quiz, id=serializer.validated_data["quiz_id"])
        attempt = QuizAttempt.objects.create(
            user=request.user,
            quiz=quiz,
            score=serializer.validated_data["score"],
        )
        data = QuizAttemptSerializer(attempt).data
        data["passed"] = attempt.score >= quiz.pass_score

        issued_certificate, recommended_book = handle_quiz_submission(request.user, quiz, attempt)
        
        if issued_certificate:
            data["certificate"] = {
                "certificate_id": str(issued_certificate.certificate_id),
                "issued_at": issued_certificate.issued_at,
            }
        if recommended_book:
            data["book_recommendation"] = {
                "id": recommended_book.id,
                "title": recommended_book.title,
                "author": recommended_book.author,
                "reason": recommended_book.reason,
            }

        return Response(data, status=status.HTTP_201_CREATED)

    @action(detail=False, methods=["get"], url_path="my-attempts")
    def my_attempts(self, request):
        attempts = QuizAttempt.objects.filter(user=request.user).select_related("quiz", "quiz__course")
        return Response(QuizAttemptSerializer(attempts, many=True).data)

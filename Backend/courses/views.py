from rest_framework import status, viewsets
from rest_framework.decorators import action
from rest_framework.exceptions import PermissionDenied
from rest_framework.response import Response

from core.permissions import IsAdminOrReadOnly
from .models import Skill, Course, Lesson, Module
from .permissions import IsCourseCreatorOrAdmin, is_admin, is_student, is_tutor
from .serializers import SkillSerializer, CourseSerializer, LessonSerializer, ModuleSerializer


class SkillViewSet(viewsets.ModelViewSet):
    serializer_class = SkillSerializer
    permission_classes = [IsAdminOrReadOnly]

    def get_queryset(self):
        user = self.request.user
        queryset = Skill.objects.all()
        if user.is_authenticated and (is_admin(user) or is_tutor(user)):
            return queryset
        return queryset.filter(courses__is_active=True, courses__is_published=True).distinct()


class CourseViewSet(viewsets.ModelViewSet):
    serializer_class = CourseSerializer
    permission_classes = []

    def get_queryset(self):
        queryset = (
            Course.objects.select_related("skill", "created_by")
            .prefetch_related("lessons", "modules")
            .filter(is_active=True)
        )
        user = self.request.user
        skill_id = self.request.query_params.get("skill")
        difficulty = self.request.query_params.get("difficulty")
        published = self.request.query_params.get("published")
        tutor_id = self.request.query_params.get("tutor")
        search = self.request.query_params.get("search")

        if user.is_authenticated and is_admin(user):
            pass
        elif user.is_authenticated and is_tutor(user):
            queryset = queryset.filter(created_by=user)
        else:
            queryset = queryset.filter(is_published=True)

        if skill_id:
            queryset = queryset.filter(skill_id=skill_id)
        if difficulty:
            queryset = queryset.filter(difficulty=difficulty)
        if published is not None:
            queryset = queryset.filter(is_published=str(published).lower() == "true")
        if tutor_id and user.is_authenticated and is_admin(user):
            queryset = queryset.filter(created_by_id=tutor_id)
        if search:
            queryset = queryset.filter(title__icontains=search)
        return queryset

    def perform_create(self, serializer):
        user = self.request.user
        if not (user.is_authenticated and (is_admin(user) or is_tutor(user))):
            raise PermissionDenied("Only admins or tutors can create courses.")
        serializer.save(created_by=user)

    def perform_update(self, serializer):
        instance = self.get_object()
        if not IsCourseCreatorOrAdmin().has_object_permission(self.request, self, instance):
            raise PermissionDenied("Only the course creator or an admin can update this course.")
        serializer.save()

    def perform_destroy(self, instance):
        if not IsCourseCreatorOrAdmin().has_object_permission(self.request, self, instance):
            raise PermissionDenied("Only the course creator or an admin can delete this course.")
        instance.is_active = False
        instance.is_published = False
        instance.save(update_fields=["is_active", "is_published", "updated_at"])

    @action(detail=True, methods=["get", "post"], url_path="modules")
    def modules(self, request, pk=None):
        course = self.get_object()
        modules_qs = Module.objects.filter(course=course, course__is_active=True).order_by("order_index", "id")

        if request.method.lower() == "get":
            if request.user.is_authenticated and (is_admin(request.user) or (is_tutor(request.user) and course.created_by_id == request.user.id)):
                serializer = ModuleSerializer(modules_qs, many=True)
                return Response(serializer.data)
            if course.is_published:
                serializer = ModuleSerializer(modules_qs, many=True)
                return Response(serializer.data)
            raise PermissionDenied("This course is not publicly available.")

        if not IsCourseCreatorOrAdmin().has_object_permission(request, self, course):
            raise PermissionDenied("Only the course creator or an admin can add modules.")

        serializer = ModuleSerializer(data=request.data, context={"request": request, "course": course})
        serializer.is_valid(raise_exception=True)
        serializer.save(course=course)
        return Response(serializer.data, status=status.HTTP_201_CREATED)


class LessonViewSet(viewsets.ModelViewSet):
    serializer_class = LessonSerializer
    permission_classes = [IsAdminOrReadOnly]

    def get_queryset(self):
        queryset = Lesson.objects.select_related("course", "course__skill").filter(course__is_active=True)
        user = self.request.user
        course_id = self.request.query_params.get("course")

        if user.is_authenticated and getattr(user, "role", None) == "tutor":
            queryset = queryset.filter(course__created_by=user)
        elif not user.is_authenticated or is_student(user):
            queryset = queryset.filter(course__is_published=True)
        if course_id:
            queryset = queryset.filter(course_id=course_id)
        return queryset

    def perform_create(self, serializer):
        user = self.request.user
        course = serializer.validated_data["course"]
        if getattr(user, "role", None) == "tutor" and course.created_by_id != user.id:
            raise PermissionDenied("You can only add lessons to your own courses.")
        serializer.save()

    def perform_update(self, serializer):
        instance = self.get_object()
        user = self.request.user
        if getattr(user, "role", None) == "tutor" and instance.course.created_by_id != user.id:
            raise PermissionDenied("You can only edit lessons in your own courses.")
        serializer.save()

    def perform_destroy(self, instance):
        user = self.request.user
        if getattr(user, "role", None) == "tutor" and instance.course.created_by_id != user.id:
            raise PermissionDenied("You can only delete lessons in your own courses.")
        instance.delete()


class ModuleViewSet(viewsets.GenericViewSet):
    queryset = Module.objects.select_related("course", "course__created_by").filter(course__is_active=True)
    serializer_class = ModuleSerializer
    permission_classes = []

    def get_queryset(self):
        user = self.request.user
        queryset = super().get_queryset()
        if user.is_authenticated and is_admin(user):
            return queryset
        if user.is_authenticated and is_tutor(user):
            return queryset.filter(course__created_by=user)
        return queryset.filter(course__is_published=True)

    def retrieve(self, request, *args, **kwargs):
        module = self.get_object()
        serializer = self.get_serializer(module)
        return Response(serializer.data)

    def update(self, request, *args, **kwargs):
        module = self.get_object()
        if not IsCourseCreatorOrAdmin().has_object_permission(request, self, module):
            raise PermissionDenied("Only the course creator or an admin can update this module.")
        partial = kwargs.pop("partial", False)
        serializer = self.get_serializer(module, data=request.data, partial=partial)
        serializer.is_valid(raise_exception=True)
        serializer.save()
        return Response(serializer.data)

    def partial_update(self, request, *args, **kwargs):
        kwargs["partial"] = True
        return self.update(request, *args, **kwargs)

    def destroy(self, request, *args, **kwargs):
        module = self.get_object()
        if not IsCourseCreatorOrAdmin().has_object_permission(request, self, module):
            raise PermissionDenied("Only the course creator or an admin can delete this module.")
        module.delete()
        return Response(status=status.HTTP_204_NO_CONTENT)

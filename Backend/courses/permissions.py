from rest_framework.permissions import BasePermission


def is_admin(user):
    return getattr(user, "role", None) == "admin"


def is_tutor(user):
    return getattr(user, "role", None) == "tutor"


def is_student(user):
    return getattr(user, "role", None) in {"learner", "student"}


class IsAdminOrTutor(BasePermission):
    def has_permission(self, request, view):
        user = request.user
        return bool(user and user.is_authenticated and (is_admin(user) or is_tutor(user)))


class IsCourseCreatorOrAdmin(BasePermission):
    def has_object_permission(self, request, view, obj):
        user = request.user
        if not user or not user.is_authenticated:
            return False
        if is_admin(user):
            return True
        creator = getattr(obj, "created_by", None)
        if creator is None and hasattr(obj, "course"):
            creator = getattr(obj.course, "created_by", None)
        return bool(is_tutor(user) and creator and creator.id == user.id)

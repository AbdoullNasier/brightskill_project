from decimal import Decimal
from django.db import transaction
from rest_framework.exceptions import ValidationError
from courses.models import Course, Module
from books.services import create_book_recommendation
from certificates.services import issue_certificate_if_eligible
from .models import Enrollment, Progress, ModuleCompletion, QuizAttempt, Quiz


def calculate_completion_percentage(course: Course, completed_count: int) -> Decimal:
    total_modules = course.modules.count()
    if total_modules == 0:
        return Decimal("0.00")
    percentage = (Decimal(completed_count) / Decimal(total_modules)) * Decimal("100")
    return percentage.quantize(Decimal("0.01"))


@transaction.atomic
def enroll_user_in_course(user, course_id: int):
    course = Course.objects.get(id=course_id)
    enrollment, _ = Enrollment.objects.get_or_create(user=user, course=course)
    Progress.objects.get_or_create(user=user, course=course)
    return enrollment


@transaction.atomic
def mark_module_complete(user, course_id: int | None, module_id: int):
    module = Module.objects.select_related("course").get(id=module_id)
    course = module.course
    if course_id and course.id != int(course_id):
        raise Module.DoesNotExist

    module_quiz = Quiz.objects.filter(
        course=course,
        module=module,
        quiz_type=Quiz.QuizType.MODULE,
    ).first()
    if module_quiz and not QuizAttempt.objects.filter(
        user=user,
        quiz=module_quiz,
        score__gte=module_quiz.pass_score,
    ).exists():
        raise ValidationError(
            {"detail": "You must pass the module quiz before this module can be completed."}
        )

    ModuleCompletion.objects.get_or_create(user=user, module=module)
    progress, _ = Progress.objects.get_or_create(user=user, course=course)

    completed_module_ids = list(
        ModuleCompletion.objects.filter(user=user, module__course=course)
        .values_list("module_id", flat=True)
        .order_by("module__order_index")
    )
    progress.completed_modules = completed_module_ids
    progress.completion_percentage = calculate_completion_percentage(course, len(completed_module_ids))
    progress.save(update_fields=["completed_modules", "completion_percentage", "last_updated"])

    # Certificate/Recommendation logic is moved to submit_quiz
    return progress, None, None

@transaction.atomic
def handle_quiz_submission(user, quiz: Quiz, attempt: QuizAttempt):
    course = quiz.course
    progress, _ = Progress.objects.get_or_create(user=user, course=course)

    issued_certificate = None
    recommended_book = None

    if quiz.quiz_type == Quiz.QuizType.EXAM and attempt.score >= quiz.pass_score:
        if progress.completion_percentage == Decimal("100.00"):
            issued_certificate = issue_certificate_if_eligible(user, course)
            recommended_book = create_book_recommendation(
                user=user,
                topic=getattr(course.skill, "name", "") or course.title or "soft skills",
                source_type="course",
                source_id=course.id,
            )

    return issued_certificate, recommended_book

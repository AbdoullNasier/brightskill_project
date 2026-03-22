from datetime import timedelta

from django.contrib.auth import get_user_model
from django.test import TestCase
from django.utils import timezone
from rest_framework.test import APIRequestFactory, force_authenticate

from certificates.models import Certificate
from courses.models import Course, Module, Skill
from progress.models import ModuleCompletion

from .views import LeaderboardView


User = get_user_model()


class LeaderboardViewTests(TestCase):
    def setUp(self):
        self.factory = APIRequestFactory()
        self.view = LeaderboardView.as_view()
        self.skill = Skill.objects.create(name="Communication")

    def _create_user(self, index):
        return User.objects.create_user(
            username=f"user{index}",
            email=f"user{index}@example.com",
            password="password123",
            first_name=f"User{index}",
            last_name="Tester",
        )

    def _create_module_completion(self, user, index, completed_at):
        course = Course.objects.create(
            title=f"Course {user.username} {index}",
            description="Test course",
            skill=self.skill,
        )
        module = Module.objects.create(
            course=course,
            title=f"Module {index}",
            order_index=index,
        )
        completion = ModuleCompletion.objects.create(user=user, module=module)
        ModuleCompletion.objects.filter(pk=completion.pk).update(completed_at=completed_at)

    def _create_certificate(self, user, index, issued_at):
        course = Course.objects.create(
            title=f"Certificate Course {user.username} {index}",
            description="Test course",
            skill=self.skill,
        )
        certificate = Certificate.objects.create(user=user, course=course)
        Certificate.objects.filter(pk=certificate.pk).update(issued_at=issued_at)

    def test_leaderboard_only_counts_current_week_and_returns_top_six(self):
        now = timezone.now()
        week_start = (now - timedelta(days=now.weekday())).replace(
            hour=0,
            minute=0,
            second=0,
            microsecond=0,
        )
        last_week = week_start - timedelta(minutes=1)

        users = [self._create_user(index) for index in range(7)]

        for index, user in enumerate(users, start=1):
            for module_index in range(index):
                self._create_module_completion(
                    user=user,
                    index=module_index + 1,
                    completed_at=week_start + timedelta(hours=1),
                )

        self._create_certificate(users[0], 1, last_week)

        request = self.factory.get("/api/auth/leaderboard/")
        force_authenticate(request, user=users[0])
        response = self.view(request)

        self.assertEqual(response.status_code, 200)
        self.assertEqual(len(response.data), 6)

        usernames = [entry["username"] for entry in response.data]
        self.assertEqual(usernames, ["user6", "user5", "user4", "user3", "user2", "user1"])
        self.assertNotIn("user0", usernames)

        top_user = response.data[0]
        self.assertEqual(top_user["rank"], 1)
        self.assertEqual(top_user["xp"], 350)

        current_user = next(entry for entry in response.data if entry["username"] == "user1")
        self.assertTrue(current_user["is_current_user"])
        self.assertEqual(current_user["xp"], 100)

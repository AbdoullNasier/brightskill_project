from django.urls import path
from rest_framework_simplejwt.views import TokenRefreshView

from .views import (
    RegisterView,
    UserDetailView,
    ProfileSettingsView,
    CustomTokenObtainPairView,
    AdminDashboardStatsView,
    AdminUserListView,
    AdminUserDetailView,
    UserDashboardView,
    LeaderboardView,
    TutorApplicationCreateView,
    AdminTutorApplicationListView,
    AdminTutorApplicationApproveView,
    AdminTutorApplicationRejectView,
    ChangePasswordView,
    PasswordResetRequestView,
    PasswordResetConfirmView,
)

urlpatterns = [
    path("register/", RegisterView.as_view(), name="register"),
    path("login/", CustomTokenObtainPairView.as_view(), name="token_obtain_pair"),
    path("token/refresh/", TokenRefreshView.as_view(), name="token_refresh"),
    path("profile/", UserDetailView.as_view(), name="profile"),
    path("profile/settings/", ProfileSettingsView.as_view(), name="profile_settings"),
    path("profile/change-password/", ChangePasswordView.as_view(), name="change_password"),
    path("dashboard/", UserDashboardView.as_view(), name="user_dashboard"),
    path("leaderboard/", LeaderboardView.as_view(), name="leaderboard"),
    path("password-reset/", PasswordResetRequestView.as_view(), name="password_reset"),
    path(
        "password-reset-confirm/<uidb64>/<token>/",
        PasswordResetConfirmView.as_view(),
        name="password_reset_confirm",
    ),
    path("admin/stats/", AdminDashboardStatsView.as_view(), name="admin_stats"),
    path("admin/users/", AdminUserListView.as_view(), name="admin_users"),
    path("admin/users/<int:user_id>/", AdminUserDetailView.as_view(), name="admin_user_detail"),
    path("admin/tutor-applications/", AdminTutorApplicationListView.as_view(), name="admin_tutor_applications"),
    path(
        "admin/tutor-applications/<int:application_id>/approve/",
        AdminTutorApplicationApproveView.as_view(),
        name="admin_tutor_application_approve",
    ),
    path(
        "admin/tutor-applications/<int:application_id>/reject/",
        AdminTutorApplicationRejectView.as_view(),
        name="admin_tutor_application_reject",
    ),
    path("tutor/apply/", TutorApplicationCreateView.as_view(), name="tutor-apply"),
]

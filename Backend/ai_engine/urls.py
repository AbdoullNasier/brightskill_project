from django.urls import path

from .views import (
    FABAssistView,
    RolePlayView,
    RolePlayStartView,
    RolePlayMessageView,
    RolePlayHistoryView,
    RolePlaySessionManageView,
    OnboardingSelectSkillView,
    OnboardingInterviewView,
    OnboardingGenerateRoadmapView,
    LearningRoadmapView,
    InterviewQuestionsView,
    InterviewStartView,
    InterviewAnswerView,
    InterviewFinishView,
    InterviewSubmitView,
    LatestLearningPathView,
)

urlpatterns = [
    path("fab-assist/", FABAssistView.as_view(), name="fab_assist"),

    path("onboarding/select-skill/", OnboardingSelectSkillView.as_view(), name="onboarding_select_skill"),
    path("onboarding/interview/", OnboardingInterviewView.as_view(), name="onboarding_interview"),
    path("onboarding/generate-roadmap/", OnboardingGenerateRoadmapView.as_view(), name="onboarding_generate_roadmap"),
    path("roadmap/", LearningRoadmapView.as_view(), name="roadmap"),

    path("roleplay/start/", RolePlayStartView.as_view(), name="roleplay_start"),
    path("roleplay/message/", RolePlayMessageView.as_view(), name="roleplay_message"),
    path("roleplay/history/", RolePlayHistoryView.as_view(), name="roleplay_history"),
    path("roleplay/sessions/<int:session_id>/", RolePlaySessionManageView.as_view(), name="roleplay_session_manage"),
    path("roleplay/", RolePlayView.as_view(), name="roleplay"),

    path("interview/questions/", InterviewQuestionsView.as_view(), name="interview_questions"),
    path("interview/start/", InterviewStartView.as_view(), name="interview_start"),
    path("interview/answer/", InterviewAnswerView.as_view(), name="interview_answer"),
    path("interview/finish/", InterviewFinishView.as_view(), name="interview_finish"),
    path("interview/submit/", InterviewSubmitView.as_view(), name="interview_submit"),
    path("interview/path/", LatestLearningPathView.as_view(), name="latest_learning_path"),
]

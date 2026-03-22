from django.contrib import admin

from .models import (
    Conversation,
    Message,
    RolePlaySession,
    RolePlayMessage,
    InterviewAssessment,
    InterviewResponse,
    LearningPath,
    UserSkillProfile,
    LearningRoadmap,
    RoadmapStage,
)

admin.site.register(
    [
        Conversation,
        Message,
        RolePlaySession,
        RolePlayMessage,
        InterviewAssessment,
        InterviewResponse,
        LearningPath,
        UserSkillProfile,
        LearningRoadmap,
        RoadmapStage,
    ]
)

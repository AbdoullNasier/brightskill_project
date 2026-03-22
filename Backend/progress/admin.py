from accounts.admin import user_admin
from .models import Enrollment, ModuleCompletion, Progress, Quiz, QuizAttempt


user_admin.register([Enrollment, ModuleCompletion, Progress, Quiz, QuizAttempt])
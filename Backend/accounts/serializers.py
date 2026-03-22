from django.contrib.auth import get_user_model
from django.contrib.auth.password_validation import validate_password
from django.contrib.auth.tokens import PasswordResetTokenGenerator
from django.utils.encoding import force_str
from django.utils.http import urlsafe_base64_decode
from rest_framework import serializers
from rest_framework_simplejwt.serializers import TokenObtainPairSerializer

from .models import TutorApplication

User = get_user_model()


class UserSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = (
            "id",
            "username",
            "email",
            "role",
            "bio",
            "avatar",
            "first_name",
            "last_name",
        )
        read_only_fields = ("id", "role")


class RegisterSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True, min_length=8)
    password2 = serializers.CharField(write_only=True, min_length=8)
    first_name = serializers.CharField(required=False, allow_blank=True)
    last_name = serializers.CharField(required=False, allow_blank=True)

    class Meta:
        model = User
        fields = ("username", "email", "password", "password2", "first_name", "last_name")

    def validate(self, attrs):
        if attrs["password"] != attrs["password2"]:
            raise serializers.ValidationError({"password2": "Passwords do not match."})
        return attrs

    def create(self, validated_data):
        validated_data.pop("password2", None)
        user = User.objects.create_user(
            username=validated_data["username"],
            email=validated_data.get("email", ""),
            password=validated_data["password"],
            first_name=validated_data.get("first_name", ""),
            last_name=validated_data.get("last_name", ""),
            role=User.Roles.LEARNER,
        )
        return user


class LoginSerializer(serializers.Serializer):
    username = serializers.CharField(required=False)
    email = serializers.CharField(required=False)
    password = serializers.CharField()

    def validate(self, data):
        username = data.get("username")
        email = data.get("email")

        if not username and not email:
            raise serializers.ValidationError("Email or username is required.")

        return data


class CustomTokenObtainPairSerializer(TokenObtainPairSerializer):
    @classmethod
    def get_token(cls, user):
        return super().get_token(user)

    def validate(self, attrs):
        username_field = self.username_field
        submitted_username = attrs.get(username_field)
        password = attrs.get("password")

        if not submitted_username or not password:
            raise serializers.ValidationError({"detail": "Username and password are required."})

        user = User.objects.filter(**{f"{username_field}__iexact": submitted_username}).first()
        if not user:
            raise serializers.ValidationError({"detail": "Username not registered"})
        if not user.is_active:
            raise serializers.ValidationError({"detail": "Account is inactive"})
        if not user.check_password(password):
            raise serializers.ValidationError({"detail": "Incorrect password"})

        refresh = self.get_token(user)
        self.user = user
        return {
            "refresh": str(refresh),
            "access": str(refresh.access_token),
            "user": UserSerializer(user).data,
        }


class AdminUserSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = (
            "id",
            "username",
            "email",
            "first_name",
            "last_name",
            "role",
            "is_active",
            "date_joined",
        )
        read_only_fields = ("id", "date_joined")


class AdminUserUpdateSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ("email", "first_name", "last_name", "role", "is_active")


class TutorApplicationSerializer(serializers.ModelSerializer):
    class Meta:
        model = TutorApplication
        fields = (
            "id",
            "phone",
            "location",
            "qualification",
            "field_of_study",
            "experience_years",
            "skills",
            "teaching_level",
            "bio",
            "cv",
            "created_at",
        )
        read_only_fields = ("id", "created_at")

    def validate_experience_years(self, value):
        if value < 0:
            raise serializers.ValidationError("Experience years must be greater than or equal to 0.")
        return value

    def validate_teaching_level(self, value):
        allowed_levels = ["Beginner", "Intermediate", "Advanced"]
        if value not in allowed_levels:
            raise serializers.ValidationError(
                f"Teaching level must be one of: {', '.join(allowed_levels)}."
            )
        return value


class TutorApplicationAdminSerializer(serializers.ModelSerializer):
    applicant_email = serializers.EmailField(source="user.email", read_only=True)

    class Meta:
        model = TutorApplication
        fields = (
            "id",
            "applicant_email",
            "qualification",
            "experience_years",
            "teaching_level",
            "status",
            "cv",
            "created_at",
        )
        read_only_fields = fields


class TutorApplicationProfileSerializer(serializers.ModelSerializer):
    class Meta:
        model = TutorApplication
        fields = (
            "id",
            "phone",
            "location",
            "qualification",
            "field_of_study",
            "experience_years",
            "skills",
            "teaching_level",
            "bio",
            "status",
            "cv",
            "created_at",
        )
        read_only_fields = fields


class ProfileSettingsSerializer(serializers.ModelSerializer):
    tutor_application = serializers.SerializerMethodField()

    class Meta:
        model = User
        fields = (
            "id",
            "username",
            "email",
            "role",
            "first_name",
            "last_name",
            "bio",
            "avatar",
            "date_joined",
            "tutor_application",
        )
        read_only_fields = ("id", "username", "email", "role", "date_joined", "tutor_application")

    def get_tutor_application(self, obj):
        application = obj.tutor_applications.order_by("-created_at").first()
        if not application:
            return None
        return TutorApplicationProfileSerializer(application).data


class PasswordResetRequestSerializer(serializers.Serializer):
    email = serializers.EmailField()


class PasswordResetConfirmSerializer(serializers.Serializer):
    new_password = serializers.CharField(write_only=True, min_length=8)
    confirm_password = serializers.CharField(write_only=True, min_length=8)

    def validate(self, attrs):
        if attrs["new_password"] != attrs["confirm_password"]:
            raise serializers.ValidationError({"confirm_password": "Passwords do not match."})
        validate_password(attrs["new_password"])
        return attrs

    def validate_user(self, uidb64):
        try:
            user_id = force_str(urlsafe_base64_decode(uidb64))
            return User.objects.get(pk=user_id)
        except (TypeError, ValueError, OverflowError, User.DoesNotExist):
            return None

    def validate_token(self, user, token):
        return PasswordResetTokenGenerator().check_token(user, token)


class ChangePasswordSerializer(serializers.Serializer):
    current_password = serializers.CharField(write_only=True)
    new_password = serializers.CharField(write_only=True, min_length=8)
    confirm_password = serializers.CharField(write_only=True, min_length=8)

    def validate(self, attrs):
        if attrs["new_password"] != attrs["confirm_password"]:
            raise serializers.ValidationError({"confirm_password": "Passwords do not match."})
        validate_password(attrs["new_password"])
        return attrs

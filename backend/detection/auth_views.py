import logging
import secrets

from django.conf import settings
from django.contrib.auth import authenticate
from django.contrib.auth.tokens import default_token_generator
from django.core.mail import send_mail
from django.utils.encoding import force_bytes, force_str
from django.utils.http import urlsafe_base64_decode, urlsafe_base64_encode
from django.contrib.auth.models import User
from django.core.exceptions import ValidationError
from django.core.validators import validate_email
from rest_framework import status
from rest_framework.authtoken.models import Token
from rest_framework.decorators import api_view, authentication_classes, permission_classes, throttle_classes
from rest_framework.permissions import AllowAny
from rest_framework.response import Response

from .models import Profile
from .throttles import AuthThrottle

logger = logging.getLogger(__name__)
ROLES = {"farmer": "Farmer", "expert": "Expert"}


def _payload(user):
    return {"id": user.id, "name": user.first_name or user.username,
            "email": user.username, "role": user.profile.role}


def _fresh_token(user):
    """One token per login; old ones are dropped so stolen/old tokens stop working."""
    Token.objects.filter(user=user).delete()
    return Token.objects.create(user=user)


def _error(message, code=status.HTTP_400_BAD_REQUEST):
    return Response({"error": message}, status=code)


@api_view(["POST"])
@authentication_classes([])
@permission_classes([AllowAny])
@throttle_classes([AuthThrottle])
def register(request):
    data = request.data
    name = str(data.get("name") or "").strip()
    email = str(data.get("email") or "").strip().lower()
    password = str(data.get("password") or "")
    role = data.get("role")

    if role not in ROLES:
        return _error("Please choose Farmer or Expert.")
    if not name:
        return _error("Please enter your name.")
    try:
        validate_email(email)
    except ValidationError:
        return _error("Please enter a valid email address.")
    if len(password) < 6:
        return _error("Password must be at least 6 characters.")
    if role == "expert":
        supplied = str(data.get("access_code") or "")
        if not secrets.compare_digest(supplied.encode(), settings.EXPERT_SIGNUP_CODE.encode()):
            return _error("Invalid expert access code.", status.HTTP_403_FORBIDDEN)
    if User.objects.filter(username=email).exists():
        return _error("This email is already registered. Please log in.")

    user = User.objects.create_user(username=email, email=email, password=password, first_name=name)
    Profile.objects.create(user=user, role=role)
    token = _fresh_token(user)
    return Response({"token": token.key, "user": _payload(user)}, status=status.HTTP_201_CREATED)


@api_view(["POST"])
@authentication_classes([])
@permission_classes([AllowAny])
@throttle_classes([AuthThrottle])
def login_view(request):
    email = str(request.data.get("email") or "").strip().lower()
    password = str(request.data.get("password") or "")
    role = request.data.get("role")

    user = authenticate(username=email, password=password)
    if user is None or not hasattr(user, "profile"):
        return _error("Invalid email or password.", status.HTTP_401_UNAUTHORIZED)
    if role and role != user.profile.role:
        return _error(f"This account is registered as {ROLES[user.profile.role]}. "
                      f"Please use the {ROLES[user.profile.role]} tab to log in.",
                      status.HTTP_403_FORBIDDEN)
    token = _fresh_token(user)
    return Response({"token": token.key, "user": _payload(user)})


@api_view(["GET"])
def me(request):
    if not hasattr(request.user, "profile"):
        return _error("This account has no role.", status.HTTP_403_FORBIDDEN)
    return Response({"user": _payload(request.user)})


@api_view(["POST"])
def logout_view(request):
    Token.objects.filter(user=request.user).delete()
    return Response({"status": "logged out"})


GENERIC_FORGOT = "If this email is registered, a password reset link has been sent. It is valid for 1 hour."


@api_view(["POST"])
@authentication_classes([])
@permission_classes([AllowAny])
@throttle_classes([AuthThrottle])
def forgot_password(request):
    """Always answers the same way so nobody can find out which emails are registered."""
    email = str(request.data.get("email") or "").strip().lower()
    user = User.objects.filter(username=email, is_active=True).first()
    if user is not None and hasattr(user, "profile"):
        if not settings.SITE_URL:
            logger.error("SITE_URL is not set - cannot build the password reset link")
        else:
            uid = urlsafe_base64_encode(force_bytes(user.pk))
            link = f"{settings.SITE_URL}/reset-password?uid={uid}&token={default_token_generator.make_token(user)}"
            try:
                send_mail(
                    f"{settings.SITE_NAME}: reset your password / password badlein",
                    f"Hello {user.first_name or ''},\n\nReset your {settings.SITE_NAME} password (link valid for 1 hour):\n{link}\n\n"
                    f"Password badalne ke liye upar diye link par click karein (1 ghante tak valid).\n\n"
                    f"If you did not ask for this, ignore this email. / Agar aapne nahi manga, toh is email ko ignore karein.",
                    settings.DEFAULT_FROM_EMAIL, [user.username], fail_silently=False)
            except Exception:
                logger.exception("Could not send password reset email")
    return Response({"message": GENERIC_FORGOT})


@api_view(["POST"])
@authentication_classes([])
@permission_classes([AllowAny])
@throttle_classes([AuthThrottle])
def reset_password(request):
    password = str(request.data.get("password") or "")
    if len(password) < 6:
        return _error("Password must be at least 6 characters.")
    try:
        user = User.objects.get(pk=force_str(urlsafe_base64_decode(str(request.data.get("uid") or ""))))
    except (User.DoesNotExist, ValueError, TypeError, OverflowError):
        user = None
    if user is None or not default_token_generator.check_token(user, str(request.data.get("token") or "")):
        return _error("This reset link is invalid or has expired. Please request a new one.")
    user.set_password(password)
    user.save()
    Token.objects.filter(user=user).delete()   # log the account out everywhere
    return Response({"message": "Password changed. You can log in now."})

from datetime import timedelta

from django.conf import settings
from django.utils import timezone
from rest_framework.authentication import TokenAuthentication
from rest_framework.exceptions import AuthenticationFailed


class ExpiringTokenAuthentication(TokenAuthentication):
    """Token auth where tokens stop working after TOKEN_LIFETIME_DAYS."""

    def authenticate_credentials(self, key):
        user, token = super().authenticate_credentials(key)
        if token.created < timezone.now() - timedelta(days=settings.TOKEN_LIFETIME_DAYS):
            token.delete()
            raise AuthenticationFailed("Session expired. Please log in again.")
        return user, token

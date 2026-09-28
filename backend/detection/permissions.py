from rest_framework.permissions import BasePermission


def _role(user):
    profile = getattr(user, "profile", None)
    return getattr(profile, "role", None)


class IsFarmer(BasePermission):
    message = "Only farmer accounts can do this."

    def has_permission(self, request, view):
        return bool(request.user and request.user.is_authenticated and _role(request.user) == "farmer")


class IsExpert(BasePermission):
    message = "Only expert accounts can do this."

    def has_permission(self, request, view):
        return bool(request.user and request.user.is_authenticated and _role(request.user) == "expert")

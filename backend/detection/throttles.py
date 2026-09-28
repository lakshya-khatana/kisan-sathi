from rest_framework.throttling import AnonRateThrottle, UserRateThrottle


class AuthThrottle(AnonRateThrottle):
    """Login / register attempts per IP - slows down password guessing."""
    scope = "auth"


class ScanThrottle(UserRateThrottle):
    """Scans per farmer per day - protects the API bill."""
    scope = "scan"

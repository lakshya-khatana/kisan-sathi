from django.conf import settings
from django.db import models


class Profile(models.Model):
    ROLE_FARMER = "farmer"
    ROLE_EXPERT = "expert"
    ROLE_CHOICES = [(ROLE_FARMER, "Farmer"), (ROLE_EXPERT, "Expert")]

    user = models.OneToOneField(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name="profile")
    role = models.CharField(max_length=10, choices=ROLE_CHOICES)

    def __str__(self):
        return f"{self.user.username} ({self.role})"


class Scan(models.Model):
    """One analysis result for a farmer (the photo itself is never stored)."""
    farmer = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name="scans")
    crop = models.CharField(max_length=80)
    disease = models.CharField(max_length=120)
    severity = models.CharField(max_length=20)
    confidence = models.CharField(max_length=10)
    details = models.JSONField(default=dict)   # full normalised result
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["-created_at"]


class Advisory(models.Model):
    """Information (scheme/benefit, tip, alert) posted by an expert for farmers."""
    CATEGORY_CHOICES = [("scheme", "Scheme / Benefit"), ("tip", "Farming Tip"), ("alert", "Alert")]

    author = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name="advisories")
    title = models.CharField(max_length=120)
    message = models.TextField(max_length=2000)
    category = models.CharField(max_length=10, choices=CATEGORY_CHOICES, default="tip")
    crop = models.CharField(max_length=60, blank=True)  # empty = applies to all crops
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["-created_at"]

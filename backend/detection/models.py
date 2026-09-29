from django.conf import settings
from django.db import models


class Profile(models.Model):
    ROLE_FARMER = "farmer"
    ROLE_EXPERT = "expert"
    ROLE_CONSUMER = "consumer"
    ROLE_CHOICES = [(ROLE_FARMER, "Farmer"), (ROLE_EXPERT, "Expert"), (ROLE_CONSUMER, "Consumer")]

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


class Demand(models.Model):
    """A crop a consumer wants to buy. Farmers browse these to decide what to grow/sell."""
    consumer = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name="demands")
    crop = models.CharField(max_length=80)
    quantity = models.CharField(max_length=40)          # free text: "50 kg", "2 quintal" - farmers write units they use
    location = models.CharField(max_length=120)
    budget = models.CharField(max_length=60, blank=True)   # e.g. "₹25/kg" - optional
    notes = models.TextField(max_length=800, blank=True)
    contact_phone = models.CharField(max_length=20)
    is_open = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["-created_at"]


class ProduceListing(models.Model):
    """Produce a farmer has ready to sell. Consumers browse these to buy directly."""
    farmer = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name="produce_listings")
    crop = models.CharField(max_length=80)
    quantity = models.CharField(max_length=40)
    price = models.CharField(max_length=60, blank=True)    # e.g. "₹22/kg" - optional
    location = models.CharField(max_length=120)
    notes = models.TextField(max_length=800, blank=True)
    contact_phone = models.CharField(max_length=20)
    is_available = models.BooleanField(default=True)
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

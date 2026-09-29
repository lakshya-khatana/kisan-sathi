from django.contrib import admin

from .models import Advisory, Demand, ProduceListing, Profile, Scan

admin.site.site_header = "KISAN SATHI – Admin"
admin.site.site_title = "KISAN SATHI Admin"


@admin.register(Profile)
class ProfileAdmin(admin.ModelAdmin):
    list_display = ("user", "role")
    list_filter = ("role",)
    search_fields = ("user__username", "user__first_name")


@admin.register(Advisory)
class AdvisoryAdmin(admin.ModelAdmin):
    """Moderation: review and delete expert posts."""
    list_display = ("title", "category", "crop", "author", "created_at")
    list_filter = ("category", "created_at")
    search_fields = ("title", "message", "author__username")
    date_hierarchy = "created_at"


@admin.register(Scan)
class ScanAdmin(admin.ModelAdmin):
    list_display = ("farmer", "crop", "disease", "severity", "confidence", "created_at")
    list_filter = ("severity", "confidence")
    search_fields = ("farmer__username", "crop", "disease")
    readonly_fields = ("details", "created_at")


@admin.register(Demand)
class DemandAdmin(admin.ModelAdmin):
    """Moderation: review and remove buyer requests (e.g. spam contact numbers)."""
    list_display = ("crop", "quantity", "location", "consumer", "is_open", "created_at")
    list_filter = ("is_open", "created_at")
    search_fields = ("crop", "location", "consumer__username", "contact_phone")
    date_hierarchy = "created_at"


@admin.register(ProduceListing)
class ProduceListingAdmin(admin.ModelAdmin):
    """Moderation: review and remove seller listings."""
    list_display = ("crop", "quantity", "price", "location", "farmer", "is_available", "created_at")
    list_filter = ("is_available", "created_at")
    search_fields = ("crop", "location", "farmer__username", "contact_phone")
    date_hierarchy = "created_at"

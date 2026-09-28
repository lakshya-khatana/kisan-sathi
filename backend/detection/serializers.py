from rest_framework import serializers

from .models import Advisory, Scan


class ScanSerializer(serializers.ModelSerializer):
    class Meta:
        model = Scan
        fields = ["id", "crop", "disease", "severity", "confidence", "details", "created_at"]


class AdvisorySerializer(serializers.ModelSerializer):
    title = serializers.CharField(max_length=120)
    message = serializers.CharField(max_length=2000)
    crop = serializers.CharField(max_length=60, required=False, allow_blank=True)
    author_name = serializers.SerializerMethodField()
    is_mine = serializers.SerializerMethodField()

    class Meta:
        model = Advisory
        fields = ["id", "title", "message", "category", "crop",
                  "created_at", "author_name", "is_mine"]
        read_only_fields = ["id", "created_at", "author_name", "is_mine"]

    def get_author_name(self, obj):
        return obj.author.first_name or "Expert"

    def get_is_mine(self, obj):
        request = self.context.get("request")
        return bool(request and request.user.is_authenticated and obj.author_id == request.user.id)

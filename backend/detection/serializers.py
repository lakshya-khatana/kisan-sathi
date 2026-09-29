from rest_framework import serializers

from .models import Advisory, Demand, ProduceListing, Scan


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


class DemandSerializer(serializers.ModelSerializer):
    """A consumer's request to buy a crop. Farmers read these to see what's needed."""
    crop = serializers.CharField(max_length=80)
    quantity = serializers.CharField(max_length=40)
    location = serializers.CharField(max_length=120)
    budget = serializers.CharField(max_length=60, required=False, allow_blank=True)
    notes = serializers.CharField(max_length=800, required=False, allow_blank=True)
    contact_phone = serializers.CharField(max_length=20)
    consumer_name = serializers.SerializerMethodField()
    is_mine = serializers.SerializerMethodField()

    class Meta:
        model = Demand
        fields = ["id", "crop", "quantity", "location", "budget", "notes", "contact_phone",
                  "is_open", "created_at", "consumer_name", "is_mine"]
        read_only_fields = ["id", "is_open", "created_at", "consumer_name", "is_mine"]

    def get_consumer_name(self, obj):
        return obj.consumer.first_name or "Buyer"

    def get_is_mine(self, obj):
        request = self.context.get("request")
        return bool(request and request.user.is_authenticated and obj.consumer_id == request.user.id)


class ProduceListingSerializer(serializers.ModelSerializer):
    """Produce a farmer has ready to sell. Consumers read these to buy directly."""
    crop = serializers.CharField(max_length=80)
    quantity = serializers.CharField(max_length=40)
    location = serializers.CharField(max_length=120)
    price = serializers.CharField(max_length=60, required=False, allow_blank=True)
    notes = serializers.CharField(max_length=800, required=False, allow_blank=True)
    contact_phone = serializers.CharField(max_length=20)
    farmer_name = serializers.SerializerMethodField()
    is_mine = serializers.SerializerMethodField()

    class Meta:
        model = ProduceListing
        fields = ["id", "crop", "quantity", "location", "price", "notes", "contact_phone",
                  "is_available", "created_at", "farmer_name", "is_mine"]
        read_only_fields = ["id", "is_available", "created_at", "farmer_name", "is_mine"]

    def get_farmer_name(self, obj):
        return obj.farmer.first_name or "Farmer"

    def get_is_mine(self, obj):
        request = self.context.get("request")
        return bool(request and request.user.is_authenticated and obj.farmer_id == request.user.id)

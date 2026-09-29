import logging

from django.shortcuts import get_object_or_404
from rest_framework import status
from rest_framework.decorators import (api_view, authentication_classes,
                                       parser_classes, permission_classes, throttle_classes)
from rest_framework.parsers import MultiPartParser
from rest_framework.permissions import AllowAny
from rest_framework.response import Response

from . import analyzer
from .throttles import ScanThrottle
from .models import Advisory, Demand, ProduceListing, Scan
from .permissions import IsConsumer, IsExpert, IsFarmer
from .serializers import (AdvisorySerializer, DemandSerializer,
                          ProduceListingSerializer, ScanSerializer)

logger = logging.getLogger(__name__)

ALLOWED_CONTENT_TYPES = {"image/jpeg", "image/png", "image/jpg", "image/webp"}
MAX_UPLOAD_BYTES = 8 * 1024 * 1024  # 8 MB


@api_view(["POST"])
@parser_classes([MultiPartParser])
@permission_classes([IsFarmer])
@throttle_classes([ScanThrottle])
def predict_disease(request):
    """POST /api/predict/  (farmers only) - multipart: image, optional crop, language."""
    image_file = request.FILES.get("image")
    if image_file is None:
        return Response({"error": "Please choose a photo first."}, status=status.HTTP_400_BAD_REQUEST)
    if image_file.content_type not in ALLOWED_CONTENT_TYPES:
        return Response({"error": "Please upload a JPEG, PNG or WebP image."}, status=status.HTTP_400_BAD_REQUEST)
    if image_file.size > MAX_UPLOAD_BYTES:
        return Response({"error": "Image too large. Maximum size is 8 MB."}, status=status.HTTP_400_BAD_REQUEST)

    try:
        result = analyzer.analyze(image_file.read(), request.data.get("crop", ""),
                                  str(request.data.get("language", "hinglish")))
    except analyzer.BadImage as exc:
        return Response({"error": str(exc)}, status=status.HTTP_400_BAD_REQUEST)
    except analyzer.AnalysisUnavailable:
        return Response({"error": "Disease analysis is not available right now. Please try again in a few minutes."},
                        status=status.HTTP_503_SERVICE_UNAVAILABLE)

    if result["photo_ok"]:
        Scan.objects.create(farmer=request.user, crop=result["crop"], disease=result["disease"],
                            severity=result["severity"], confidence=result["confidence"], details=result)
    return Response(result, status=status.HTTP_200_OK)


@api_view(["GET"])
@permission_classes([IsFarmer])
def my_scans(request):
    scans = Scan.objects.filter(farmer=request.user)[:50]
    return Response(ScanSerializer(scans, many=True).data)


@api_view(["GET", "POST"])
def advisories(request):
    """
    GET  /api/advisories/          any logged-in user (?mine=1 -> only my posts)
    POST /api/advisories/          experts only
    """
    if request.method == "POST":
        if not IsExpert().has_permission(request, None):
            return Response({"error": IsExpert.message}, status=status.HTTP_403_FORBIDDEN)
        serializer = AdvisorySerializer(data=request.data, context={"request": request})
        if not serializer.is_valid():
            first = next(iter(serializer.errors.values()))[0]
            field = next(iter(serializer.errors.keys()))
            return Response({"error": f"{field}: {first}"}, status=status.HTTP_400_BAD_REQUEST)
        serializer.save(author=request.user)
        return Response(serializer.data, status=status.HTTP_201_CREATED)

    queryset = Advisory.objects.select_related("author")
    if request.query_params.get("mine") == "1":
        queryset = queryset.filter(author=request.user)
    return Response(AdvisorySerializer(queryset[:100], many=True, context={"request": request}).data)


@api_view(["DELETE"])
@permission_classes([IsExpert])
def advisory_detail(request, pk):
    advisory = get_object_or_404(Advisory, pk=pk, author=request.user)
    advisory.delete()
    return Response(status=status.HTTP_204_NO_CONTENT)


@api_view(["GET", "POST"])
def demands(request):
    """
    Marketplace - what buyers want.
    GET  /api/demands/   any logged-in user (?mine=1 -> only my requests, ?crop= filter)
    POST /api/demands/   consumers only
    """
    if request.method == "POST":
        if not IsConsumer().has_permission(request, None):
            return Response({"error": IsConsumer.message}, status=status.HTTP_403_FORBIDDEN)
        serializer = DemandSerializer(data=request.data, context={"request": request})
        if not serializer.is_valid():
            first = next(iter(serializer.errors.values()))[0]
            field = next(iter(serializer.errors.keys()))
            return Response({"error": f"{field}: {first}"}, status=status.HTTP_400_BAD_REQUEST)
        serializer.save(consumer=request.user)
        return Response(serializer.data, status=status.HTTP_201_CREATED)

    queryset = Demand.objects.select_related("consumer")
    if request.query_params.get("mine") == "1":
        queryset = queryset.filter(consumer=request.user)
    else:
        queryset = queryset.filter(is_open=True)
    crop = request.query_params.get("crop")
    if crop:
        queryset = queryset.filter(crop__icontains=crop)
    return Response(DemandSerializer(queryset[:100], many=True, context={"request": request}).data)


@api_view(["DELETE"])
@permission_classes([IsConsumer])
def demand_detail(request, pk):
    """A consumer closes their own request once it's fulfilled (or no longer needed)."""
    demand = get_object_or_404(Demand, pk=pk, consumer=request.user)
    demand.delete()
    return Response(status=status.HTTP_204_NO_CONTENT)


@api_view(["GET", "POST"])
def produce(request):
    """
    Marketplace - what farmers have to sell.
    GET  /api/produce/   any logged-in user (?mine=1 -> only my listings, ?crop= filter)
    POST /api/produce/   farmers only
    """
    if request.method == "POST":
        if not IsFarmer().has_permission(request, None):
            return Response({"error": IsFarmer.message}, status=status.HTTP_403_FORBIDDEN)
        serializer = ProduceListingSerializer(data=request.data, context={"request": request})
        if not serializer.is_valid():
            first = next(iter(serializer.errors.values()))[0]
            field = next(iter(serializer.errors.keys()))
            return Response({"error": f"{field}: {first}"}, status=status.HTTP_400_BAD_REQUEST)
        serializer.save(farmer=request.user)
        return Response(serializer.data, status=status.HTTP_201_CREATED)

    queryset = ProduceListing.objects.select_related("farmer")
    if request.query_params.get("mine") == "1":
        queryset = queryset.filter(farmer=request.user)
    else:
        queryset = queryset.filter(is_available=True)
    crop = request.query_params.get("crop")
    if crop:
        queryset = queryset.filter(crop__icontains=crop)
    return Response(ProduceListingSerializer(queryset[:100], many=True, context={"request": request}).data)


@api_view(["DELETE"])
@permission_classes([IsFarmer])
def produce_detail(request, pk):
    """A farmer removes their own listing once it's sold out."""
    listing = get_object_or_404(ProduceListing, pk=pk, farmer=request.user)
    listing.delete()
    return Response(status=status.HTTP_204_NO_CONTENT)


@api_view(["GET"])
@authentication_classes([])
@permission_classes([AllowAny])
def health_check(request):
    return Response({"status": "ok"})

from django.utils import timezone
from rest_framework import serializers

from .models import BookingRequest, Lease, Vehicle


class VehicleListSerializer(serializers.ModelSerializer):
    class Meta:
        model = Vehicle
        fields = [
            "id",
            "make",
            "model",
            "year",
            "license_plate",
            "color",
            "base_daily_price",
            "minimum_rental_price",
            "status",
        ]


class BookingRequestCreateSerializer(serializers.Serializer):
    vehicle_id = serializers.UUIDField()
    start_at = serializers.DateTimeField()
    end_at = serializers.DateTimeField()

    def validate(self, attrs):
        if attrs["end_at"] <= attrs["start_at"]:
            raise serializers.ValidationError("End time must be after start time.")
        if attrs["start_at"] <= timezone.now():
            raise serializers.ValidationError("Start time must be in the future.")
        return attrs


class BookingRequestSerializer(serializers.ModelSerializer):
    class Meta:
        model = BookingRequest
        fields = [
            "id",
            "user",
            "vehicle",
            "start_at",
            "end_at",
            "quoted_weekly_rate",
            "status",
            "admin_note",
            "created_at",
        ]
        read_only_fields = ["id", "user", "quoted_weekly_rate", "status", "created_at"]


class BookingDecisionSerializer(serializers.Serializer):
    decision = serializers.ChoiceField(choices=["approve", "reject"])
    admin_note = serializers.CharField(allow_blank=True, required=False)


class LeaseSerializer(serializers.ModelSerializer):
    class Meta:
        model = Lease
        fields = [
            "id",
            "lease_number",
            "booking_request",
            "user",
            "vehicle",
            "starts_at",
            "ends_at",
            "weekly_charge",
            "bond_amount",
            "bond_status",
            "status",
        ]

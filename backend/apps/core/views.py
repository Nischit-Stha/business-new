from django.shortcuts import get_object_or_404
from rest_framework import status
from rest_framework.permissions import IsAuthenticated, AllowAny
from rest_framework.response import Response
from rest_framework.views import APIView

from .models import BookingRequest, Vehicle
from .permissions import IsAdminOrOps, IsCustomer
from .serializers import (
    BookingDecisionSerializer,
    BookingRequestCreateSerializer,
    BookingRequestSerializer,
    LeaseSerializer,
    VehicleListSerializer,
)
from .services.booking_service import create_booking_request, decide_booking_request


class PublicVehicleListAPIView(APIView):
    permission_classes = [AllowAny]

    def get(self, request):
        queryset = Vehicle.objects.filter(status=Vehicle.VehicleStatus.AVAILABLE).order_by("base_daily_price")
        serializer = VehicleListSerializer(queryset, many=True)
        return Response(serializer.data)


class CustomerBookingRequestCreateAPIView(APIView):
    permission_classes = [IsAuthenticated, IsCustomer]

    def post(self, request):
        serializer = BookingRequestCreateSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        vehicle = get_object_or_404(Vehicle, id=serializer.validated_data["vehicle_id"])

        try:
            booking_request = create_booking_request(
                user=request.user,
                vehicle=vehicle,
                start_at=serializer.validated_data["start_at"],
                end_at=serializer.validated_data["end_at"],
            )
        except ValueError as exc:
            return Response({"detail": str(exc)}, status=status.HTTP_400_BAD_REQUEST)

        return Response(BookingRequestSerializer(booking_request).data, status=status.HTTP_201_CREATED)


class AdminBookingDecisionAPIView(APIView):
    permission_classes = [IsAuthenticated, IsAdminOrOps]

    def post(self, request, booking_request_id):
        serializer = BookingDecisionSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        booking_request = get_object_or_404(BookingRequest, id=booking_request_id)

        try:
            decided_booking_request, lease = decide_booking_request(
                admin_user=request.user,
                booking_request=booking_request,
                decision=serializer.validated_data["decision"],
                admin_note=serializer.validated_data.get("admin_note", ""),
            )
        except ValueError as exc:
            return Response({"detail": str(exc)}, status=status.HTTP_400_BAD_REQUEST)

        payload = {"booking_request": BookingRequestSerializer(decided_booking_request).data}
        if lease:
            payload["lease"] = LeaseSerializer(lease).data
        return Response(payload, status=status.HTTP_200_OK)

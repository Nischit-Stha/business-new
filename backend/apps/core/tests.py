from decimal import Decimal
from django.test import TestCase
from django.utils import timezone

from .models import BookingRequest, User, Vehicle
from .services.booking_service import create_booking_request


class BookingRequestServiceTests(TestCase):
    def setUp(self):
        self.user = User.objects.create_user(
            email="customer@example.com",
            username="customer",
            password="x",
            role=User.Role.CUSTOMER,
            is_kyc_verified=True,
        )
        self.vehicle = Vehicle.objects.create(
            starr365_external_id="S-1",
            make="Tesla",
            model="Model 3",
            year=2024,
            vin="VIN000001",
            license_plate="ABC123",
            base_daily_price=Decimal("100.00"),
            minimum_rental_price=Decimal("90.00"),
            status=Vehicle.VehicleStatus.AVAILABLE,
        )

    def test_booking_request_creates(self):
        booking_request = create_booking_request(
            user=self.user,
            vehicle=self.vehicle,
            start_at=timezone.now() + timezone.timedelta(days=1),
            end_at=timezone.now() + timezone.timedelta(days=2),
        )
        self.assertEqual(booking_request.status, BookingRequest.BookingStatus.PENDING_ADMIN_REVIEW)

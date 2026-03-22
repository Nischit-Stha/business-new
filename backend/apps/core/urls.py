from django.urls import path

from .views import AdminBookingDecisionAPIView, CustomerBookingRequestCreateAPIView, PublicVehicleListAPIView

urlpatterns = [
    path("vehicles/public/", PublicVehicleListAPIView.as_view(), name="vehicles-public"),
    path("booking-requests/", CustomerBookingRequestCreateAPIView.as_view(), name="booking-request-create"),
    path("admin/booking-requests/<uuid:booking_request_id>/decision/", AdminBookingDecisionAPIView.as_view(), name="admin-booking-decision"),
]

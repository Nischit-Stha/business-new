from django.db import transaction
from django.utils import timezone

from apps.core.models import BookingRequest, Lease, User, Vehicle
from apps.core.services.audit_service import write_audit_log


def _has_vehicle_overlap(vehicle: Vehicle, start_at, end_at) -> bool:
    return BookingRequest.objects.filter(
        vehicle=vehicle,
        status__in=[BookingRequest.BookingStatus.PENDING_ADMIN_REVIEW, BookingRequest.BookingStatus.APPROVED],
        start_at__lt=end_at,
        end_at__gt=start_at,
    ).exists()


@transaction.atomic
def create_booking_request(*, user: User, vehicle: Vehicle, start_at, end_at):
    if user.is_blacklisted:
        raise ValueError("Blacklisted users cannot create booking requests.")
    if not user.is_kyc_verified:
        raise ValueError("KYC verification is required before booking.")
    if vehicle.status != Vehicle.VehicleStatus.AVAILABLE:
        raise ValueError("Vehicle is not available.")
    if start_at <= timezone.now() or end_at <= start_at:
        raise ValueError("Invalid booking date range.")
    if vehicle.base_daily_price < vehicle.minimum_rental_price:
        raise ValueError("Vehicle pricing configuration is invalid.")
    if _has_vehicle_overlap(vehicle, start_at, end_at):
        raise ValueError("Vehicle already has overlapping booking window.")

    booking_request = BookingRequest.objects.create(
        user=user,
        vehicle=vehicle,
        start_at=start_at,
        end_at=end_at,
        quoted_weekly_rate=vehicle.base_daily_price * 7,
        status=BookingRequest.BookingStatus.PENDING_ADMIN_REVIEW,
    )
    write_audit_log(
        actor=user,
        action="booking_request.created",
        entity_type="BookingRequest",
        entity_id=str(booking_request.id),
        metadata={"vehicle_id": str(vehicle.id)},
    )
    return booking_request


@transaction.atomic
def decide_booking_request(*, admin_user: User, booking_request: BookingRequest, decision: str, admin_note: str = ""):
    if booking_request.status != BookingRequest.BookingStatus.PENDING_ADMIN_REVIEW:
        raise ValueError("Only pending booking requests can be decided.")

    booking_request.admin_decision_by = admin_user
    booking_request.admin_decision_at = timezone.now()
    booking_request.admin_note = admin_note

    if decision == "approve":
        booking_request.status = BookingRequest.BookingStatus.APPROVED
        booking_request.save(update_fields=["admin_decision_by", "admin_decision_at", "admin_note", "status", "updated_at"])

        lease = Lease.objects.create(
            booking_request=booking_request,
            user=booking_request.user,
            vehicle=booking_request.vehicle,
            lease_number=f"L-{timezone.now().strftime('%Y%m%d')}-{str(booking_request.id)[:8]}",
            starts_at=booking_request.start_at,
            ends_at=booking_request.end_at,
            weekly_charge=booking_request.quoted_weekly_rate,
            bond_amount=0,
            status=Lease.LeaseStatus.DRAFT,
        )

        booking_request.vehicle.status = Vehicle.VehicleStatus.RESERVED
        booking_request.vehicle.save(update_fields=["status", "updated_at"])

        write_audit_log(
            actor=admin_user,
            action="booking_request.approved",
            entity_type="BookingRequest",
            entity_id=str(booking_request.id),
            metadata={"lease_id": str(lease.id), "note": admin_note},
        )
        return booking_request, lease

    if decision == "reject":
        booking_request.status = BookingRequest.BookingStatus.REJECTED
        booking_request.save(update_fields=["admin_decision_by", "admin_decision_at", "admin_note", "status", "updated_at"])
        write_audit_log(
            actor=admin_user,
            action="booking_request.rejected",
            entity_type="BookingRequest",
            entity_id=str(booking_request.id),
            metadata={"note": admin_note},
        )
        return booking_request, None

    raise ValueError("Decision must be approve or reject.")

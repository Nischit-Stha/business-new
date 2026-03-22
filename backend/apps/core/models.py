import uuid
from decimal import Decimal

from django.conf import settings
from django.contrib.auth.models import AbstractUser
from django.core.validators import MaxValueValidator, MinValueValidator
from django.db import models


class TimeStampedModel(models.Model):
    created_at = models.DateTimeField(auto_now_add=True, db_index=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        abstract = True


class User(AbstractUser, TimeStampedModel):
    class Role(models.TextChoices):
        CUSTOMER = "customer", "Customer"
        ADMIN = "admin", "Admin"
        OPS = "ops", "Operations"
        FINANCE = "finance", "Finance"

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    email = models.EmailField(unique=True, db_index=True)
    role = models.CharField(max_length=20, choices=Role.choices, default=Role.CUSTOMER, db_index=True)
    phone = models.CharField(max_length=32, blank=True)
    is_kyc_verified = models.BooleanField(default=False, db_index=True)
    is_blacklisted = models.BooleanField(default=False, db_index=True)
    risk_score = models.PositiveSmallIntegerField(
        default=0,
        validators=[MinValueValidator(0), MaxValueValidator(100)],
    )
    oauth_provider = models.CharField(max_length=32, blank=True)
    oauth_sub = models.CharField(max_length=255, blank=True, db_index=True)

    USERNAME_FIELD = "email"
    REQUIRED_FIELDS = ["username"]

    def __str__(self):
        return self.email


class CustomerProfile(TimeStampedModel):
    user = models.OneToOneField(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name="customer_profile")
    legal_first_name = models.CharField(max_length=100)
    legal_last_name = models.CharField(max_length=100)
    date_of_birth = models.DateField(null=True, blank=True)
    address_line_1 = models.CharField(max_length=255, blank=True)
    address_line_2 = models.CharField(max_length=255, blank=True)
    city = models.CharField(max_length=120, blank=True)
    state = models.CharField(max_length=120, blank=True)
    postcode = models.CharField(max_length=20, blank=True)
    country = models.CharField(max_length=80, default="Australia")


class DriverLicense(TimeStampedModel):
    class VerificationStatus(models.TextChoices):
        PENDING = "pending", "Pending"
        APPROVED = "approved", "Approved"
        REJECTED = "rejected", "Rejected"

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name="licenses")
    license_number = models.CharField(max_length=64, db_index=True)
    issuing_state = models.CharField(max_length=64)
    expiry_date = models.DateField(db_index=True)
    front_image_key = models.CharField(max_length=512)
    back_image_key = models.CharField(max_length=512, blank=True)
    status = models.CharField(max_length=16, choices=VerificationStatus.choices, default=VerificationStatus.PENDING, db_index=True)
    reviewed_by = models.ForeignKey(settings.AUTH_USER_MODEL, null=True, blank=True, on_delete=models.SET_NULL, related_name="reviewed_licenses")
    reviewed_at = models.DateTimeField(null=True, blank=True)
    rejection_reason = models.TextField(blank=True)


class Vehicle(TimeStampedModel):
    class VehicleStatus(models.TextChoices):
        AVAILABLE = "available", "Available"
        RESERVED = "reserved", "Reserved"
        ON_RENT = "on_rent", "On Rent"
        MAINTENANCE = "maintenance", "In Maintenance"
        OVERDUE = "overdue", "Overdue"

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    starr365_external_id = models.CharField(max_length=128, unique=True, db_index=True)
    make = models.CharField(max_length=80)
    model = models.CharField(max_length=80)
    year = models.PositiveSmallIntegerField(validators=[MinValueValidator(1990), MaxValueValidator(2100)])
    vin = models.CharField(max_length=32, unique=True, db_index=True)
    license_plate = models.CharField(max_length=32, unique=True, db_index=True)
    color = models.CharField(max_length=40, blank=True)
    mileage_km = models.PositiveIntegerField(default=0)
    base_daily_price = models.DecimalField(max_digits=10, decimal_places=2, validators=[MinValueValidator(Decimal("0.00"))])
    minimum_rental_price = models.DecimalField(max_digits=10, decimal_places=2, validators=[MinValueValidator(Decimal("0.00"))])
    status = models.CharField(max_length=20, choices=VehicleStatus.choices, default=VehicleStatus.AVAILABLE, db_index=True)
    registration_expiry = models.DateField(null=True, blank=True, db_index=True)
    insurance_expiry = models.DateField(null=True, blank=True, db_index=True)
    next_service_due_date = models.DateField(null=True, blank=True, db_index=True)
    next_service_due_km = models.PositiveIntegerField(null=True, blank=True)

    class Meta:
        indexes = [
            models.Index(fields=["status", "base_daily_price"]),
            models.Index(fields=["make", "model", "year"]),
        ]


class VehicleDocument(TimeStampedModel):
    class DocType(models.TextChoices):
        REGISTRATION = "registration", "Registration"
        INSURANCE = "insurance", "Insurance"
        LEASE = "lease", "Lease"
        INSPECTION = "inspection", "Inspection"
        OTHER = "other", "Other"

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    vehicle = models.ForeignKey(Vehicle, on_delete=models.CASCADE, related_name="documents")
    doc_type = models.CharField(max_length=20, choices=DocType.choices, db_index=True)
    file_key = models.CharField(max_length=512)
    effective_date = models.DateField(null=True, blank=True)
    expiry_date = models.DateField(null=True, blank=True, db_index=True)
    uploaded_by = models.ForeignKey(settings.AUTH_USER_MODEL, null=True, blank=True, on_delete=models.SET_NULL)


class BookingRequest(TimeStampedModel):
    class BookingStatus(models.TextChoices):
        PENDING_ADMIN_REVIEW = "pending_admin_review", "Pending Admin Review"
        APPROVED = "approved", "Approved"
        REJECTED = "rejected", "Rejected"
        CANCELLED = "cancelled", "Cancelled"

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.PROTECT, related_name="booking_requests")
    vehicle = models.ForeignKey(Vehicle, on_delete=models.PROTECT, related_name="booking_requests")
    start_at = models.DateTimeField(db_index=True)
    end_at = models.DateTimeField(db_index=True)
    quoted_weekly_rate = models.DecimalField(max_digits=10, decimal_places=2, validators=[MinValueValidator(Decimal("0.00"))])
    status = models.CharField(max_length=30, choices=BookingStatus.choices, default=BookingStatus.PENDING_ADMIN_REVIEW, db_index=True)
    admin_decision_by = models.ForeignKey(settings.AUTH_USER_MODEL, null=True, blank=True, on_delete=models.SET_NULL, related_name="decided_booking_requests")
    admin_decision_at = models.DateTimeField(null=True, blank=True)
    admin_note = models.TextField(blank=True)

    class Meta:
        constraints = [
            models.CheckConstraint(check=models.Q(end_at__gt=models.F("start_at")), name="booking_end_after_start"),
            models.CheckConstraint(check=models.Q(quoted_weekly_rate__gte=0), name="booking_quote_non_negative"),
        ]
        indexes = [
            models.Index(fields=["vehicle", "start_at", "end_at"]),
            models.Index(fields=["user", "status"]),
        ]


class BookingAddon(TimeStampedModel):
    booking_request = models.ForeignKey(BookingRequest, on_delete=models.CASCADE, related_name="addons")
    code = models.CharField(max_length=64)
    label = models.CharField(max_length=120)
    unit_price = models.DecimalField(max_digits=10, decimal_places=2)
    quantity = models.PositiveIntegerField(default=1)


class Lease(TimeStampedModel):
    class LeaseStatus(models.TextChoices):
        DRAFT = "draft", "Draft"
        ACTIVE = "active", "Active"
        COMPLETED = "completed", "Completed"
        TERMINATED = "terminated", "Terminated"
        OVERDUE = "overdue", "Overdue"

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    booking_request = models.OneToOneField(BookingRequest, on_delete=models.PROTECT, related_name="lease")
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.PROTECT, related_name="leases")
    vehicle = models.ForeignKey(Vehicle, on_delete=models.PROTECT, related_name="leases")
    lease_number = models.CharField(max_length=64, unique=True, db_index=True)
    starts_at = models.DateTimeField(db_index=True)
    ends_at = models.DateTimeField(db_index=True)
    weekly_charge = models.DecimalField(max_digits=10, decimal_places=2)
    bond_amount = models.DecimalField(max_digits=10, decimal_places=2, default=Decimal("0.00"))
    bond_status = models.CharField(max_length=30, default="held", db_index=True)
    status = models.CharField(max_length=20, choices=LeaseStatus.choices, default=LeaseStatus.DRAFT, db_index=True)
    signed_pdf_key = models.CharField(max_length=512, blank=True)
    terminated_reason = models.TextField(blank=True)

    class Meta:
        constraints = [
            models.CheckConstraint(check=models.Q(ends_at__gt=models.F("starts_at")), name="lease_end_after_start"),
        ]


class Invoice(TimeStampedModel):
    class InvoiceStatus(models.TextChoices):
        PENDING = "pending", "Pending"
        PAID = "paid", "Paid"
        OVERDUE = "overdue", "Overdue"
        VOID = "void", "Void"

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    lease = models.ForeignKey(Lease, on_delete=models.PROTECT, related_name="invoices")
    invoice_number = models.CharField(max_length=64, unique=True, db_index=True)
    period_start = models.DateField()
    period_end = models.DateField()
    subtotal = models.DecimalField(max_digits=12, decimal_places=2)
    tax = models.DecimalField(max_digits=12, decimal_places=2, default=Decimal("0.00"))
    total = models.DecimalField(max_digits=12, decimal_places=2)
    due_date = models.DateField(db_index=True)
    status = models.CharField(max_length=20, choices=InvoiceStatus.choices, default=InvoiceStatus.PENDING, db_index=True)
    pdf_key = models.CharField(max_length=512, blank=True)


class Payment(TimeStampedModel):
    class PaymentStatus(models.TextChoices):
        INITIATED = "initiated", "Initiated"
        SUCCEEDED = "succeeded", "Succeeded"
        FAILED = "failed", "Failed"
        REFUNDED = "refunded", "Refunded"

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    invoice = models.ForeignKey(Invoice, on_delete=models.PROTECT, related_name="payments")
    provider = models.CharField(max_length=40)
    provider_payment_id = models.CharField(max_length=128, db_index=True)
    amount = models.DecimalField(max_digits=12, decimal_places=2)
    currency = models.CharField(max_length=8, default="AUD")
    status = models.CharField(max_length=20, choices=PaymentStatus.choices, default=PaymentStatus.INITIATED, db_index=True)
    paid_at = models.DateTimeField(null=True, blank=True)


class TollFineCharge(TimeStampedModel):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    lease = models.ForeignKey(Lease, on_delete=models.PROTECT, related_name="toll_fine_charges")
    charge_type = models.CharField(max_length=20, db_index=True)  # toll | fine
    occurred_at = models.DateTimeField(db_index=True)
    amount = models.DecimalField(max_digits=10, decimal_places=2)
    reference_number = models.CharField(max_length=80, blank=True)
    note = models.TextField(blank=True)


class ServiceLog(TimeStampedModel):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    vehicle = models.ForeignKey(Vehicle, on_delete=models.CASCADE, related_name="service_logs")
    odometer_km = models.PositiveIntegerField()
    service_type = models.CharField(max_length=120)
    cost = models.DecimalField(max_digits=10, decimal_places=2)
    notes = models.TextField(blank=True)
    performed_at = models.DateTimeField(db_index=True)


class ConditionReport(TimeStampedModel):
    class ReportType(models.TextChoices):
        PRE_RENT = "pre_rent", "Pre Rent"
        POST_RENT = "post_rent", "Post Rent"

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    lease = models.ForeignKey(Lease, on_delete=models.CASCADE, related_name="condition_reports")
    report_type = models.CharField(max_length=20, choices=ReportType.choices, db_index=True)
    odometer_km = models.PositiveIntegerField(null=True, blank=True)
    notes = models.TextField(blank=True)
    created_by = models.ForeignKey(settings.AUTH_USER_MODEL, null=True, blank=True, on_delete=models.SET_NULL)


class ConditionPhoto(TimeStampedModel):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    report = models.ForeignKey(ConditionReport, on_delete=models.CASCADE, related_name="photos")
    file_key = models.CharField(max_length=512)
    label = models.CharField(max_length=80, blank=True)


class AuditLog(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    actor = models.ForeignKey(settings.AUTH_USER_MODEL, null=True, blank=True, on_delete=models.SET_NULL)
    action = models.CharField(max_length=120, db_index=True)
    entity_type = models.CharField(max_length=80, db_index=True)
    entity_id = models.CharField(max_length=80, db_index=True)
    metadata = models.JSONField(default=dict)
    created_at = models.DateTimeField(auto_now_add=True, db_index=True)

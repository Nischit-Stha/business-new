from celery import shared_task
from django.utils import timezone

from apps.core.models import Lease, Vehicle
from apps.core.services.billing_service import create_weekly_invoice_for_lease


@shared_task
def generate_weekly_invoices_task():
    active_leases = Lease.objects.filter(status=Lease.LeaseStatus.ACTIVE)
    for lease in active_leases:
        create_weekly_invoice_for_lease(lease)


@shared_task
def compliance_alerts_task():
    today = timezone.localdate()
    threshold = today.replace(day=today.day)
    vehicles = Vehicle.objects.filter(
        registration_expiry__isnull=False,
        registration_expiry__lte=threshold,
    )
    return {"vehicles_due": vehicles.count()}

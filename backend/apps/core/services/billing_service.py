from datetime import timedelta
from decimal import Decimal

from django.utils import timezone

from apps.core.models import Invoice, Lease
from apps.core.services.audit_service import write_audit_log


def create_weekly_invoice_for_lease(lease: Lease) -> Invoice:
    today = timezone.localdate()
    period_start = today
    period_end = today + timedelta(days=6)
    subtotal = lease.weekly_charge
    tax = (subtotal * Decimal("0.10")).quantize(Decimal("0.01"))
    total = subtotal + tax

    invoice = Invoice.objects.create(
        lease=lease,
        invoice_number=f"INV-{today.strftime('%Y%m%d')}-{str(lease.id)[:8]}",
        period_start=period_start,
        period_end=period_end,
        subtotal=subtotal,
        tax=tax,
        total=total,
        due_date=today + timedelta(days=7),
        status=Invoice.InvoiceStatus.PENDING,
    )
    write_audit_log(
        actor=None,
        action="invoice.generated.weekly",
        entity_type="Invoice",
        entity_id=str(invoice.id),
        metadata={"lease_id": str(lease.id)},
    )
    return invoice

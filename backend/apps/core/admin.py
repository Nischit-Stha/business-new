from django.contrib import admin

from .models import (
    AuditLog,
    BookingAddon,
    BookingRequest,
    ConditionPhoto,
    ConditionReport,
    CustomerProfile,
    DriverLicense,
    Invoice,
    Lease,
    Payment,
    ServiceLog,
    TollFineCharge,
    User,
    Vehicle,
    VehicleDocument,
)

admin.site.register(User)
admin.site.register(CustomerProfile)
admin.site.register(DriverLicense)
admin.site.register(Vehicle)
admin.site.register(VehicleDocument)
admin.site.register(BookingRequest)
admin.site.register(BookingAddon)
admin.site.register(Lease)
admin.site.register(Invoice)
admin.site.register(Payment)
admin.site.register(TollFineCharge)
admin.site.register(ServiceLog)
admin.site.register(ConditionReport)
admin.site.register(ConditionPhoto)
admin.site.register(AuditLog)

from decimal import Decimal

from django.conf import settings

from apps.core.models import Vehicle
from apps.integrations.starr365 import Starr365Client, Starr365Config


def sync_starr365_inventory():
    base_url = getattr(settings, "STARR365_BASE_URL", "")
    api_key = getattr(settings, "STARR365_API_KEY", "")
    client = Starr365Client(Starr365Config(base_url=base_url, api_key=api_key))

    vehicles = client.fetch_inventory()
    upserted = 0

    for item in vehicles:
        Vehicle.objects.update_or_create(
            starr365_external_id=item["id"],
            defaults={
                "make": item.get("make", "Unknown"),
                "model": item.get("model", "Unknown"),
                "year": int(item.get("year", 2024)),
                "vin": item.get("vin", f"VIN-{item['id']}"),
                "license_plate": item.get("license_plate", f"PLATE-{item['id']}"),
                "color": item.get("color", ""),
                "mileage_km": int(item.get("mileage_km", 0)),
                "base_daily_price": Decimal(str(item.get("base_daily_price", "0"))),
                "minimum_rental_price": Decimal(str(item.get("minimum_rental_price", item.get("minimum_bid_price", "0")))),
                "status": item.get("status", Vehicle.VehicleStatus.AVAILABLE),
            },
        )
        upserted += 1

    return {"upserted": upserted}

from dataclasses import dataclass
from typing import Any


@dataclass
class Starr365Config:
    base_url: str
    api_key: str


class Starr365Client:
    def __init__(self, config: Starr365Config):
        self.config = config

    def fetch_inventory(self) -> list[dict[str, Any]]:
        # TODO: Replace with real API call and robust retry/backoff strategy.
        return []

    def fetch_vehicle_status(self, external_id: str) -> dict[str, Any]:
        # TODO: Replace with real status endpoint call.
        return {"external_id": external_id, "status": "available"}

from apps.core.models import AuditLog


def write_audit_log(*, actor, action: str, entity_type: str, entity_id: str, metadata: dict | None = None) -> None:
    AuditLog.objects.create(
        actor=actor,
        action=action,
        entity_type=entity_type,
        entity_id=entity_id,
        metadata=metadata or {},
    )

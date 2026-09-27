from typing import Any, Dict, Optional
from sqlalchemy.orm import Session
from app.models.audit_log import AuditLog
from app.utils.datetime import utc_now


def log_audit_event(
    db: Session,
    action: str,
    resource_type: str,
    resource_id: str,
    actor_id: Optional[str] = None,
    metadata: Optional[Dict[str, Any]] = None,
    ip_address: Optional[str] = None,
) -> AuditLog:
    """Record an immutable audit log entry for system governance and security compliance."""
    # Ensure sensitive data (passwords, answer keys) are never logged
    sanitized_metadata = dict(metadata or {})
    for key in list(sanitized_metadata.keys()):
        if any(sensitive in key.lower() for sensitive in ["password", "secret", "token", "correct_answer"]):
            sanitized_metadata[key] = "[REDACTED]"

    log_entry = AuditLog(
        actor_id=actor_id,
        action=action,
        resource_type=resource_type,
        resource_id=resource_id,
        timestamp=utc_now(),
        metadata_json=sanitized_metadata,
        ip_address=ip_address,
    )
    db.add(log_entry)
    db.commit()
    db.refresh(log_entry)
    return log_entry

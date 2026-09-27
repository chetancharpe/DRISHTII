from datetime import datetime, timezone


def utc_now() -> datetime:
    """Return current timezone-aware UTC datetime."""
    return datetime.now(timezone.utc)


def ensure_utc(dt: datetime) -> datetime:
    """Ensure datetime object is timezone-aware in UTC."""
    if dt is None:
        return None
    if dt.tzinfo is None:
        return dt.replace(tzinfo=timezone.utc)
    return dt.astimezone(timezone.utc)


def format_iso(dt: datetime) -> str:
    """Safely format datetime to ISO 8601 string."""
    if dt is None:
        return ""
    dt = ensure_utc(dt)
    return dt.isoformat()



def seconds_until(future_dt: datetime) -> int:
    """Calculate remaining seconds until future datetime relative to authoritative UTC clock."""
    if not future_dt:
        return 0
    now = utc_now()
    if future_dt.tzinfo is None:
        future_dt = future_dt.replace(tzinfo=timezone.utc)
    diff = (future_dt - now).total_seconds()
    return max(0, int(diff))

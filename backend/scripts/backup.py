"""
GoWow Database Backup Automation Script (Sections 10 & 11)
Automates full database backups, gzip compression, SHA-256 integrity checksums,
and retention lifecycle pruning for PostgreSQL and SQLite.
"""

import os
import sys
import shutil
import hashlib
import gzip
import time
from datetime import datetime, timezone
from urllib.parse import urlparse

# Add parent directory to sys.path
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))
from app.core.config import settings


def compute_sha256(filepath: str) -> str:
    """Computes SHA-256 checksum of an archive."""
    hasher = hashlib.sha256()
    with open(filepath, "rb") as f:
        while chunk := f.read(65536):
            hasher.update(chunk)
    return hasher.hexdigest()


def prune_old_backups(backup_dir: str, retention_days: int) -> None:
    """Removes backups older than retention_days."""
    now = time.time()
    cutoff = now - (retention_days * 86400)
    for fname in os.listdir(backup_dir):
        fpath = os.path.join(backup_dir, fname)
        if os.path.isfile(fpath) and os.stat(fpath).st_mtime < cutoff:
            os.remove(fpath)
            print(f"[Backup Prune] Removed expired backup file: {fname}")


def run_backup() -> str:
    timestamp = datetime.now(timezone.utc).strftime("%Y%m%d_%H%M%S")
    backup_dir = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "backups"))
    os.makedirs(backup_dir, exist_ok=True)

    db_url = settings.DATABASE_URL
    print(f"[{datetime.now(timezone.utc).isoformat()}] Starting GoWow Database Backup...")

    if db_url.startswith("sqlite"):
        # SQLite Snapshot Backup
        db_path = db_url.replace("sqlite:///", "")
        if not os.path.exists(db_path):
            raise FileNotFoundError(f"Source database file not found at: {db_path}")

        archive_filename = f"gowow_backup_{timestamp}.sqlite.gz"
        archive_path = os.path.join(backup_dir, archive_filename)

        with open(db_path, "rb") as f_in, gzip.open(archive_path, "wb") as f_out:
            shutil.copyfileobj(f_in, f_out)

    elif db_url.startswith("postgresql"):
        # PostgreSQL pg_dump
        parsed = urlparse(db_url)
        archive_filename = f"gowow_pg_backup_{timestamp}.sql.gz"
        archive_path = os.path.join(backup_dir, archive_filename)

        cmd = (
            f"PGPASSWORD='{parsed.password}' pg_dump -h {parsed.hostname} "
            f"-p {parsed.port or 5432} -U {parsed.username} {parsed.path.lstrip('/')} | gzip > '{archive_path}'"
        )
        ret = os.system(cmd)
        if ret != 0:
            raise RuntimeError(f"pg_dump exited with error code {ret}")
    else:
        raise ValueError(f"Unsupported database scheme in URL: {db_url}")

    # Generate Checksum
    checksum = compute_sha256(archive_path)
    checksum_path = f"{archive_path}.sha256"
    with open(checksum_path, "w") as f:
        f.write(f"{checksum}  {archive_filename}\n")

    # Enforce Retention
    prune_old_backups(backup_dir, settings.BACKUP_RETENTION_DAYS)

    print(f"[{datetime.now(timezone.utc).isoformat()}] Backup Completed Successfully!")
    print(f"  Archive:  {archive_path}")
    print(f"  SHA-256:  {checksum}")
    print(f"  Checksum: {checksum_path}")
    return archive_path


if __name__ == "__main__":
    try:
        run_backup()
    except Exception as e:
        print(f"[Backup Error] {str(e)}", file=sys.stderr)
        sys.exit(1)

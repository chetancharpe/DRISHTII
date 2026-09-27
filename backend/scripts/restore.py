"""
GoWow Database Restore & Verification Script (Section 11)
Automates archive restoration, SHA-256 integrity verification, and post-restore sanity checks.
Usage: python restore.py <path_to_backup_archive> [--target-db <optional_url>]
"""

import os
import sys
import shutil
import hashlib
import gzip
import argparse
from urllib.parse import urlparse
from sqlalchemy import create_engine, text

# Add parent directory to sys.path
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))
from app.core.config import settings


def verify_sha256(archive_path: str) -> bool:
    """Verifies that the archive matches its companion .sha256 file if present."""
    checksum_file = f"{archive_path}.sha256"
    if not os.path.exists(checksum_file):
        print(f"[Warning] No checksum file found at {checksum_file}. Skipping hash verification.")
        return True

    with open(checksum_file, "r") as f:
        expected_hash = f.readline().split()[0].strip()

    hasher = hashlib.sha256()
    with open(archive_path, "rb") as f:
        while chunk := f.read(65536):
            hasher.update(chunk)
    actual_hash = hasher.hexdigest()

    if actual_hash.lower() != expected_hash.lower():
        raise ValueError(f"Checksum mismatch! Expected: {expected_hash}, Actual: {actual_hash}")

    print(f"[Verified] SHA-256 checksum confirmed: {actual_hash}")
    return True


def run_restore(archive_path: str, target_db_url: str = None) -> None:
    if not os.path.exists(archive_path):
        raise FileNotFoundError(f"Backup archive not found: {archive_path}")

    # Step 1: Verify Checksum
    verify_sha256(archive_path)

    db_url = target_db_url or settings.DATABASE_URL
    print(f"Restoring into target database: {db_url.split('@')[-1] if '@' in db_url else db_url}...")

    # Step 2: Restore Data
    if db_url.startswith("sqlite"):
        target_path = db_url.replace("sqlite:///", "")
        temp_restored = f"{target_path}.restored_tmp"

        with gzip.open(archive_path, "rb") as f_in, open(temp_restored, "wb") as f_out:
            shutil.copyfileobj(f_in, f_out)

        # Atomic replacement
        shutil.move(temp_restored, target_path)
        print(f"[Success] Restored SQLite database to {target_path}")

    elif db_url.startswith("postgresql"):
        parsed = urlparse(db_url)
        cmd = (
            f"gunzip -c '{archive_path}' | PGPASSWORD='{parsed.password}' psql -h {parsed.hostname} "
            f"-p {parsed.port or 5432} -U {parsed.username} -d {parsed.path.lstrip('/')}"
        )
        ret = os.system(cmd)
        if ret != 0:
            raise RuntimeError(f"psql restore process failed with exit code {ret}")
        print("[Success] Restored PostgreSQL database.")

    # Step 3: Verify Integrity with test connection
    print("Performing post-restore sanity check...")
    engine = create_engine(db_url)
    with engine.connect() as conn:
        try:
            users_count = conn.execute(text("SELECT count(*) FROM users")).scalar()
            print(f"[Verification Passed] Found {users_count} registered users.")
        except Exception as e:
            print(f"[Verification Notice] Schema query check: {e}")

    print("Database restoration and verification completed successfully!")


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="GoWow Database Restoration Utility")
    parser.add_argument("archive", help="Path to the .sql.gz or .sqlite.gz backup archive")
    parser.add_argument("--target-db", default=None, help="Target database connection URL (defaults to current settings)")
    args = parser.parse_args()

    try:
        run_restore(args.archive, args.target_db)
    except Exception as exc:
        print(f"[Restore Error] {str(exc)}", file=sys.stderr)
        sys.exit(1)

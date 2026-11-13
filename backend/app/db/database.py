from pathlib import Path
from typing import Generator
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, Session
from app.core.config import settings

# Engine configuration
connect_args = {}
db_url = settings.DATABASE_URL
if db_url.startswith("postgres://"):
    db_url = db_url.replace("postgres://", "postgresql://", 1)

if db_url.startswith("sqlite"):
    connect_args["check_same_thread"] = False
    # If SQLite URL is relative (e.g. sqlite:///./gowow.db or sqlite:///gowow.db),
    # anchor it definitively to the backend folder so working directory does not matter.
    if db_url.startswith("sqlite:///") and not db_url.startswith("sqlite:////"):
        raw_db_file = db_url[len("sqlite:///"):]
        if raw_db_file.startswith("./"):
            raw_db_file = raw_db_file[2:]
        backend_dir = Path(__file__).resolve().parent.parent.parent
        abs_db_file = backend_dir / raw_db_file
        db_url = f"sqlite:///{abs_db_file.as_posix()}"

engine = create_engine(
    db_url,
    connect_args=connect_args,
    pool_pre_ping=True,
    echo=False,
)

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)


def get_db() -> Generator[Session, None, None]:
    """
    FastAPI dependency yielding a database session per request.
    Rolls back automatically in the event of an unhandled error.
    """
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

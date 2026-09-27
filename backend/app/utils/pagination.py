from typing import Any, Generic, List, Sequence, TypeVar
from pydantic import BaseModel
from sqlalchemy.orm import Query

T = TypeVar("T")


class Page(BaseModel, Generic[T]):
    items: List[T]
    total: int
    page: int
    limit: int
    total_pages: int


def paginate(query: Query, page: int = 1, limit: int = 20) -> tuple[List[Any], int, int]:
    """
    Paginate a SQLAlchemy query safely with bounds checking.
    Returns (items, total_count, total_pages).
    """
    page = max(1, page)
    limit = max(1, min(limit, 100))  # Capped at 100 to prevent DOS
    
    total = query.count()
    total_pages = (total + limit - 1) // limit if total > 0 else 1
    offset = (page - 1) * limit
    
    items = query.offset(offset).limit(limit).all()
    return items, total, total_pages

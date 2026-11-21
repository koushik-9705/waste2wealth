"""Standard success envelope (docs/API_Design.md 2.3) and pagination."""

import math
from typing import Generic, TypeVar

from pydantic import BaseModel

T = TypeVar("T")


class ApiResponse(BaseModel, Generic[T]):
    success: bool = True
    message: str = "OK"
    data: T | None = None


class Page(BaseModel, Generic[T]):
    items: list[T]
    page: int
    page_size: int
    total: int
    total_pages: int

    @classmethod
    def build(cls, items: list[T], page: int, page_size: int, total: int) -> "Page[T]":
        return cls(
            items=items,
            page=page,
            page_size=page_size,
            total=total,
            total_pages=math.ceil(total / page_size) if total else 0,
        )


def ok(data: T | None = None, message: str = "OK") -> ApiResponse[T]:
    return ApiResponse(success=True, message=message, data=data)

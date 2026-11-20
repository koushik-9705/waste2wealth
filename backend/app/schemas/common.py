"""Standard success envelope (docs/API_Design.md 2.3)."""

from typing import Generic, TypeVar

from pydantic import BaseModel

T = TypeVar("T")


class ApiResponse(BaseModel, Generic[T]):
    success: bool = True
    message: str = "OK"
    data: T | None = None


def ok(data: T | None = None, message: str = "OK") -> ApiResponse[T]:
    return ApiResponse(success=True, message=message, data=data)

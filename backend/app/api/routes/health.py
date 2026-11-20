from fastapi import APIRouter

from app.core.config import get_settings
from app.schemas.common import ApiResponse, ok

router = APIRouter(tags=["health"])


@router.get("/health", response_model=ApiResponse[dict])
def health() -> ApiResponse[dict]:
    settings = get_settings()
    return ok({"status": "ok", "service": settings.app_name, "environment": settings.environment})

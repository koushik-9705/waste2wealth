from fastapi import APIRouter, Depends

from app.api.dependencies.auth import CurrentUser, get_current_user, get_profile_service
from app.schemas.common import ApiResponse, ok
from app.schemas.profile import ProfileOut, ProfileUpdate
from app.services.profile_service import ProfileService

router = APIRouter(prefix="/profiles", tags=["profiles"])


@router.get("/me", response_model=ApiResponse[ProfileOut])
def get_my_profile(
    user: CurrentUser = Depends(get_current_user),
    service: ProfileService = Depends(get_profile_service),
) -> ApiResponse[ProfileOut]:
    return ok(service.get_profile(user.id))


@router.patch("/me", response_model=ApiResponse[ProfileOut])
def update_my_profile(
    changes: ProfileUpdate,
    user: CurrentUser = Depends(get_current_user),
    service: ProfileService = Depends(get_profile_service),
) -> ApiResponse[ProfileOut]:
    return ok(service.update_profile(user.id, changes), "Profile updated")

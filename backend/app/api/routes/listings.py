from typing import Annotated
from uuid import UUID

from fastapi import APIRouter, Depends, File, Query, UploadFile, status

from app.api.dependencies.auth import (
    get_current_profile,
    get_current_user,
    get_listing_service,
    require_roles,
)
from app.schemas.common import ApiResponse, Page, ok
from app.schemas.listing import ListingCreate, ListingFilters, ListingOut, ListingUpdate
from app.schemas.profile import ProfileOut
from app.services.listing_service import MAX_IMAGE_BYTES, ListingService

router = APIRouter(prefix="/listings", tags=["listings"])

Service = Annotated[ListingService, Depends(get_listing_service)]
Filters = Annotated[ListingFilters, Query()]


@router.get("", response_model=ApiResponse[Page[ListingOut]], dependencies=[Depends(get_current_user)])
def browse_listings(service: Service, filters: Filters) -> ApiResponse[Page[ListingOut]]:
    """Listings visible to the caller: all active listings, plus their own (RLS)."""
    return ok(service.search(filters))


@router.get("/mine", response_model=ApiResponse[Page[ListingOut]])
def my_listings(service: Service, filters: Filters) -> ApiResponse[Page[ListingOut]]:
    """The caller's own listings in any status. No role lookup needed: the query is
    filtered to owner_id = caller (and RLS), so other account types just get an empty list."""
    return ok(service.search(filters, mine=True))


@router.post("", response_model=ApiResponse[ListingOut], status_code=status.HTTP_201_CREATED)
def create_listing(
    data: ListingCreate,
    service: Service,
    _: ProfileOut = Depends(require_roles("generator")),
) -> ApiResponse[ListingOut]:
    return ok(service.create(data), "Listing created successfully")


@router.get("/{listing_id}", response_model=ApiResponse[ListingOut])
def get_listing(listing_id: UUID, service: Service) -> ApiResponse[ListingOut]:
    return ok(service.get(str(listing_id)))


@router.patch("/{listing_id}", response_model=ApiResponse[ListingOut])
def update_listing(
    listing_id: UUID,
    changes: ListingUpdate,
    service: Service,
    profile: ProfileOut = Depends(get_current_profile),
) -> ApiResponse[ListingOut]:
    return ok(service.update(str(listing_id), changes, is_admin=profile.account_type == "admin"),
              "Listing updated")


@router.delete("/{listing_id}", response_model=ApiResponse[None])
def delete_listing(
    listing_id: UUID,
    service: Service,
    profile: ProfileOut = Depends(get_current_profile),
) -> ApiResponse[None]:
    service.delete(str(listing_id), is_admin=profile.account_type == "admin")
    return ok(None, "Listing deleted")


@router.post("/{listing_id}/images", response_model=ApiResponse[ListingOut])
def upload_listing_images(
    listing_id: UUID,
    service: Service,
    files: list[UploadFile] = File(..., description="Up to 5 JPEG/PNG/WebP images, 5 MB each"),
) -> ApiResponse[ListingOut]:
    # Read at most limit+1 bytes so oversized files are rejected without loading them fully.
    contents = [(f.file.read(MAX_IMAGE_BYTES + 1), f.filename) for f in files]
    return ok(service.add_images(str(listing_id), contents), "Images uploaded")


@router.delete("/{listing_id}/images", response_model=ApiResponse[ListingOut])
def delete_listing_image(
    listing_id: UUID,
    service: Service,
    path: str = Query(..., description="Image path as returned in images[].path"),
) -> ApiResponse[ListingOut]:
    return ok(service.remove_image(str(listing_id), path), "Image removed")

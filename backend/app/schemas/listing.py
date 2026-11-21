from datetime import datetime
from decimal import Decimal
from typing import Literal

from pydantic import BaseModel, ConfigDict, Field, model_validator

WasteCategory = Literal["agricultural", "electronic"]
ListingStatus = Literal["active", "reserved", "completed", "cancelled"]
Unit = Literal["kg", "tonne", "piece", "litre"]
SortField = Literal["newest", "oldest", "quantity_asc", "quantity_desc", "price_asc", "price_desc"]

MAX_PAGE_SIZE = 100


class ListingImage(BaseModel):
    path: str
    url: str | None = None  # short-lived signed URL (private bucket)


class _ListingFields(BaseModel):
    model_config = ConfigDict(extra="forbid", str_strip_whitespace=True)

    material_name: str = Field(min_length=2, max_length=120)
    description: str | None = Field(default=None, max_length=2000)
    quantity: Decimal = Field(gt=0, max_digits=12, decimal_places=2)
    unit: Unit
    material_condition: str = Field(min_length=2, max_length=120)
    location: str = Field(min_length=2, max_length=200)
    latitude: Decimal | None = Field(default=None, ge=-90, le=90, max_digits=9, decimal_places=6)
    longitude: Decimal | None = Field(default=None, ge=-180, le=180, max_digits=9, decimal_places=6)
    expected_price: Decimal | None = Field(default=None, ge=0, max_digits=12, decimal_places=2)

    @model_validator(mode="after")
    def _coords_together(self):
        if (self.latitude is None) != (self.longitude is None):
            raise ValueError("latitude and longitude must be provided together")
        return self


class ListingCreate(_ListingFields):
    waste_category: WasteCategory


class ListingUpdate(BaseModel):
    """Partial update. Owners may cancel or reopen a listing; 'reserved' and
    'completed' are set only by the request workflow (transition_request)."""

    model_config = ConfigDict(extra="forbid", str_strip_whitespace=True)

    material_name: str | None = Field(default=None, min_length=2, max_length=120)
    description: str | None = Field(default=None, max_length=2000)
    quantity: Decimal | None = Field(default=None, gt=0, max_digits=12, decimal_places=2)
    unit: Unit | None = None
    material_condition: str | None = Field(default=None, min_length=2, max_length=120)
    location: str | None = Field(default=None, min_length=2, max_length=200)
    latitude: Decimal | None = Field(default=None, ge=-90, le=90, max_digits=9, decimal_places=6)
    longitude: Decimal | None = Field(default=None, ge=-180, le=180, max_digits=9, decimal_places=6)
    expected_price: Decimal | None = Field(default=None, ge=0, max_digits=12, decimal_places=2)
    status: Literal["active", "cancelled"] | None = None


class ListingOut(BaseModel):
    listing_id: str
    owner_id: str
    waste_category: WasteCategory
    material_name: str
    description: str | None = None
    quantity: Decimal
    unit: str
    material_condition: str
    location: str
    latitude: Decimal | None = None
    longitude: Decimal | None = None
    expected_price: Decimal | None = None
    status: ListingStatus
    images: list[ListingImage] = []
    is_owner: bool = False
    created_at: datetime
    updated_at: datetime


class ListingFilters(BaseModel):
    category: WasteCategory | None = None
    material: str | None = Field(default=None, max_length=120)
    location: str | None = Field(default=None, max_length=200)
    status: ListingStatus | None = None
    min_quantity: Decimal | None = Field(default=None, ge=0)
    max_quantity: Decimal | None = Field(default=None, ge=0)
    sort_by: SortField = "newest"
    page: int = Field(default=1, ge=1)
    page_size: int = Field(default=20, ge=1, le=MAX_PAGE_SIZE)

"""Listing business rules.

- Only generators (or 'both' accounts) create listings; RLS forces owner_id = caller.
- Only 'active' listings can be edited. Owners may cancel an active listing or
  reopen a cancelled one; 'reserved' / 'completed' belong to the request workflow.
- A listing that has collection requests cannot be deleted (FK RESTRICT) -
  the owner should cancel it instead.
- Images: max 5 per listing, JPEG/PNG/WebP, max 5 MB, stored under
  {owner_id}/{listing_id}/ in the private bucket.
"""

import uuid
from decimal import Decimal

from postgrest.exceptions import APIError

from app.core.exceptions import AppError, ConflictError, ForbiddenError, NotFoundError
from app.integrations.supabase.storage import ImageStorage
from app.repositories.listing_repository import ListingRepository
from app.schemas.common import Page
from app.schemas.listing import (
    ListingCreate,
    ListingFilters,
    ListingImage,
    ListingOut,
    ListingUpdate,
)

MAX_IMAGES_PER_LISTING = 5
MAX_IMAGE_BYTES = 5 * 1024 * 1024
IMAGE_TYPES = {"image/jpeg": "jpg", "image/png": "png", "image/webp": "webp"}


def sniff_image_type(content: bytes) -> str | None:
    """Detect the real image type from magic bytes (don't trust the client)."""
    if content.startswith(b"\xff\xd8\xff"):
        return "image/jpeg"
    if content.startswith(b"\x89PNG\r\n\x1a\n"):
        return "image/png"
    if len(content) >= 12 and content[:4] == b"RIFF" and content[8:12] == b"WEBP":
        return "image/webp"
    return None


def _jsonable(fields: dict) -> dict:
    return {k: (str(v) if isinstance(v, Decimal) else v) for k, v in fields.items()}


class ListingService:
    def __init__(self, repo: ListingRepository, storage: ImageStorage, user_id: str):
        self.repo = repo
        self.storage = storage
        self.user_id = user_id

    # ---------- reads ----------
    def _to_out(self, rows: list[dict]) -> list[ListingOut]:
        paths = [p for row in rows for p in (row.get("image_urls") or [])]
        urls = self.storage.signed_urls(paths)
        out = []
        for row in rows:
            images = [ListingImage(path=p, url=urls.get(p)) for p in (row.get("image_urls") or [])]
            data = {k: v for k, v in row.items() if k != "image_urls"}
            out.append(ListingOut(**data, images=images, is_owner=row["owner_id"] == self.user_id))
        return out

    def search(self, filters: ListingFilters, mine: bool = False) -> Page[ListingOut]:
        rows, total = self.repo.search(filters, owner_id=self.user_id if mine else None)
        return Page.build(self._to_out(rows), filters.page, filters.page_size, total)

    def _get_row(self, listing_id: str) -> dict:
        row = self.repo.get(listing_id)
        if row is None:
            raise NotFoundError("Listing not found")
        return row

    def _get_owned_row(self, listing_id: str, is_admin: bool = False) -> dict:
        row = self._get_row(listing_id)
        if row["owner_id"] != self.user_id and not is_admin:
            raise ForbiddenError("Only the listing owner can do this")
        return row

    def get(self, listing_id: str) -> ListingOut:
        return self._to_out([self._get_row(listing_id)])[0]

    # ---------- writes ----------
    def create(self, data: ListingCreate) -> ListingOut:
        row = {**_jsonable(data.model_dump()), "owner_id": self.user_id, "status": "active"}
        return self._to_out([self.repo.create(row)])[0]

    def update(self, listing_id: str, changes: ListingUpdate, is_admin: bool = False) -> ListingOut:
        row = self._get_owned_row(listing_id, is_admin)
        fields = changes.model_dump(exclude_unset=True)
        if not fields:
            raise AppError(400, "BAD_REQUEST", "No fields to update")

        current = row["status"]
        new_status = fields.get("status")
        if current in ("reserved", "completed"):
            raise ConflictError(f"A {current} listing cannot be edited")
        if current == "cancelled" and set(fields) != {"status"}:
            raise ConflictError("Reopen the listing (status=active) before editing it")

        lat = fields.get("latitude", row.get("latitude"))
        lng = fields.get("longitude", row.get("longitude"))
        if (lat is None) != (lng is None):
            raise AppError(422, "VALIDATION_ERROR", "latitude and longitude must be provided together")

        if new_status == current:
            fields.pop("status")
            if not fields:
                return self._to_out([row])[0]

        updated = self.repo.update(listing_id, _jsonable(fields))
        if updated is None:
            raise NotFoundError("Listing not found")
        return self._to_out([updated])[0]

    def delete(self, listing_id: str, is_admin: bool = False) -> None:
        row = self._get_owned_row(listing_id, is_admin)
        try:
            deleted = self.repo.delete(listing_id)
        except APIError as exc:
            if exc.code == "23503":
                raise ConflictError(
                    "This listing has collection requests and cannot be deleted; cancel it instead"
                ) from exc
            raise
        if not deleted:
            raise NotFoundError("Listing not found")
        # Best effort: remove images after the row is gone.
        try:
            self.storage.remove(row.get("image_urls") or [])
        except Exception:
            pass

    # ---------- images ----------
    def add_images(self, listing_id: str, files: list[tuple[bytes, str | None]]) -> ListingOut:
        """files: list of (content, original filename)."""
        row = self._get_owned_row(listing_id)
        if row["status"] != "active":
            raise ConflictError("Images can only be added to active listings")
        if not files:
            raise AppError(400, "BAD_REQUEST", "No files uploaded")

        existing = row.get("image_urls") or []
        if len(existing) + len(files) > MAX_IMAGES_PER_LISTING:
            raise ConflictError(f"A listing can have at most {MAX_IMAGES_PER_LISTING} images")

        prepared = []
        for content, filename in files:
            if len(content) > MAX_IMAGE_BYTES:
                raise AppError(413, "FILE_TOO_LARGE", f"{filename or 'file'} is larger than 5 MB")
            content_type = sniff_image_type(content)
            if content_type is None:
                raise AppError(415, "UNSUPPORTED_FILE_TYPE",
                               f"{filename or 'file'} is not a JPEG, PNG or WebP image")
            path = f"{self.user_id}/{listing_id}/{uuid.uuid4().hex}.{IMAGE_TYPES[content_type]}"
            prepared.append((path, content, content_type))

        uploaded: list[str] = []
        try:
            for path, content, content_type in prepared:
                self.storage.upload(path, content, content_type)
                uploaded.append(path)
            updated = self.repo.update(listing_id, {"image_urls": existing + uploaded})
        except Exception:
            # Don't leave orphaned files behind if anything failed.
            try:
                self.storage.remove(uploaded)
            except Exception:
                pass
            raise
        return self._to_out([updated])[0]

    def remove_image(self, listing_id: str, path: str) -> ListingOut:
        row = self._get_owned_row(listing_id)
        existing = row.get("image_urls") or []
        if path not in existing:
            raise NotFoundError("Image not found on this listing")
        updated = self.repo.update(listing_id, {"image_urls": [p for p in existing if p != path]})
        try:
            self.storage.remove([path])
        except Exception:
            pass
        return self._to_out([updated])[0]

"""Listing image storage (private bucket `waste-listing-images`).

- Uploads/deletes run AS the user, so the storage policy "own folder only"
  ({user_id}/...) is enforced by Supabase.
- Viewing: the bucket is private and users may only read their own folder,
  so the backend signs short-lived URLs (service role) - but only for
  listings the caller is already allowed to see via RLS.
"""

import logging
from typing import Protocol

from storage3 import SyncStorageClient

from app.core.config import get_settings
from app.integrations.supabase.client import admin_client

logger = logging.getLogger(__name__)

LISTING_IMAGES_BUCKET = "waste-listing-images"
SIGNED_URL_TTL_SECONDS = 3600


class ImageStorage(Protocol):
    def upload(self, path: str, content: bytes, content_type: str) -> None: ...
    def remove(self, paths: list[str]) -> None: ...
    def signed_urls(self, paths: list[str]) -> dict[str, str]: ...


class SupabaseImageStorage:
    def __init__(self, access_token: str):
        settings = get_settings()
        self._user_bucket = SyncStorageClient(
            f"{settings.supabase_url.rstrip('/')}/storage/v1",
            headers={
                "apikey": settings.supabase_anon_key,
                "Authorization": f"Bearer {access_token}",
            },
        ).from_(LISTING_IMAGES_BUCKET)

    def upload(self, path: str, content: bytes, content_type: str) -> None:
        self._user_bucket.upload(path, content, {"content-type": content_type, "upsert": "false"})

    def remove(self, paths: list[str]) -> None:
        if paths:
            self._user_bucket.remove(paths)

    def signed_urls(self, paths: list[str]) -> dict[str, str]:
        if not paths:
            return {}
        try:
            results = admin_client().storage.from_(LISTING_IMAGES_BUCKET).create_signed_urls(
                paths, SIGNED_URL_TTL_SECONDS
            )
        except Exception:  # images are optional - never fail the whole request
            logger.exception("Could not sign listing image URLs")
            return {}
        return {
            r["path"]: (r.get("signedURL") or r.get("signedUrl"))
            for r in results
            if not r.get("error") and (r.get("signedURL") or r.get("signedUrl"))
        }

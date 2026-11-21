"""Listing image storage (private bucket `waste-listing-images`).

- Uploads/deletes run AS the user, so the storage policy "own folder only"
  ({user_id}/...) is enforced by Supabase.
- Viewing: the bucket is private and users may only read their own folder,
  so the backend signs short-lived URLs (service role) - but only for
  listings the caller is already allowed to see via RLS.
- Signed URLs are cached in memory and reused while they still have at least
  10 minutes left, which saves one Supabase round trip on most page loads.
  A signed URL already works for anyone who has it, so sharing the cache
  between users does not widen access: URLs are only handed out for listings
  the caller can see.
"""

import logging
import threading
import time
from typing import Protocol

from storage3 import SyncStorageClient

from app.core.config import get_settings
from app.integrations.supabase.client import admin_client

logger = logging.getLogger(__name__)

LISTING_IMAGES_BUCKET = "waste-listing-images"
SIGNED_URL_TTL_SECONDS = 3600
MIN_REMAINING_SECONDS = 600


class ImageStorage(Protocol):
    def upload(self, path: str, content: bytes, content_type: str) -> None: ...
    def remove(self, paths: list[str]) -> None: ...
    def signed_urls(self, paths: list[str]) -> dict[str, str]: ...


class SignedUrlCache:
    def __init__(self, clock=time.monotonic):
        self._clock = clock
        self._lock = threading.Lock()
        self._items: dict[str, tuple[str, float]] = {}  # path -> (url, expires_at)

    def get_many(self, paths: list[str]) -> dict[str, str]:
        now = self._clock()
        with self._lock:
            return {
                p: url
                for p in paths
                if (hit := self._items.get(p)) and (url := hit[0]) and hit[1] - now > MIN_REMAINING_SECONDS
            }

    def put_many(self, urls: dict[str, str], ttl: int = SIGNED_URL_TTL_SECONDS) -> None:
        expires = self._clock() + ttl
        with self._lock:
            for p, url in urls.items():
                self._items[p] = (url, expires)
            if len(self._items) > 5000:  # crude bound on memory
                now = self._clock()
                self._items = {k: v for k, v in self._items.items() if v[1] > now}

    def forget(self, paths: list[str]) -> None:
        with self._lock:
            for p in paths:
                self._items.pop(p, None)


signed_url_cache = SignedUrlCache()


class SupabaseImageStorage:
    def __init__(self, access_token: str, cache: SignedUrlCache = signed_url_cache):
        settings = get_settings()
        self._cache = cache
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
            self._cache.forget(paths)

    def signed_urls(self, paths: list[str]) -> dict[str, str]:
        if not paths:
            return {}
        found = self._cache.get_many(paths)
        missing = [p for p in dict.fromkeys(paths) if p not in found]
        if not missing:
            return found
        try:
            results = admin_client().storage.from_(LISTING_IMAGES_BUCKET).create_signed_urls(
                missing, SIGNED_URL_TTL_SECONDS
            )
        except Exception:  # images are optional - never fail the whole request
            logger.exception("Could not sign listing image URLs")
            return found
        fresh = {
            r["path"]: (r.get("signedURL") or r.get("signedUrl"))
            for r in results
            if not r.get("error") and (r.get("signedURL") or r.get("signedUrl"))
        }
        self._cache.put_many(fresh)
        return {**found, **fresh}

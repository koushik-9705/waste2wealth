"""Supabase clients.

- user_db(token): PostgREST client acting AS the signed-in user. RLS applies,
  auth.uid() is the caller. Use this for normal requests.
- admin_client(): service-role client that BYPASSES RLS. Use only for narrowly
  scoped, server-side operations (e.g. writing match_results).

Performance: every user_db() shares one pooled HTTP connection to Supabase
(reusing TLS connections cut request time from ~1.7 s to ~0.4 s). This is safe
because postgrest-py keeps the auth headers on each PostgREST client object and
sends them per request - nothing user-specific is stored on the shared
connection (see tests/test_supabase_client.py).
"""

from functools import lru_cache

import httpx
from postgrest import SyncPostgrestClient
from supabase import Client, create_client

from app.core.config import get_settings


@lru_cache
def _shared_http() -> httpx.Client:
    # No default headers here on purpose: auth must never live on the shared client.
    return httpx.Client(
        timeout=httpx.Timeout(15.0, connect=10.0),
        limits=httpx.Limits(max_connections=50, max_keepalive_connections=20, keepalive_expiry=60),
        follow_redirects=True,
        http2=True,
    )


def close_shared_http() -> None:
    if _shared_http.cache_info().currsize:
        _shared_http().close()
        _shared_http.cache_clear()


def user_db(access_token: str) -> SyncPostgrestClient:
    settings = get_settings()
    return SyncPostgrestClient(
        f"{settings.supabase_url.rstrip('/')}/rest/v1",
        headers={
            "apikey": settings.supabase_anon_key,
            "Authorization": f"Bearer {access_token}",
        },
        http_client=_shared_http(),
    )


@lru_cache
def admin_client() -> Client:
    settings = get_settings()
    if not settings.supabase_service_role_key:
        raise RuntimeError("SUPABASE_SERVICE_ROLE_KEY is not configured")
    return create_client(settings.supabase_url, settings.supabase_service_role_key)

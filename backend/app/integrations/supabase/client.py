"""Supabase clients.

- user_db(token): PostgREST client acting AS the signed-in user. RLS applies,
  auth.uid() is the caller. Use this for normal requests.
- admin_client(): service-role client that BYPASSES RLS. Use only for narrowly
  scoped, server-side operations (e.g. writing match_results).
"""

from functools import lru_cache

from postgrest import SyncPostgrestClient
from supabase import Client, create_client

from app.core.config import get_settings


def user_db(access_token: str) -> SyncPostgrestClient:
    settings = get_settings()
    return SyncPostgrestClient(
        f"{settings.supabase_url.rstrip('/')}/rest/v1",
        headers={
            "apikey": settings.supabase_anon_key,
            "Authorization": f"Bearer {access_token}",
        },
    )


@lru_cache
def admin_client() -> Client:
    settings = get_settings()
    if not settings.supabase_service_role_key:
        raise RuntimeError("SUPABASE_SERVICE_ROLE_KEY is not configured")
    return create_client(settings.supabase_url, settings.supabase_service_role_key)

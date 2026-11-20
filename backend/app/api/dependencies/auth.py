"""Authentication / authorization dependencies.

Usage in a route:
    user: CurrentUser = Depends(get_current_user)
    profile: ProfileOut = Depends(require_roles("admin"))
"""

from collections.abc import Callable
from dataclasses import dataclass

from fastapi import Depends
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from postgrest import SyncPostgrestClient

from app.core.exceptions import ForbiddenError, UnauthorizedError
from app.core.security import verify_access_token
from app.integrations.supabase.client import user_db
from app.repositories.profile_repository import ProfileRepository
from app.schemas.profile import ProfileOut
from app.services.profile_service import ProfileService

bearer_scheme = HTTPBearer(auto_error=False)


@dataclass(frozen=True)
class CurrentUser:
    id: str
    email: str | None
    access_token: str


def get_current_user(
    credentials: HTTPAuthorizationCredentials | None = Depends(bearer_scheme),
) -> CurrentUser:
    if credentials is None or credentials.scheme.lower() != "bearer":
        raise UnauthorizedError("Missing bearer token")
    claims = verify_access_token(credentials.credentials)
    return CurrentUser(id=claims.user_id, email=claims.email, access_token=credentials.credentials)


def get_user_db(user: CurrentUser = Depends(get_current_user)) -> SyncPostgrestClient:
    """PostgREST client acting as the caller, so RLS policies apply."""
    return user_db(user.access_token)


def get_profile_service(db: SyncPostgrestClient = Depends(get_user_db)) -> ProfileService:
    return ProfileService(ProfileRepository(db))


def get_current_profile(
    user: CurrentUser = Depends(get_current_user),
    service: ProfileService = Depends(get_profile_service),
) -> ProfileOut:
    """The caller's profile; the role comes from the database, never from the client."""
    return service.get_profile(user.id)


def require_roles(*roles: str) -> Callable[..., ProfileOut]:
    """Allow only callers whose profiles.account_type is one of `roles`.

    'both' counts as generator and partner.
    """
    allowed = set(roles)
    if allowed & {"generator", "partner"}:
        allowed.add("both")

    def _check(profile: ProfileOut = Depends(get_current_profile)) -> ProfileOut:
        if profile.account_type not in allowed:
            raise ForbiddenError("Your account type cannot perform this action")
        return profile

    return _check


__all__ = [
    "CurrentUser",
    "UnauthorizedError",
    "get_current_profile",
    "get_current_user",
    "get_profile_service",
    "get_user_db",
    "require_roles",
]

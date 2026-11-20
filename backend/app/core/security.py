"""Supabase access-token verification.

The project signs tokens with asymmetric keys (ES256), so tokens are verified
locally against the project's public JWKS - no JWT secret is needed and there is
no network call per request (keys are cached by PyJWKClient).
"""

from dataclasses import dataclass
from functools import lru_cache

import jwt

from app.core.config import get_settings
from app.core.exceptions import UnauthorizedError

ALLOWED_ALGORITHMS = ["ES256", "RS256"]


@dataclass(frozen=True)
class TokenClaims:
    user_id: str
    email: str | None
    role: str
    raw: dict


@lru_cache
def get_jwks_client() -> jwt.PyJWKClient:
    return jwt.PyJWKClient(get_settings().supabase_jwks_url, cache_keys=True, lifespan=3600)


def verify_access_token(token: str, jwks_client: jwt.PyJWKClient | None = None) -> TokenClaims:
    settings = get_settings()
    client = jwks_client or get_jwks_client()
    try:
        signing_key = client.get_signing_key_from_jwt(token)
        claims = jwt.decode(
            token,
            signing_key.key,
            algorithms=ALLOWED_ALGORITHMS,
            audience="authenticated",
            issuer=settings.supabase_issuer,
            options={"require": ["exp", "sub", "aud", "iss"]},
        )
    except jwt.ExpiredSignatureError as exc:
        raise UnauthorizedError("Access token has expired") from exc
    except (jwt.PyJWTError, jwt.PyJWKClientError) as exc:
        raise UnauthorizedError("Invalid access token") from exc

    if claims.get("role") != "authenticated":
        raise UnauthorizedError("Invalid access token")

    return TokenClaims(
        user_id=claims["sub"],
        email=claims.get("email"),
        role=claims["role"],
        raw=claims,
    )

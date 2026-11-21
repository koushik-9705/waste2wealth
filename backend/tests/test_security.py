import time
from types import SimpleNamespace

import jwt
import pytest
from cryptography.hazmat.primitives.asymmetric import ec

from app.core.config import get_settings
from app.core.exceptions import UnauthorizedError
from app.core.security import verify_access_token

PRIVATE_KEY = ec.generate_private_key(ec.SECP256R1())
OTHER_KEY = ec.generate_private_key(ec.SECP256R1())


class FakeJwks:
    """Stands in for PyJWKClient: always returns our test public key."""

    def get_signing_key_from_jwt(self, token):
        return SimpleNamespace(key=PRIVATE_KEY.public_key())


def make_token(key=PRIVATE_KEY, **overrides):
    now = int(time.time())
    claims = {
        "sub": "11111111-1111-1111-1111-111111111111",
        "email": "user@example.com",
        "role": "authenticated",
        "aud": "authenticated",
        "iss": get_settings().supabase_issuer,
        "iat": now,
        "exp": now + 3600,
    }
    claims.update(overrides)
    return jwt.encode(claims, key, algorithm="ES256", headers={"kid": "test"})


def test_valid_token():
    claims = verify_access_token(make_token(), FakeJwks())
    assert claims.user_id == "11111111-1111-1111-1111-111111111111"
    assert claims.email == "user@example.com"


@pytest.mark.parametrize(
    "token_kwargs, label",
    [
        ({"exp": int(time.time()) - 10}, "expired"),
        ({"aud": "something-else"}, "wrong audience"),
        ({"iss": "https://evil.example.com/auth/v1"}, "wrong issuer"),
        ({"role": "anon"}, "anon key used as user token"),
        ({"key": OTHER_KEY}, "signed with another key"),
    ],
)
def test_rejected_tokens(token_kwargs, label):
    with pytest.raises(UnauthorizedError):
        verify_access_token(make_token(**token_kwargs), FakeJwks())


def test_garbage_token():
    with pytest.raises(UnauthorizedError):
        verify_access_token("not-a-jwt", FakeJwks())


def test_hs256_token_rejected():
    token = jwt.encode(
        {"sub": "x", "aud": "authenticated", "iss": get_settings().supabase_issuer,
         "role": "authenticated", "exp": int(time.time()) + 60},
        "a-shared-secret-that-is-at-least-32-bytes-long",
        algorithm="HS256",
    )
    with pytest.raises(UnauthorizedError):
        verify_access_token(token, FakeJwks())

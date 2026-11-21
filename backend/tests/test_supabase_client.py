"""The shared HTTP connection must never carry one user's token into another user's request."""

import httpx

from app.integrations.supabase import client as sb


def test_users_share_connection_but_not_auth(monkeypatch):
    sent: list[httpx.Request] = []

    def handler(request: httpx.Request) -> httpx.Response:
        sent.append(request)
        return httpx.Response(200, json=[], headers={"content-range": "0-0/0"})

    fake = httpx.Client(transport=httpx.MockTransport(handler))
    monkeypatch.setattr(sb, "_shared_http", lambda: fake)

    alice = sb.user_db("token-alice")
    bob = sb.user_db("token-bob")
    assert alice.session is bob.session  # pooled connection is shared

    alice.from_("profiles").select("user_id").execute()
    bob.from_("profiles").select("user_id").execute()
    alice.from_("profiles").select("user_id").execute()

    assert [r.headers["authorization"] for r in sent] == [
        "Bearer token-alice",
        "Bearer token-bob",
        "Bearer token-alice",
    ]
    assert "authorization" not in fake.headers  # nothing user-specific on the shared client

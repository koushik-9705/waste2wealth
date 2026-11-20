from datetime import datetime, timezone

from postgrest.exceptions import APIError

from app.api.dependencies.auth import CurrentUser, get_current_user, get_profile_service
from app.services.profile_service import ProfileService

USER_ID = "11111111-1111-1111-1111-111111111111"


class FakeProfileRepo:
    def __init__(self):
        now = datetime.now(timezone.utc).isoformat()
        self.rows = {
            USER_ID: {
                "user_id": USER_ID, "full_name": "Ravi", "phone": None, "account_type": "generator",
                "organization_name": None, "address": None, "city": "Guntur", "state": "AP",
                "pincode": None, "created_at": now, "updated_at": now,
            }
        }
        self.updates = []

    def get(self, user_id):
        return self.rows.get(user_id)

    def update(self, user_id, fields):
        self.updates.append(fields)
        if user_id not in self.rows:
            return None
        self.rows[user_id] = {**self.rows[user_id], **fields}
        return self.rows[user_id]


def login_as(app, repo, user_id=USER_ID):
    app.dependency_overrides[get_current_user] = lambda: CurrentUser(user_id, "u@x.test", "token")
    app.dependency_overrides[get_profile_service] = lambda: ProfileService(repo)


def test_health(client):
    for path in ("/health", "/api/v1/health"):
        res = client.get(path)
        assert res.status_code == 200
        assert res.json()["success"] is True
        assert res.json()["data"]["status"] == "ok"


def test_profile_requires_token(client):
    res = client.get("/api/v1/profiles/me")
    assert res.status_code == 401
    assert res.json() == {
        "success": False,
        "message": "Missing bearer token",
        "error": {"code": "UNAUTHORIZED"},
    }


def test_profile_rejects_invalid_token(client):
    res = client.get("/api/v1/profiles/me", headers={"Authorization": "Bearer not-a-jwt"})
    assert res.status_code == 401
    assert res.json()["error"]["code"] == "UNAUTHORIZED"


def test_get_my_profile(app, client):
    login_as(app, FakeProfileRepo())
    res = client.get("/api/v1/profiles/me")
    assert res.status_code == 200
    body = res.json()
    assert body["success"] is True
    assert body["data"]["full_name"] == "Ravi"
    assert body["data"]["account_type"] == "generator"


def test_missing_profile_is_404(app, client):
    login_as(app, FakeProfileRepo(), user_id="22222222-2222-2222-2222-222222222222")
    res = client.get("/api/v1/profiles/me")
    assert res.status_code == 404
    assert res.json()["error"]["code"] == "NOT_FOUND"


def test_update_my_profile(app, client):
    repo = FakeProfileRepo()
    login_as(app, repo)
    res = client.patch("/api/v1/profiles/me", json={"city": "Hyderabad", "pincode": "500001"})
    assert res.status_code == 200
    assert res.json()["message"] == "Profile updated"
    assert res.json()["data"]["city"] == "Hyderabad"
    assert repo.updates == [{"city": "Hyderabad", "pincode": "500001"}]


def test_cannot_change_role_via_api(app, client):
    repo = FakeProfileRepo()
    login_as(app, repo)
    res = client.patch("/api/v1/profiles/me", json={"account_type": "admin"})
    assert res.status_code == 422
    assert res.json()["error"]["code"] == "VALIDATION_ERROR"
    assert repo.updates == []


def test_invalid_pincode(app, client):
    login_as(app, FakeProfileRepo())
    res = client.patch("/api/v1/profiles/me", json={"pincode": "12"})
    assert res.status_code == 422
    assert res.json()["error"]["details"][0]["field"] == "pincode"


def test_empty_update_is_400(app, client):
    login_as(app, FakeProfileRepo())
    res = client.patch("/api/v1/profiles/me", json={})
    assert res.status_code == 400


def test_database_errors_are_mapped(app, client):
    class FailingRepo(FakeProfileRepo):
        def update(self, user_id, fields):
            raise APIError({"code": "42501", "message": "new row violates row-level security policy"})

    login_as(app, FailingRepo())
    res = client.patch("/api/v1/profiles/me", json={"city": "X"})
    assert res.status_code == 403
    assert res.json()["error"]["code"] == "FORBIDDEN"

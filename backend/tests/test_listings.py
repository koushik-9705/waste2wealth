"""Listings API tests with an in-memory repository that mimics the RLS rules."""

import uuid
from datetime import datetime, timezone
from decimal import Decimal

import pytest
from postgrest.exceptions import APIError

from app.api.dependencies.auth import (
    CurrentUser,
    get_current_profile,
    get_current_user,
    get_listing_service,
)
from app.schemas.profile import ProfileOut
from app.services.listing_service import ListingService

OWNER = "11111111-1111-1111-1111-111111111111"
PARTNER = "22222222-2222-2222-2222-222222222222"

PNG = b"\x89PNG\r\n\x1a\n" + b"\x00" * 100
JPEG = b"\xff\xd8\xff\xe0" + b"\x00" * 100


class FakeRepo:
    """In-memory waste_listings; visibility follows the RLS policy."""

    def __init__(self, viewer: str):
        self.viewer = viewer
        self.rows: dict[str, dict] = {}
        self.has_requests: set[str] = set()

    def _visible(self, row):
        return row["status"] == "active" or row["owner_id"] == self.viewer

    def add(self, **kw):
        now = datetime.now(timezone.utc).isoformat()
        row = {
            "listing_id": str(uuid.uuid4()), "owner_id": OWNER, "waste_category": "agricultural",
            "material_name": "Rice husk", "description": None, "quantity": "100", "unit": "kg",
            "material_condition": "dry", "location": "Guntur, AP", "latitude": None,
            "longitude": None, "expected_price": None, "image_urls": [], "status": "active",
            "created_at": now, "updated_at": now,
        }
        row.update(kw)
        self.rows[row["listing_id"]] = row
        return row

    def search(self, f, owner_id=None):
        rows = [r for r in self.rows.values() if self._visible(r)]
        if owner_id:
            rows = [r for r in rows if r["owner_id"] == owner_id]
        if f.category:
            rows = [r for r in rows if r["waste_category"] == f.category]
        if f.status:
            rows = [r for r in rows if r["status"] == f.status]
        if f.material:
            rows = [r for r in rows if f.material.lower() in r["material_name"].lower()]
        if f.location:
            rows = [r for r in rows if f.location.lower() in r["location"].lower()]
        if f.min_quantity is not None:
            rows = [r for r in rows if Decimal(r["quantity"]) >= f.min_quantity]
        total = len(rows)
        start = (f.page - 1) * f.page_size
        return rows[start:start + f.page_size], total

    def get(self, listing_id):
        row = self.rows.get(listing_id)
        return dict(row) if row and self._visible(row) else None

    def create(self, row):
        return self.add(**row)

    def update(self, listing_id, fields):
        row = self.rows.get(listing_id)
        if not row or row["owner_id"] != self.viewer:
            return None
        row.update(fields)
        return dict(row)

    def delete(self, listing_id):
        if listing_id in self.has_requests:
            raise APIError({"code": "23503", "message": "violates foreign key constraint"})
        row = self.rows.get(listing_id)
        if not row or row["owner_id"] != self.viewer:
            return False
        del self.rows[listing_id]
        return True


class FakeStorage:
    def __init__(self):
        self.files: dict[str, bytes] = {}
        self.fail_upload = False

    def upload(self, path, content, content_type):
        if self.fail_upload:
            raise RuntimeError("storage down")
        self.files[path] = content

    def remove(self, paths):
        for p in paths:
            self.files.pop(p, None)

    def signed_urls(self, paths):
        return {p: f"https://signed.example/{p}?token=x" for p in paths}


def profile(user_id, account_type):
    now = datetime.now(timezone.utc)
    return ProfileOut(user_id=user_id, full_name="Test", account_type=account_type,
                      created_at=now, updated_at=now)


@pytest.fixture
def world():
    return {"repo_rows": {}, "requests": set(), "storage": FakeStorage()}


@pytest.fixture
def as_user(app, world):
    """Switch the signed-in user: as_user(OWNER, 'generator')."""

    def _login(user_id, account_type="generator"):
        repo = FakeRepo(user_id)
        repo.rows = world["repo_rows"]
        repo.has_requests = world["requests"]
        app.dependency_overrides[get_current_user] = lambda: CurrentUser(user_id, None, "t")
        app.dependency_overrides[get_current_profile] = lambda: profile(user_id, account_type)
        app.dependency_overrides[get_listing_service] = lambda: ListingService(
            repo, world["storage"], user_id)
        return repo

    return _login


NEW_LISTING = {
    "waste_category": "agricultural", "material_name": "Paddy straw", "quantity": "250.5",
    "unit": "kg", "material_condition": "dry, baled", "location": "Warangal, TS",
    "expected_price": "1500",
}


def test_listings_require_login(client):
    assert client.get("/api/v1/listings").status_code == 401
    assert client.post("/api/v1/listings", json=NEW_LISTING).status_code == 401


def test_create_listing(client, as_user):
    as_user(OWNER)
    res = client.post("/api/v1/listings", json=NEW_LISTING)
    assert res.status_code == 201
    data = res.json()["data"]
    assert data["owner_id"] == OWNER
    assert data["status"] == "active"
    assert data["is_owner"] is True
    assert Decimal(data["quantity"]) == Decimal("250.5")


def test_partner_account_cannot_create_listing(client, as_user):
    as_user(PARTNER, "partner")
    res = client.post("/api/v1/listings", json=NEW_LISTING)
    assert res.status_code == 403


def test_both_account_can_create_listing(client, as_user):
    as_user(PARTNER, "both")
    assert client.post("/api/v1/listings", json=NEW_LISTING).status_code == 201


@pytest.mark.parametrize("bad", [
    {"quantity": "0"},
    {"unit": "bags"},
    {"waste_category": "plastic"},
    {"material_name": ""},
    {"latitude": "17.4"},             # without longitude
    {"owner_id": PARTNER},            # client cannot choose owner
    {"status": "completed"},          # client cannot set status on create
])
def test_create_validation(client, as_user, bad):
    as_user(OWNER)
    res = client.post("/api/v1/listings", json={**NEW_LISTING, **bad})
    assert res.status_code == 422
    assert res.json()["error"]["code"] == "VALIDATION_ERROR"


def test_browse_shows_active_and_own_only(client, as_user):
    repo = as_user(OWNER)
    repo.add(material_name="Rice husk")
    repo.add(material_name="Old laptops", waste_category="electronic")
    repo.add(material_name="My cancelled coir", status="cancelled")
    repo.add(material_name="Someone else's cancelled", owner_id=PARTNER, status="cancelled")

    as_user(PARTNER, "partner")
    names = {i["material_name"] for i in client.get("/api/v1/listings").json()["data"]["items"]}
    assert names == {"Rice husk", "Old laptops", "Someone else's cancelled"}

    as_user(OWNER)
    names = {i["material_name"] for i in client.get("/api/v1/listings").json()["data"]["items"]}
    assert "My cancelled coir" in names and "Someone else's cancelled" not in names


def test_browse_filters_and_pagination(client, as_user):
    repo = as_user(OWNER)
    for i in range(25):
        repo.add(material_name=f"Husk {i}")
    repo.add(material_name="Circuit boards", waste_category="electronic", location="Hyderabad")

    body = client.get("/api/v1/listings", params={"page": 2, "page_size": 10}).json()["data"]
    assert (body["page"], body["page_size"], body["total"], body["total_pages"]) == (2, 10, 26, 3)
    assert len(body["items"]) == 10

    body = client.get("/api/v1/listings", params={"category": "electronic"}).json()["data"]
    assert [i["material_name"] for i in body["items"]] == ["Circuit boards"]

    body = client.get("/api/v1/listings", params={"location": "hyder"}).json()["data"]
    assert body["total"] == 1


def test_browse_rejects_bad_params(client, as_user):
    as_user(OWNER)
    assert client.get("/api/v1/listings", params={"page_size": 500}).status_code == 422
    assert client.get("/api/v1/listings", params={"sort_by": "drop table"}).status_code == 422


def test_my_listings(client, as_user):
    repo = as_user(OWNER)
    repo.add(material_name="Mine")
    repo.add(material_name="Not mine", owner_id=PARTNER)
    body = client.get("/api/v1/listings/mine").json()["data"]
    assert [i["material_name"] for i in body["items"]] == ["Mine"]


def test_get_listing_and_not_found(client, as_user):
    repo = as_user(OWNER)
    row = repo.add()
    assert client.get(f"/api/v1/listings/{row['listing_id']}").status_code == 200
    assert client.get(f"/api/v1/listings/{uuid.uuid4()}").status_code == 404
    assert client.get("/api/v1/listings/not-a-uuid").status_code == 422


def test_hidden_listing_is_404_for_others(client, as_user):
    repo = as_user(OWNER)
    row = repo.add(status="cancelled")
    as_user(PARTNER, "partner")
    assert client.get(f"/api/v1/listings/{row['listing_id']}").status_code == 404


def test_update_listing(client, as_user):
    repo = as_user(OWNER)
    row = repo.add()
    res = client.patch(f"/api/v1/listings/{row['listing_id']}", json={"quantity": "80", "expected_price": "900"})
    assert res.status_code == 200
    assert Decimal(res.json()["data"]["quantity"]) == 80


def test_non_owner_cannot_update(client, as_user):
    repo = as_user(OWNER)
    row = repo.add()
    as_user(PARTNER, "both")
    res = client.patch(f"/api/v1/listings/{row['listing_id']}", json={"quantity": "1"})
    assert res.status_code == 403


def test_cancel_and_reopen(client, as_user):
    repo = as_user(OWNER)
    row = repo.add()
    lid = row["listing_id"]
    assert client.patch(f"/api/v1/listings/{lid}", json={"status": "cancelled"}).json()["data"]["status"] == "cancelled"
    assert client.patch(f"/api/v1/listings/{lid}", json={"quantity": "5"}).status_code == 409
    assert client.patch(f"/api/v1/listings/{lid}", json={"status": "active"}).json()["data"]["status"] == "active"


@pytest.mark.parametrize("status", ["reserved", "completed"])
def test_reserved_or_completed_cannot_be_edited(client, as_user, status):
    repo = as_user(OWNER)
    row = repo.add(status=status)
    assert client.patch(f"/api/v1/listings/{row['listing_id']}", json={"quantity": "5"}).status_code == 409


def test_client_cannot_set_reserved(client, as_user):
    repo = as_user(OWNER)
    row = repo.add()
    assert client.patch(f"/api/v1/listings/{row['listing_id']}", json={"status": "reserved"}).status_code == 422


def test_delete_listing(client, as_user, world):
    repo = as_user(OWNER)
    row = repo.add(image_urls=[f"{OWNER}/x/a.png"])
    world["storage"].files[f"{OWNER}/x/a.png"] = PNG
    res = client.delete(f"/api/v1/listings/{row['listing_id']}")
    assert res.status_code == 200
    assert row["listing_id"] not in world["repo_rows"]
    assert world["storage"].files == {}


def test_delete_listing_with_requests_is_409(client, as_user, world):
    repo = as_user(OWNER)
    row = repo.add()
    world["requests"].add(row["listing_id"])
    res = client.delete(f"/api/v1/listings/{row['listing_id']}")
    assert res.status_code == 409
    assert "cancel" in res.json()["message"]


def test_upload_images(client, as_user, world):
    repo = as_user(OWNER)
    row = repo.add()
    res = client.post(
        f"/api/v1/listings/{row['listing_id']}/images",
        files=[("files", ("a.png", PNG, "image/png")), ("files", ("b.jpg", JPEG, "image/jpeg"))],
    )
    assert res.status_code == 200, res.json()
    images = res.json()["data"]["images"]
    assert len(images) == 2
    assert all(img["path"].startswith(f"{OWNER}/{row['listing_id']}/") for img in images)
    assert all(img["url"].startswith("https://signed.example/") for img in images)
    assert set(world["storage"].files) == {img["path"] for img in images}


def test_upload_rejects_non_images(client, as_user):
    repo = as_user(OWNER)
    row = repo.add()
    res = client.post(f"/api/v1/listings/{row['listing_id']}/images",
                      files=[("files", ("evil.png", b"<script>alert(1)</script>", "image/png"))])
    assert res.status_code == 415


def test_upload_rejects_large_files(client, as_user):
    repo = as_user(OWNER)
    row = repo.add()
    big = PNG + b"\x00" * (5 * 1024 * 1024)
    res = client.post(f"/api/v1/listings/{row['listing_id']}/images",
                      files=[("files", ("big.png", big, "image/png"))])
    assert res.status_code == 413


def test_upload_max_five_images(client, as_user):
    repo = as_user(OWNER)
    row = repo.add(image_urls=[f"{OWNER}/x/{i}.png" for i in range(4)])
    res = client.post(f"/api/v1/listings/{row['listing_id']}/images",
                      files=[("files", ("a.png", PNG, "image/png")), ("files", ("b.png", PNG, "image/png"))])
    assert res.status_code == 409


def test_upload_only_by_owner(client, as_user):
    repo = as_user(OWNER)
    row = repo.add()
    as_user(PARTNER, "partner")
    res = client.post(f"/api/v1/listings/{row['listing_id']}/images",
                      files=[("files", ("a.png", PNG, "image/png"))])
    assert res.status_code == 403


def test_failed_upload_leaves_no_orphans(client, as_user, world):
    repo = as_user(OWNER)
    row = repo.add()
    world["storage"].fail_upload = True
    res = client.post(f"/api/v1/listings/{row['listing_id']}/images",
                      files=[("files", ("a.png", PNG, "image/png"))])
    assert res.status_code == 500
    assert res.json() == {"success": False, "message": "Unexpected server error",
                          "error": {"code": "INTERNAL_ERROR"}}
    assert world["storage"].files == {}
    assert world["repo_rows"][row["listing_id"]]["image_urls"] == []


def test_remove_image(client, as_user, world):
    repo = as_user(OWNER)
    path = f"{OWNER}/x/a.png"
    row = repo.add(image_urls=[path])
    world["storage"].files[path] = PNG
    res = client.delete(f"/api/v1/listings/{row['listing_id']}/images", params={"path": path})
    assert res.status_code == 200
    assert res.json()["data"]["images"] == []
    assert world["storage"].files == {}
    res = client.delete(f"/api/v1/listings/{row['listing_id']}/images", params={"path": "other.png"})
    assert res.status_code == 404

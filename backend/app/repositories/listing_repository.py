"""Data access for public.waste_listings, as the signed-in user (RLS applies).

RLS already limits what each caller sees: active listings, plus their own
listings in any status, plus everything for admins.
"""

from postgrest import SyncPostgrestClient
from postgrest.exceptions import APIError

from app.schemas.listing import ListingFilters

LISTING_COLUMNS = (
    "listing_id,owner_id,waste_category,material_name,description,quantity,unit,"
    "material_condition,location,latitude,longitude,expected_price,image_urls,status,"
    "created_at,updated_at"
)

_SORTS = {
    "newest": ("created_at", True),
    "oldest": ("created_at", False),
    "quantity_asc": ("quantity", False),
    "quantity_desc": ("quantity", True),
    "price_asc": ("expected_price", False),
    "price_desc": ("expected_price", True),
}


def _escape_like(value: str) -> str:
    # Treat user input literally: escape LIKE wildcards.
    for ch in ("\\", "%", "_"):
        value = value.replace(ch, f"\\{ch}")
    return value


class ListingRepository:
    def __init__(self, db: SyncPostgrestClient):
        self.db = db

    def search(self, f: ListingFilters, owner_id: str | None = None) -> tuple[list[dict], int]:
        column, desc = _SORTS[f.sort_by]
        start = (f.page - 1) * f.page_size
        q = (
            self._filtered(f, owner_id, LISTING_COLUMNS)
            .order(column, desc=desc, nullsfirst=False)
            .order("listing_id")
            .range(start, start + f.page_size - 1)
        )
        try:
            res = q.execute()
        except APIError as exc:
            if exc.code != "PGRST103":  # page is past the end of the results
                raise
            total = self._filtered(f, owner_id, "listing_id").range(0, 0).execute().count or 0
            return [], total
        return res.data or [], res.count or 0

    def _filtered(self, f: ListingFilters, owner_id: str | None, columns: str):
        q = self.db.from_("waste_listings").select(columns, count="exact")
        if owner_id:
            q = q.eq("owner_id", owner_id)
        if f.category:
            q = q.eq("waste_category", f.category)
        if f.status:
            q = q.eq("status", f.status)
        if f.material:
            q = q.ilike("material_name", f"%{_escape_like(f.material)}%")
        if f.location:
            q = q.ilike("location", f"%{_escape_like(f.location)}%")
        if f.min_quantity is not None:
            q = q.gte("quantity", str(f.min_quantity))
        if f.max_quantity is not None:
            q = q.lte("quantity", str(f.max_quantity))
        return q

    def get(self, listing_id: str) -> dict | None:
        res = (
            self.db.from_("waste_listings")
            .select(LISTING_COLUMNS)
            .eq("listing_id", listing_id)
            .limit(1)
            .execute()
        )
        return res.data[0] if res.data else None

    def create(self, row: dict) -> dict:
        res = self.db.from_("waste_listings").insert(row).execute()
        return res.data[0]

    def update(self, listing_id: str, fields: dict) -> dict | None:
        res = self.db.from_("waste_listings").update(fields).eq("listing_id", listing_id).execute()
        return res.data[0] if res.data else None

    def delete(self, listing_id: str) -> bool:
        res = self.db.from_("waste_listings").delete().eq("listing_id", listing_id).execute()
        return bool(res.data)

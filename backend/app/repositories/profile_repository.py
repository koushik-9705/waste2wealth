"""Data access for public.profiles, always as the signed-in user (RLS applies)."""

from postgrest import SyncPostgrestClient

PROFILE_COLUMNS = (
    "user_id,full_name,phone,account_type,organization_name,"
    "address,city,state,pincode,created_at,updated_at"
)


class ProfileRepository:
    def __init__(self, db: SyncPostgrestClient):
        self.db = db

    def get(self, user_id: str) -> dict | None:
        res = (
            self.db.from_("profiles")
            .select(PROFILE_COLUMNS)
            .eq("user_id", user_id)
            .limit(1)
            .execute()
        )
        return res.data[0] if res.data else None

    def update(self, user_id: str, fields: dict) -> dict | None:
        res = self.db.from_("profiles").update(fields).eq("user_id", user_id).execute()
        return res.data[0] if res.data else None

from app.core.exceptions import AppError, NotFoundError
from app.repositories.profile_repository import ProfileRepository
from app.schemas.profile import ProfileOut, ProfileUpdate


class ProfileService:
    def __init__(self, repo: ProfileRepository):
        self.repo = repo

    def get_profile(self, user_id: str) -> ProfileOut:
        row = self.repo.get(user_id)
        if row is None:
            # handle_new_user creates a profile on sign-up, so this means bad data.
            raise NotFoundError("Profile not found for this account")
        return ProfileOut.model_validate(row)

    def update_profile(self, user_id: str, changes: ProfileUpdate) -> ProfileOut:
        fields = changes.model_dump(exclude_unset=True)
        if not fields:
            raise AppError(400, "BAD_REQUEST", "No fields to update")
        row = self.repo.update(user_id, fields)
        if row is None:
            raise NotFoundError("Profile not found for this account")
        return ProfileOut.model_validate(row)

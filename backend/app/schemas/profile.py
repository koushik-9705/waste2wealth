from datetime import datetime
from typing import Literal

from pydantic import BaseModel, ConfigDict, Field

AccountType = Literal["generator", "partner", "both", "admin"]


class ProfileOut(BaseModel):
    user_id: str
    full_name: str
    phone: str | None = None
    account_type: AccountType
    organization_name: str | None = None
    address: str | None = None
    city: str | None = None
    state: str | None = None
    pincode: str | None = None
    created_at: datetime
    updated_at: datetime


class ProfileUpdate(BaseModel):
    """Fields a user may change on their own profile.

    account_type is deliberately absent: roles are never client-controlled
    (also enforced in the database by protect_profile_role).
    """

    model_config = ConfigDict(extra="forbid")

    full_name: str | None = Field(default=None, min_length=1, max_length=120)
    phone: str | None = Field(default=None, max_length=20)
    organization_name: str | None = Field(default=None, max_length=200)
    address: str | None = Field(default=None, max_length=500)
    city: str | None = Field(default=None, max_length=100)
    state: str | None = Field(default=None, max_length=100)
    pincode: str | None = Field(default=None, pattern=r"^\d{6}$")

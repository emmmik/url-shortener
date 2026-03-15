from pydantic import BaseModel, Field, HttpUrl, field_validator
from datetime import datetime, timezone
from typing import Optional
import re

ALIAS_REGEX = re.compile(r"^[a-zA-Z0-9]+$")

class URLItemBase(BaseModel):
    url: HttpUrl

class URLItemCreate(URLItemBase):
    custom_alias: Optional[str] = None

    @field_validator("custom_alias")
    def validate_custom_alias(cls, v: Optional[str]) -> Optional[str]:
        if v:
            if not ALIAS_REGEX.match(v):
                raise ValueError("Custom alias must contain only letters and numbers")
            if len(v) < 5 or len(v) > 20:
                raise ValueError("Custom alias must be between 5 and 20 characters long")
        return v


class URLItem(URLItemBase):
    id: int
    short_code: str
    access_count: int = Field(default=0)
    custom_alias: Optional[str] = None
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    updated_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

    model_config = {
        "from_attributes": True
    }
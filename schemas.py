from pydantic import BaseModel, Field, HttpUrl
from datetime import datetime, timezone

class URLItemBase(BaseModel):
    url: HttpUrl

class URLItemCreate(URLItemBase):
    pass

class URLItem(URLItemBase):
    id: int
    short_code: str
    access_count: int = Field(default=0)
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    updated_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

    model_config = {
        "from_attributes": True
    }
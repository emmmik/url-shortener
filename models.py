from sqlalchemy import Column, Integer, String, DateTime
from datetime import datetime, timezone
from database import Base

class URLItem(Base):
    __tablename__ = "urls"
    
    id = Column(Integer, primary_key=True)
    url = Column(String, index=True)
    short_code = Column(String, unique=True, index=True)
    access_count = Column(Integer, default=0)

    created_at = Column(DateTime, default=datetime.now(timezone.utc))
    updated_at = Column(DateTime, default=datetime.now(timezone.utc), onupdate=datetime.now(timezone.utc))
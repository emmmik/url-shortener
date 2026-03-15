from sqlalchemy import Column, Integer, String, DateTime
from sqlalchemy.sql import func
from app.core.database import Base

class URLItem(Base):
    __tablename__ = "urls"
    
    id = Column(Integer, primary_key=True)
    url = Column(String, index=True)
    short_code = Column(String, unique=True, index=True)
    access_count = Column(Integer, default=0)
    custom_alias = Column(String, unique=True, index=True, nullable=True)

    created_at = Column(DateTime, default=func.now())
    updated_at = Column(DateTime, default=func.now(), onupdate=func.now())
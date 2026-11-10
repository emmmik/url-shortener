from sqlalchemy import delete, update
from sqlalchemy.orm import Session
from sqlalchemy import or_
import uuid

from app.models import URLItem
import app.utils.base62 as base62

def get_url_by_url_id(url_id: int, db: Session) -> URLItem | None:
    return db.query(URLItem).filter(URLItem.id == url_id).first()


def create_url(url: str, db: Session, custom_alias: str | None = None) -> URLItem:
    temp_code = f"temp_{uuid.uuid4().hex[:8]}"
    new_url = URLItem(url=url, short_code=temp_code, custom_alias=custom_alias)

    db.add(new_url)
    db.commit()
    db.refresh(new_url)

    new_url.short_code = base62.encode(new_url.id)
    db.commit()
    db.refresh(new_url)

    return new_url

def get_all_urls(db: Session) -> list[URLItem]:
    return db.query(URLItem).all()

def increment_access_count(url_id: int, db: Session) -> URLItem | None:
    stmt = (
        update(URLItem)
        .where(URLItem.id == url_id)
        .values(access_count=URLItem.access_count + 1)
    )
    db.execute(stmt)
    db.commit()
    return db.query(URLItem).filter(URLItem.id == url_id).first()

def delete_url(identifier: str, db: Session) -> bool:
    url_item = get_url_by_identifier(identifier, db)
    if not url_item:
        return False

    stmt = (
        delete(URLItem)
        .where(URLItem.id == url_item.id)
    )

    result = db.execute(stmt)
    db.commit()

    return result.rowcount > 0

def get_url_by_identifier(identifier: str, db: Session) -> URLItem | None:
    return db.query(URLItem).filter(
        or_(
            URLItem.custom_alias == identifier,
            URLItem.short_code == identifier
        )
    ).first()
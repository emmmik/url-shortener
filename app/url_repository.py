from sqlalchemy import delete, update
from sqlalchemy.orm import Session
from sqlalchemy import or_
from app.models import URLItem

def get_url_by_url_id(url_id: int, db: Session) -> URLItem | None:
    return db.query(URLItem).filter(URLItem.id == url_id).first()

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
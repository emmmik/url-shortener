from sqlalchemy import update
from sqlalchemy.orm import Session

from models import URLItem
import base62

def get_url_by_short_code(short_code: str, db: Session) -> URLItem | None:
    try:
        user_id = base62.decode(short_code)
    except ValueError:
        raise ValueError("Invalid short code")

    return db.query(URLItem).filter(URLItem.id == user_id).first()

def get_url_by_user_id(user_id: int, db: Session) -> URLItem | None:
    return db.query(URLItem).filter(URLItem.id == user_id).first()

def increment_access_count(user_id: int, db: Session) -> URLItem | None:
    stmt = (
        update(URLItem)
        .where(URLItem.id == user_id)
        .values(access_count=URLItem.access_count + 1)
    )
    db.execute(stmt)
    db.commit()
    return db.query(URLItem).filter(URLItem.id == user_id).first()

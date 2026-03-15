"""Background task helpers that run with their own DB session."""

import app.core.database as database
import app.url_repository as url_repository


def increment_access_in_background(url_id: int) -> None:
    """Increment access count for a URL. Uses its own DB session (for use in background tasks)."""
    db = database.SessionLocal()
    try:
        url_repository.increment_access_count(url_id, db)
    finally:
        db.close()

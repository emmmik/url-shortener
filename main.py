from fastapi import FastAPI, Depends, HTTPException, BackgroundTasks
from sqlalchemy.orm import Session
from starlette import status
import uuid
from fastapi.responses import RedirectResponse

import database as database
import models
import schemas
import base62

import user_repository

models.Base.metadata.create_all(bind=database.engine)

app = FastAPI()

@app.post("/shorten", response_model=schemas.URLItem, status_code=status.HTTP_201_CREATED)
def shorten_url(item: schemas.URLItemCreate, db: Session = Depends(database.get_db)):
    temp_code = f"temp_{uuid.uuid4().hex[:8]}"

    new_url = models.URLItem(
        url=str(item.url),
        short_code=temp_code,
    )

    db.add(new_url)
    db.commit()
    db.refresh(new_url)

    real_code = base62.encode(new_url.id)
    new_url.short_code = real_code
    db.commit()
    db.refresh(new_url)

    return new_url

@app.get("/{short_code}")
def redirect_to_url(short_code: str, background_task: BackgroundTasks, db: Session = Depends(database.get_db)):
    user_id = user_repository.get_url_by_short_code(short_code, db).id
    url_item = user_repository.get_url_by_user_id(short_code, db)

    if not url_item:
        raise HTTPException(status_code=404, detail="Error fetching URL")

    background_task.add_task(user_repository.increment_access_count, user_id, db)
    return RedirectResponse(url=url_item.url)

@app.get("/{short_code}/stats", response_model=schemas.URLItem)
def get_url_stats(short_code: str, db: Session = Depends(database.get_db)):
    url_item = user_repository.get_url_by_short_code(short_code, db)

    if not url_item:
        raise HTTPException(status_code=404, detail="URL not found")
    
    return url_item

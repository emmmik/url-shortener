from fastapi import FastAPI, Depends, HTTPException, BackgroundTasks, Response
from sqlalchemy.orm import Session
from starlette import status
import uuid
from fastapi.responses import RedirectResponse

import database as database
import models
import schemas
import base62
import cache

import url_repository

from dependencies import get_valid_url_id, rate_limit

models.Base.metadata.create_all(bind=database.engine)

app = FastAPI()

@app.get("/favicon.ico", include_in_schema=False)
def favicon():
    return Response(status_code=204)

@app.post("/shorten", response_model=schemas.URLItem, status_code=status.HTTP_201_CREATED)
def shorten_url(item: schemas.URLItemCreate, db: Session = Depends(database.get_db), _ = Depends(rate_limit)):
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
def redirect_to_url(background_task: BackgroundTasks, url_id: int = Depends(get_valid_url_id), db: Session = Depends(database.get_db)):
    cache_key = f"url:{url_id}"
    cached_url = cache.redis_client.get(cache_key)
    if cached_url:
        print("Cached URL found")
        
        background_task.add_task(url_repository.increment_access_count, url_id, db)
        return RedirectResponse(url=cached_url if isinstance(cached_url, str) else cached_url.decode())

    url_item = url_repository.get_url_by_url_id(url_id, db)

    if not url_item:
        raise HTTPException(status_code=404, detail="Error fetching URL")

    cache.redis_client.set(cache_key, url_item.url, ex=3600)

    background_task.add_task(url_repository.increment_access_count, url_item.id, db)
    return RedirectResponse(url=url_item.url)

@app.get("/{short_code}/stats", response_model=schemas.URLItem)
def get_url_stats(url_id: int = Depends(get_valid_url_id), db: Session = Depends(database.get_db)):
    url_item = url_repository.get_url_by_url_id(url_id, db)

    if not url_item:
        raise HTTPException(status_code=404, detail="Error fetching URL")
    
    return url_item

@app.delete("/{short_code}", status_code=status.HTTP_204_NO_CONTENT)
def detlete_url(url_id: int = Depends(get_valid_url_id), db: Session = Depends(database.get_db)):
    success = url_repository.delete_url(url_id, db)
    if not success:
        raise HTTPException(status_code=404, detail="Error deleting URL")

    cache.redis_client.delete(f"url:{url_id}")
    return Response(status_code=status.HTTP_204_NO_CONTENT, content=None)
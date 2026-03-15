from fastapi import FastAPI, Depends, HTTPException, BackgroundTasks, Response, Path
from sqlalchemy.orm import Session
from starlette import status
import uuid
from fastapi.responses import RedirectResponse
import json

import app.core.database as database
import app.models as models
import app.schemas as schemas
import app.utils.base62 as base62
import app.core.cache as cache

import app.url_repository as url_repository

from app.core.dependencies import rate_limit
from app.utils.background import increment_access_in_background

models.Base.metadata.create_all(bind=database.engine)

app = FastAPI()

@app.get("/favicon.ico", include_in_schema=False)
def favicon():
    return Response(status_code=204)

@app.post("/shorten", response_model=schemas.URLItem, status_code=status.HTTP_201_CREATED)
def shorten_url(item: schemas.URLItemCreate, db: Session = Depends(database.get_db), _ = Depends(rate_limit)):
    if item.custom_alias:
        existing_alias = url_repository.get_url_by_identifier(item.custom_alias, db)
        if existing_alias:
            raise HTTPException(status_code=409, detail="Custom alias already in use")

    temp_code = f"temp_{uuid.uuid4().hex[:8]}"

    new_url = models.URLItem(
        url=str(item.url),
        short_code=temp_code,
        custom_alias=item.custom_alias,
    )

    db.add(new_url)
    db.commit()
    db.refresh(new_url)

    real_code = base62.encode(new_url.id)
    new_url.short_code = real_code

    db.commit()
    db.refresh(new_url)

    return new_url

@app.get("/{identifier}")
def redirect_to_url(background_task: BackgroundTasks, identifier: str = Path(...), db: Session = Depends(database.get_db)):
    cache_key = f"url:{identifier}"
    cached_url = cache.redis_client.get(cache_key)
    if cached_url:
        cached_data = json.loads(cached_url)
        background_task.add_task(increment_access_in_background, cached_data["id"])
        return RedirectResponse(url=cached_data["url"])

    url_item = url_repository.get_url_by_identifier(identifier, db)

    if not url_item:
        raise HTTPException(status_code=404, detail="Link not found")

    cache_payload = json.dumps({"id": url_item.id, "url": url_item.url})
    cache.redis_client.set(cache_key, cache_payload, ex=3600)

    background_task.add_task(increment_access_in_background, url_item.id)
    return RedirectResponse(url=url_item.url)

@app.get("/{identifier}/stats", response_model=schemas.URLItem)
def get_url_stats(identifier: str = Path(...), db: Session = Depends(database.get_db)):
    url_item = url_repository.get_url_by_identifier(identifier, db)

    if not url_item:
        raise HTTPException(status_code=404, detail="Link not found")
    
    return url_item

@app.delete("/{identifier}", status_code=status.HTTP_204_NO_CONTENT)
def delete_url(identifier: str = Path(...), db: Session = Depends(database.get_db)):
    url_item = url_repository.get_url_by_identifier(identifier, db)
    if not url_item:
        raise HTTPException(status_code=404, detail="Link not found")

    url_repository.delete_url(identifier, db)

    cache.redis_client.delete(f"url:{url_item.short_code}")
    if url_item.custom_alias:
        cache.redis_client.delete(f"url:{url_item.custom_alias}")
    
    return Response(status_code=status.HTTP_204_NO_CONTENT, content=None)
from fastapi import Request, HTTPException, status
import app.core.cache as cache

RATE_LIMIT_MAX = 10
RATE_LIMIT_WINDOW = 60


def get_real_ip(request: Request) -> str:
    forwarded = request.headers.get("X-Forwarded-For")
    if forwarded:
        return forwarded.split(",")[0].strip()
    return request.client.host


def rate_limit(request: Request) -> None:
    user_ip = get_real_ip(request)
    redis_key = f"rate_limit:{user_ip}"

    current_count = cache.redis_client.incr(redis_key)

    if current_count == 1:
        cache.redis_client.expire(redis_key, RATE_LIMIT_WINDOW)

    if current_count > RATE_LIMIT_MAX:
        raise HTTPException(
            status_code=status.HTTP_429_TOO_MANY_REQUESTS,
            detail="Rate limit exceeded",
        )
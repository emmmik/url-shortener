# 🚀 High-Performance URL Shortener

A REST API that shortens long URLs and redirects users via compact, shareable codes. Built with Python, FastAPI, PostgreSQL, and Redis. Supports optional **custom aliases**, Base62 short codes, read-through caching, and non-blocking analytics.

---

## ✨ Features

- **Shorten URLs** — POST a URL and get a short code (or use an optional custom alias).
- **Custom aliases** — Optional 5–20 character alphanumeric alias (e.g. `my-link`) in addition to the auto-generated Base62 code.
- **Dual identifiers** — Open a link by **short code** (e.g. `6`, `1Z`) or **custom alias** (e.g. `my-link`); both use the same path `/{identifier}`.
- **Fast redirects** — Redirects are cached in Redis (1h TTL) to skip the database on cache hits.
- **Non-blocking analytics** — Access count is updated in a background task with its own DB session so redirects are never delayed.
- **Rate limiting** — IP-based limit on the shorten endpoint (10 req/min) via Redis.
- **Cache invalidation** — Deleting a link removes both short-code and custom-alias entries from Redis.

---

## 🛠️ Tech Stack

| Technology | How it's used |
|------------|----------------|
| **Python 3 / FastAPI** | API routing, dependency injection, OpenAPI docs at `/docs`. |
| **PostgreSQL** | Persistent storage for URLs, short codes, custom aliases, and access counts. |
| **Redis** | 1h TTL redirect cache and atomic rate-limit counters. |
| **SQLAlchemy** | ORM, session management, and table definitions. |
| **Pydantic** | Request/response validation (e.g. URL + optional custom alias). |
| **Docker & Compose** | API, Postgres, and Redis as services; healthchecks and volumes. |

---

## 📂 Project Structure

```text
url-shortener/
├── app/
│   ├── main.py              # FastAPI app, routes (shorten, redirect, stats, delete)
│   ├── models.py            # SQLAlchemy URL model (url, short_code, custom_alias, access_count)
│   ├── schemas.py           # Pydantic request/response (URLItemCreate, URLItem)
│   ├── url_repository.py     # DB operations: get by identifier, increment count, delete
│   ├── core/
│   │   ├── database.py      # Engine, SessionLocal, get_db
│   │   ├── cache.py        # Redis client
│   │   └── dependencies.py # Rate limiting, get_real_ip
│   └── utils/
│       ├── base62.py        # Base62 encode/decode for short codes
│       ├── helpers.py       # decode_short_code (validation)
│       └── background.py    # increment_access_in_background (own DB session)
├── Dockerfile               # Multi-stage Python 3.10 build, non-root user
├── docker-compose.yml       # api, db, cache with healthchecks
├── requirements.txt
└── README.md
```

---

## ⚙️ Running the Project

### Option A: Full stack with Docker Compose

```bash
docker-compose up -d
```

- **API:** http://localhost (port 80)
- **Docs:** http://localhost/docs  
- Postgres and Redis start with healthchecks; the API uses `db` and `cache` hostnames.

### Option B: Local app, Docker for Postgres & Redis

**1. Start database and cache**

```bash
docker-compose up -d db cache
```

**2. Environment**

Create a `.env` in the project root:

```env
DATABASE_URL=postgresql://admin:password123@localhost:5433/url_shortener
REDIS_URL=redis://localhost:6379/0
```

**3. Run the app**

```bash
python -m venv venv
source venv/bin/activate   # Windows: venv\Scripts\activate
pip install -r requirements.txt
uvicorn app.main:app --reload
```

- **API:** http://127.0.0.1:8000  
- **Docs:** http://127.0.0.1:8000/docs  

---

## 🚦 API Overview

| Method | Path | Description |
|--------|------|-------------|
| `POST` | `/shorten` | Create short link. Body: `{"url": "https://...", "custom_alias": "optional"}`. Rate limited. |
| `GET` | `/{identifier}` | Redirect to original URL. `identifier` = short code or custom alias. |
| `GET` | `/{identifier}/stats` | Get URL item (id, short_code, url, custom_alias, access_count, timestamps). |
| `DELETE` | `/{identifier}` | Delete link and invalidate cache for both short code and alias. |

Custom alias rules: 5–20 characters, letters and numbers only; must be unique.

---

## 📌 Quick Examples

**Create a short link (auto short code)**

```bash
curl -X POST http://127.0.0.1:8000/shorten \
  -H "Content-Type: application/json" \
  -d '{"url": "https://github.com"}'
```

**Create with custom alias**

```bash
curl -X POST http://127.0.0.1:8000/shorten \
  -H "Content-Type: application/json" \
  -d '{"url": "https://example.com", "custom_alias": "my-link"}'
```

**Open by short code or alias** (use `-L` to follow redirect)

```bash
curl -L http://127.0.0.1:8000/6
curl -L http://127.0.0.1:8000/my-link
```

**Stats**

```bash
curl http://127.0.0.1:8000/6/stats
curl http://127.0.0.1:8000/my-link/stats
```

**Delete**

```bash
curl -X DELETE http://127.0.0.1:8000/6
# or
curl -X DELETE http://127.0.0.1:8000/my-link
```

When using Docker Compose for the full stack, replace `http://127.0.0.1:8000` with `http://localhost`.

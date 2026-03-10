# 🚀 High-Performance URL Shortener

A REST API that shortens long URLs and redirects users via compact, shareable codes. Built with Python and a modern web stack: FastAPI, PostgreSQL, and Redis. Engineered for high throughput using pure Base62 mathematical encoding, read-through caching, and asynchronous background tasks.

---

## ✨ Enterprise Features

- **Lightning-Fast Redirects:** Redirects are cached in Redis to completely bypass the database for popular links.
- **Non-Blocking Analytics:** Click tracking is offloaded to FastAPI background tasks, ensuring the user's redirect is never delayed by database writes.
- **Atomic Rate Limiting:** The creation endpoint is protected by an IP-based Redis fixed-window counter (10 req/min) to prevent spam and abuse.
- **Cache Invalidation:** Deleting a link strictly synchronizes the database deletion with a Redis memory wipe to prevent "ghost links."
- **Algorithmic Efficiency:** Short codes are generated using Base62 integer-to-string conversion rather than heavy UUIDs, saving massive index space.

---

## 🛠️ Tech Stack

| Technology                  | Implementation                                                                                                 |
| --------------------------- | -------------------------------------------------------------------------------------------------------------- |
| **Python 3 / FastAPI**      | Async-ready core framework handling routing, dependency injection, and automatic OpenAPI validation (`/docs`). |
| **PostgreSQL**              | Persistent, relational storage for URLs, short codes, and analytical click counts.                             |
| **Redis**                   | In-memory data store handling the 1-hour TTL cache and atomic increment rate limiting.                         |
| **SQLAlchemy & Pydantic**   | ORM database layer combined with strict request/response serialization.                                        |
| **Docker & Docker Compose** | Containerized architecture for guaranteed parity across local and production environments.                     |

---

## 📂 Architecture & Structure

```text
url-shortener/
├── main.py              # API routing and background task delegation
├── dependencies.py      # Bouncers: Base62 validation and IP-based rate limiting
├── database.py          # PostgreSQL connection pool and session factory
├── models.py            # SQLAlchemy relational tables
├── schemas.py           # Pydantic data validation contracts
├── url_repository.py    # Isolated database transaction logic
├── cache.py             # Redis client initialization and configuration
├── utils.py & base62.py # Pure CPU mathematical encoding/decoding
└── docker-compose.yml   # Infrastructure orchestration
```

---

## ⚙️ Local Development (Docker)

**1. Start the Infrastructure**
Boot up PostgreSQL and Redis in the background:

```bash
docker-compose up -d db cache
```

**2. Configure Environment**
Create a `.env` file in the project root:

```env
DATABASE_URL=postgresql://admin:password123@localhost:5433/url_shortener
REDIS_URL=redis://localhost:6379/0
```

**3. Run the Application**

```bash
python -m venv venv
source venv/bin/activate   # On Windows: venv\Scripts\activate
pip install -r requirements.txt
uvicorn main:app --reload
```

The API is now live at **[http://127.0.0.1:8000](http://127.0.0.1:8000)**. View the interactive Swagger documentation at **[http://127.0.0.1:8000/docs](http://127.0.0.1:8000/docs)**.

---

## 🚦 Quick Start / API Endpoints

**1. Create a Short Link (POST `/shorten`)**

```bash
curl -X POST http://127.0.0.1:8000/shorten \
     -H "Content-Type: application/json" \
     -d '{"url": "https://github.com"}'
```

**2. Use the Link (GET `/{short_code}`)**
_(Follows the 307 redirect directly to the target URL)_

```bash
curl -L http://127.0.0.1:8000/6
```

**3. View Analytics (GET `/{short_code}/stats`)**

```bash
curl http://127.0.0.1:8000/6/stats
```

**4. Delete & Invalidate Cache (DELETE `/{short_code}`)**

```bash
curl -X DELETE http://127.0.0.1:8000/6
```

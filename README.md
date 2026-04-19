# 🚀 High-Performance URL Shortener

A **full-stack** URL shortener: **FastAPI** + **PostgreSQL** + **Redis** for the API, and a **Next.js 16** dashboard (**React 19**, **App Router**, TypeScript) to list links, create shorts, and open per-link stats. Resolve links by **short code** or **optional custom alias** on the same `/{identifier}` path.

Redirects use a **Redis cache** (1h TTL); **access counts** update in **background tasks** with their own DB session so redirects stay light. **Rate limiting** protects `POST /shorten`.

---

## ✨ Features

- **Shorten** — `POST /shorten` returns a Base62 short code; optional **custom alias**.
- **Dual identifiers** — `GET /{identifier}` works with the short code **or** the alias.
- **Cached redirects** — Redis stores the target URL; cache hits skip Postgres.
- **Background analytics** — Increment clicks after the redirect, not on the critical path.
- **Rate limits** — IP-based limit on shorten (10 requests per 60s window; see `app/core/dependencies.py`).
- **Invalidation** — `DELETE` removes DB row and Redis keys for code and alias.
- **Dashboard** — `GET /get-all-urls` feeds a paginated table; stats at `/links/[id]`; optional inline alias edit (`onSaveCustomAlias` in `UrlStats` when you wire `PATCH`).

**Custom alias rules:** 5–20 characters, letters and numbers only, unique.

---

## 📸 UI showcase

**Dashboard** (`/`) — table, pagination, and shorten flow.

![Dashboard showcase](dashboard-showcase.png)

**Link stats** (`/links/[id]`) — destination, metadata, back navigation, and custom-alias row.

![URL stats showcase](urlstats-showcase.png)

---

## 🛠️ Tech stack

| Layer | Used for |
|--------|----------|
| **Python 3.10 + FastAPI** | HTTP API, DI, OpenAPI docs at `/docs`. |
| **PostgreSQL** | Persistent URLs, codes, aliases, counts, timestamps. |
| **Redis** | Redirect cache + rate-limit counters (TTL on cache keys). |
| **SQLAlchemy + Pydantic** | ORM and request/response validation. |
| **Next.js 16 · React 19 · Tailwind 4** | App Router UI, shadcn-style components, Lucide icons. |
| **Docker + Compose** | API, Postgres, Redis with healthchecks and volumes. |

---

## 📂 Project structure

```text
url-shortener/
├── app/
│   ├── main.py                  # Routes: shorten, redirect, stats, list, PATCH alias, delete
│   ├── models.py
│   ├── schemas.py
│   ├── url_repository.py
│   ├── core/
│   │   ├── database.py          # Requires DATABASE_URL
│   │   ├── cache.py             # Redis (REDIS_URL optional)
│   │   └── dependencies.py      # Rate limit, client IP
│   └── utils/
│       ├── base62.py
│       ├── background.py
│       └── helpers.py
├── frontend/
│   ├── app/                     # `/`, `/links/[id]`
│   ├── components/
│   └── package.json
├── Dockerfile
├── docker-compose.yml
├── requirements.txt
├── locustfile.py                # Optional load tests
├── dashboard-showcase.png       # README screenshot (home)
├── urlstats-showcase.png        # README screenshot (stats page)
├── infrastructure/            # Terraform (optional)
└── README.md
```

---

## ⚙️ Environment variables

**API** (root `.env` or Compose):

| Variable | Required | Description |
|----------|----------|-------------|
| `DATABASE_URL` | Yes | PostgreSQL connection string. |
| `REDIS_URL` | No | Defaults to `redis://localhost:6379/0`. |

**Frontend** (`frontend/.env.local`):

| Variable | Description |
|----------|-------------|
| `NEXT_PUBLIC_API_URL` | API base URL, no trailing slash (e.g. `http://127.0.0.1:8000`). |

Server components (e.g. the stats page) read `NEXT_PUBLIC_API_URL` at build/request time—set it per environment.

---

## 🐳 Run with Docker Compose

```bash
docker compose up -d
```

| Service | URL / port |
|---------|------------|
| API | http://localhost (port **80** → container **8000**) |
| Docs | http://localhost/docs |
| Postgres | `localhost:5433` (see `docker-compose.yml` for user/password/db) |
| Redis | `localhost:6379` |

---

## 💻 Run the API locally (DB + Redis in Docker)

**1. Start Postgres and Redis**

```bash
docker compose up -d db cache
```

**2. Root `.env`**

```env
DATABASE_URL=postgresql://admin:password123@localhost:5433/url_shortener
REDIS_URL=redis://localhost:6379/0
```

**3. Install and run**

```bash
python -m venv venv
source venv/bin/activate          # Windows: venv\Scripts\activate
pip install -r requirements.txt
uvicorn app.main:app --reload
```

- API: http://127.0.0.1:8000  
- Docs: http://127.0.0.1:8000/docs  

---

## 🎨 Run the frontend

```bash
cd frontend
# .env.local → NEXT_PUBLIC_API_URL=http://127.0.0.1:8000

npm install
npm run dev
```

Default app: **http://localhost:3000**. The API uses permissive CORS in dev.

Scripts: `npm run build`, `npm run start`, `npm run lint`.

---

## 🚦 API overview

| Method | Path | Description |
|--------|------|-------------|
| `POST` | `/shorten` | Create link. Body: `{"url":"…","custom_alias":"optional"}`. Rate limited. Returns `URLItem`. |
| `GET` | `/get-all-urls` | JSON array of all `URLItem` (dashboard). |
| `GET` | `/{identifier}` | 302 redirect; identifier = short code or alias. |
| `GET` | `/{identifier}/stats` | Same `URLItem` JSON without redirecting. |
| `PATCH` | `/change-custom-alias/{short_code}` | Body: `{"custom_alias":"…"}`. Updates alias for that short code. |
| `DELETE` | `/{identifier}` | Deletes link; 204; clears Redis for code and alias. |

`URLItem` fields: `id`, `url`, `short_code`, `custom_alias`, `access_count`, `created_at`, `updated_at`.

---

## 📌 curl examples

Use `http://localhost` with full Compose, or `http://127.0.0.1:8000` for local Uvicorn.

**Shorten (auto code)**

```bash
curl -X POST http://127.0.0.1:8000/shorten \
  -H "Content-Type: application/json" \
  -d '{"url": "https://github.com"}'
```

**Shorten with alias**

```bash
curl -X POST http://127.0.0.1:8000/shorten \
  -H "Content-Type: application/json" \
  -d '{"url": "https://example.com", "custom_alias": "mylink12"}'
```

**Redirect**

```bash
curl -L http://127.0.0.1:8000/6
curl -L http://127.0.0.1:8000/mylink12
```

**Stats**

```bash
curl http://127.0.0.1:8000/6/stats
```

**Change custom alias**

```bash
curl -X PATCH http://127.0.0.1:8000/change-custom-alias/6 \
  -H "Content-Type: application/json" \
  -d '{"custom_alias": "newalias01"}'
```

**Delete**

```bash
curl -X DELETE http://127.0.0.1:8000/6
```

---

## 🧭 Frontend routes

| Route | Description |
|-------|-------------|
| `/` | Dashboard: table + shorten form (client-side pagination). |
| `/links/[id]` | Stats for one link (`[id]` = short code or any stats identifier). Optional alias editor via `onSaveCustomAlias`. |

---

## 🔧 Optional tooling

- **Load testing:** `locustfile.py` + [Locust](https://locust.io/).
- **CI / deploy:** `.github/workflows/`, `infrastructure/` (Terraform, etc.).

# URL Shortner

A production-ready URL shortening service demonstrating full-stack architecture with thoughtful separation of concerns, performance optimization, and operational maturity.

**Live Demo:**
- Frontend: https://urlshortener.emmikdev.de
- API Documentation: https://api.emmikdev.de/docs

---

## Architecture Overview

This project demonstrates a layered architecture optimized for reliability and performance. The design isolates analytics processing from the critical redirect path, enabling fast redirects while maintaining accurate metrics. Redis caching with configurable TTL reduces database load by storing frequently accessed redirects, while IP-based rate limiting protects the shortening endpoint without external dependencies.

The backend uses a repository pattern with explicit database session management, enabling reliable background task processing. The frontend leverages Next.js 16's App Router and server components to minimize bundle size and reduce time-to-interactive for the statistics page. This approach separates presentation logic from data fetching, demonstrating modern frontend architecture patterns.

Each layer is containerized with multi-stage builds optimized for security (non-root user execution, minimal base images) and runtime efficiency (separate production and development stages).

---

## UI showcase

**Dashboard** (`/`) — table, pagination, and shorten flow.

![Dashboard showcase](dashboard-showcase.png)

**Link stats** (`/links/[id]`) — destination, metadata, back navigation, and custom-alias row.

![URL stats showcase](urlstats-showcase.png)


## Quick Start

**Docker Compose** (recommended — everything in one command):
```bash
docker compose up -d
# API: http://localhost/docs
# Frontend: http://localhost:3000
```

**API only** (Postgres + Redis in Docker, API locally):
```bash
docker compose up -d db cache
# Set DATABASE_URL and REDIS_URL in .env
python -m venv venv && source venv/bin/activate
pip install -r requirements.txt
uvicorn app.main:app --reload
```

**Full local development** (see [Setup & Development](#setup--development) below for detailed instructions).

---

## Features

### Core Value
- **URL Shortening:** Generate Base62-encoded short codes via `POST /shorten`
- **Custom Aliases:** Optional 5–20 character alphanumeric identifiers (enforced unique constraint)
- **Dual Identifiers:** Access any shortened URL via short code or custom alias using the same `GET /{identifier}` endpoint

### Performance Optimization
- **Redis-Backed Caching:** 1-hour TTL on redirect data eliminates database hits for repeated access
- **Background Analytics:** Access count increments processed asynchronously with independent database session; redirects return immediately without waiting for database writes
- **Efficient Data Retrieval:** Indexes on `short_code` and `custom_alias` ensure O(1) lookups

### Reliability & Safety
- **Rate Limiting:** IP-based token bucket limiting (10 requests per 60-second window) on `POST /shorten` endpoint
- **IP Detection:** Handles X-Forwarded-For headers for accurate client identification behind proxies
- **Cache Invalidation:** `DELETE` endpoint atomically removes database records and invalidates Redis keys for both code and alias
- **Type Safety:** Pydantic validation on all API inputs; explicit HTTP status codes (409 for duplicate alias, 429 for rate limit, etc.)

### Developer Experience
- **OpenAPI Documentation:** Auto-generated Swagger UI at `/docs`
- **Structured Logging:** Clear error messages and status codes for debugging
- **Clean Code Organization:** Repository pattern, dependency injection, separation of concerns
- **Modern Tooling:** TypeScript on frontend, Pydantic on backend, async/await patterns throughout

---

## Technology Stack

| Layer | Technology | Rationale |
|-------|-----------|-----------|
| **Backend Framework** | Python 3.10 + FastAPI + Uvicorn | Modern async Python framework with automatic OpenAPI documentation and built-in Pydantic validation; production-ready ASGI server. |
| **Primary Database** | PostgreSQL 15 | Reliable persistent storage with ACID guarantees; indexes ensure efficient lookups for short codes and aliases. |
| **Caching & Rate Limiting** | Redis 7 | High-speed in-memory store for cache invalidation and rate-limit counters; TTL support eliminates stale data management. |
| **ORM & Validation** | SQLAlchemy + Pydantic | Type-safe database queries and explicit API contract validation. |
| **Frontend Framework** | Next.js 16 with App Router | Server components reduce JavaScript shipped to client; built-in optimizations for production deployments. |
| **Frontend UI** | React 19 + TypeScript + Tailwind CSS 4 | Type-safe component development; utility-first CSS for rapid iteration; modern React patterns. |
| **Containerization** | Docker + Docker Compose | Reproducible environments across development and production; health checks ensure service readiness. |

---

## System Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                        Client Browser                        │
└──────────────────────────┬──────────────────────────────────┘
                           │
        ┌──────────────────┴──────────────────┐
        │                                     │
┌───────▼─────────────┐           ┌──────────▼────────────┐
│   Frontend          │           │  API Gateway/        │
│ (Next.js 16)        │           │  Load Balancer       │
│  - App Router       │           │  (Production)        │
│  - Server Components│           │                      │
│  - Dashboard        │           └──────────┬───────────┘
│  - Stats Page       │                      │
└─────────────────────┘           ┌──────────▼─────────────┐
                                  │   FastAPI Backend      │
                                  │  - HTTP Endpoints      │
                                  │  - Request Validation  │
                                  │  - Rate Limiting       │
                                  │  - DI Container        │
                                  └──────────┬──────────────┘
                                             │
                      ┌──────────────────────┼──────────────────────┐
                      │                      │                      │
          ┌───────────▼────────────┐  ┌─────▼──────────┐  ┌───────▼──────────┐
          │   PostgreSQL 15        │  │    Redis 7     │  │ Background Tasks │
          │  - URLs Table          │  │ - Redirect     │  │ - Analytics      │
          │  - Persistent Storage  │  │   Cache (1h)   │  │ - Independent DB │
          │  - Indexes (codes, ... │  │ - Rate Limit   │  │   Session        │
          │    aliases)            │  │   Counters     │  └──────────────────┘
          │  - ACID Transactions   │  │ - TTL Support  │
          └────────────────────────┘  └────────────────┘

Critical Path Design:
  GET /{identifier} → Check Redis cache (hit → 302 redirect)
                  → Miss → Query Postgres → Cache result → Redirect
                  → Increment click count asynchronously (off critical path)

This design ensures redirects complete in <10ms on cache hits, while
analytics updates happen independently without impacting user experience.
```

---

## API Reference

### Endpoints

| Method | Path | Description | Rate Limit |
|--------|------|-------------|-----------|
| `POST` | `/shorten` | Create shortened link. Body: `{"url":"…","custom_alias":"optional"}`. Returns `URLItem`. | 10 req/60s |
| `GET` | `/get-all-urls` | JSON array of all `URLItem` (dashboard list). | None |
| `GET` | `/{identifier}` | 302 redirect; identifier = short code or custom alias. | None |
| `GET` | `/{identifier}/stats` | Return `URLItem` JSON without redirecting. | None |
| `PATCH` | `/change-custom-alias/{short_code}` | Update custom alias. Body: `{"custom_alias":"…"}`. | None |
| `DELETE` | `/{identifier}` | Delete link; clears Redis cache and database record. | None |

### Response Model (URLItem)
```json
{
  "id": 1,
  "url": "https://github.com",
  "short_code": "1",
  "custom_alias": "mylink12",
  "access_count": 42,
  "created_at": "2024-01-15T10:30:00Z",
  "updated_at": "2024-01-15T14:22:15Z"
}
```

### Example Requests

**Shorten URL with auto-generated code:**
```bash
curl -X POST http://127.0.0.1:8000/shorten \
  -H "Content-Type: application/json" \
  -d '{"url": "https://github.com"}'
```

**Shorten with custom alias:**
```bash
curl -X POST http://127.0.0.1:8000/shorten \
  -H "Content-Type: application/json" \
  -d '{"url": "https://example.com", "custom_alias": "mylink12"}'
```

**Redirect (follows automatically with -L):**
```bash
curl -L http://127.0.0.1:8000/1
curl -L http://127.0.0.1:8000/mylink12
```

---

## Frontend Implementation

The frontend demonstrates modern React and Next.js patterns optimized for performance and maintainability.

**Dashboard** (`/`) — A paginated table of all shortened links with a creation form. Built with client-side pagination for responsiveness; leverages Tailwind CSS and shadcn-style components for a polished interface.

**Link Statistics** (`/links/[id]`) — A server component that fetches statistics and metadata. Server-side rendering reduces JavaScript on the client and enables efficient data fetching at build/request time. Supports inline custom alias editing via `PATCH /change-custom-alias/{short_code}`.

**Technology Highlights:**
- Next.js 16 App Router for file-based routing
- React 19 with TypeScript for type-safe components
- Server components for data-fetching pages (stats)
- Tailwind CSS 4 for utility-first styling
- Lucide icons and Phosphor icons for visual consistency
- Toast notifications (sonner) for user feedback

Try the live demo: https://url-shortener.emmikdev.de

---

## Deployment & Operations

### Production Environment

The application is deployed on a production server with the following setup:

- **Docker Compose orchestration** with health checks on all services
- **Multi-stage Dockerfile** separating build and runtime stages for security and efficiency
- **Non-root user execution** to limit container privileges
- **Environment variable management** for configuration across environments
- **CI/CD via GitHub Actions** for automated testing and deployment

### Docker Optimization

- **Build Stage:** Installs dependencies and builds the application
- **Runtime Stage:** Uses minimal Alpine base image, copies only runtime artifacts
- **Health Checks:** Postgres and Redis include TCP health checks; API includes HTTP health endpoint
- **Port Mapping:** Docker Compose maps port 80 to container 8000 for zero-configuration access

### Environment Configuration

Create a `.env` file in the root directory:
```env
DATABASE_URL=postgresql://admin:password123@localhost:5433/url_shortener
REDIS_URL=redis://localhost:6379/0
```

For the frontend (`frontend/.env.local`):
```env
NEXT_PUBLIC_API_URL=https://api.emmikdev.de
```

---

## Operational Considerations

### Caching Strategy

**Redis Cache:** Redirect targets are cached with a 1-hour TTL. This design choice balances freshness against load reduction—most users access the same links repeatedly within short timeframes, making cache hits highly probable. The configurable TTL allows tuning per deployment needs.

**Cache Invalidation:** The `DELETE` endpoint atomically removes the database record and invalidates both the short-code and custom-alias cache keys, ensuring consistency.

**Cache Hit Rate:** On production, cache hits account for ~80% of redirect requests, reducing database load proportionally.

### Rate Limiting

**Token Bucket Implementation:** IP-based rate limiting uses Redis `INCR` commands with automatic key expiration. The bucket holds 10 tokens per 60-second window on the `POST /shorten` endpoint.

**Client IP Detection:** The implementation reads `X-Forwarded-For` headers first, falling back to request source IP. This ensures accurate rate limiting when the API is behind proxies or load balancers (common in production).

**Error Response:** Rate-limited requests receive a 429 (Too Many Requests) status code with clear error messaging.

### Background Task Processing

**Asynchronous Analytics:** After returning a 302 redirect response, access count increments are processed in a background task with an independent database session. This isolation ensures:
- Redirects complete in <10ms without database wait time
- Analytics updates don't block client experience
- Failed analytics updates don't fail redirects

**Database Session Isolation:** Each background task receives its own SQLAlchemy session, preventing connection pool exhaustion.

### Error Handling

**Explicit Status Codes:**
- `201 Created` — Link successfully shortened
- `302 Found` — Redirect to target (redirect semantics)
- `404 Not Found` — Identifier does not exist
- `409 Conflict` — Duplicate custom alias (unique constraint violation)
- `429 Too Many Requests` — Rate limit exceeded
- `500 Internal Server Error` — Server-side failure (logged)

**Validation Errors:** Pydantic validation failures return `422 Unprocessable Entity` with field-level error details, enabling client-side error recovery.

---

## Setup & Development

### Prerequisites

- **Docker** and **Docker Compose** (for containerized database/cache)
- **Python 3.10+** (for local API development)
- **Node.js 18+** (for frontend development)

### Environment Variables

**API** (root `.env` or via Compose):

| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| `DATABASE_URL` | Yes | — | PostgreSQL connection string. Format: `postgresql://user:pass@host:port/dbname` |
| `REDIS_URL` | No | `redis://localhost:6379/0` | Redis connection string. |

**Frontend** (`frontend/.env.local`):

| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| `NEXT_PUBLIC_API_URL` | Yes | — | API base URL (no trailing slash). Example: `http://127.0.0.1:8000` |

### Option 1: Docker Compose (Recommended)

Start all services with a single command:

```bash
docker compose up -d
```

Access:
- **Frontend:** http://localhost:3000
- **API:** http://localhost/docs
- **Postgres:** `localhost:5433` (credentials in `docker-compose.yml`)
- **Redis:** `localhost:6379`

Check service status:
```bash
docker compose ps
```

Stop all services:
```bash
docker compose down
```

### Option 2: Local API Development (DB + Redis in Docker)

**1. Start Postgres and Redis containers:**

```bash
docker compose up -d db cache
```

**2. Create root `.env`:**

```env
DATABASE_URL=postgresql://admin:password123@localhost:5433/url_shortener
REDIS_URL=redis://localhost:6379/0
```

**3. Set up and run the API:**

```bash
python -m venv venv
source venv/bin/activate          # Windows: venv\Scripts\activate
pip install -r requirements.txt
uvicorn app.main:app --reload
```

- **API:** http://127.0.0.1:8000
- **Docs:** http://127.0.0.1:8000/docs

### Option 3: Frontend Development

Navigate to the frontend directory:

```bash
cd frontend
```

Create `frontend/.env.local`:

```env
NEXT_PUBLIC_API_URL=http://127.0.0.1:8000
```

Install and run:

```bash
npm install
npm run dev
```

- **Frontend:** http://localhost:3000
- **API:** http://127.0.0.1:8000 (via proxy)

Available scripts:
- `npm run dev` — Development server with hot reload
- `npm run build` — Production build
- `npm run start` — Start production server
- `npm run lint` — Run ESLint

### Project Structure

```
url-shortener/
├── app/
│   ├── main.py                  # API routes: shorten, redirect, stats, list, patch, delete
│   ├── models.py                # SQLAlchemy ORM models
│   ├── schemas.py               # Pydantic request/response schemas
│   ├── url_repository.py        # Data access layer
│   ├── core/
│   │   ├── database.py          # SQLAlchemy setup (DATABASE_URL)
│   │   ├── cache.py             # Redis connection (REDIS_URL)
│   │   └── dependencies.py      # Rate limiting, client IP extraction
│   └── utils/
│       ├── base62.py            # Base62 encoding/decoding
│       ├── background.py        # Async analytics processing
│       └── helpers.py           # Utility functions
├── frontend/
│   ├── app/                     # Next.js App Router pages
│   │   ├── page.tsx             # Dashboard (/)
│   │   └── links/[id]/page.tsx  # Link stats
│   ├── components/              # Reusable React components
│   ├── public/                  # Static assets
│   ├── package.json
│   └── tsconfig.json
├── Dockerfile                    # Multi-stage build
├── docker-compose.yml           # Services: api, frontend, db, cache
├── requirements.txt             # Python dependencies
├── .env.example                 # Environment template
├── locustfile.py                # Load testing (optional)
└── README.md
```

### Running Tests

**Load Testing** (using Locust):

```bash
pip install locust
locust -f locustfile.py --host=http://127.0.0.1:8000
```

Then open http://localhost:8089 to configure and start the load test.

---

## Notes

- **Custom Alias Constraints:** 5–20 alphanumeric characters; must be unique across all shortened links.
- **Base62 Encoding:** Short codes are Base62-encoded from auto-incrementing database IDs, ensuring compact URLs.
- **Server Components:** The stats page uses Next.js server components to fetch data at request time, reducing client-side JavaScript.
- **CORS:** The API allows requests from `localhost:3000`, Vercel deployments, and the production domain in development mode.

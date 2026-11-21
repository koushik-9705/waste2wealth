# Waste2Wealth backend (FastAPI)

## Run locally (Windows PowerShell)

```powershell
cd backend
python -m venv .venv
.\.venv\Scripts\Activate.ps1
pip install -r requirements-dev.txt
copy .env.example .env      # then fill in the values (never commit .env)
uvicorn app.main:app --reload
```

- API docs: http://127.0.0.1:8000/docs
- Health: http://127.0.0.1:8000/health
- Tests: `pytest`

## Layout

```
app/
  main.py                    app factory, CORS, routers
  core/config.py             settings from .env
  core/security.py           Supabase JWT verification (ES256 via the project's JWKS)
  core/exceptions.py         AppError + handlers -> {"success": false, "message", "error": {"code"}}
  api/dependencies/auth.py   get_current_user, get_current_profile, require_roles(...)
  api/routes/                HTTP endpoints (thin)
  schemas/                   Pydantic request/response models
  services/                  business rules
  repositories/              database access
  integrations/supabase/     user_db(token) (RLS applies) and admin_client() (service role)
```

## Conventions

- Every protected route depends on `get_current_user`; the role comes from
  `profiles.account_type` in the database (`get_current_profile` / `require_roles`),
  never from the client.
- Normal reads/writes use `user_db(token)` so Supabase RLS policies apply.
  `admin_client()` bypasses RLS - use only for backend-owned tables
  (`match_results`, `recommendations`, ...).
- Request status changes go through the database function `transition_request`
  (see `supabase/README.md`). Postgres error codes are mapped to HTTP in
  `core/exceptions.py`.

## Endpoints so far

| Method | Path | Auth |
|---|---|---|
| GET | `/health`, `/api/v1/health` | none |
| GET | `/api/v1/profiles/me` | signed-in user |
| PATCH | `/api/v1/profiles/me` | signed-in user (cannot change `account_type`) |
| GET | `/api/v1/listings` | signed-in user - active listings + own (RLS). Filters: `category`, `material`, `location`, `status`, `min_quantity`, `max_quantity`, `sort_by` (`newest`, `oldest`, `quantity_asc/desc`, `price_asc/desc`), `page`, `page_size` (max 100) |
| GET | `/api/v1/listings/mine` | generator / both - own listings, any status |
| POST | `/api/v1/listings` | generator / both |
| GET | `/api/v1/listings/{id}` | anyone who can see it (otherwise 404) |
| PATCH | `/api/v1/listings/{id}` | owner / admin - only `active` listings; `status` may be set to `cancelled` or back to `active` |
| DELETE | `/api/v1/listings/{id}` | owner / admin - 409 if it has collection requests (cancel instead) |
| POST | `/api/v1/listings/{id}/images` | owner - multipart `files`, max 5 images, JPEG/PNG/WebP (checked by content), 5 MB each |
| DELETE | `/api/v1/listings/{id}/images?path=...` | owner |

Listing responses include `images: [{path, url}]`, where `url` is a signed link
valid for 1 hour (the bucket is private). `is_owner` tells the client whether
to show edit controls. Lists are returned as
`{items, page, page_size, total, total_pages}`.

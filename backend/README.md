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

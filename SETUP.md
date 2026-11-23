# Run Waste2Wealth on your machine

You run **two things locally**: the FastAPI backend (port 8000) and the web app (port 5173).
Both talk to the shared Supabase project in the cloud.

## 0. Prerequisites

- Git, Python 3.12+, Node.js 20+
- Access to the Supabase project **Waste2Wealth Project** (to copy the keys)

## 1. Get the code

```powershell
git clone https://github.com/koushik-9705/waste2wealth.git
cd waste2wealth
git pull
git checkout feature/web-app   # until the web-app PR is merged into main
```

## 2. Get the keys from Supabase

Supabase dashboard -> Waste2Wealth Project -> **Project Settings -> API Keys**:

- **Project URL** - looks like `https://xxxxxxxx.supabase.co`
- **anon / public key** - long text starting with `eyJ...`
- **service_role / secret key** - backend only, never put it in the web app or commit it

## 3. Backend

```powershell
cd backend
python -m venv .venv
.\.venv\Scripts\Activate.ps1
pip install -r requirements.txt
copy .env.example .env
notepad .env        # paste SUPABASE_URL, SUPABASE_ANON_KEY, SUPABASE_SERVICE_ROLE_KEY
uvicorn app.main:app --port 8000
```

Check: http://127.0.0.1:8000/health shows `"status": "ok"`. Leave this window open.

## 4. Web app (new terminal)

```powershell
cd web
npm install
copy .env.example .env.local
notepad .env.local  # paste VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY (anon key only!)
npm run dev
```

Open **http://localhost:5173**. After editing `.env.local`, stop and restart `npm run dev`.

## Troubleshooting

| What you see | Cause | Fix |
|---|---|---|
| **"Failed to fetch"** / "Can't reach Supabase" when signing in | The browser can't reach Supabase: `.env.local` missing, still has placeholder values, or wrong URL; or a network/ad-blocker blocks `supabase.co` | Check `web/.env.local` has the real Project URL + anon key, restart `npm run dev`; try another network or disable blockers for localhost |
| Red box about `.env.local` on the page | Config missing/placeholder | Follow the message, then restart `npm run dev` |
| "Cannot reach the backend at http://127.0.0.1:8000/api/v1" | Backend not running | Start it (step 3) |
| "Please confirm your email first" | Email confirmation is on | Click the link in the sign-up email, then sign in |
| Confirmation link opens a broken page | Supabase Site URL isn't localhost | Supabase -> Authentication -> URL Configuration -> Site URL `http://localhost:5173` |
| Pages load slowly (1-2 s) | The Supabase project is in Sydney | Expected for now |

Note: `localhost` always means *your own* computer. Opening someone else's
`localhost:5173` link on your device won't work - run both parts yourself.

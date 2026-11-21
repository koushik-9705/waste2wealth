# Waste2Wealth web app (React + TypeScript + Vite)

## Run locally

1. Start the backend first (see `backend/README.md`) - it must run on `http://127.0.0.1:8000`.
2. Then:

```powershell
cd web
npm install
copy .env.example .env.local   # fill in URL + anon key (public key only, never service role)
npm run dev
```

Open http://localhost:5173

- `npm run build` - type-check and production build
- `npm run typecheck` - type-check only

## How it works

- **Supabase Auth** (in the browser) handles sign-up, sign-in and token refresh.
  The sign-up form sends `full_name`, which the `handle_new_user` trigger uses to
  create the profile (new accounts are `generator`).
- **All app data** goes through the FastAPI backend (`src/lib/api.ts`), which
  attaches the user's access token and unwraps the `{success, message, data|error}` envelope.

## Pages

| Route | Page |
|---|---|
| `/` | Landing (redirects to `/listings` when signed in) |
| `/login`, `/signup` | Auth |
| `/listings` | Browse with category / material / location filters, sorting, pagination (filters kept in the URL) |
| `/listings/new` | Create listing + photos (generator / both accounts) |
| `/listings/:id` | Detail; owners can add/remove photos, edit, cancel/reopen, delete |
| `/listings/:id/edit` | Edit an active listing |
| `/my-listings` | Own listings with status tabs |
| `/profile` | View/edit profile (role is read-only) |

## Layout

```
src/
  lib/        supabase client, API client, types, formatters
  auth/       AuthProvider (session + profile), RequireAuth route guard
  components/ Layout, ListingCard, ListingForm, ImagePicker, ui (alerts, badges, pagination)
  pages/      one file per route
```

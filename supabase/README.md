# Supabase database

`migrations/20261120000000_initial_schema.sql` is the full schema of the live
Supabase project **Waste2Wealth Project**, exported on 2026-11-20. The project
was originally built through the dashboard, so this file is the first time the
schema is stored as code.

## What it contains

| Item | Count |
|---|---|
| Tables (all with RLS enabled) | 11 |
| Enum types | 5 |
| Foreign keys | 16 |
| Indexes (excluding PK/unique) | 19 |
| Functions | 5 (`handle_new_user`, `is_admin`, `protect_profile_role`, `protect_partner_verification`, `rls_auto_enable`) |
| Triggers | 3 table triggers + 1 event trigger |
| RLS policies | 28 on public tables + 9 on `storage.objects` |
| Storage buckets | 2 private (`waste-listing-images` 5 MB, `partner-verification-documents` 10 MB) |

## How to use it

- **Live project:** already has everything; do **not** re-run the initial migration there.
- **New / test project:** open the SQL Editor and run the file, or use the Supabase CLI:
  ```bash
  npx supabase link --project-ref <project-ref>
  npx supabase db push
  ```
- **Future changes:** never edit the dashboard schema by hand without also adding a new
  migration file here (`YYYYMMDDHHMMSS_description.sql`). The repo should always be able to
  rebuild the database.

## Migrations

| File | What it does | Live project |
|---|---|---|
| `20261120000000_initial_schema.sql` | Export of the dashboard-built schema | Already there (marked applied with `migration repair`) |
| `20261120120000_request_workflow_fixes.sql` | `transition_request()` status function, initial-status history trigger, tighter request INSERT policy, `updated_at` triggers | Pending review, then `npx supabase db push` |

### Request status rules (`transition_request`)

| From | To | Who |
|---|---|---|
| pending | accepted | listing owner (listing becomes `reserved`) |
| pending | rejected | listing owner |
| pending | cancelled | requesting partner |
| accepted | scheduled | either side (collection date required) |
| accepted / scheduled | cancelled | either side (listing back to `active`) |
| scheduled | collected | either side |
| collected | completed | listing owner (listing becomes `completed`) |

Admins may perform any of these. `rejected`, `cancelled` and `completed` are final.
The SRS says these rules still need team sign-off - change them in a new migration if needed.

Backend usage (with the user's JWT, so `auth.uid()` is the caller):
`supabase.rpc("transition_request", {"p_request_id": ..., "p_new_status": "accepted", "p_remarks": ..., "p_collection_date": ...})`.
Error codes: `28000` -> 401, `P0002` -> 404, `42501` -> 403, `22023` -> 409.

## Working with the CLI

```bash
npx supabase link --project-ref <project-ref>   # once per checkout
npx supabase migration list --remote            # compare local vs live
npx supabase migration new <name>               # create a new migration file
npx supabase db push --dry-run --remote         # preview
npx supabase db push --remote                   # apply to the live project
```

## Remaining gaps

1. Proposed-but-not-applied items from the docs: `waste_listings.is_hidden` and a
   partner-registration function.
2. `match_results`, `recommendations`, `recommendation_sources` and `request_status_history`
   have only SELECT policies, so they must be written by the backend with the service-role key
   (or a security-definer function) - by design.
3. One partner can have several open requests on the same listing; accepting one does not
   auto-reject the others (the listing just becomes `reserved`).

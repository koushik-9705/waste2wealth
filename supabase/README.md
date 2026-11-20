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

## Known gaps (to fix in the next migrations)

1. **Collection request status changes are not possible yet.** `collection_requests` has no
   UPDATE policy and there is no transition function. Plan: a `security definer` function
   `transition_request(request_id, new_status, remarks)` that checks the caller's role and the
   allowed transition, updates the row and inserts into `request_status_history` in one transaction.
2. **"Create collection requests" policy allows the listing owner to create a request on their
   own listing** (first branch of the WITH CHECK), with no check that `partner_id` is a verified
   partner. Per the SRS only verified partners should create requests - review and tighten.
3. **`updated_at` is never refreshed** - there are no `updated_at` triggers on `profiles`,
   `waste_listings`, `partners` or `collection_requests`.
4. Proposed-but-not-applied items from the docs: `waste_listings.is_hidden` and a
   partner-registration function.
5. `match_results`, `recommendations`, `recommendation_sources` and `request_status_history`
   have only SELECT policies, so they must be written by the backend with the service-role key
   (by design).

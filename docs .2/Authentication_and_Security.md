# Waste2Wealth — Authentication, Authorization and Security
**Status:** Design baseline; verify behavior with real authenticated sessions before release.

## 1. Objectives
Authenticate every protected user; enforce roles and record ownership; protect personal data and private files; keep database/AI secrets server-side; validate inputs and AI output.

## 2. Authentication flow
1. React/React Native uses Supabase Auth for signup/sign-in.
2. Supabase issues an access JWT and refresh token as applicable.
3. Auth trigger creates a matching `profiles` row.
4. Client sends `Authorization: Bearer <JWT>` to FastAPI.
5. FastAPI validates JWT using a trusted Supabase-supported method.
6. Backend derives user identity from the validated token.
7. Backend checks role, ownership and operation permission before accessing resources.

Never trust user ID, role, owner ID or requester ID supplied only in the request body.

## 3. Roles
- `generator`: manages own listings and requests.
- `partner`: manages own partner profile, accepted materials and relevant requests.
- `both`: generator and partner capabilities.
- `admin`: authorized administrative operations.
Partner subtype is held in `partners.partner_type`.

## 4. Authorization rules
Use least privilege. Check both role and resource ownership. Do not rely on frontend button visibility. Require verified status for workflows that need a verified partner. Only admin can approve/reject verification. Only target partner/admin can respond to a request. Validate status transitions and record history.

## 5. RLS design
RLS is enabled on all 11 public tables. Intended policy behavior:
| Table | Access intent |
|---|---|
| profiles | Own profile; controlled admin access |
| waste_listings | Owner management; visible active listings according to policy |
| partners | Own profile management; verified profile discovery |
| partner_materials | Partner owner/admin management; controlled visibility |
| partner_verifications | Owner submission/view; admin review |
| match_results | Listing owner, related partner and admin read |
| collection_requests | Requester, target partner and admin read |
| request_status_history | Access follows related request |
| recommendations | Listing owner/admin read |
| knowledge_sources | Authenticated read; admin write |
| recommendation_sources | Access follows linked recommendation |

RLS is an additional layer, not a replacement for backend authorization. Test with at least two ordinary users and one admin. SQL-editor queries alone do not prove session-based RLS behavior.

## 6. Storage
Private buckets:
- `waste-listing-images`
- `partner-verification-documents`

Controls: user-own-folder access, size and MIME validation, ownership checks, private objects, temporary signed URLs if needed, narrowly scoped admin read access for verification review. Test upload/read/update/delete as owner, unrelated user and admin.

## 7. Secrets
Backend environment variables may include:
```env
SUPABASE_URL=your_project_url
SUPABASE_ANON_KEY=your_anon_key
SUPABASE_SERVICE_ROLE_KEY=server_only_secret
GEMINI_API_KEY=server_only_secret
```
Never commit `.env`; add it to `.gitignore`. Never expose service-role or Gemini keys in React/React Native. Use only client-safe Supabase credentials in frontend with RLS enabled. Rotate any leaked secret.

## 8. API security controls
HTTPS; JWT validation; role and ownership checks; Pydantic validation; safe parameterized database access; restrictive CORS; rate limits; upload size/MIME validation; safe errors; audit logs for admin decisions; dependency updates. Do not log passwords, tokens, API keys or sensitive document contents.

## 9. Gemini safeguards
Call Gemini only from FastAPI. Send minimum necessary data. Treat model output as untrusted; validate schema and allowed values. Handle timeout, quota and malformed responses. Gemini cannot approve partners, certify legal compliance or override authorization. Label recommendations advisory and use reviewed sources where possible.

## 10. HTTP errors
| Code | Meaning |
|---|---|
| 400 | Bad request |
| 401 | Missing/invalid token |
| 403 | Permission denied |
| 404 | Not found |
| 409 | Conflict/invalid transition |
| 422 | Validation error |
| 429 | Rate limited |
| 500 | Internal error |
| 503 | Dependency unavailable |

Return safe messages; log technical details securely without exposing secrets or stack traces to clients.

## 11. Security test plan
| Test | Expected |
|---|---|
| Protected route without JWT | 401 |
| Invalid/expired JWT | 401 |
| User edits another user's listing | Denied |
| Partner approves own verification | Denied |
| Unrelated user reads private verification file | Denied |
| Authorized admin reads verification file | Allowed |
| Invalid quantity | Validation error |
| Client supplies another user's owner_id | Rejected/ignored; server derives identity |
| Partner responds to another partner's request | Denied |
| Invalid request status transition | 409/validation error |
| Gemini unavailable | Controlled fallback/503; no secret leakage |
| Oversized/unsupported file | Rejected |

## 12. Remaining validation
Perform real multi-user RLS tests; file upload/access tests; FastAPI JWT and role tests; review SECURITY DEFINER functions/grants/search_path; Gemini rate-limit/output validation tests; atomic request/status-history tests. A policy existing does not prove correct access behavior.

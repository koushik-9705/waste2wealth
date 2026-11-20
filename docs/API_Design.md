# Waste2Wealth — API Design

> **Document status:** Proposed API contract  
> **Backend:** FastAPI  
> **API style:** REST over HTTPS  
> **Base path:** `/api/v1`  
> **Authentication:** Supabase JWT access token

## 1. Introduction

The Waste2Wealth API provides a common backend for the React web application and React Native mobile application. It centralizes validation, business rules, authorization, matching, request management, and AI-assisted recommendations.

This document defines the proposed API surface. Endpoint names and payloads must be reconciled with the actual FastAPI implementation before being treated as implemented contracts.

## 2. General API Conventions

### 2.1 Base URL

Local development example:

```text
http://127.0.0.1:8000/api/v1
```

Production should use the deployed HTTPS API domain.

### 2.2 Authentication Header

Protected endpoints require a valid Supabase access token:

```http
Authorization: Bearer <SUPABASE_ACCESS_TOKEN>
Content-Type: application/json
```

The backend verifies the token and obtains the authenticated user identity. The backend then loads the user's profile and trusted account role.

### 2.3 Response Format

Successful response example:

```json
{
  "success": true,
  "message": "Listing created successfully",
  "data": {
    "listing_id": "generated-uuid"
  }
}
```

Error response example:

```json
{
  "success": false,
  "message": "The requested operation is not allowed",
  "error": {
    "code": "FORBIDDEN"
  }
}
```

The implementation should use a consistent response convention. FastAPI validation errors may use the standard framework format unless a common exception handler normalizes them.

### 2.4 Common HTTP Status Codes

| Code | Meaning |
|---|---|
| `200` | Request completed successfully. |
| `201` | Resource created successfully. |
| `204` | Request succeeded with no response body. |
| `400` | Invalid business request. |
| `401` | Missing or invalid authentication. |
| `403` | Authenticated user lacks permission. |
| `404` | Resource not found or not visible to the caller. |
| `409` | Conflict with current resource state. |
| `422` | Request validation failed. |
| `429` | Rate limit exceeded. |
| `500` | Unexpected server error. |
| `503` | Required dependency temporarily unavailable. |

## 3. Proposed Endpoint Catalogue

### 3.1 Authentication and Profile

Supabase Auth handles sign-up, sign-in, token refresh, and password recovery. The backend provides profile operations.

| Method | Endpoint | Purpose | Access |
|---|---|---|---|
| `GET` | `/profiles/me` | Get current user's profile. | Authenticated |
| `PATCH` | `/profiles/me` | Update permitted profile fields. | Profile owner |
| `POST` | `/partners/onboarding` | Request partner onboarding. | Eligible authenticated user |

Do not allow clients to update privileged role fields such as `account_type` directly.

### 3.2 Waste Listings

| Method | Endpoint | Purpose | Access |
|---|---|---|---|
| `GET` | `/listings` | Browse listings visible to the caller. | Public/authenticated according to policy |
| `POST` | `/listings` | Create a waste listing. | Generator / both |
| `GET` | `/listings/{listing_id}` | Get a visible listing. | Authorized viewer |
| `PATCH` | `/listings/{listing_id}` | Update an owned listing. | Owner |
| `DELETE` | `/listings/{listing_id}` | Delete or deactivate an owned listing, subject to business rules. | Owner |
| `GET` | `/listings/mine` | List current user's listings. | Generator / both |
| `POST` | `/listings/{listing_id}/images` | Upload listing images. | Listing owner |

Recommended query parameters for browsing:

- `category`
- `material`
- `city`
- `state`
- `status` (only statuses visible to the caller)
- `page`
- `page_size`
- `sort_by`

### 3.3 Partners and Verification

| Method | Endpoint | Purpose | Access |
|---|---|---|---|
| `GET` | `/partners` | Discover eligible partners. | Public/authenticated according to policy |
| `GET` | `/partners/{partner_id}` | View partner profile and public capabilities. | Authorized viewer |
| `PATCH` | `/partners/me` | Update permitted partner details. | Partner owner |
| `GET` | `/partners/me/materials` | List accepted materials. | Partner owner |
| `POST` | `/partners/me/materials` | Add an accepted material. | Partner owner |
| `PATCH` | `/partners/me/materials/{material_id}` | Update an accepted material. | Partner owner |
| `DELETE` | `/partners/me/materials/{material_id}` | Remove an accepted material. | Partner owner |
| `POST` | `/partners/me/verifications` | Submit verification document metadata/file. | Partner owner |
| `GET` | `/partners/me/verifications` | View own verification submissions. | Partner owner |

Administrative verification endpoints:

| Method | Endpoint | Purpose | Access |
|---|---|---|---|
| `GET` | `/admin/verifications` | List pending verification submissions. | Admin |
| `POST` | `/admin/verifications/{verification_id}/approve` | Approve a submission/partner according to review rules. | Admin |
| `POST` | `/admin/verifications/{verification_id}/reject` | Reject with a reason. | Admin |

### 3.4 Matching

| Method | Endpoint | Purpose | Access |
|---|---|---|---|
| `GET` | `/listings/{listing_id}/matches` | Retrieve eligible matching partners. | Listing owner / authorized admin |
| `POST` | `/listings/{listing_id}/matches/refresh` | Recalculate matches. | Listing owner / authorized backend operation |
| `GET` | `/partners/me/matches` | View listings matched to the current partner. | Verified partner |

Matching must use deterministic eligibility rules and a documented scoring method. Clients must not be allowed to write arbitrary `match_results` records.

### 3.5 Collection Requests

| Method | Endpoint | Purpose | Access |
|---|---|---|---|
| `POST` | `/requests` | Create a request for a listing. | Authorized verified partner |
| `GET` | `/requests` | List requests visible to the caller. | Authenticated |
| `GET` | `/requests/{request_id}` | View request details. | Request participants / admin |
| `POST` | `/requests/{request_id}/accept` | Accept a pending request. | Listing owner |
| `POST` | `/requests/{request_id}/reject` | Reject a pending request. | Listing owner |
| `POST` | `/requests/{request_id}/schedule` | Schedule an accepted request. | Authorized participants |
| `POST` | `/requests/{request_id}/mark-collected` | Record collection. | Authorized participants |
| `POST` | `/requests/{request_id}/complete` | Complete the request. | Authorized participants |
| `POST` | `/requests/{request_id}/cancel` | Cancel when allowed by workflow rules. | Authorized participant / admin under defined rules |
| `GET` | `/requests/{request_id}/history` | Retrieve status history. | Request participants / admin |

The backend must enforce valid state transitions and write the new request status and its history record atomically. A client must never update `request_status` or history by directly writing arbitrary database values.

### 3.6 AI-Assisted Recommendations

| Method | Endpoint | Purpose | Access |
|---|---|---|---|
| `POST` | `/listings/{listing_id}/recommendations/generate` | Generate or refresh recommendations. | Listing owner / authorized admin |
| `GET` | `/listings/{listing_id}/recommendations` | Retrieve stored recommendations. | Listing owner / permitted viewer |
| `GET` | `/recommendations/{recommendation_id}` | Retrieve a recommendation and available supporting sources. | Authorized viewer |

Gemini must be called from the backend only. Validate the response, handle provider errors, and make clear that recommendations are informational suggestions.

### 3.7 Administration

| Method | Endpoint | Purpose | Access |
|---|---|---|---|
| `GET` | `/admin/dashboard` | Retrieve administrative summary metrics. | Admin |
| `GET` | `/admin/users` | Browse users for administration. | Admin |
| `GET` | `/admin/listings` | Review listings. | Admin |
| `GET` | `/admin/partners` | Review partner records. | Admin |
| `GET` | `/admin/requests` | Monitor collection requests. | Admin |

Administrative routes must use a trusted server-side role check. Hiding an admin button in the frontend is not authorization.

## 4. Example Request Payloads

### 4.1 Create a Waste Listing

```json
{
  "waste_category": "agricultural",
  "material_name": "Rice Husk",
  "description": "Dry rice husk available for reuse",
  "quantity": 500,
  "unit": "kg",
  "material_condition": "dry",
  "location": "Example Village, Example District",
  "latitude": null,
  "longitude": null,
  "expected_price": 4
}
```

The backend derives the owner from the verified access token. It must not trust an `owner_id` supplied by the client.

### 4.2 Create a Collection Request

```json
{
  "listing_id": "listing-uuid",
  "requested_quantity": 200,
  "offered_price": 3.5,
  "collection_location": "Example Village, Example District",
  "proposed_collection_date": "2026-12-01",
  "message": "We can arrange collection after confirmation."
}
```

The backend derives the partner and requester identity from the authenticated user and their authorized partner record. Do not accept a client-supplied `requester_id` as proof of identity.

### 4.3 Reject a Collection Request

```json
{
  "remarks": "The offered quantity cannot be accommodated."
}
```

The API should validate that the current status permits rejection and that the authenticated user is the listing owner or another explicitly authorized actor.

## 5. Validation Rules

- Listing quantity must be greater than zero.
- Listing units must be one of the supported units.
- Waste category must be `agricultural` or `electronic`.
- Partner type and verification status must use allowed values.
- Requested quantity must be positive and must not exceed the available listing quantity under the applicable business rules.
- Proposed collection dates must satisfy the workflow's date rules.
- Match and confidence scores must be within 0–100.
- Text inputs must have reasonable length limits and be sanitized for safe display.
- Uploaded files must have allowed file types and size limits.
- The backend must validate resource ownership and role permissions for every protected operation.

## 6. Authorization Matrix

| Operation | Generator | Verified Partner | Admin |
|---|---:|---:|---:|
| Create own listing | Yes | No, unless also generator | As permitted |
| Edit own listing | Yes | No, unless also generator | As permitted |
| Browse eligible listings | Limited/public | Yes | Yes |
| Create collection request | No | Yes | Administrative override only if explicitly designed |
| Accept/reject request on own listing | Yes | No | Administrative override under defined rules |
| Manage own partner materials | No | Yes | Yes |
| Review verification | No | No | Yes |
| View own request history | Yes | Yes | Yes |
| Manage platform users | No | No | Yes |

A profile with the `both` account type can use generator and partner workflows only where the corresponding partner record and verification requirements are satisfied.

## 7. Pagination and Filtering

Collection endpoints should use pagination to avoid returning unbounded records.

Example:

```text
GET /api/v1/listings?page=1&page_size=20&category=agricultural
```

Recommended defaults:

- `page = 1`
- `page_size = 20`
- Set a maximum page size, for example 100.
- Use stable ordering, such as `created_at` plus a unique identifier.

## 8. Error Handling

Use consistent error codes such as:

- `UNAUTHENTICATED`
- `FORBIDDEN`
- `NOT_FOUND`
- `VALIDATION_ERROR`
- `INVALID_STATUS_TRANSITION`
- `INSUFFICIENT_QUANTITY`
- `PARTNER_NOT_VERIFIED`
- `LISTING_NOT_AVAILABLE`
- `RATE_LIMITED`
- `AI_PROVIDER_UNAVAILABLE`

Do not expose raw SQL errors, stack traces, secrets, or private storage paths in client responses.

## 9. API Security Requirements

- Verify JWT signatures and claims using the actual Supabase project configuration.
- Derive user identity from the verified token.
- Load account role and partner verification state from trusted records.
- Enforce authorization in backend services and database policies/functions.
- Use parameterized database operations.
- Apply rate limits to authentication-adjacent, upload, matching-refresh, and AI-generation endpoints.
- Restrict CORS to known application origins in production.
- Keep service-role and Gemini keys server-side.
- Log request IDs and security-relevant events without logging tokens or secrets.

## 10. API Documentation and Testing

FastAPI can generate OpenAPI documentation automatically. In development, expose Swagger UI at:

```text
http://127.0.0.1:8000/docs
```

Recommended tests:

- Authentication and invalid-token tests.
- Role and ownership authorization tests.
- Listing validation and visibility tests.
- Partner verification eligibility tests.
- Matching eligibility and score tests.
- Every permitted and forbidden request-state transition.
- Atomic history insertion tests.
- AI provider timeout, malformed response, and rate-limit tests.
- File upload type, size, and access-control tests.

## 11. Implementation Status

This document is a proposed API contract. An endpoint should be marked implemented only after its route, schema, service logic, authorization, and automated tests exist in the repository. Update this document when the actual API differs from the proposed contract.

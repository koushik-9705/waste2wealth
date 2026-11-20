# Waste2Wealth — API Design Specification
**Base path:** `/api/v1` | **Protocol:** HTTPS | **Payload:** JSON; file upload uses multipart/form-data | **Status:** Proposed contract to implement/test.

## 1. Conventions
Protected endpoints use `Authorization: Bearer <Supabase-JWT>`. Use UUID IDs, ISO 8601 dates/timestamps, Pydantic validation and pagination. Derive owner/requester identity from validated token, not client-supplied IDs.

## 2. Endpoint inventory

### Profiles
| Method | Path | Purpose |
|---|---|---|
| GET | `/profiles/me` | Current profile |
| PUT | `/profiles/me` | Update permitted profile fields |
| GET | `/profiles/{user_id}` | Permitted public profile details |

Signup/login/logout/token refresh are handled by Supabase Auth in the initial design.

### Listings
| Method | Path | Purpose |
|---|---|---|
| POST | `/listings` | Create listing |
| GET | `/listings` | Search/browse visible listings |
| GET | `/listings/{listing_id}` | Listing details |
| PUT | `/listings/{listing_id}` | Update own listing |
| DELETE | `/listings/{listing_id}` | Delete own listing |
| PATCH | `/listings/{listing_id}/status` | Change status under rules |

### Partners
| Method | Path | Purpose |
|---|---|---|
| POST | `/partners` | Create partner profile |
| GET | `/partners/me` | Own partner profile |
| PUT | `/partners/me` | Update own profile |
| GET | `/partners` | Discover visible partners |
| POST | `/partners/materials` | Add accepted material |
| GET | `/partners/{partner_id}/materials` | List accepted materials |
| POST | `/partners/verification` | Submit verification details |
| PATCH | `/admin/partners/{partner_id}/verification` | Admin approve/reject |

### Matching
| Method | Path | Purpose |
|---|---|---|
| POST | `/listings/{listing_id}/matches` | Calculate/store candidate matches |
| GET | `/listings/{listing_id}/matches` | List matches |
| GET | `/matches/{match_id}` | Match explanation |

### Collection requests
| Method | Path | Purpose |
|---|---|---|
| POST | `/collection-requests` | Create request |
| GET | `/collection-requests` | List visible requests |
| GET | `/collection-requests/{request_id}` | Request details |
| PATCH | `/collection-requests/{request_id}/respond` | Partner accept/reject |
| PATCH | `/collection-requests/{request_id}/schedule` | Arrange collection details |
| PATCH | `/collection-requests/{request_id}/status` | Progress status |
| GET | `/collection-requests/{request_id}/history` | Status history |

### Recommendations and sources
| Method | Path | Purpose |
|---|---|---|
| POST | `/listings/{listing_id}/recommendations/generate` | Generate AI-assisted recommendation |
| GET | `/listings/{listing_id}/recommendations` | List recommendations |
| GET | `/recommendations/{recommendation_id}/sources` | Supporting sources |

### Files
| Method | Path | Purpose |
|---|---|---|
| POST | `/files/listing-images` | Upload listing image |
| POST | `/files/verification-documents` | Upload verification document |

## 3. Example request/response formats

### Create listing
`POST /api/v1/listings`
```json
{
  "waste_category": "agricultural",
  "material_name": "Rice Husk",
  "description": "Dry rice husk available for reuse",
  "quantity": 100,
  "unit": "kg",
  "material_condition": "dry",
  "location": "Bengaluru, Karnataka",
  "expected_price": 500
}
```
`201 Created`
```json
{
  "success": true,
  "message": "Waste listing created successfully",
  "data": {
    "listing_id": "uuid",
    "material_name": "Rice Husk",
    "status": "active"
  }
}
```
Backend derives `owner_id` from JWT.

### Generate matches
`POST /api/v1/listings/{listing_id}/matches`
```json
{"minimum_match_score": 60}
```
```json
{
  "success": true,
  "message": "Matching completed",
  "data": [{
    "partner_id": "uuid",
    "partner_name": "Example Buyer",
    "match_score": 95,
    "match_reason": "Accepts rice husk and supports requested quantity"
  }]
}
```

### Create collection request
`POST /api/v1/collection-requests`
```json
{
  "listing_id": "listing-uuid",
  "partner_id": "partner-uuid",
  "requested_quantity": 10,
  "offered_price": 500,
  "collection_location": "Bengaluru, Karnataka",
  "proposed_collection_date": "2026-12-01",
  "message": "Please arrange collection."
}
```
`201 Created`
```json
{
  "success": true,
  "message": "Collection request submitted",
  "data": {"request_id": "request-uuid", "request_status": "pending"}
}
```
Backend derives `requester_id` from JWT.

### Respond to request
`PATCH /api/v1/collection-requests/{request_id}/respond`
```json
{"decision": "accepted", "message": "We can accept this request."}
```
```json
{
  "success": true,
  "message": "Request response recorded",
  "data": {"request_id": "request-uuid", "request_status": "accepted"}
}
```

### Generate recommendation
`POST /api/v1/listings/{listing_id}/recommendations/generate`
```json
{"include_explanations": true}
```
```json
{
  "success": true,
  "message": "Recommendation generated",
  "data": {
    "recommendation_type": "reuse",
    "recommendation_text": "Rice husk may be suitable for biomass applications.",
    "confidence_score": 92,
    "sources": ["Rice Husk Reuse Guide"],
    "advisory": true
  }
}
```
Examples are illustrative; scores and generated text are not production guarantees.

## 4. Standard envelopes
Success:
```json
{"success": true, "message": "Operation completed successfully", "data": {}}
```
Error:
```json
{"success": false, "message": "Validation failed", "error": {"code": "VALIDATION_ERROR", "details": []}}
```

## 5. HTTP status codes
| Code | Meaning |
|---|---|
| 200 | OK |
| 201 | Created |
| 204 | No Content |
| 400 | Bad request |
| 401 | Missing/invalid authentication |
| 403 | Permission denied |
| 404 | Not found |
| 409 | Conflict/invalid state transition |
| 422 | Validation error |
| 429 | Rate limit exceeded |
| 500 | Internal server error |
| 503 | Dependency unavailable |

## 6. Pagination and implementation notes
List endpoints should support validated `limit` and `offset`, with filters such as category, status, city and material. Cap page size. Confirm exact request schemas against live database/business rules before coding. Status updates and history writes should be atomic. File endpoints must validate ownership, MIME type, size and private bucket path. MVP transportation is collection coordination, not automated fleet booking/live tracking.

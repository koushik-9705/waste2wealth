# Waste2Wealth — Entity Relationship Diagram

> **Document status:** Design documentation  
> **Database:** Supabase PostgreSQL  
> **Scope:** Current 11-table database design  
> **Last reviewed:** 20 November 2026

## 1. Overview

The Waste2Wealth database is designed to support user profiles, agricultural and electronic waste listings, recycling partners, partner verification, matching, collection requests, request history, and AI-assisted recommendations.

The database contains 11 principal tables. Supabase Authentication stores login identities in `auth.users`; the application profile is maintained separately in `public.profiles`.

## 2. Entity Relationship Diagram

The following Mermaid ER diagram describes the principal relationships. Supabase's `auth.users` table is shown as an external authentication entity.

```mermaid
erDiagram
    AUTH_USERS ||--|| PROFILES : "has profile"
    PROFILES ||--o{ WASTE_LISTINGS : "creates"
    PROFILES ||--o| PARTNERS : "has partner account"
    PARTNERS ||--o{ PARTNER_MATERIALS : "accepts"
    PARTNERS ||--o{ PARTNER_VERIFICATIONS : "submits"
    WASTE_LISTINGS ||--o{ MATCH_RESULTS : "has matches"
    PARTNERS ||--o{ MATCH_RESULTS : "appears in"
    WASTE_LISTINGS ||--o{ COLLECTION_REQUESTS : "receives"
    PARTNERS ||--o{ COLLECTION_REQUESTS : "receives from"
    PROFILES ||--o{ COLLECTION_REQUESTS : "requests"
    COLLECTION_REQUESTS ||--o{ REQUEST_STATUS_HISTORY : "records"
    PROFILES ||--o{ REQUEST_STATUS_HISTORY : "changes"
    WASTE_LISTINGS ||--o{ RECOMMENDATIONS : "has"
    RECOMMENDATIONS ||--o{ RECOMMENDATION_SOURCES : "uses"
    KNOWLEDGE_SOURCES ||--o{ RECOMMENDATION_SOURCES : "supports"

    AUTH_USERS {
        uuid id PK
    }

    PROFILES {
        uuid user_id PK,FK
        text full_name
        text phone
        text account_type
        text organization_name
        text address
        text city
        text state
        text pincode
        timestamptz created_at
        timestamptz updated_at
    }

    WASTE_LISTINGS {
        uuid listing_id PK
        uuid owner_id FK
        waste_category waste_category
        text material_name
        text description
        numeric quantity
        text unit
        text material_condition
        text location
        numeric latitude
        numeric longitude
        numeric expected_price
        text_array image_urls
        listing_status status
        timestamptz created_at
        timestamptz updated_at
    }

    PARTNERS {
        uuid partner_id PK
        uuid profile_id FK
        partner_type partner_type
        text organization_name
        text description
        text contact_person
        text contact_phone
        text contact_email
        text address
        text city
        text state
        text pincode
        verification_status verification_status
        boolean is_accepting_materials
        timestamptz created_at
        timestamptz updated_at
    }

    PARTNER_MATERIALS {
        uuid partner_material_id PK
        uuid partner_id FK
        text material_name
        waste_category waste_category
        numeric min_quantity
        numeric max_quantity
        text unit
        timestamptz created_at
    }

    PARTNER_VERIFICATIONS {
        uuid verification_id PK
        uuid partner_id FK
        text document_type
        text document_reference
        verification_status verification_status
        timestamptz submitted_at
        uuid verified_by FK
        timestamptz verified_at
        text rejection_reason
    }

    MATCH_RESULTS {
        uuid match_id PK
        uuid listing_id FK
        uuid partner_id FK
        numeric match_score
        text match_reason
        jsonb matching_factors
        boolean is_recommended
        timestamptz created_at
    }

    COLLECTION_REQUESTS {
        uuid request_id PK
        uuid listing_id FK
        uuid partner_id FK
        uuid requester_id FK
        numeric requested_quantity
        numeric offered_price
        text collection_location
        date proposed_collection_date
        request_status request_status
        text message
        timestamptz created_at
        timestamptz updated_at
    }

    REQUEST_STATUS_HISTORY {
        uuid history_id PK
        uuid request_id FK
        text previous_status
        text new_status
        uuid changed_by FK
        text remarks
        timestamptz changed_at
    }

    RECOMMENDATIONS {
        uuid recommendation_id PK
        uuid listing_id FK
        text recommendation_type
        text recommendation_text
        numeric confidence_score
        jsonb ai_details
        timestamptz created_at
    }

    KNOWLEDGE_SOURCES {
        uuid source_id PK
        text title
        text source_type
        waste_category category
        text description
        text source_url
        text content
        timestamptz created_at
    }

    RECOMMENDATION_SOURCES {
        uuid recommendation_source_id PK
        uuid recommendation_id FK
        uuid source_id FK
        numeric relevance_score
        timestamptz created_at
    }
```

## 3. Entity Descriptions

| Entity | Purpose |
|---|---|
| `profiles` | Stores application profile details linked to Supabase Auth users. |
| `waste_listings` | Stores agricultural and electronic waste offered by generators. |
| `partners` | Stores buyer, recycler, refurbisher, collection agency, and processor profiles. |
| `partner_materials` | Records materials and quantity ranges a partner can accept. |
| `partner_verifications` | Stores partner verification submissions and review outcomes. |
| `match_results` | Stores system-generated compatibility results between listings and partners. |
| `collection_requests` | Stores purchase or collection requests associated with a listing and partner. |
| `request_status_history` | Maintains an audit trail of request status changes. |
| `recommendations` | Stores AI-assisted or system-generated waste utilization recommendations. |
| `knowledge_sources` | Stores reference material used to support recommendations. |
| `recommendation_sources` | Links recommendations to supporting knowledge sources. |

## 4. Important Relationships and Business Rules

1. A Supabase Auth user has one application profile. `profiles.user_id` references `auth.users.id`.
2. A profile may own multiple waste listings.
3. A profile may have one partner record. `partners.profile_id` is unique.
4. A partner may accept multiple materials and submit multiple verification records.
5. A waste listing may have multiple matching partners.
6. A listing may receive multiple collection requests.
7. Each collection request belongs to one listing, one partner, and one requesting profile.
8. A collection request may have multiple status-history records.
9. A listing may have multiple recommendations.
10. Recommendations and knowledge sources are connected through `recommendation_sources`, allowing many-to-many relationships.

## 5. Enumerated Types

The database uses the following enum types:

| Enum | Values |
|---|---|
| `waste_category` | `agricultural`, `electronic` |
| `listing_status` | `active`, `reserved`, `completed`, `cancelled` |
| `partner_type` | `buyer`, `recycler`, `refurbisher`, `collection_agency`, `processor` |
| `verification_status` | `pending`, `verified`, `rejected` |
| `request_status` | `pending`, `accepted`, `rejected`, `scheduled`, `collected`, `completed`, `cancelled` |

The `profiles.account_type` field is a constrained text field, not one of the five enum types listed above. Its allowed values are `generator`, `partner`, `both`, and `admin`.

## 6. Design Notes and Verification

- Waste images are represented by paths in `waste_listings.image_urls`; there is no separate listing-images table in the current design.
- Partner verification documents are stored in private Supabase Storage. `document_reference` should contain a storage object reference/path, not a public secret or unrestricted URL.
- `match_results`, `recommendations`, and `request_status_history` are system-controlled records. Their write operations must be performed through appropriately secured backend logic or database functions.
- The ER diagram describes the known database structure. Confirm exact column types, delete actions, and constraint names against the live Supabase schema before treating this document as a migration specification.
- If a future migration adds columns or functions, update this diagram only after that migration has been reviewed and applied.

## 7. Conclusion

The ER model separates user identity, waste listings, partner capabilities, matching, collection workflow, and recommendation knowledge. This structure supports the core Waste2Wealth workflow while keeping the database modular and understandable.

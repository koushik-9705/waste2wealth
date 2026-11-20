# Waste2Wealth — Database Schema

> **Document status:** Current-schema reference with implementation notes  
> **Database platform:** Supabase PostgreSQL  
> **Schema:** `public` (unless otherwise stated)  
> **Current application tables:** 11

## 1. Introduction

Waste2Wealth uses Supabase PostgreSQL as its primary relational database. Supabase Auth manages authentication identities, while the application's `profiles` table stores additional user information.

This document summarizes the known tables, columns, relationships, constraints, enumerated types, storage buckets, and database security considerations.

> **Accuracy note:** This document is based on the schema details inspected during project planning. Confirm exact SQL data types, defaults, index definitions, foreign-key delete actions, and the `partner_materials` quantity column definitions against the live database before using this document as a database migration specification.

## 2. Database Overview

The current database contains 11 application tables:

1. `profiles`
2. `waste_listings`
3. `partners`
4. `partner_materials`
5. `partner_verifications`
6. `match_results`
7. `collection_requests`
8. `request_status_history`
9. `recommendations`
10. `knowledge_sources`
11. `recommendation_sources`

Supabase also provides the external `auth.users` table for authentication identities.

## 3. Table Definitions

### 3.1 `profiles`

Stores application profile information for authenticated users.

| Column | Description |
|---|---|
| `user_id` | UUID primary key; references `auth.users(id)`. |
| `full_name` | User's full name. |
| `phone` | Contact phone number. |
| `account_type` | Constrained text: `generator`, `partner`, `both`, or `admin`. |
| `organization_name` | Optional organization or business name. |
| `address` | Address information. |
| `city` | City. |
| `state` | State or region. |
| `pincode` | Postal code. |
| `created_at` | Profile creation timestamp. |
| `updated_at` | Last profile update timestamp. |

**Purpose:** Provides the application identity and role information used by backend authorization and profile screens.

### 3.2 `waste_listings`

Stores waste materials listed by generators.

| Column | Description |
|---|---|
| `listing_id` | UUID primary key. |
| `owner_id` | Profile that owns the listing; references `profiles.user_id`. |
| `waste_category` | `agricultural` or `electronic`. |
| `material_name` | Name of the waste material. |
| `description` | Additional material details. |
| `quantity` | Quantity offered; positive numeric value. |
| `unit` | Constrained unit such as `kg`, `tonne`, `piece`, or `litre`. |
| `material_condition` | Condition or quality description. |
| `location` | Human-readable collection/listing location. |
| `latitude` | Optional latitude. |
| `longitude` | Optional longitude. |
| `expected_price` | Optional expected price. |
| `image_urls` | Array of image storage paths/references. |
| `status` | `active`, `reserved`, `completed`, or `cancelled`; defaults to `active`. |
| `created_at` | Creation timestamp. |
| `updated_at` | Last update timestamp. |

**Known constraints:** `quantity` must be greater than zero. `unit` is restricted to the supported units. Listing ownership is linked to a profile.

### 3.3 `partners`

Stores organizations or individuals who can buy, collect, refurbish, process, or recycle materials.

| Column | Description |
|---|---|
| `partner_id` | UUID primary key. |
| `profile_id` | Unique profile reference; references `profiles.user_id`. |
| `partner_type` | One of the supported `partner_type` enum values. |
| `organization_name` | Partner organization name. |
| `description` | Partner description and capabilities. |
| `contact_person` | Primary contact person. |
| `contact_phone` | Partner contact phone. |
| `contact_email` | Partner contact email. |
| `address` | Partner address; currently NOT NULL. |
| `city` | City. |
| `state` | State or region. |
| `pincode` | Postal code. |
| `verification_status` | `pending`, `verified`, or `rejected`; defaults to `pending`. |
| `is_accepting_materials` | Indicates whether the partner is currently accepting materials. |
| `created_at` | Creation timestamp. |
| `updated_at` | Last update timestamp. |

**Known constraint:** `profile_id` is unique, allowing at most one partner record per profile.

### 3.4 `partner_materials`

Records the materials a partner is willing and able to accept.

| Column | Description |
|---|---|
| `partner_material_id` | UUID primary key. |
| `partner_id` | References `partners.partner_id`. |
| `material_name` | Material accepted by the partner. |
| `waste_category` | Agricultural or electronic category. |
| `min_quantity` | Minimum accepted quantity, where configured. |
| `max_quantity` | Maximum accepted quantity, where configured. |
| `unit` | Quantity unit. |
| `created_at` | Creation timestamp. |

**Known constraints:** A unique constraint exists on `(partner_id, material_name)`. A check constraint validates the minimum/maximum quantity relationship. Confirm the exact nullability and check expression in the live database.

### 3.5 `partner_verifications`

Stores verification documents and review results for partners.

| Column | Description |
|---|---|
| `verification_id` | UUID primary key. |
| `partner_id` | References `partners.partner_id`. |
| `document_type` | Type of submitted verification document. |
| `document_reference` | Storage path/reference for the document. |
| `verification_status` | `pending`, `verified`, or `rejected`. |
| `submitted_at` | Submission timestamp. |
| `verified_by` | Admin profile that reviewed the submission; references `profiles.user_id`. |
| `verified_at` | Review timestamp. |
| `rejection_reason` | Explanation when verification is rejected. |

### 3.6 `match_results`

Stores matching results between waste listings and partners.

| Column | Description |
|---|---|
| `match_id` | UUID primary key. |
| `listing_id` | References `waste_listings.listing_id`. |
| `partner_id` | References `partners.partner_id`. |
| `match_score` | Numeric compatibility score from 0 to 100. |
| `match_reason` | Human-readable explanation. |
| `matching_factors` | JSONB object containing matching factors. |
| `is_recommended` | Indicates whether the result is marked as recommended. |
| `created_at` | Creation timestamp. |

**Known constraints:** `match_score` is restricted to 0–100. A unique constraint exists on `(listing_id, partner_id)`.

### 3.7 `collection_requests`

Stores requests made by partners in relation to waste listings.

| Column | Description |
|---|---|
| `request_id` | UUID primary key. |
| `listing_id` | References `waste_listings.listing_id`. |
| `partner_id` | References `partners.partner_id`. |
| `requester_id` | Profile that submitted the request; references `profiles.user_id`. |
| `requested_quantity` | Requested quantity; must be greater than zero. |
| `offered_price` | Optional offered price. |
| `collection_location` | Proposed collection location. |
| `proposed_collection_date` | Proposed collection date. |
| `request_status` | Request workflow status; defaults to `pending`. |
| `message` | Optional message from the requester. |
| `created_at` | Creation timestamp. |
| `updated_at` | Last update timestamp. |

**Business rule:** The authenticated requester must be authorized to act for the partner associated with the request. This must be enforced by trusted database logic or backend authorization, not by trusting a client-supplied `requester_id`.

### 3.8 `request_status_history`

Maintains an audit trail of collection-request status changes.

| Column | Description |
|---|---|
| `history_id` | UUID primary key. |
| `request_id` | References `collection_requests.request_id`. |
| `previous_status` | Previous status, if available. |
| `new_status` | New status. |
| `changed_by` | Profile responsible for the change; references `profiles.user_id`. |
| `remarks` | Optional explanation. |
| `changed_at` | Timestamp of the change. |

Status history should be written atomically with the corresponding request status update.

### 3.9 `recommendations`

Stores recommendations associated with waste listings.

| Column | Description |
|---|---|
| `recommendation_id` | UUID primary key. |
| `listing_id` | References `waste_listings.listing_id`. |
| `recommendation_type` | Category/type of recommendation. |
| `recommendation_text` | Recommendation shown to the user. |
| `confidence_score` | Numeric score from 0 to 100. |
| `ai_details` | JSONB containing structured AI or processing details. |
| `created_at` | Creation timestamp. |

### 3.10 `knowledge_sources`

Stores reference information that may support waste-utilization recommendations.

| Column | Description |
|---|---|
| `source_id` | UUID primary key. |
| `title` | Source title. |
| `source_type` | Type of source. |
| `category` | Optional agricultural/electronic waste category. |
| `description` | Short description. |
| `source_url` | Reference URL, when available. |
| `content` | Stored reference content or excerpt. |
| `created_at` | Creation timestamp. |

### 3.11 `recommendation_sources`

Connects recommendations to the knowledge sources used to support them.

| Column | Description |
|---|---|
| `recommendation_source_id` | UUID primary key. |
| `recommendation_id` | References `recommendations.recommendation_id`. |
| `source_id` | References `knowledge_sources.source_id`. |
| `relevance_score` | Relevance score from 0 to 100. |
| `created_at` | Creation timestamp. |

**Known constraint:** A unique constraint exists on `(recommendation_id, source_id)`.

## 4. Enumerated Types and Allowed Values

| Type | Values |
|---|---|
| `waste_category` | `agricultural`, `electronic` |
| `listing_status` | `active`, `reserved`, `completed`, `cancelled` |
| `partner_type` | `buyer`, `recycler`, `refurbisher`, `collection_agency`, `processor` |
| `verification_status` | `pending`, `verified`, `rejected` |
| `request_status` | `pending`, `accepted`, `rejected`, `scheduled`, `collected`, `completed`, `cancelled` |

`profiles.account_type` is a constrained text field with the values `generator`, `partner`, `both`, and `admin`.

## 5. Storage Buckets

The current Supabase project uses the following private storage buckets:

| Bucket | Purpose | Access note |
|---|---|---|
| `waste-listing-images` | Images uploaded for waste listings. | Private; access should be mediated by policies or short-lived signed URLs. |
| `partner-verification-documents` | Partner verification documents. | Private; access must be restricted to the relevant partner and authorized administrators. |

The listing image paths are stored in `waste_listings.image_urls`. Verification document references are stored in `partner_verifications.document_reference`.

## 6. Indexes and Constraints

The database inspection reported 19 custom indexes. Important known uniqueness/check constraints include:

- Unique `partners.profile_id`.
- Unique `(partner_id, material_name)` in `partner_materials`.
- Unique `(listing_id, partner_id)` in `match_results`.
- Unique `(recommendation_id, source_id)` in `recommendation_sources`.
- Positive `waste_listings.quantity`.
- Positive `collection_requests.requested_quantity`.
- `match_results.match_score` between 0 and 100.
- `recommendations.confidence_score` between 0 and 100.
- `recommendation_sources.relevance_score` between 0 and 100.
- Supported listing units are constrained to the defined set.

For a production-quality schema reference, append the exact output of PostgreSQL catalog queries for all 19 indexes, foreign keys, check constraints, defaults, and delete/update actions.

## 7. Row-Level Security

Row-Level Security (RLS) is enabled on all 11 application tables.

The intended access model is:

- Users can access and manage their own profile within permitted columns.
- Generators can manage their own waste listings.
- Public/partner listing visibility is limited by listing status and the applicable policies.
- Partner records and verification data are restricted to authorized users and administrators.
- System-generated match, recommendation, and history records must not be writable by arbitrary clients.
- Collection request creation and status transitions require ownership/partner authorization.

RLS policies should be reviewed together with database triggers, security-definer functions, grants, and backend service-role usage. RLS enabled does not by itself prove that every operation is secure.

## 8. Data Integrity and Operational Notes

- Use UUID identifiers for application entities.
- Validate quantity, unit, price, date, and location inputs in both API schemas and database constraints.
- Use transactions or atomic database functions for request transitions and status-history insertion.
- Avoid trusting user IDs, partner IDs, roles, or verification states supplied by the frontend.
- Never expose the Supabase service-role key to web or mobile clients.
- Keep private storage objects private; issue signed URLs only after authorization.
- Use migrations for schema changes and keep reviewed migration files under version control.

## 9. Items to Verify Before Final Submission

- Exact `partner_materials` column types, nullability, defaults, and quantity check expression.
- Exact foreign-key `ON DELETE` / `ON UPDATE` actions.
- All 19 custom index definitions.
- Full RLS policy definitions and grants.
- Whether the proposed `is_hidden` column and request-transition/partner-registration functions have been approved and applied.

## 10. Conclusion

The database schema supports the core Waste2Wealth lifecycle: users publish waste, partners describe accepted materials, the system identifies potential matches, partners submit collection requests, and the platform records request progress and recommendations. Security-sensitive operations must remain protected by RLS and trusted backend/database logic.

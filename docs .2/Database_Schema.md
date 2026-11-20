# Waste2Wealth — Database Schema Design
**Database:** Supabase PostgreSQL | **Schema:** `public` | **Status:** Implemented baseline; verify exact live definitions before release.

## 1. Enumerated types
- `waste_category`: `agricultural`, `electronic`
- `listing_status`: `active`, `reserved`, `completed`, `cancelled`
- `partner_type`: `buyer`, `recycler`, `refurbisher`, `collection_agency`, `processor`
- `verification_status`: `pending`, `verified`, `rejected`
- `request_status`: `pending`, `accepted`, `rejected`, `scheduled`, `collected`, `completed`, `cancelled`

## 2. Tables and columns

### profiles
`user_id UUID PK` (FK to `auth.users.id`), `full_name TEXT`, `phone TEXT`, `account_type TEXT` (generator/partner/both/admin), `organization_name TEXT`, `address TEXT`, `city TEXT`, `state TEXT`, `pincode TEXT`, `created_at`, `updated_at`. Stores user profile and role.

### waste_listings
`listing_id UUID PK`, `owner_id UUID FK -> profiles.user_id`, `waste_category ENUM`, `material_name TEXT`, `description TEXT`, `quantity NUMERIC(12,2)` (>0), `unit TEXT` (kg/tonne/piece/litre), `material_condition TEXT`, `location TEXT`, `latitude NUMERIC`, `longitude NUMERIC`, `expected_price NUMERIC`, `image_urls TEXT[]`, `status listing_status` (default active), timestamps. Stores materials offered for reuse/sale/recycling.

### partners
`partner_id UUID PK`, `profile_id UUID UNIQUE FK -> profiles.user_id`, `partner_type ENUM`, `organization_name TEXT`, `description TEXT`, `contact_person TEXT`, `contact_phone TEXT`, `contact_email TEXT`, `address TEXT NOT NULL`, `city TEXT`, `state TEXT`, `pincode TEXT`, `verification_status ENUM` (default pending), `is_accepting_materials BOOLEAN` (default true), timestamps. Stores partner profile and verification state.

### partner_materials
`partner_material_id UUID PK`, `partner_id UUID FK -> partners.partner_id`, `material_name TEXT`, `waste_category ENUM`, `minimum_quantity NUMERIC`, `maximum_quantity NUMERIC`, `unit TEXT`, `created_at`. Unique `(partner_id, material_name)`; quantity range checked. Stores accepted materials and ranges.

### partner_verifications
`verification_id UUID PK`, `partner_id UUID FK -> partners.partner_id`, `document_type TEXT`, `document_reference TEXT`, `verification_status ENUM` (default pending), `submitted_at`, `verified_by UUID FK -> profiles.user_id`, `verified_at`, `rejection_reason TEXT`. Stores verification metadata; files belong in private Storage.

### match_results
`match_id UUID PK`, `listing_id UUID FK -> waste_listings.listing_id`, `partner_id UUID FK -> partners.partner_id`, `match_score NUMERIC(5,2)` (0–100), `match_reason TEXT`, `matching_factors JSONB` (default `{}`), `is_recommended BOOLEAN`, `created_at`. Unique `(listing_id, partner_id)`. Stores explainable candidate matches.

### collection_requests
`request_id UUID PK`, `listing_id UUID FK -> waste_listings.listing_id`, `partner_id UUID FK -> partners.partner_id`, `requester_id UUID FK -> profiles.user_id`, `requested_quantity NUMERIC` (>0), `offered_price NUMERIC`, `collection_location TEXT`, `proposed_collection_date DATE`, `request_status ENUM` (default pending), `message TEXT`, timestamps. Manages collection requests.

### request_status_history
`history_id UUID PK`, `request_id UUID FK -> collection_requests.request_id`, `previous_status TEXT`, `new_status TEXT`, `changed_by UUID FK -> profiles.user_id`, `remarks TEXT`, `changed_at`. Tracks status changes.

### recommendations
`recommendation_id UUID PK`, `listing_id UUID FK -> waste_listings.listing_id`, `recommendation_type TEXT`, `recommendation_text TEXT`, `confidence_score NUMERIC` (0–100), `ai_details JSONB`, `created_at`. Stores advisory recommendations.

### knowledge_sources
`source_id UUID PK`, `title TEXT`, `source_type TEXT`, `category waste_category NULL`, `description TEXT`, `source_url TEXT`, `content TEXT`, `created_at`. Stores reference knowledge.

### recommendation_sources
`recommendation_source_id UUID PK`, `recommendation_id UUID FK -> recommendations.recommendation_id`, `source_id UUID FK -> knowledge_sources.source_id`, `relevance_score NUMERIC` (0–100), `created_at`. Unique `(recommendation_id, source_id)`. Links recommendations to supporting sources.

## 3. Indexes
Custom index names created/intended:
`idx_listings_owner`, `idx_listings_category_status`, `idx_listings_location`, `idx_listings_created_at`, `idx_partners_type_status`, `idx_partners_city`, `idx_partner_materials_partner`, `idx_partner_materials_category`, `idx_verifications_partner`, `idx_matches_listing`, `idx_matches_partner`, `idx_requests_listing`, `idx_requests_partner`, `idx_requests_requester`, `idx_requests_status`, `idx_history_request`, `idx_recommendations_listing`, `idx_rec_sources_recommendation`, `idx_rec_sources_source`.
Primary-key and unique constraints also create PostgreSQL indexes. Verify actual names/definitions in `pg_indexes`.

## 4. RLS policy design
RLS is enabled on all 11 public tables. Intended policy model:
- profiles: own profile read/update; admin oversight.
- waste_listings: active listings discoverable as policy allows; owner manages own; admin oversight.
- partners: verified profiles discoverable; owner manages own; admin oversight.
- partner_materials: visible for verified/own partner as configured; partner owner/admin manages.
- partner_verifications: partner accesses own submission; admin reviews/updates.
- match_results: listing owner, relevant partner and admin can read.
- collection_requests: requester, target partner and admin can read; creation validates ownership and state.
- request_status_history: access follows permission to view the associated request.
- recommendations: listing owner and admin can read.
- knowledge_sources: authenticated read; admin write.
- recommendation_sources: access follows linked recommendation visibility.
System-generated writes may use trusted backend operations. Never expose service-role key to clients. Test policies with separate authenticated sessions; policy existence alone does not prove correct behavior.

## 5. Storage
Private buckets:
- `waste-listing-images`: configured 5 MB; JPEG/PNG/WebP.
- `partner-verification-documents`: configured 10 MB; PDF/JPEG/PNG.
User-own-folder policies were created for insert/select/update/delete. An additional admin SELECT policy was added for partner verification documents. Test with owner, unrelated user and admin accounts.

## 6. Functions and triggers
- `handle_new_user()` / `on_auth_user_created`: creates profile after Auth user insert.
- `is_admin()`: checks current profile's admin role.
- `protect_profile_role()` / `prevent_profile_role_change`: protects role changes.
- `protect_partner_verification()` / `prevent_partner_verification_change`: protects verification status changes.
Review SECURITY DEFINER grants, ownership and search_path before production.

## 7. Verification performed
Project work recorded: 11 tables; RLS enabled on 11; two private buckets; eight initial storage policies plus admin SELECT policy; automatic profile creation tested; sample data inserted into all 11 tables; JOIN and selected orphan-record checks passed. These do not replace full multi-user RLS, API, file-upload and end-to-end testing.

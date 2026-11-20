# Waste2Wealth — Entity Relationship Diagram
**Status:** Proposed logical model aligned with the implemented Supabase table set. Confirm against the live schema before final approval.

```mermaid
erDiagram
 PROFILES ||--o{ WASTE_LISTINGS : owns
 PROFILES ||--o| PARTNERS : has
 PARTNERS ||--o{ PARTNER_MATERIALS : accepts
 PARTNERS ||--o{ PARTNER_VERIFICATIONS : submits
 PROFILES o|--o{ PARTNER_VERIFICATIONS : verifies
 WASTE_LISTINGS ||--o{ MATCH_RESULTS : receives
 PARTNERS ||--o{ MATCH_RESULTS : matched
 WASTE_LISTINGS ||--o{ COLLECTION_REQUESTS : receives
 PARTNERS ||--o{ COLLECTION_REQUESTS : receives
 PROFILES ||--o{ COLLECTION_REQUESTS : requests
 COLLECTION_REQUESTS ||--o{ REQUEST_STATUS_HISTORY : tracks
 PROFILES o|--o{ REQUEST_STATUS_HISTORY : changes
 WASTE_LISTINGS ||--o{ RECOMMENDATIONS : has
 RECOMMENDATIONS ||--o{ RECOMMENDATION_SOURCES : cites
 KNOWLEDGE_SOURCES ||--o{ RECOMMENDATION_SOURCES : supports

 PROFILES {
  uuid user_id PK
  text full_name
  text phone
  text account_type
  text organization_name
  text address
  text city
  text state
  text pincode
 }
 WASTE_LISTINGS {
  uuid listing_id PK
  uuid owner_id FK
  enum waste_category
  text material_name
  numeric quantity
  text unit
  text material_condition
  text location
  numeric expected_price
  text_array image_urls
  enum status
 }
 PARTNERS {
  uuid partner_id PK
  uuid profile_id FK
  enum partner_type
  text organization_name
  text address
  enum verification_status
  boolean is_accepting_materials
 }
 PARTNER_MATERIALS {
  uuid partner_material_id PK
  uuid partner_id FK
  text material_name
  enum waste_category
  numeric minimum_quantity
  numeric maximum_quantity
  text unit
 }
 PARTNER_VERIFICATIONS {
  uuid verification_id PK
  uuid partner_id FK
  text document_type
  text document_reference
  enum verification_status
  uuid verified_by FK
 }
 MATCH_RESULTS {
  uuid match_id PK
  uuid listing_id FK
  uuid partner_id FK
  numeric match_score
  text match_reason
  jsonb matching_factors
  boolean is_recommended
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
  enum request_status
 }
 REQUEST_STATUS_HISTORY {
  uuid history_id PK
  uuid request_id FK
  text previous_status
  text new_status
  uuid changed_by FK
  timestamptz changed_at
 }
 RECOMMENDATIONS {
  uuid recommendation_id PK
  uuid listing_id FK
  text recommendation_type
  text recommendation_text
  numeric confidence_score
  jsonb ai_details
 }
 KNOWLEDGE_SOURCES {
  uuid source_id PK
  text title
  text source_type
  enum category
  text source_url
  text content
 }
 RECOMMENDATION_SOURCES {
  uuid recommendation_source_id PK
  uuid recommendation_id FK
  uuid source_id FK
  numeric relevance_score
 }
```

## Entity purposes
| Table | Purpose |
|---|---|
| profiles | User profile and role; user_id corresponds to Supabase Auth user |
| waste_listings | Agricultural/electronic waste listings |
| partners | Buyer, recycler, refurbisher, collection agency or processor |
| partner_materials | Materials and quantity ranges accepted by partners |
| partner_verifications | Verification submissions and review outcome |
| match_results | Candidate partner matches, scores and explanations |
| collection_requests | Request from generator to partner |
| request_status_history | Audit trail of request status changes |
| recommendations | AI-assisted reuse/recycling suggestions |
| knowledge_sources | Reference information supporting recommendations |
| recommendation_sources | Junction table linking recommendations and sources |

## Relationship notes
- One profile can own many listings.
- A profile can have at most one partner row (`partners.profile_id` is unique).
- A partner can have many accepted materials and verification records.
- Match results link one listing to one partner; current schema has a unique `(listing_id, partner_id)` rule.
- A request links one listing, one partner and one requester profile; it can have many history records.
- A listing can have many recommendations.
- Recommendations and knowledge sources are many-to-many through `recommendation_sources`.
- `profiles.user_id` references `auth.users.id`; listing owners, partner profiles and request actors reference `profiles.user_id`.
- No dedicated vehicle/driver/transport-booking entity exists in the current MVP schema.

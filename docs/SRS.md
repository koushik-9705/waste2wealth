# Waste2Wealth — Software Requirements Specification (SRS)

**Version:** 1.0 — Draft for Review  
**Project:** Waste2Wealth  
**Product:** AI-Assisted Cross-Platform System for Agricultural Residue Reuse and E-Waste Recycling  
**Platforms:** Web and Mobile

## 1. Purpose

Waste2Wealth aims to connect waste generators with suitable reuse buyers, collection providers, refurbishers and recycling partners through a cross-platform application.

The system will support agricultural-residue reuse and appropriate e-waste routing, with explainable buyer matching, request management and traceable transaction status.

## 2. Scope

The MVP includes user authentication, waste listing management, buyer discovery, matching, partner verification, quotation and collection requests, status tracking, AI-assisted agricultural recommendations, and web/mobile access.

Advanced payments, nationwide verified coverage, automated transport booking and advanced machine-learning models are outside the initial scope.

## 3. User Roles

- **Waste Generator:** Creates listings and manages requests.
- **Buyer / Recycling Partner:** Defines accepted materials and responds to eligible requests.
- **Administrator:** Reviews partner evidence and manages verification decisions.

## 4. Functional Requirements

- FR-01: The system shall provide authentication and role-based access.
- FR-02: The system shall support authorized waste listing management.
- FR-03: The system shall distinguish agricultural and electronic waste workflows.
- FR-04: The system shall maintain a buyer and partner directory.
- FR-05: The system shall match listings to compatible buyers using defined criteria.
- FR-06: The system shall support partner verification and status management.
- FR-07: The system shall support quotation and collection requests.
- FR-08: The system shall maintain request status history.
- FR-09: The system shall provide evidence-grounded agricultural reuse recommendations.
- FR-10: The system shall apply applicable eligibility checks to e-waste routing.
- FR-11: The web and mobile applications shall share the same backend business rules.
- FR-12: The system shall report confirmed completed transactions and qualifying recovered quantities.

## 5. Non-Functional Requirements

- NFR-01: Protected operations shall enforce authentication and authorization.
- NFR-02: Secrets and API keys shall not be exposed in client applications or source control.
- NFR-03: The system shall validate inputs and handle errors consistently.
- NFR-04: The system shall protect user data through appropriate access policies.
- NFR-05: The system shall maintain consistent business rules across platforms.
- NFR-06: Verification decisions and transaction status changes shall be auditable.
- NFR-07: The codebase shall be modular and testable.
- NFR-08: Performance targets shall be defined against an agreed workload and measured before release.

## 6. Business Rules

1. Each listing must have an authenticated owner.
2. Buyer matches are suggestions, not guaranteed purchase offers.
3. Demo buyers must be explicitly labelled and separated from verified real partners.
4. E-waste destinations must satisfy applicable eligibility requirements.
5. Prices must be sourced from genuine quotations or identified reliable data.
6. Only authorized actors may perform permitted status transitions.
7. AI output must not override business, security or eligibility rules.
8. Recovery metrics must be based on confirmed qualifying transactions.

## 7. Proposed Technology Stack

- Web: React
- Mobile: React Native with Expo
- Backend: Python with FastAPI
- Database and authentication: Supabase with PostgreSQL and Supabase Auth
- File storage: Supabase Storage
- AI assistance: Google Gemini API, accessed through the backend
- Version control: Git and GitHub

## 8. Acceptance Criteria and Testing

### 8.1 Purpose

This section defines the acceptance criteria and test cases used to verify that Waste2Wealth satisfies its functional and non-functional requirements. Testing shall cover normal operation, invalid inputs, unauthorized access, failed dependencies, data integrity, cross-platform consistency, and AI-related edge cases.

A requirement shall be considered accepted only when its applicable acceptance criteria pass and the results are documented. Test execution results shall be recorded separately; defining a test case does not mean that the feature has already passed.

### 8.2 Test Environment

The initial testing environment shall include:

- **Web client:** React application.
- **Mobile client:** React Native application using Expo.
- **Backend:** Python FastAPI application.
- **Database and authentication:** Supabase PostgreSQL and Supabase Auth.
- **File storage:** Supabase Storage, where applicable.
- **AI service:** Google Gemini API accessed only through the backend.
- **Test data:** Synthetic users, agricultural-residue listings, e-waste listings, and clearly labelled demo partners.

Test records shall be distinguishable from genuine partner and transaction records. Production credentials and real personal information shall not be used in test fixtures.

### 8.3 Functional Acceptance Criteria

#### FR-01: Authentication and Role-Based Access

**Acceptance criteria**

1. Users shall be able to register and sign in through the supported authentication workflow.
2. Invalid credentials and invalid authentication requests shall be rejected with appropriate error messages.
3. Protected operations shall require a valid authenticated session.
4. Users shall only perform actions permitted by their assigned role.
5. Users shall not be able to grant themselves administrator privileges by modifying profile data.
6. Signing out shall invalidate the application's usable authenticated session.

**Test cases**

| Test ID | Test scenario | Expected result |
|---|---|---|
| TC-01-01 | Register with valid details | Account is created successfully. |
| TC-01-02 | Sign in with invalid credentials | Authentication is rejected; protected data is not exposed. |
| TC-01-03 | Access a protected endpoint without authentication | Request is rejected. |
| TC-01-04 | Generator attempts an administrator-only action | Action is denied. |
| TC-01-05 | User attempts to change their role to administrator | Privilege escalation is prevented. |
| TC-01-06 | Sign out and attempt to reuse the application session | Protected access is no longer available through the signed-out session. |

#### FR-02: Waste Listing Management

**Acceptance criteria**

1. An authenticated user shall be able to create a listing containing the required material information, quantity, unit, condition, and location.
2. Required fields shall be validated before a listing is saved.
3. Each listing shall be associated with its authenticated owner.
4. Authorized owners shall be able to view and update their listings and perform permitted deletion or closure operations.
5. Users shall not be able to modify or delete another user's listing without an explicitly authorized administrative permission.
6. Invalid quantities, unsupported units, and invalid field values shall be rejected.
7. Failed validation shall not create a partially valid listing.

**Test cases**

| Test ID | Test scenario | Expected result |
|---|---|---|
| TC-02-01 | Create a listing with valid required fields | Listing is saved and associated with the correct owner. |
| TC-02-02 | Submit a listing without a required material name | Validation error is returned; no invalid listing is created. |
| TC-02-03 | Submit zero or negative quantity | Request is rejected. |
| TC-02-04 | Submit an unsupported unit | Request is rejected or the unit is normalized through an explicitly supported conversion. |
| TC-02-05 | Owner updates their own listing | Permitted changes are saved. |
| TC-02-06 | User attempts to update another user's listing | Operation is denied; original listing remains unchanged. |
| TC-02-07 | Retrieve a listing after saving it | Stored values match the accepted input. |

#### FR-03: Agricultural and Electronic Waste Workflows

**Acceptance criteria**

1. Each listing shall be assigned a supported waste category.
2. Agricultural-residue listings and e-waste listings shall follow their respective validation and processing rules.
3. The system shall not apply agricultural reuse recommendations as a substitute for e-waste eligibility checks.
4. Invalid or unsupported categories shall be rejected.
5. Category-specific fields shall be validated according to the selected workflow.

**Test cases**

| Test ID | Test scenario | Expected result |
|---|---|---|
| TC-03-01 | Create an agricultural-residue listing | Agricultural workflow and relevant validations are applied. |
| TC-03-02 | Create an e-waste listing | E-waste workflow and relevant validations are applied. |
| TC-03-03 | Submit an unsupported waste category | Request is rejected with a clear validation error. |
| TC-03-04 | Attempt to use an agricultural recommendation to bypass e-waste eligibility | The system blocks the bypass. |

#### FR-04: Buyer and Partner Directory

**Acceptance criteria**

1. The system shall maintain partner information, accepted material categories, service areas, and verification status.
2. Users shall be able to view partner information permitted by their role.
3. Demo partners shall be visibly labelled as demonstration records.
4. Demo-unverified partners shall not be represented as verified real businesses.
5. Only authorized operations shall create or modify restricted partner information.

**Test cases**

| Test ID | Test scenario | Expected result |
|---|---|---|
| TC-04-01 | View the partner directory | Permitted partner information is displayed. |
| TC-04-02 | Open a demo partner profile | The demo/unverified status is clearly visible. |
| TC-04-03 | Attempt to represent a demo partner as verified through an ordinary user action | The operation is denied. |
| TC-04-04 | Submit incomplete or invalid partner information | Validation is applied and invalid data is not accepted. |

#### FR-05: Compatible Buyer Matching

**Acceptance criteria**

1. The system shall identify potential partners using defined criteria, including material compatibility, quantity constraints, location or service area, and condition requirements where applicable.
2. Partners that fail mandatory material-acceptance or eligibility rules shall be excluded from eligible results.
3. Matching results shall be presented as suggestions, not guaranteed purchase offers.
4. The system shall not invent buyer prices, availability, or commercial commitments.
5. Results shall distinguish verified partners from demo or unverified records.
6. The matching process shall produce consistent results for the same data and matching rules, unless relevant inputs change.

**Test cases**

| Test ID | Test scenario | Expected result |
|---|---|---|
| TC-05-01 | Match a listing with a compatible partner | Compatible partner appears in the results. |
| TC-05-02 | Match a listing with a partner that does not accept the material | Partner is excluded from eligible matches. |
| TC-05-03 | Listing quantity falls below a partner's mandatory minimum | Partner is excluded or marked incompatible according to the defined rule. |
| TC-05-04 | Partner does not serve the listing's location | Partner is excluded or clearly marked as outside the supported area. |
| TC-05-05 | No compatible partners exist | The system displays an appropriate no-match result. |
| TC-05-06 | Matching results are displayed without a supplied quotation | No fabricated price is shown as a genuine offer. |
| TC-05-07 | An ineligible e-waste partner receives a high numerical match score | Eligibility rules take precedence; the partner is not presented as eligible. |

#### FR-06: Partner Verification

**Acceptance criteria**

1. The system shall record verification status and relevant verification evidence or references.
2. Authorized administrators shall be able to review partner evidence and record a verification decision.
3. Verification decisions shall include the decision outcome, responsible actor, timestamp, and appropriate supporting information.
4. Pending, rejected, expired where applicable, and demo-unverified partners shall not be represented as verified.
5. A verification decision shall not be changed by an unauthorized user.
6. E-waste routing shall enforce applicable destination eligibility requirements.

**Test cases**

| Test ID | Test scenario | Expected result |
|---|---|---|
| TC-06-01 | Submit a partner for verification | Verification status becomes pending. |
| TC-06-02 | Authorized administrator approves sufficient evidence | Decision and audit information are recorded. |
| TC-06-03 | Unauthorized user attempts to approve a partner | Operation is denied. |
| TC-06-04 | Partner has insufficient or rejected evidence | Partner is not represented as verified. |
| TC-06-05 | Attempt to route e-waste to an ineligible destination | Routing or request progression is blocked according to the applicable rules. |

#### FR-07: Quotation and Collection Requests

**Acceptance criteria**

1. An authorized user shall be able to create a request for an eligible listing and partner.
2. The request shall record the listing, partner, requester, initial status, and creation timestamp.
3. The system shall validate that the requester has permission to create the request and that the selected listing and partner satisfy applicable rules.
4. A partner shall only be able to respond to requests for which it is authorized.
5. Quotation information shall be recorded only when supplied through an accepted workflow.
6. Duplicate submissions shall not unintentionally create duplicate requests when the same submission is retried.
7. Failed requests shall return an appropriate error without leaving inconsistent records.

**Test cases**

| Test ID | Test scenario | Expected result |
|---|---|---|
| TC-07-01 | Submit a valid request for an eligible partner | Request is created with the correct relationships. |
| TC-07-02 | Submit a request for a nonexistent listing | Request is rejected. |
| TC-07-03 | Attempt to request an ineligible partner | Request is blocked. |
| TC-07-04 | Unauthorized user attempts to respond to another partner's request | Operation is denied. |
| TC-07-05 | Partner submits a genuine quotation | Supplied quotation and relevant metadata are stored accurately. |
| TC-07-06 | Retry a request after a network timeout | Duplicate request creation is prevented where the idempotency mechanism applies. |

#### FR-08: Request Status History

**Acceptance criteria**

1. Every request shall have a defined current status.
2. Only permitted status transitions shall be accepted.
3. Each successful status change shall record the previous status, new status, actor, and timestamp.
4. Unauthorized or invalid transitions shall be rejected.
5. Historical status records shall not be silently overwritten during ordinary status updates.
6. The current request status shall remain consistent with its recorded history.

**Test cases**

| Test ID | Test scenario | Expected result |
|---|---|---|
| TC-08-01 | Create a new request | Initial status and corresponding record are saved. |
| TC-08-02 | Authorized actor performs a permitted transition | Current status and history are updated. |
| TC-08-03 | Actor attempts a forbidden transition | Operation is rejected; status remains unchanged. |
| TC-08-04 | Unauthorized user attempts a status change | Operation is denied. |
| TC-08-05 | Retrieve the request history | All recorded transitions appear in the correct chronological order. |

The permitted status sequence and role permissions shall be finalized before implementation.

#### FR-09: Evidence-Grounded Agricultural Recommendations

**Acceptance criteria**

1. The system shall provide agricultural reuse recommendations based on available listing details and an approved knowledge base or other defined supporting information.
2. Recommendations shall clearly distinguish suggestions from confirmed facts.
3. Where supporting sources are available, the system shall retain or display relevant source references.
4. Invalid inputs, unavailable AI services, and malformed AI responses shall be handled gracefully.
5. AI output shall be validated before it is presented to the user.
6. AI-generated content shall not override access control, business rules, or safety restrictions.
7. The system shall not claim that an unsupported recommendation is scientifically verified.

**Test cases**

| Test ID | Test scenario | Expected result |
|---|---|---|
| TC-09-01 | Request a recommendation for a supported agricultural material | A relevant recommendation is returned and validated. |
| TC-09-02 | Submit incomplete material information | The system requests required information or returns a clear limitation. |
| TC-09-03 | AI service is unavailable | A controlled error or fallback response is provided. |
| TC-09-04 | AI returns malformed or unsupported output | Invalid output is rejected or safely handled. |
| TC-09-05 | AI output attempts to bypass a business or eligibility rule | The rule remains enforced. |
| TC-09-06 | Review a recommendation that claims to have supporting evidence | The referenced evidence is available and relevant, or the claim is not presented as verified. |

#### FR-10: E-Waste Eligibility and Routing

**Acceptance criteria**

1. The system shall identify the e-waste workflow separately from agricultural-residue processing.
2. Applicable destination eligibility and verification requirements shall be checked before a destination is treated as eligible.
3. Missing, invalid, or insufficient verification information shall not be treated as proof of eligibility.
4. Demo partners shall not be presented as approved real recycling destinations.
5. The system shall communicate when eligibility cannot be confirmed.
6. AI-generated suggestions shall not override the required checks.

**Test cases**

| Test ID | Test scenario | Expected result |
|---|---|---|
| TC-10-01 | Route a listing to an appropriately verified and eligible destination | Destination may proceed through the permitted workflow. |
| TC-10-02 | Destination has no required evidence | Eligibility is not confirmed; progression is blocked as required. |
| TC-10-03 | Destination is rejected or no longer eligible | It is excluded from eligible routing. |
| TC-10-04 | AI recommends a demo or unverified partner | System rules prevent that partner from being presented as an eligible real destination. |
| TC-10-05 | Eligibility information is unavailable | The system communicates the limitation and does not assume approval. |

#### FR-11: Shared Backend Business Rules

**Acceptance criteria**

1. Web and mobile clients shall use the shared FastAPI backend for operations governed by server-side business rules.
2. Authorization, validation, matching, verification, and status-transition rules shall be enforced consistently.
3. Client-side validation shall not be the only protection against invalid or unauthorized operations.
4. Equivalent requests from both platforms shall produce equivalent outcomes under the same data and permissions.
5. API errors shall use a consistent, documented response format.

**Test cases**

| Test ID | Test scenario | Expected result |
|---|---|---|
| TC-11-01 | Create equivalent listings through web and mobile | Both follow the same validation rules and produce compatible records. |
| TC-11-02 | Submit invalid data directly to the API | Backend validation rejects the request even if client validation is bypassed. |
| TC-11-03 | Perform the same unauthorized action from both platforms | Both operations are denied. |
| TC-11-04 | Simulate a backend error | Both clients handle the error without exposing secrets or internal stack traces. |

#### FR-12: Confirmed Transactions and Recovery Metrics

**Acceptance criteria**

1. The system shall distinguish listings, requests, quotations, and completed transactions.
2. Only transactions meeting the defined completion and confirmation rules shall contribute to recovery metrics.
3. Rejected, cancelled, pending, or otherwise unconfirmed records shall not be counted as completed recovery.
4. Quantities shall use consistent units or documented conversions before aggregation.
5. Metrics shall be traceable to the underlying qualifying records.
6. Demo records shall be excluded from real-world recovery claims or clearly separated as demonstration results.

**Test cases**

| Test ID | Test scenario | Expected result |
|---|---|---|
| TC-12-01 | Complete and confirm a qualifying transaction | The transaction contributes to the appropriate metric. |
| TC-12-02 | Create a listing without a completed transaction | No recovered quantity is counted. |
| TC-12-03 | Cancel a request before completion | The cancelled request is excluded from completed recovery metrics. |
| TC-12-04 | Aggregate quantities recorded in supported different units | Values are converted consistently before aggregation. |
| TC-12-05 | Include demo transactions in a report | Demo results are excluded from real-world totals or clearly separated. |

### 8.4 Non-Functional Acceptance Criteria

| Requirement | Acceptance criteria | Verification method |
|---|---|---|
| NFR-01: Authentication and authorization | Protected operations reject unauthenticated and unauthorized requests. | API authorization and role-permission tests. |
| NFR-02: Secret management | API keys and secrets are absent from client bundles, committed source files, and exposed API responses. | Configuration review, repository scanning, and client-build inspection. |
| NFR-03: Input validation and error handling | Invalid requests produce consistent errors and do not create invalid records. | Validation tests and failure-path testing. |
| NFR-04: User-data protection | Database policies restrict access according to ownership and role. | Supabase RLS and cross-user access tests. |
| NFR-05: Cross-platform consistency | Web and mobile apply the same server-side business rules. | Cross-platform API integration tests. |
| NFR-06: Auditability | Verification decisions and request status changes retain actor and timestamp information. | Database inspection and audit-trail tests. |
| NFR-07: Modularity and testability | Business logic can be tested independently of UI components and external AI services where practical. | Code review and automated unit tests. |
| NFR-08: Performance | Agreed response-time and workload targets are met in a documented test environment. | Load and performance tests against targets agreed before release. |

Numeric performance targets shall be documented before performance acceptance testing. Targets shall identify the operation, test workload, environment, and acceptable response time.

### 8.5 Security and Integration Testing

The following additional tests shall be included:

1. **Ownership tests:** Attempt to read, update, or delete records belonging to another user.
2. **Role tests:** Verify that generator, partner, and administrator permissions are enforced.
3. **Database policy tests:** Confirm that Supabase RLS policies protect data even when a request bypasses client-side checks.
4. **Secret-exposure tests:** Verify that Gemini API credentials and other server secrets are not shipped to web or mobile clients.
5. **Dependency-failure tests:** Simulate unavailable database, storage, authentication, or AI services where applicable.
6. **Input-security tests:** Submit malformed input and unexpected field values; verify safe rejection and consistent handling.
7. **Transaction-integrity tests:** Confirm that failed multi-step operations do not leave inconsistent records.
8. **Cross-platform tests:** Execute equivalent workflows through web and mobile clients.
9. **Eligibility tests:** Verify that unverified, rejected, and demo-only e-waste destinations cannot bypass required checks.
10. **Data-integrity tests:** Confirm that foreign keys, constraints, and status-history records remain consistent.

### 8.6 Testing Levels

Testing shall be performed at the following levels:

- **Unit testing:** Tests individual functions, validation rules, matching logic, and status-transition rules.
- **Integration testing:** Tests interactions between FastAPI, PostgreSQL, authentication, storage, and the AI service.
- **API testing:** Tests endpoint behavior, input validation, permissions, and error responses.
- **End-to-end testing:** Tests complete workflows from the web or mobile interface through the backend and database.
- **Security testing:** Tests authentication, authorization, RLS, secret management, and unauthorized access.
- **Acceptance testing:** Confirms that the completed MVP satisfies the approved requirements and acceptance criteria.

### 8.7 Test Execution and Defect Management

Each test execution shall record:

- Test case ID and related requirement ID.
- Test date and environment.
- Test data or preconditions.
- Actual steps performed.
- Expected and actual results.
- Outcome: Pass, Fail, or Blocked.
- Defect reference and severity, where applicable.
- Retest result after the defect is resolved.

A failed test shall be recorded as a defect, investigated, corrected, and retested. A blocked test shall not be counted as passed.

### 8.8 MVP Acceptance and Release Criteria

The Waste2Wealth MVP may be accepted for release when:

1. All agreed MVP functional requirements have been implemented or formally excluded from the release.
2. Mandatory acceptance tests pass.
3. No unresolved critical security or data-integrity defects remain.
4. Role permissions, RLS, partner verification, and e-waste eligibility checks pass their required tests.
5. Web and mobile workflows use consistent backend rules.
6. AI failures and invalid AI output are handled safely.
7. Recovery metrics exclude unconfirmed and improperly classified demo transactions.
8. Agreed performance targets are measured and satisfied.
9. Test results and known limitations are documented.
10. The project owner or authorized reviewer approves the release.

**Approval status:** Proposed acceptance and testing baseline. Final approval is pending review of the criteria, matching rules, request-status transitions, and numeric performance targets.

## 9. Assumptions and Constraints

- Demo buyer records are for development and testing only.
- Real buyer availability and commercial terms must be independently confirmed.
- Partner verification depends on appropriate evidence and applicable requirements.
- AI-generated recommendations may be incomplete and require validation.
- Numeric performance targets and detailed release criteria remain to be agreed.

## 10. Approval Status

This document is a proposed baseline. Requirements, MVP scope, business rules and acceptance criteria must be reviewed and approved before the database schema and API contracts are finalized.

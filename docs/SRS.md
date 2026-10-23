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

## 8. Acceptance and Testing

Each requirement shall have linked acceptance criteria and test cases. Testing shall include valid inputs, invalid inputs, unauthorized access, failed dependencies, platform integration and relevant AI edge cases.

## 9. Assumptions and Constraints

- Demo buyer records are for development and testing only.
- Real buyer availability and commercial terms must be independently confirmed.
- Partner verification depends on appropriate evidence and applicable requirements.
- AI-generated recommendations may be incomplete and require validation.
- Numeric performance targets and detailed release criteria remain to be agreed.

## 10. Approval Status

This document is a proposed baseline. Requirements, MVP scope, business rules and acceptance criteria must be reviewed and approved before the database schema and API contracts are finalized.

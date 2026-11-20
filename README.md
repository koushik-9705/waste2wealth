♻️ Waste2Wealth
AI-Assisted Platform for Agricultural Residue Reuse and E-Waste Recycling

Waste2Wealth is an intelligent cross-platform application designed to connect waste generators with potential buyers, recyclers, refurbishers, and collection partners. It aims to transform agricultural residues and electronic waste into valuable resources through digital discovery, intelligent matching, AI-assisted recommendations, and coordinated collection requests.

By bringing waste generators and recycling partners together, Waste2Wealth promotes resource recovery, reduces improper waste disposal, and supports a sustainable circular economy.

---

📌 Table of Contents

- [Problem Statement](#-problem-statement)
- [Project Objectives](#-project-objectives)
- [Key Features](#-key-features)
- [How It Works](#-how-it-works)
- [Technology Stack](#-technology-stack)
- [System Architecture](#-system-architecture)
- [Project Structure](#-project-structure)
- [Getting Started](#-getting-started)
- [Environment Configuration](#-environment-configuration)
- [Documentation](#-documentation)
- [Project Scope](#-project-scope)
- [Future Enhancements](#-future-enhancements)
- [Contributors](#-contributors)

---

🌍 Problem Statement

Agricultural residues such as crop waste, rice husks, coconut coir, and plant trimmings are often burned or discarded because farmers lack access to suitable buyers and reuse opportunities.

Similarly, electronic waste such as discarded laptops, mobile phones, circuit boards, and printers is frequently disposed of improperly due to limited access to convenient recycling channels.

The lack of a centralized platform connecting waste generators with suitable buyers and recycling partners makes waste recovery difficult.

**Waste2Wealth addresses this problem by providing a digital platform that helps users discover reuse and recycling opportunities for agricultural and electronic waste.**

🎯 Project Objectives

- Reduce improper disposal and burning of agricultural residues.
- Encourage responsible electronic waste collection and recycling.
- Connect waste generators with relevant buyers and recycling partners.
- Provide intelligent matching between waste listings and potential partners.
- Generate AI-assisted recommendations for agricultural waste utilization.
- Simplify collection requests and transaction status tracking.
- Promote resource recovery and circular economy practices.

🚀 Key Features

1. User Authentication and Role Management
- Secure user registration and login.
- Role-based access for generators, partners, and administrators.
- User profile management.

2. Waste Listing Management
- Create and manage agricultural and electronic waste listings.
- Specify material type, quantity, condition, location, and expected price.
- Upload images of listed materials.
- Track listing status.

3. Partner Discovery and Verification
- Discover buyers, recyclers, refurbishers, processors, and collection agencies.
- View partner profiles and accepted materials.
- Support partner verification by administrators.

4. Intelligent Waste Matching
- Match waste listings with suitable partners.
- Consider material compatibility, quantity, and location.
- Display matching results and explanations.

5. AI-Assisted Recommendations
- Provide agricultural residue reuse suggestions.
- Recommend potential applications and utilization methods.
- Use Google Gemini through the backend for AI-assisted explanations.

6. Collection Request Management
- Allow partners to send collection or purchase requests.
- Enable generators to accept or reject requests.
- Coordinate collection schedules between both parties.
- Track request progress through different statuses.

7. Admin Dashboard
- Manage users and partner verification.
- Monitor waste listings and collection requests.
- Support platform administration.

---

🔄 How It Works

1. **Register:** Users create an account as a waste generator or partner.
2. **List Waste:** Generators publish agricultural or electronic waste details.
3. **Discover:** The platform identifies suitable buyers and recycling partners.
4. **Match:** Matching logic evaluates material compatibility, quantity, and location.
5. **Request:** Interested partners submit collection or purchase requests.
6. **Coordinate:** The generator and partner agree on the collection schedule and other details.
7. **Track:** Both parties can follow the request status until completion.

*Note: Waste2Wealth coordinates the collection process between generators and partners; it does not operate its own transportation fleet.*

---

🛠️ Technology Stack

| Component | Technology |
|---|---|
| Web Frontend | React.js, TypeScript |
| Mobile Application | React Native, Expo |
| Backend | Python, FastAPI |
| Database | Supabase PostgreSQL |
| Authentication | Supabase Auth |
| File Storage | Supabase Storage |
| AI Integration | Google Gemini API |
| API Communication | REST APIs |
| Development Tools | Visual Studio Code, Git, GitHub |

---

🏗️ System Architecture

Waste2Wealth follows a modular application architecture with a centralized backend.

```text
       WEB APPLICATION          MOBILE APPLICATION
       React + TypeScript       React Native + Expo
                |                       |
                +-----------+-----------+
                            |
                       REST APIs
                            |
                   FASTAPI BACKEND
                            |
          +-----------------+-----------------+
          |                 |                 |
      Authentication     Business Logic     AI Service
          |                 |                 |
          +-----------------+-----------------+
                            |
                     SUPABASE PLATFORM
                            |
             +--------------+--------------+
             |              |              |
         PostgreSQL     Authentication    Storage
             |
      Waste2Wealth Data
                            |
                    GOOGLE GEMINI API
                    (AI Recommendations)
```

The backend handles business logic, validation, authorization, matching, and secure communication with external services.

---

📁 Project Structure

The following is the intended high-level project organization. The actual implementation may evolve as development progresses.

```text
Waste2Wealth/
│
├── backend/
│   ├── app/
│   │   ├── api/
│   │   ├── core/
│   │   ├── models/
│   │   ├── schemas/
│   │   ├── services/
│   │   └── repositories/
│   ├── tests/
│   ├── requirements.txt
│   └── .env.example
│
├── web/
│   ├── src/
│   ├── public/
│   ├── package.json
│   └── ...
│
├── mobile/
│   ├── app/
│   ├── components/
│   ├── package.json
│   └── ...
│
├── docs/
│   ├── SRS.md
│   ├── ER_Diagram.md
│   ├── Database_Schema.md
│   ├── System_Architecture.md
│   ├── API_Design.md
│   └── Authentication_and_Security.md
│
├── .gitignore
└── README.md
```

---

⚙️ Getting Started

 Prerequisites

Install the following tools before running the application:

- Python 3.12
- Node.js and npm
- Git
- Visual Studio Code
- Supabase project
- Google Gemini API key

1. Clone the Repository

```bash
git clone https://github.com/koushik-9705/waste2wealth.git
cd waste2wealth
```

2. Backend Setup

Open a terminal inside the backend directory:

```bash
cd backend
python -m venv .venv
```

Activate the virtual environment on Windows PowerShell:

```powershell
.\.venv\Scripts\Activate.ps1
```

Install dependencies:

```bash
pip install -r requirements.txt
```

Configure the backend environment variables using the `.env.example` file and your own credentials.

Start the FastAPI development server using the entry point configured in the project. For example:

```bash
uvicorn app.main:app --reload
```

API documentation, when the server is running:

```text
http://127.0.0.1:8000/docs
```

3. Web Application Setup

Open another terminal:

```bash
cd web
npm install
npm run dev
```

4. Mobile Application Setup

Open another terminal:

```bash
cd mobile
npm install
npx expo start
```

Follow the Expo instructions to run the mobile application on an emulator or supported device.

*The commands above assume the corresponding application entry points and scripts are present in the final project.*

---

🔐 Environment Configuration

Create environment files locally using the provided example templates.

Typical backend configuration:

```env
SUPABASE_URL=your_supabase_project_url
SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
GEMINI_API_KEY=your_gemini_api_key
```

Typical frontend configuration:

```env
VITE_SUPABASE_URL=your_supabase_project_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
VITE_API_BASE_URL=http://127.0.0.1:8000
```

**Security guidelines:**
- Never commit `.env` files or API keys to GitHub.
- Never expose the Supabase service-role key in frontend or mobile code.
- Keep the Gemini API key on the backend.
- Use appropriate authentication, authorization, and database security policies.

---

## 📚 Documentation

Detailed technical documentation is maintained separately in the `docs/` directory.

| Document | Description |
|---|---|
| [SRS](docs/SRS.md) | Software requirements and specifications |
| [ER Diagram](docs/ER_Diagram.md) | Database entities and relationships |
| [Database Schema](docs/Database_Schema.md) | Tables, columns, and constraints |
| [System Architecture](docs/System_Architecture.md) | Application architecture and components |
| [API Design](docs/API_Design.md) | Backend API endpoints and contracts |
| [Authentication and Security](docs/Authentication_and_Security.md) | Authentication, authorization, and security design |

---

## 📌 Project Scope

The project focuses on delivering a practical and maintainable web and mobile application.

**Core scope:**
- Agricultural and electronic waste management.
- Waste listing and partner discovery.
- Intelligent matching and AI-assisted recommendations.
- Partner verification.
- Collection request coordination.
- Request status tracking.

**Outside the initial scope:**
- Integrated online payment processing.
- Platform-owned transportation services.
- Nationwide verified partner coverage.
- Advanced machine-learning model training.

---

🔮 Future Enhancements

- Multilingual support for regional users.
- Location-based partner discovery and map integration.
- Advanced demand and price analytics.
- Improved AI-assisted waste utilization recommendations.
- Integration with verified recycling organizations.
- Notifications for collection requests and status changes.
- Expansion to additional waste categories and regions.

---

👨‍💻 Contributors

**Koushik Y.**  
**Project Team:** Two-member development team

GitHub: [koushik-9705](https://github.com/koushik-9705)

---

🌱 Vision

**Waste2Wealth — Turning Waste into Opportunity.**

Our vision is to create a connected ecosystem where agricultural residues and electronic waste are recognized not as unwanted materials, but as valuable resources that can support sustainable livelihoods, responsible recycling, and a circular economy.

---

*Waste2Wealth is an academic software project developed for educational and demonstration purposes.*

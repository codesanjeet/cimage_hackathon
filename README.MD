# Campus VMS — Smart Campus Visitor Management System

> **Tech Stack:** Next.js 14 · FastAPI · Docker · Gemini AI Risk Engine . Postgresql

---

## 1. Project Overview

Campus VMS is a full-stack, AI-powered visitor management system for college and university campuses. It replaces paper-based visitor registers with a secure digital system featuring OTP-based gate entry, automated email notifications, AI-driven risk scoring, and a live security dashboard.

| | |
|---|---|
| **Problem** | Campuses rely on paper registers with no verification, audit trail, or security. |
| **Solution** | Digital entry with OTP verification, AI risk analysis, and real-time alerts. |
| **Result** | Faster entry, full audit trail, automated threat detection, email notifications. |

---

## 2. Features

### 2.1 Authentication & Security

| Item | Description |
|---|---|
| **JWT Login** | Email + password login. Token stored in browser. Auto-redirect if session expires. |
| **Role System** | Admin and Guard roles. Role returned from backend on login. |
| **OTP Entry** | Single-use 6-digit OTP generated on approval. Guard verifies at gate. |
| **Blacklist** | Phone numbers permanently banned. Instant alert on blacklisted registration attempt. |

### 2.2 Visitor Lifecycle

| Item | Description |
|---|---|
| **Register** | Capture name, email, phone, purpose, host ID, expected duration. Status starts as `pending`. |
| **Approve** | Admin approves visitor. OTP generated and emailed automatically. |
| **Reject** | Admin rejects visitor. Rejection email sent automatically. |
| **Check-in** | Guard enters visitor ID + OTP. System grants or denies access. |
| **Checkout** | Guard marks visitor exited. Check-out time recorded. |
| **Search** | Search by name or phone. Filter by status dropdown. |

### 2.3 Live Dashboard

| Item | Description |
|---|---|
| **Total Today** | All visitors registered today. |
| **Active Inside** | Visitors currently on campus. |
| **Pending** | Visitors awaiting admin approval. |
| **Overstayed** | Visitors who exceeded their expected duration. |

### 2.4 Automated Emails (Resend API)

| Trigger | Recipient | Content |
|---|---|---|
| Approved | Visitor email | OTP code + instructions for gate entry |
| Rejected | Visitor email | Rejection notice |
| Overstay Alert | Host email | Visitor name + minutes overstayed |

### 2.5 AI Risk Analysis (Google Gemini)

| Item | Description |
|---|---|
| **Risk Level** | LOW / MEDIUM / HIGH classification per visitor. |
| **Risk Score** | Numeric score 0–100 based on behavioural patterns. |
| **Flags** | List of specific suspicious observations. |
| **Recommendation** | Actionable text advice for the security team. |

### 2.6 Security Alerts

| Item | Description |
|---|---|
| **Overstay** | Auto-created when visitor exceeds expected duration. |
| **Blacklist** | Instant alert when a banned phone number attempts to register. |
| **Suspicious** | Flagged by AI risk analysis engine. |
| **Resolve** | Guards can mark any alert as resolved with one click. |

---

## 3. System Architecture

Campus VMS uses a client-server architecture with a RESTful API between the Next.js frontend and FastAPI backend, backed by a hosted PostgreSQL database.

| Layer | Details |
|---|---|
| **Frontend** | Next.js 14 App Router + TypeScript · Tailwind CSS v4 + Framer Motion · REST API communication with backend (port 8000) · JWT token stored in localStorage |
| **Backend** | FastAPI (Python) with async SQLAlchemy ORM · JWT authentication via python-jose · Resend API for transactional emails · Google Gemini API for AI risk analysis |
| **Database** | PostgreSQL (hosted) — stores users, visitors, alerts, blacklist · AsyncPG async driver · Connected via single `DATABASE_URL` environment variable |
| **Deployment** | Docker + Docker Compose for containerised deployment · Separate containers: frontend, backend, PostgreSQL · Single command startup: `docker compose up --build` |

---

## 4. Tech Stack

### 4.1 Frontend (`package.json`)

| Package | Description |
|---|---|
| `next@16.2.4` | App Router framework — pages, routing, SSR |
| `react@19.2.4` | UI component rendering |
| `typescript@5` | Type-safe development |
| `tailwindcss@4` | Utility-first CSS styling |
| `framer-motion@12` | Page and card animations |
| `react-icons@5` | Icon library — Remix Icons (ri) set |

### 4.2 Backend (`requirements.txt`)

| Package | Description |
|---|---|
| `fastapi@0.136` | API framework — all routes and validation |
| `sqlalchemy@2.0` | Async ORM for database queries |
| `asyncpg@0.31` | Async PostgreSQL driver |
| `python-jose@3.5` | JWT token creation and verification |
| `bcrypt@5.0` | Password hashing |
| `httpx@0.28` | Async HTTP client for Resend API calls |
| `google-genai@1.73` | Google Gemini AI SDK |
| `python-dotenv@1.2` | Load environment variables from `.env` |
| `uvicorn@0.44` | ASGI server |
| `gunicorn@25.3` | Production process manager |

---

## 5. Project Structure

### 5.1 Frontend

```
frontend/
  app/
    layout.tsx               # Root layout
    globals.css              # Tailwind v4 + .vms-* utility classes
    login/page.tsx           # /login
    dashboard/page.tsx       # /dashboard
    visitors/page.tsx        # /visitors
    visitors/register/       # /visitors/register
    visitors/[id]/checkin/   # /visitors/[id]/checkin (OTP gate screen)
    alerts/page.tsx          # /alerts
    ai/page.tsx              # /ai
  components/
    DashboardShell.tsx       # Auth guard + layout wrapper
    Sidebar.tsx              # Navigation
    StatCard.tsx             # Dashboard stat card
    StatusBadge.tsx          # Visitor and alert badges
    Toast.tsx                # Notification system
  lib/api.ts                 # All API calls (typed)
```

### 5.2 Backend

```
backend/
  main.py                    # FastAPI entry point + CORS
  config.py                  # Environment variable loading
  mailer.py                  # Resend email functions
  core/db.py                 # Database connection (DATABASE_URL)
  models/                    # SQLAlchemy models (User, Visitor, Alert, Blacklist)
  schemas/                   # Pydantic schemas
  routers/                   # Route handlers (auth, visitors, dashboard, alerts, ai)
  services/                  # Business logic (visitor_service, dashboard_service, ai_service)
```

---

## 6. Environment Variables

Create a `.env` file in the `backend/` directory with the following variables:

| Variable | Example Value | Description |
|---|---|---|
| `DATABASE_URL` | `postgresql+asyncpg://user:pass@host/db` | Full hosted PostgreSQL connection URI |
| `SECRET_KEY` | `any-long-random-string` | JWT signing secret |
| `RESEND_API_KEY` | `re_xxxxxxxxxxxxxxxxxxxx` | API key from resend.com |
| `FROM_EMAIL` | `you@yourdomain.com` | Verified sender email in Resend |
| `GEMINI_API_KEY` | `AIzaSy_xxxxxxxxxxxxxxxxxxxx` | Google AI Studio API key |

**Notes:**
- **`DATABASE_URL`** — Use your hosted PostgreSQL URI (e.g. from Supabase, Neon, Railway).  
  Format: `postgresql+asyncpg://USER:PASSWORD@HOST:PORT/DBNAME`
- **`SECRET_KEY`** — Any long random string. Generate with:  
  ```bash
  python -c "import secrets; print(secrets.token_hex(32))"
  ```
- **`RESEND_API_KEY`** — Sign up at [resend.com](https://resend.com) → API Keys → Create Key (starts with `re_`)
- **`FROM_EMAIL`** — Must be a verified domain in the Resend dashboard.
- **`GEMINI_API_KEY`** — Get from [aistudio.google.com](https://aistudio.google.com) → Get API Key

---

## 7. Setup Instructions

### 7.1 Prerequisites

- Node.js 18+ and npm
- Python 3.11+
- Git
- Docker Desktop *(for Docker setup — recommended)*

### 7.2 Manual Setup

**Backend:**

```bash
cd backend
python -m venv .venv
.venv\Scripts\activate          # Windows
# source .venv/bin/activate     # Mac / Linux

pip install -r requirements.txt

# Create .env file (see Section 6)

uvicorn main:app --reload --port 8000
```

**Frontend:**

```bash
cd frontend
npm install
npm run dev
# Runs at http://localhost:3000
```

| Service | URL |
|---|---|
| Backend API | http://localhost:8000 |
| Frontend | http://localhost:3000 |
| Swagger Docs | http://localhost:8000/docs |

### 7.3 Docker Setup (Recommended)

Docker is the recommended deployment method. All services start with one command — no manual PostgreSQL installation required.

```bash
# 1. Create backend/.env with your 5 environment variables (see Section 6)

# 2. Build and start all containers
docker compose up --build

# 3. Access
#    Frontend:  http://localhost:3000
#    Backend:   http://localhost:8000
#    API Docs:  http://localhost:8000/docs

# Stop containers
docker compose down

# Stop and wipe all data
docker compose down -v
```

**`docker-compose.yml` overview:**

```
services:
  db:        PostgreSQL container (postgres:16)
  backend:   FastAPI container — port 8000, depends on db
  frontend:  Next.js container  — port 3000, depends on backend
```

**Why Docker?**
- No local database installation needed
- Consistent across Windows, Mac, and Linux
- Single command: `docker compose up --build`
- Isolated containers — no port or dependency conflicts
- Production-ready — same images deploy to any cloud provider

---

## 8. Visitor Flow

| Step | Action | Detail |
|---|---|---|
| **1** | Register | Guard registers visitor. Status = `pending`. |
| **2** | Admin approves | OTP generated, email sent to visitor. Status = `approved`. |
| **3** | Email received | Visitor receives OTP on their email. |
| **4** | Gate check-in | Guard enters visitor ID + OTP on `/visitors/[id]/checkin`. |
| **5** | Access granted | OTP verified. Status = `inside`. Check-in time recorded. |
| **6** | Overstay check | System alerts if visitor exceeds expected duration. |
| **7** | Exit | Guard clicks Checkout. Status = `exited`. |

---

## 9. API Reference

All endpoints return:
```json
{ "success": true, "message": "...", "data": { ... } }
```

| Method | Endpoint | Description |
|---|---|---|
| `POST` | `/auth/login` | Login — returns `access_token`, `role`, `name` |
| `GET` | `/dashboard/stats` | Live stat counts |
| `GET` | `/visitors` | List visitors (`?status=` and `?search=` supported) |
| `POST` | `/visitors/register` | Register new visitor |
| `POST` | `/visitors/{id}/approve` | Approve — generates OTP + sends email |
| `POST` | `/visitors/{id}/reject` | Reject — sends rejection email |
| `POST` | `/visitors/{id}/checkin` | Verify OTP at gate — body: `{ otp }` |
| `POST` | `/visitors/{id}/checkout` | Mark visitor as exited |
| `GET` | `/alerts` | List all security alerts |
| `POST` | `/alerts/check-overstay` | Trigger overstay scan |
| `POST` | `/alerts/{id}/resolve` | Resolve an alert |
| `POST` | `/ai/analyze/{visitor_id}` | AI risk analysis — returns score + flags |

---

## 10. Troubleshooting

| Issue | Fix |
|---|---|
| **Email not received** | Check FastAPI terminal for `[EMAIL DEBUG]` output. Verify `RESEND_API_KEY` is valid and `FROM_EMAIL` domain is verified in Resend. |
| **Stats show 0** | Backend wraps all responses in `ResponseSchema`. Ensure `lib/api.ts` returns `res.data` not `res` directly. |
| **`visitors.map` error** | Backend returns wrapped object, not array. Use `ResponseSchema` unwrap in `getVisitors()`. |
| **Login name undefined** | Login response is wrapped. Use `res.data.name`, `res.data.role`, `res.data.access_token`. |
| **CORS error** | Add `CORSMiddleware` to FastAPI allowing `http://localhost:3000`. |
| **DB connection error** | Verify `DATABASE_URL` is correct. For Docker, ensure the hosted DB URL is accessible from the container. |
| **Docker port conflict** | Stop any local service using port 3000 or 8000 before running `docker compose up`. |

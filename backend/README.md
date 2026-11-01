# 🌿 PlantCare AI — Standalone Backend API

High-performance, modular Node.js & Express REST API for **PlantCare AI**, integrating PostgreSQL via Supabase and AI leaf disease diagnosis via OpenAI Vision (with intelligent offline botanist fallback).

---

## 📁 Directory Structure

```
backend/
├── package.json              # Backend dependencies and scripts
├── tsconfig.json             # TypeScript configuration
├── .env.example              # Environment variables template
├── README.md                 # Backend documentation
└── src/
    ├── server.ts             # Express application entrypoint
    ├── config/
    │   └── env.ts            # Validated environment configuration
    ├── middleware/
    │   ├── auth.ts           # Supabase JWT token verification
    │   └── errorHandler.ts   # Centralized error handler
    ├── controllers/
    │   ├── auth.controller.ts    # User profiles
    │   ├── plants.controller.ts  # Garden inventory & watering
    │   ├── library.controller.ts # Botanical catalog
    │   └── diagnose.controller.ts# AI plant disease diagnosis
    ├── routes/
    │   ├── auth.routes.ts        # /api/auth/*
    │   ├── plants.routes.ts      # /api/plants/*
    │   ├── library.routes.ts     # /api/library/*
    │   ├── diagnose.routes.ts    # /api/diagnose/*
    │   └── index.ts              # Combined router
    ├── services/
    │   ├── supabase.service.ts   # Supabase database clients
    │   └── ai.service.ts         # OpenAI vision & diagnostic engine
    └── types/
        └── index.ts              # Shared TypeScript definitions
```

---

## 🚀 Quick Start

### 1. Install Dependencies
```bash
cd backend
npm install
```

### 2. Configure Environment Variables
Copy `.env.example` to `.env`:
```bash
cp .env.example .env
```
Fill in your Supabase project credentials (can be copied directly from the root `.env`):
- `SUPABASE_URL`
- `SUPABASE_PUBLISHABLE_KEY`
- `OPENAI_API_KEY` *(optional, built-in intelligent diagnostic engine runs if omitted)*

### 3. Run Development Server
```bash
npm run dev
```
The server will start on `http://localhost:5000`.

---

## 📡 API Endpoints

### 🩺 System & Health
| Method | Endpoint | Description | Auth Required |
|---|---|---|---|
| `GET` | `/health` | Server status and connected services | No |

### 🔍 Plant Diagnosis (`/api/diagnose`)
| Method | Endpoint | Description | Auth Required |
|---|---|---|---|
| `POST` | `/api/diagnose` | Run botanical diagnosis on base64 plant image | No |
| `GET` | `/api/diagnose/history` | Get past diagnosis scans for authenticated user | Yes |

#### Sample Request (`POST /api/diagnose`):
```json
{
  "imageDataUrl": "data:image/jpeg;base64,...",
  "notes": "Leaf tips turning brown and crispy",
  "plantId": "optional-uuid"
}
```

### 🌱 Garden Inventory (`/api/plants`)
| Method | Endpoint | Description | Auth Required |
|---|---|---|---|
| `GET` | `/api/plants` | List all user plants with watering history | Yes |
| `POST` | `/api/plants` | Add a new plant to garden | Yes |
| `PUT` | `/api/plants/:id` | Update plant details | Yes |
| `DELETE` | `/api/plants/:id` | Delete plant from garden | Yes |
| `POST` | `/api/plants/:id/water`| Record watering care event | Yes |

### 📚 Botanical Library (`/api/library`)
| Method | Endpoint | Description | Auth Required |
|---|---|---|---|
| `GET` | `/api/library` | Get list of botanical plant care profiles | No |
| `GET` | `/api/library/:slug` | Get details for a specific plant profile | No |

### 👤 User Account (`/api/auth`)
| Method | Endpoint | Description | Auth Required |
|---|---|---|---|
| `GET` | `/api/auth/me` | Get profile details for authenticated user | Yes |
| `PUT` | `/api/auth/profile` | Update user name and avatar | Yes |

---

## 🔐 Authentication
Protected routes require a Supabase JWT in the `Authorization` header:
```
Authorization: Bearer <supabase_access_token>
```
Local demo mode is supported with token `Bearer demo-token.dev`.

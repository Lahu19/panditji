# PanditJi — Religious Services Marketplace

A production-ready, configuration-driven platform connecting customers with verified Pandits and religious-service providers across India.

---

## Platform Architecture

Three completely separate portals, one shared backend:

```
                         PANDITJI PLATFORM
                                │
              ┌─────────────────┼─────────────────┐
              │                 │                 │
              ▼                 ▼                 ▼
       Customer Portal    Pandit Portal      Admin Panel
       localhost:5173/    /pandit-portal     /admin
```

| Portal | URL prefix | Auth required | Role |
|---|---|---|---|
| Customer | `/` | Optional | CUSTOMER |
| Pandit Portal | `/pandit-portal/*` | Yes | PROVIDER |
| Admin Panel | `/admin/*` | Yes | ADMIN |

---

## Quick Start

### Prerequisites

- Node.js 18+
- MongoDB Atlas account (or local MongoDB 6+)
- A `.env` file in `server/` (copy from `.env.example`)

### 1 — Install dependencies

```bash
# Frontend
npm install

# Backend
cd server && npm install
```

### 2 — Configure environment

```bash
cp server/.env.example server/.env
```

Edit `server/.env` and set:

```
MONGODB_URI=mongodb+srv://<user>:<pass>@cluster.mongodb.net/panditji
JWT_SECRET=<generate a strong random string>
GEMINI_API_KEY=<from Google AI Studio — optional, for AI chat>
```

### 3 — Seed the database

```bash
cd server && npm run seed
```

This creates:

- 6 categories, 23 services with requirement fields
- 3 verified provider accounts (Indore, MP)
- 1 admin account
- Geo hierarchy: 1 country, 10 states, 16 cities, 16 areas (all with 2dsphere coordinates)
- ProviderServiceArea records for each seeded provider

**Seed credentials:**

| Account | Email | Password | Role |
|---|---|---|---|
| Admin | `admin@panditji.dev` | `Admin@123!` | ADMIN |
| Pandit 1 | `rajesh.sharma@panditji.dev` | `Password123!` | PROVIDER |
| Pandit 2 | `mahesh.joshi@panditji.dev` | `Password123!` | PROVIDER |
| Pandit 3 | `suresh.dwivedi@panditji.dev` | `Password123!` | PROVIDER |

### 4 — Run

Open two terminals:

```bash
# Terminal 1 — Backend (port 5001)
cd server && npm run dev

# Terminal 2 — Frontend (port 5173)
npm run dev
```

Visit `http://localhost:5173`

---

## Portal URLs

### Customer Portal

| Path | Description |
|---|---|
| `/` | Home — location badge, three entry points |
| `/tell-us` | AI-assisted "tell us what you need" flow |
| `/browse` | Browse services by category |
| `/search` | Search providers and services |
| `/pandits` | All providers directory |
| `/pandit/:id` | Provider profile |
| `/service/:id` | Service detail |
| `/book/:id` | Booking confirmation |

### Pandit Portal

| Path | Description |
|---|---|
| `/pandit-portal/login` | Sign in / register as provider |
| `/pandit-portal/become` | Shown to customers who try to access the portal |
| `/pandit-portal` | Dashboard — KPIs, completion, upcoming bookings |
| `/pandit-portal/onboarding` | 11-step guided setup wizard |
| `/pandit-portal/profile` | Edit profile with live customer preview |
| `/pandit-portal/services` | Add and configure offered services |
| `/pandit-portal/service-areas` | Define coverage (city / area / radius) |
| `/pandit-portal/availability` | Weekly schedule + block dates |
| `/pandit-portal/requests` | Accept or decline incoming bookings |
| `/pandit-portal/bookings` | Upcoming and past bookings |
| `/pandit-portal/earnings` | Revenue dashboard + payment history |
| `/pandit-portal/reviews` | Customer reviews with breakdown |
| `/pandit-portal/verification` | Verification checklist + submit |
| `/pandit-portal/notifications` | In-app notification centre |

### Admin Panel

| Path | Description |
|---|---|
| `/admin` | Dashboard — KPIs, charts, recent activity |
| `/admin/providers` | Provider list + verify / suspend |
| `/admin/users` | Customer and admin user management |
| `/admin/locations` | Geo hierarchy management (cities, areas, stats) |
| `/admin/services` | Service catalogue with requirement fields |
| `/admin/requests` | Service requests + match details |
| `/admin/bookings` | All bookings with filters |
| `/admin/payments` | Payment history + payout tracking |
| `/admin/reviews` | Review moderation (flag / hide / restore) |
| `/admin/audit` | Immutable audit log with before/after diff |

---

## API Overview

Base URL: `http://localhost:5001/api`

All protected routes require: `Authorization: Bearer <jwt>`

### Auth

| Method | Path | Description |
|---|---|---|
| POST | `/auth/register` | Register new user |
| POST | `/auth/login` | Login, returns JWT |
| GET | `/auth/me` | Get current user from token |

### Geo Location

| Method | Path | Description |
|---|---|---|
| GET | `/geo/search?q=Vijay+Nagar` | Search cities and areas |
| POST | `/geo/resolve` | Resolve `{latitude, longitude}` → location hierarchy |
| GET | `/geo/countries` | List active countries |
| GET | `/geo/states?countryId=IN` | List states by country |
| GET | `/geo/cities?stateId=IN_MP` | List cities by state |
| GET | `/geo/areas?cityId=IN_MP_INDORE` | List areas by city |
| GET | `/geo/location/:id` | Get single location by area/city ID |
| POST | `/geo/provider-service-areas` | Add provider coverage record |

### Providers

| Method | Path | Description |
|---|---|---|
| GET | `/providers` | List with filters (language, samagri, verified, serviceId, price range) |
| GET | `/providers/search?q=` | Text search |
| GET | `/providers/:id` | Profile + recent reviews |
| POST | `/providers` | Create provider profile |
| PATCH | `/providers/:id` | Update (owner or admin) |
| GET | `/providers/:id/availability` | Get availability schedule |

### Service Requests + Matching

| Method | Path | Description |
|---|---|---|
| POST | `/service-requests` | Create request with geo location object |
| GET | `/service-requests` | List own requests |
| PATCH | `/service-requests/:id` | Update requirements |
| POST | `/service-requests/:id/match` | Run geo-aware matching engine |
| GET | `/matches?requestId=` | Get match results |
| PATCH | `/matches/:id/select` | Select a provider |

### Bookings + Payments

| Method | Path | Description |
|---|---|---|
| POST | `/bookings` | Create booking |
| GET | `/bookings` | List own bookings |
| PATCH | `/bookings/:id/status` | Transition booking status |
| POST | `/payments` | Initiate payment |
| POST | `/payments/:id/confirm` | Confirm payment (simulation) |
| POST | `/payments/:id/refund` | Initiate refund |

### Pandit Portal (PROVIDER role)

| Method | Path | Description |
|---|---|---|
| GET | `/pandit-portal/me` | Profile + completion score |
| PATCH | `/pandit-portal/profile` | Update profile |
| PATCH | `/pandit-portal/location` | Update base location with geo IDs |
| POST | `/pandit-portal/onboarding/step` | Save individual wizard step |
| GET | `/pandit-portal/services-catalog` | Services grouped by category (from DB) |
| GET | `/pandit-portal/my-services` | Provider's configured services |
| POST | `/pandit-portal/my-services` | Add service |
| PATCH | `/pandit-portal/my-services/:id` | Update service pricing/config |
| DELETE | `/pandit-portal/my-services/:id` | Remove service |
| GET | `/pandit-portal/service-areas` | Provider coverage records |
| POST | `/pandit-portal/service-areas` | Add coverage area |
| GET | `/pandit-portal/availability` | Get schedule |
| PUT | `/pandit-portal/availability` | Update schedule |
| POST | `/pandit-portal/availability/block` | Block date range |
| GET | `/pandit-portal/bookings?tab=upcoming` | Provider's bookings |
| PATCH | `/pandit-portal/bookings/:id/respond` | Accept or decline booking |
| GET | `/pandit-portal/earnings` | Revenue KPIs + payment history |
| GET | `/pandit-portal/reviews` | Received reviews with summary |
| PATCH | `/pandit-portal/submit` | Submit profile for verification |

### Admin (ADMIN role)

| Method | Path | Description |
|---|---|---|
| GET | `/admin/dashboard` | KPIs, charts, booking trend |
| GET | `/admin/users` | Paginated user list with filters |
| PATCH | `/admin/users/:id` | Update user status / role |
| GET | `/admin/providers` | Paginated provider list with filters |
| PATCH | `/admin/providers/:id/verify` | Verify specific document type |
| PATCH | `/admin/providers/:id/status` | Change provider status |
| GET | `/admin/bookings` | Paginated bookings with filters |
| GET | `/admin/payments` | Payment history with summary |
| GET | `/admin/reviews` | Reviews with filter |
| PATCH | `/admin/reviews/:id/moderate` | Flag / hide / restore review |
| GET | `/admin/audit-logs` | Immutable audit log with filters |
| GET | `/admin/location-stats` | Provider + booking counts by city |
| GET | `/admin/service-requests` | All service requests |
| GET | `/admin/services` | All services |

---

## Geo Location System

### Location hierarchy

```
Country (IN)
  └── State (IN_MP — Madhya Pradesh)
        └── City (IN_MP_INDORE — Indore)
              └── Area (IN_MP_INDORE_VIJAY_NAGAR — Vijay Nagar)
```

### LocationContext (frontend)

`useLocation()` hook manages:
- `detectedLocation` — from browser GPS + reverse-geocode (never silently applied)
- `selectedLocation` — user-confirmed location (persisted to `localStorage`)
- `permissionState` — `unknown | requesting | granted | denied | unavailable`
- `detectionState` — `idle | detecting | resolving | done | error`

```js
// Get location object to embed in a service request
const { getLocationForRequest } = useLocation();
const location = getLocationForRequest(); // { cityId, areaId, stateId, countryId, coordinates, formattedAddress }
```

### Matching engine

`POST /service-requests/:id/match` applies filters in this order:
1. MongoDB `$near` pre-filter (100 km radius) — uses `2dsphere` index on `Provider.location`
2. `ProviderServiceArea` check — verifies the provider explicitly covers the requested city / area / state, or is within a radius
3. Haversine fallback for radius coverage
4. Legacy `Provider.serviceAreas[]` string fallback
5. Score: 60 base + 15 language + 15 samagri + 10 rating + 5 verified

---

## Booking location principle

```
User GPS location      ≠     Booking event location
(Mumbai)                     (Indore — booking for parents)
```

The system stores separate:
- `user.currentLocation` (volatile, in React context)
- `serviceRequest.extractedRequirements.location` (frozen at request creation)
- `booking.event.location` (frozen at booking creation)

---

## Provider verification flow

```
Pandit registers (PROVIDER account)
        ↓
Onboarding wizard (11 steps)
        ↓
Submit profile → status: PENDING_VERIFICATION
        ↓
Admin panel verification workflow
        ↓
Admin marks IDENTITY + PHONE etc. as VERIFIED
        ↓
Provider status → ACTIVE
        ↓
Provider appears in customer matching results
```

Providers **cannot** self-activate. Admin approval is required.

---

## Environment variables

| Variable | Required | Description |
|---|---|---|
| `MONGODB_URI` | ✅ | MongoDB Atlas connection string |
| `JWT_SECRET` | ✅ | Strong random string for JWT signing |
| `PORT` | Optional | Server port (default: 5001) |
| `NODE_ENV` | Optional | `development` or `production` |
| `CORS_ORIGIN` | Optional | Frontend URL for CORS (default: `*`) |
| `GEMINI_API_KEY` | Optional | Google Gemini API key for AI chat |

---

## Project structure

```
find-MU-PANDIT/
├── src/                        # React frontend
│   ├── api/                    # API client modules
│   │   ├── client.js           # Base fetch wrapper
│   │   ├── geo.js              # Geo location API
│   │   ├── admin.js            # Admin API
│   │   └── panditPortal.js     # Provider portal API
│   ├── context/
│   │   ├── AuthContext.jsx     # Global auth state
│   │   ├── LocationContext.jsx # Geo location state machine
│   │   └── PanditPortalContext.jsx  # Provider portal state
│   ├── components/
│   │   ├── Navbar.jsx          # Customer navbar with LocationBadge
│   │   └── LocationSelector.jsx # LocationBadge, LocationSearch, modal
│   ├── pages/
│   │   ├── Home.jsx            # Customer home
│   │   ├── ...                 # Other customer pages
│   │   ├── admin/              # Admin panel pages
│   │   └── pandit-portal/      # Pandit portal pages
│   └── index.css               # All CSS (customer + admin + portal)
│
└── server/                     # Express backend
    ├── models/                 # Mongoose models
    │   ├── GeoCountry.js       # ISO country master
    │   ├── GeoState.js         # State / province
    │   ├── GeoCity.js          # City with text index
    │   ├── GeoArea.js          # Area with 2dsphere index
    │   ├── ProviderServiceArea.js  # Provider coverage
    │   ├── Provider.js         # Provider profile + geo IDs
    │   ├── ServiceRequest.js   # Request with Mixed location field
    │   └── ...                 # Other models
    ├── routes/
    │   ├── geo.js              # /api/geo/*
    │   ├── admin.js            # /api/admin/*
    │   ├── panditPortal.js     # /api/pandit-portal/*
    │   └── ...                 # Other route files
    ├── middleware/
    │   └── auth.js             # JWT authRequired / optionalAuth
    ├── seed.js                 # Database seed script
    └── server.js               # Express app entry point
```

---

## Key design principles

- **Configuration-driven** — services, categories, locations, and requirement fields are in the database, not hardcoded in the frontend. Adding a new service or city requires no frontend code changes.
- **Geo-first matching** — provider matching uses MongoDB `$near` and `ProviderServiceArea` records rather than string comparison. A customer in Mumbai can book a ceremony in Indore.
- **Transparent matching** — every match result shows human-readable `matchReasons[]`. Scores are never exposed to customers as numbers.
- **AI assists, backend decides** — Gemini extracts intent and requirements from natural language. Availability, eligibility, geo coverage, and pricing are all determined by deterministic backend logic.
- **Provider trust layer** — providers cannot self-activate. `PENDING_VERIFICATION → ACTIVE` requires explicit admin approval per the verification workflow.
- **Audit everything** — `AuditLog` is append-only and wired into provider verification, status changes, review moderation, booking accept/decline, and match runs.

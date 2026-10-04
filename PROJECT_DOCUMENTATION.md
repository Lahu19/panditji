# PanditJi — Complete Project Documentation

> **Audience:** This document is written for both technical (developers, architects) and non-technical (product managers, business stakeholders) readers.  
> Every section is clearly labelled. Non-technical readers can safely skip sections marked 🔧.

---

## Table of Contents

1. [What Is PanditJi?](#1-what-is-panditji)
2. [Who Is It For?](#2-who-is-it-for)
3. [Core Features](#3-core-features)
4. [How It Works — User Journey](#4-how-it-works--user-journey)
5. [System Architecture Overview 🔧](#5-system-architecture-overview-)
6. [Data Flow Diagram — Booking Lifecycle 🔧](#6-data-flow-diagram--booking-lifecycle-)
7. [Data Flow Diagram — Pandit Respond Flow 🔧](#7-data-flow-diagram--pandit-respond-flow-)
8. [Entity Relationship Diagram 🔧](#8-entity-relationship-diagram-)
9. [API Route Map 🔧](#9-api-route-map-)
10. [Booking Status State Machine 🔧](#10-booking-status-state-machine-)
11. [Frontend Page Map 🔧](#11-frontend-page-map-)
12. [Database Models Reference 🔧](#12-database-models-reference-)
13. [Authentication & Security 🔧](#13-authentication--security-)
14. [Deployment & Infrastructure](#14-deployment--infrastructure)
15. [Environment Variables 🔧](#15-environment-variables-)
16. [Seed Data & Local Setup 🔧](#16-seed-data--local-setup-)
17. [Known Limitations & Roadmap](#17-known-limitations--roadmap)

---

## 1. What Is PanditJi?

PanditJi is an online marketplace platform that connects Hindu customers with qualified Pandit priests (puja performers) for religious ceremonies and rituals. Think of it like "UrbanClap for religious services" — customers describe what they need (Griha Pravesh, wedding puja, Satyanarayan katha, etc.), browse verified pandits near them, and book directly through the platform.

**Key value propositions:**
- Customers find trusted, verified pandits in their city without relying on word-of-mouth.
- Pandits get a professional channel to grow their practice and manage bookings.
- The platform handles discovery, booking, pricing, and payment in one place.

---

## 2. Who Is It For?

| Role | Description |
|------|-------------|
| **Customer** | Anyone who wants to arrange a Hindu religious ceremony — family events, housewarming, business puja, etc. |
| **Pandit (Provider)** | A professional priest who registers on the platform, lists their services and availability, and accepts booking requests. |
| **Admin** | Internal team member who manages the platform — verifies pandits, reviews bookings, resolves disputes, monitors platform health. |

---

## 3. Core Features

### For Customers
- Browse services by category (Wedding, Havan, Naamkaran, Satyanarayan, etc.)
- Search pandits by city, language, and ceremony type
- View detailed pandit profiles with ratings, reviews, and pricing
- Multi-step booking flow: fill details → pay → get confirmation
- **My Bookings page** — track all bookings with live status updates
- In-app notifications when pandit confirms or declines
- AI assistant ("PanditJi AI") for puja guidance

### For Pandits
- Dedicated portal at `/pandit-portal`
- Manage profile, services offered, and service areas
- Set availability (working hours, blocked dates)
- Review and respond to incoming booking requests (Accept / Decline)
- Track upcoming and past bookings with full customer details
- Earnings dashboard with payment history

### For Admins
- Full dashboard at `/admin` with KPIs and trend charts
- Manage providers (view, verify, activate/suspend)
- Manage users and bookings with full filter/search
- Review and moderate customer reviews
- Audit trail for every important action on the platform
- Geo location management (countries, states, cities, areas)

---

## 4. How It Works — User Journey

### Customer Journey

```
1. Land on Home Page
   └─ Browse trending services / search by ceremony / location

2. Browse or Search
   └─ Filter by city, service type, language
   └─ View pandit cards with ratings, price, availability

3. Open Pandit Profile
   └─ Read full profile: languages, experience, services, reviews
   └─ Click "Book Now"

4. TellUs / Service Request (optional)
   └─ Describe what you need: ceremony type, date, guest count
   └─ System matches to relevant pandits

5. Booking Confirmation Page
   ├─ Step 1: Fill your name, phone, address, special notes
   ├─ Step 2: Review pricing breakdown + choose payment method
   └─ Step 3: Booking created → payment simulated → Confirmation screen shown

6. Wait for Pandit Confirmation
   └─ Booking status = PENDING (waiting for pandit)
   └─ Customer receives in-app notification once pandit responds

7. My Bookings Page
   └─ Upcoming tab: see PENDING / CONFIRMED / IN_PROGRESS bookings
   └─ Past tab: COMPLETED / CANCELLED / DISPUTED
   └─ Tap any card to see full details + pricing + cancellation info
```

### Pandit Journey

```
1. Register as a Provider
   └─ /pandit-portal/become → create account → onboarding wizard

2. Complete Profile
   └─ Add services, service areas, availability schedule

3. Submit for Verification
   └─ Admin reviews and verifies identity/credentials
   └─ Status: PENDING_VERIFICATION → ACTIVE

4. Receive Booking Requests
   └─ Customer books → notification arrives in portal
   └─ Booking Requests tab shows all PENDING bookings

5. Respond to Request
   ├─ Accept → booking moves to CONFIRMED; customer notified
   └─ Decline → booking moves to CANCELLED; customer notified with reason

6. Conduct Ceremony
   └─ Booking moves to IN_PROGRESS → COMPLETED

7. Get Paid
   └─ Earnings dashboard shows confirmed payments and payout status
```

### Admin Journey

```
1. Log in at /admin
   └─ Dashboard shows live KPIs: bookings today, revenue, pending verifications

2. Verify Pandits
   └─ Providers list → open pandit → run through verification checklist
   └─ Approve each check: Identity, Phone, Address, Credentials, Background

3. Monitor Bookings
   └─ All bookings visible with status filter
   └─ Click any booking → full side drawer with audit trail

4. Handle Disputes
   └─ Filter by DISPUTED status → investigate via audit trail
   └─ Resolve → trigger status update

5. Manage Platform Data
   └─ Add/edit services, categories, geo locations
```

---

## 5. System Architecture Overview 🔧

```
┌─────────────────────────────────────────────────────────────────────┐
│                         CLIENT (Browser)                            │
│                                                                     │
│  React 18 + Vite SPA                                                │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────────────────┐  │
│  │  Customer    │  │ Pandit Portal│  │    Admin Panel           │  │
│  │  Pages       │  │ /pandit-     │  │    /admin/*              │  │
│  │  /, /browse, │  │ portal/*     │  │                          │  │
│  │  /my-bookings│  │              │  │                          │  │
│  └──────┬───────┘  └──────┬───────┘  └──────────┬───────────────┘  │
│         │                 │                      │                  │
│         └─────────────────┴──────────────────────┘                 │
│                           │  REST API (fetch)                       │
│                           │  Bearer JWT in Authorization header     │
└───────────────────────────┼─────────────────────────────────────────┘
                            │ HTTPS
                            ▼
┌─────────────────────────────────────────────────────────────────────┐
│                     BACKEND (Node.js / Express)                     │
│                     Running on port 5001                            │
│                                                                     │
│  ┌──────────────────────────────────────────────────────────────┐   │
│  │  Middleware Stack                                            │   │
│  │  cors → express.json (2MB) → morgan (logging)               │   │
│  │  authRequired (JWT verify) applied per-router               │   │
│  └──────────────────────────────────────────────────────────────┘   │
│                                                                     │
│  Route Groups:                                                      │
│  /api/auth          /api/users           /api/providers            │
│  /api/bookings      /api/payments        /api/notifications        │
│  /api/reviews       /api/service-requests /api/matches             │
│  /api/conversations /api/organizations   /api/geo                  │
│  /api/pandit-portal /api/admin           /api/panditji-ai          │
│  /api/audit-logs    /api/categories      /api/services             │
│                                                                     │
│  ┌──────────────────────────────────────────────────────────────┐   │
│  │  Mongoose ORM  →  MongoDB Atlas (cloud)                      │   │
│  └──────────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────────────┐
│                      MongoDB Atlas                                  │
│  Collections: users · providers · bookings · payments              │
│               services · categories · reviews · notifications       │
│               providerservices · providerserviceareas               │
│               provideravailability · serviceRequests · matches      │
│               conversations · organizations · auditlogs             │
│               geocountries · geostates · geocities · geoareas       │
└─────────────────────────────────────────────────────────────────────┘

Deployment:
  Frontend → Vercel (static hosting, CDN)
  Backend  → Render / Railway / VPS (Node process)
  DB       → MongoDB Atlas (managed)
```

---

## 6. Data Flow Diagram — Booking Lifecycle 🔧

This diagram shows all data movement from the moment a customer starts a booking to when the admin sees the final status.

```
CUSTOMER BROWSER                  BACKEND                      DATABASE
──────────────────────────────────────────────────────────────────────

[1] Customer opens /book/:pandidId
    └─ Loads pandit data from       GET /api/providers/:id  ──► Provider doc
       provider profile             ◄── provider JSON

[2] Customer fills form + clicks
    "Pay & Confirm"

[3] POST /api/bookings ──────────────────────────────────────────────►
    { primaryProviderId,            • Resolves serviceId (slug→ObjectId)
      serviceId, event, pricing,    • Resolves providerId (name→ObjectId)
      customerDetails }             • Sanitises event.date
                                    • Creates Booking { status: PENDING }
    ◄── { booking: { _id, status } } • Updates provider.bookingSummary.total+1
                                                               ◄── Booking saved

[4] POST /api/payments ──────────────────────────────────────────────►
    { bookingId, method: CASH }     • Creates Payment doc
    ◄── { payment: { _id } }                                   ◄── Payment saved

[5] PATCH /api/payments/:id/confirm ─────────────────────────────────►
    { gatewayPaymentId }            • Sets payment.status = PAID
    ◄── { payment: { status: PAID }}                           ◄── Payment updated

[6] UI shows "Booking Confirmed!" (optimistic)
    └─ Saves summary to localStorage['pj_bookings']


─── TIME PASSES ── PANDIT CHECKS PORTAL ──────────────────────────────

PANDIT BROWSER                    BACKEND                      DATABASE
──────────────────────────────────────────────────────────────────────

[7] GET /api/pandit-portal/bookings?tab=requests ────────────────────►
                                    • Resolves provider from JWT
                                    • Filter: primaryProviderId=me,
                                              status=PENDING
    ◄── { bookings: [...] }                                    ◄── Booking read

[8] Pandit clicks "Accept Booking"
    PATCH /api/pandit-portal/bookings/:id/respond ───────────────────►
    { action: "ACCEPT" }            • Validates status == PENDING
                                    • Sets status = CONFIRMED
                                    • Writes AuditLog (PROVIDER_ACCEPTED)
                                    • Creates Notification for customer
                                      { type: BOOKING_CONFIRMED }
    ◄── { booking: { status: CONFIRMED }}
                                                               ◄── Booking updated
                                                               ◄── AuditLog saved
                                                               ◄── Notification saved


CUSTOMER BROWSER                  BACKEND                      DATABASE
──────────────────────────────────────────────────────────────────────

[9] Customer visits /my-bookings
    GET /api/bookings ───────────────────────────────────────────────►
                                    • Filter: customerId = req.user.id
    ◄── { bookings: [{ status: "CONFIRMED", ... }] }
    └─ UI shows green "Confirmed ✓" badge


ADMIN BROWSER                     BACKEND                      DATABASE
──────────────────────────────────────────────────────────────────────

[10] Admin visits /admin/bookings
     GET /api/admin/bookings?status=CONFIRMED ───────────────────────►
                                    • ADMIN guard checked
                                    • Filter by status, date, city etc.
     ◄── { bookings: [...], total, pages }
     └─ Table shows CONFIRMED with blue badge

[11] Admin clicks "View →" on any booking
     GET /api/admin/bookings/:id ───────────────────────────────────►
                                    • Returns booking + full auditTrail
     ◄── { booking, auditTrail: [ PROVIDER_ACCEPTED, ... ] }
     └─ Side drawer shows full audit history
```

---

## 7. Data Flow Diagram — Pandit Respond Flow 🔧

Zoomed-in sequence for the critical ACCEPT / DECLINE path:

```
Pandit          panditPortal.js      Booking Model    AuditLog       Notification
   │                   │                   │              │               │
   │── PATCH /respond ─►│                   │              │               │
   │   { action:ACCEPT }│                   │              │               │
   │                   │── findOne ─────────►│              │               │
   │                   │◄── booking{PENDING}─│              │               │
   │                   │                   │              │               │
   │                   │── findByIdAndUpdate►│              │               │
   │                   │   status=CONFIRMED  │              │               │
   │                   │◄── updated booking ─│              │               │
   │                   │                   │              │               │
   │                   │── AuditLog.record ──────────────►│               │
   │                   │   PROVIDER_ACCEPTED │              │               │
   │                   │◄─────────────────────────────────│               │
   │                   │                   │              │               │
   │                   │── Notification.create ──────────────────────────►│
   │                   │   userId=customer   │              │               │
   │                   │   type=BOOKING_     │              │               │
   │                   │   CONFIRMED         │              │               │
   │                   │◄────────────────────────────────────────────────│
   │                   │                   │              │               │
   │◄── 200 { booking }─│                   │              │               │
   │                   │                   │              │               │

(If DECLINE: same flow but status=CANCELLED, AuditLog=PROVIDER_DECLINED,
             Notification type=BOOKING_CANCELLED, reason stored in
             booking.cancellation.reason, initiator=PROVIDER)
```

---

## 8. Entity Relationship Diagram 🔧

```
┌──────────┐          ┌───────────────┐         ┌──────────────┐
│  User    │1        N│   Provider    │1        N│ProviderService│
│──────────│◄─────────│───────────────│◄─────────│──────────────│
│_id       │  userId  │_id            │ providerId│_id           │
│contact   │          │displayName    │          │serviceId ─────┼──►┌─────────┐
│profile   │          │status         │          │pricing        │   │ Service │
│userType  │          │verificationStatus         │capabilities   │   │─────────│
│          │          │location       │          │               │   │name     │
└──────────┘          │serviceIds     │          └──────────────┘   │slug     │
    │ 1               │bookingSummary │                             │categoryId┼►┌──────────┐
    │                 │ratingSummary  │                             └─────────┘  │Category  │
    │ N               └───────────────┘                                          │──────────│
    │                      │ 1                    ┌───────────────┐              │name      │
    │                      │                      │ProviderService│              └──────────┘
    │                      │ N                    │Area           │
┌───▼──────┐          ┌────▼──────────┐          │──────────────-│
│ Booking  │N     1   │ProviderAvail- │          │providerId     │
│──────────│◄─────────│ability        │          │cityId/stateId │
│_id       │primaryPro│───────────────│          └───────────────┘
│customerId│viderId   │workingHours   │
│serviceId │          │blockedRanges  │          ┌───────────────┐
│status    │          │bookedSlots    │          │  GeoCountry   │
│event     │          └───────────────┘          │  GeoState     │
│pricing   │                                     │  GeoCity      │
│providers │          ┌────────────────┐         │  GeoArea      │
│[]{status}│1        N│  Payment       │         └───────────────┘
└────┬─────┘◄─────────│────────────────│
     │ 1   paymentId  │bookingId       │    ┌───────────────┐
     │                │amount, method  │    │  AuditLog     │
     │ N              │status          │    │───────────────│
┌────▼─────┐          │payout          │    │entityType     │
│  Review  │          └────────────────│    │entityId       │
│──────────│                           │    │action         │
│bookingId │          ┌────────────────┐    │actorId        │
│customerId│          │  Notification  │    │before / after │
│providerId│          │────────────────│    └───────────────┘
│rating    │          │userId          │
│status    │          │type            │    ┌───────────────┐
└──────────┘          │title, body     │    │ ServiceRequest│
                      │refType, refId  │    │───────────────│
                      └────────────────┘    │customerId     │
                                            │serviceId      │
                      ┌────────────────┐    │requirements   │
                      │ Conversation   │    │status         │
                      │────────────────│    └───────────────┘
                      │participants    │
                      │messages[]      │    ┌───────────────┐
                      └────────────────┘    │    Match      │
                                            │───────────────│
                                            │requestId      │
                                            │providerId     │
                                            │score          │
                                            └───────────────┘
```

---

## 9. API Route Map 🔧

### Auth  `/api/auth`
| Method | Path | Description | Auth |
|--------|------|-------------|------|
| POST | `/register` | Create account (CUSTOMER or PROVIDER) | — |
| POST | `/login` | Login, returns JWT | — |
| GET | `/me` | Get own profile | ✓ |
| PATCH | `/me` | Update own profile | ✓ |

### Bookings  `/api/bookings`
| Method | Path | Description | Auth |
|--------|------|-------------|------|
| POST | `/` | Create a booking | ✓ |
| GET | `/` | List own bookings (customer or provider) | ✓ |
| GET | `/:id` | Get single booking | ✓ |
| PATCH | `/:id/status` | Update booking status | ✓ |

### Pandit Portal  `/api/pandit-portal`
| Method | Path | Description | Auth |
|--------|------|-------------|------|
| GET | `/profile` | Get own provider profile | PROVIDER |
| PATCH | `/profile` | Update own profile | PROVIDER |
| GET | `/my-services` | List own service offerings | PROVIDER |
| POST | `/my-services` | Add a service offering | PROVIDER |
| PATCH | `/my-services/:id` | Update service offering | PROVIDER |
| DELETE | `/my-services/:id` | Remove service offering | PROVIDER |
| GET | `/service-areas` | List service areas | PROVIDER |
| POST | `/service-areas` | Add service area | PROVIDER |
| GET | `/availability` | Get availability schedule | PROVIDER |
| PUT | `/availability` | Update availability | PROVIDER |
| POST | `/availability/block` | Block a date range | PROVIDER |
| GET | `/bookings` | List bookings (tab: upcoming/past/requests) | PROVIDER |
| GET | `/bookings/:id` | Get single booking | PROVIDER |
| **PATCH** | **`/bookings/:id/respond`** | **Accept or Decline a booking** | PROVIDER |
| GET | `/earnings` | Earnings KPIs and payment history | PROVIDER |
| PATCH | `/submit` | Submit profile for verification | PROVIDER |

### Admin  `/api/admin`
| Method | Path | Description | Auth |
|--------|------|-------------|------|
| GET | `/dashboard` | KPIs, trends, recent activity | ADMIN |
| GET | `/users` | List all users with filters | ADMIN |
| GET | `/users/:id` | User detail + booking/request history | ADMIN |
| PATCH | `/users/:id/status` | Activate / suspend user | ADMIN |
| GET | `/providers` | List providers with filters | ADMIN |
| GET | `/providers/:id` | Provider detail + bookings + reviews | ADMIN |
| PATCH | `/providers/:id/verify` | Run verification check | ADMIN |
| PATCH | `/providers/:id/status` | Activate / suspend provider | ADMIN |
| GET | `/bookings` | All bookings with full filters | ADMIN |
| GET | `/bookings/:id` | Booking detail + audit trail | ADMIN |
| GET | `/service-requests` | All service requests | ADMIN |
| GET | `/reviews` | All reviews | ADMIN |
| PATCH | `/reviews/:id/status` | Publish / reject review | ADMIN |

### Payments  `/api/payments`
| Method | Path | Description | Auth |
|--------|------|-------------|------|
| POST | `/` | Create a payment for a booking | ✓ |
| PATCH | `/:id/confirm` | Confirm (simulate gateway callback) | ✓ |
| GET | `/:id` | Get payment status | ✓ |

### Notifications  `/api/notifications`
| Method | Path | Description | Auth |
|--------|------|-------------|------|
| GET | `/` | List own notifications | ✓ |
| PATCH | `/:id/read` | Mark as read | ✓ |
| PATCH | `/read-all` | Mark all as read | ✓ |

### Geo  `/api/geo`
| Method | Path | Description | Auth |
|--------|------|-------------|------|
| GET | `/countries` | List countries | — |
| GET | `/states` | List states (filter by countryId) | — |
| GET | `/cities` | List cities (filter by stateId) | — |
| GET | `/areas` | List areas (filter by cityId) | — |

---

## 10. Booking Status State Machine 🔧

```
                    ┌──────────────────────────────┐
                    │  Customer creates booking via │
                    │  POST /api/bookings           │
                    └──────────────┬───────────────┘
                                   │
                                   ▼
                            ┌─────────────┐
                            │   PENDING   │  ◄── Initial state
                            └──────┬──────┘
                                   │
                 ┌─────────────────┼──────────────────────┐
                 │                 │                      │
   Pandit ACCEPTs│     Pandit DECLINEs or        Admin / Customer
                 ▼     Customer cancels                    │
         ┌────────────┐           │                       │
         │ CONFIRMED  │           ▼                       │
         └──────┬─────┘   ┌─────────────┐                 │
                │         │  CANCELLED  │◄────────────────┘
     Ceremony   │         └─────────────┘
     begins     ▼
         ┌─────────────┐
         │ IN_PROGRESS │
         └──────┬──────┘
                │
      ┌─────────┴───────────┐
      │                     │
      ▼                     ▼
┌───────────┐         ┌──────────┐
│ COMPLETED │         │ DISPUTED │
└───────────┘         └──────────┘


Valid Transitions (enforced in /api/bookings/:id/status):
  PENDING     → CONFIRMED  (pandit accepts via /respond)
  PENDING     → CANCELLED  (pandit declines, customer cancels)
  CONFIRMED   → IN_PROGRESS
  CONFIRMED   → CANCELLED
  IN_PROGRESS → COMPLETED
  IN_PROGRESS → DISPUTED
```

---

## 11. Frontend Page Map 🔧

```
/ (Home)
├─ /browse             — Browse services by category
├─ /search             — Search pandits
├─ /pandits            — All pandits listing
├─ /pandit/:id         — Individual pandit profile
├─ /service/:id        — Service detail page
├─ /tell-us            — Service request wizard
├─ /book/:id           — Booking confirmation (3-step wizard)
└─ /my-bookings        — Customer booking tracker (NEW)

/pandit-portal         — Protected: PROVIDER role
├─ /pandit-portal/login
├─ /pandit-portal/become
├─ /pandit-portal (index)     — Dashboard with KPIs
├─ /pandit-portal/onboarding  — First-time setup wizard
├─ /pandit-portal/profile     — Edit profile
├─ /pandit-portal/services    — Manage services offered
├─ /pandit-portal/service-areas — Coverage areas
├─ /pandit-portal/availability — Working hours & blocks
├─ /pandit-portal/requests    — Incoming booking requests (Accept/Decline)
├─ /pandit-portal/bookings    — My bookings (upcoming + past)
├─ /pandit-portal/earnings    — Revenue dashboard
├─ /pandit-portal/reviews     — My reviews
├─ /pandit-portal/verification — Document submission status
└─ /pandit-portal/notifications — In-app notifications

/admin                 — Protected: ADMIN role
├─ /admin (index)      — Dashboard
├─ /admin/providers    — Providers management
├─ /admin/users        — Users management
├─ /admin/bookings     — All bookings
├─ /admin/requests     — Service requests
├─ /admin/reviews      — Reviews moderation
├─ /admin/locations    — Geo data management
├─ /admin/services     — Services & categories
└─ /admin/audit        — Full audit log browser
```

---

## 12. Database Models Reference 🔧

### User
Stores all platform accounts. `userType` can be `CUSTOMER`, `PROVIDER`, or `ADMIN`.

| Field | Type | Notes |
|-------|------|-------|
| `contact.email` | String | Unique login identifier |
| `contact.phone` | String | |
| `profile.firstName/lastName` | String | |
| `userType` | Enum | CUSTOMER / PROVIDER / ADMIN |
| `status` | Enum | ACTIVE / SUSPENDED / PENDING |
| `passwordHash` | String | bcrypt hash, never returned in API |

### Provider
Extended profile for PROVIDER users. One-to-one with User via `userId`.

| Field | Type | Notes |
|-------|------|-------|
| `displayName` | String | Public name |
| `status` | Enum | ACTIVE / INACTIVE / PENDING_VERIFICATION / SUSPENDED |
| `verificationStatus` | Enum | UNVERIFIED / PARTIAL / VERIFIED |
| `verifications[]` | Array | Per-type checks: IDENTITY, PHONE, ADDRESS, CREDENTIAL, BACKGROUND |
| `serviceIds[]` | ObjectId[] | Services this pandit performs |
| `location.city/state` | String | Primary location |
| `pricing.startingFrom` | Number | Display price |
| `bookingSummary.total/completed` | Number | Booking counts |
| `ratingSummary.average/count` | Number | Aggregated from reviews |
| `media[]` | Array | Photos/videos |
| `languages[]` | String[] | e.g. ['Hindi', 'Marathi'] |

### Booking ← Core entity
| Field | Type | Notes |
|-------|------|-------|
| `customerId` | ObjectId → User | Who booked |
| `primaryProviderId` | ObjectId → Provider | Lead pandit |
| `serviceId` | ObjectId → Service | Ceremony type |
| `status` | Enum | DRAFT / PENDING / CONFIRMED / IN_PROGRESS / COMPLETED / CANCELLED / DISPUTED |
| `event.date` | Date | Ceremony date |
| `event.location` | Object | Address + geo coordinates |
| `pricingSnapshot` | Object | Locked-in pricing at booking time |
| `customerDetails` | Object | Name, phone, address, notes |
| `providers[]` | Array | Multi-pandit support; each has role + status |
| `paymentId` | ObjectId → Payment | |
| `cancellation` | Object | reason, initiator, cancelledAt |

### Payment
| Field | Type | Notes |
|-------|------|-------|
| `bookingId` | ObjectId → Booking | |
| `amount` | Number | INR |
| `method` | Enum | CASH / UPI / CARD / NET_BANKING |
| `status` | Enum | PENDING / PAID / FAILED / REFUNDED |
| `payout.status` | Enum | PENDING / PROCESSED | Provider payout tracking |

### Notification
| Field | Type | Notes |
|-------|------|-------|
| `userId` | ObjectId → User | Recipient |
| `type` | Enum | BOOKING_CONFIRMED, BOOKING_CANCELLED, PAYMENT_RECEIVED, etc. |
| `title/body` | String | Display content |
| `refType/refId` | Polymorphic | e.g. { refType: 'Booking', refId: xxx } |
| `isRead` | Boolean | |

### AuditLog
Immutable log of every significant platform action.

| Field | Notes |
|-------|-------|
| `entityType` | 'Booking', 'Provider', 'User', etc. |
| `entityId` | The document that changed |
| `action` | e.g. PROVIDER_ACCEPTED, STATUS_CHANGED, VERIFICATION_PASSED |
| `actorId / actorType` | Who did it (USER or ADMIN) |
| `before / after` | JSON snapshot of changed fields |

---

## 13. Authentication & Security 🔧

**JWT-based authentication:**
- On login, server returns a signed JWT (HS256) containing `{ id, userType }`.
- Token is stored in `localStorage` on the client under key `pj_token`.
- Every API request attaches `Authorization: Bearer <token>`.
- Server middleware (`auth.js`) verifies the token on each request.

**Route guards:**
- `authRequired` — any valid token.
- `adminRequired` — token must have `userType === 'ADMIN'`.
- Pandit portal routes check the user is a PROVIDER and derives the provider identity from the token — never from request body.

**Password security:**
- Stored as bcrypt hash (10 rounds). Never returned in any API response.

**CORS:**
- Configured via `CORS_ORIGIN` environment variable.
- Supports Vercel preview deployments automatically.

---

## 14. Deployment & Infrastructure

```
┌─────────────────────────────────────────────────────┐
│                   PRODUCTION SETUP                  │
│                                                     │
│  Vercel (Frontend)                                  │
│  ┌───────────────────────────────────────────────┐  │
│  │  Static React SPA built with Vite            │  │
│  │  VITE_API_URL=https://your-backend.com/api   │  │
│  │  CDN: global edge network                    │  │
│  └───────────────────────────────────────────────┘  │
│            │ API calls over HTTPS                   │
│            ▼                                        │
│  Node.js Server (Render / Railway / VPS)           │
│  ┌───────────────────────────────────────────────┐  │
│  │  Express on PORT 5001 (or $PORT)             │  │
│  │  NODE_ENV=production                         │  │
│  │  JWT_SECRET=<secret>                         │  │
│  │  CORS_ORIGIN=https://find-mu-pandit.vercel.app│  │
│  └───────────────────────────────────────────────┘  │
│            │ mongoose connection string             │
│            ▼                                        │
│  MongoDB Atlas (M0 Free / M10+ Production)         │
│  ┌───────────────────────────────────────────────┐  │
│  │  MONGO_URI=mongodb+srv://...@atlas.mongodb.net│  │
│  └───────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────┘
```

---

## 15. Environment Variables 🔧

### Backend (`server/.env`)
| Variable | Required | Example | Description |
|----------|----------|---------|-------------|
| `MONGO_URI` | ✅ | `mongodb+srv://user:pass@cluster.mongodb.net/panditji` | MongoDB Atlas connection string |
| `JWT_SECRET` | ✅ | `supersecretkey` | Secret for signing JWTs |
| `PORT` | — | `5001` | Server port (default 5001) |
| `NODE_ENV` | — | `production` | Enables prod error handling |
| `CORS_ORIGIN` | — | `https://find-mu-pandit.vercel.app` | Allowed origin(s), comma-separated |

### Frontend (root `.env.development.local` / `.env.production`)
| Variable | Required | Example | Description |
|----------|----------|---------|-------------|
| `VITE_API_URL` | ✅ | `http://localhost:5001/api` | Base URL for backend API |

---

## 16. Seed Data & Local Setup 🔧

### Prerequisites
- Node.js 18+
- MongoDB Atlas URI (or local MongoDB)

### Run Locally

```bash
# 1. Clone and install frontend deps
cd find-MU-PANDIT
npm install

# 2. Install backend deps
cd server
npm install

# 3. Configure backend environment
cp server/.env.example server/.env
# Edit server/.env: set MONGO_URI, JWT_SECRET

# 4. Seed the database
cd server
npm run seed          # Base seed: categories, services, users, providers
npm run seed:mh       # Maharashtra geo data (cities, areas)
npm run seed:reviews  # Sample reviews for providers

# 5. Start backend (in one terminal)
cd server
npm run dev           # nodemon server.js on port 5001

# 6. Start frontend (in another terminal)
cd find-MU-PANDIT
npm run dev           # Vite dev server on port 5173
```

### Default Seeded Accounts
After running `npm run seed`, the following test accounts are available:

| Role | Email | Password |
|------|-------|----------|
| Admin | `admin@panditji.com` | `Admin@1234` |
| Customer | `customer@test.com` | `Test@1234` |
| Provider | `pandit@test.com` | `Test@1234` |

---

## 17. Known Limitations & Roadmap

### Current Limitations
| Area | Issue |
|------|-------|
| Payment | Only CASH is live. UPI/Card/Net Banking show "Coming Soon". |
| Notifications | In-app only; no SMS or email dispatch yet. |
| Real-time | No WebSocket/SSE — customers must refresh to see status updates. |
| Multi-pandit | Schema supports multiple pandits per booking but UI only books 1 primary. |
| AI Assistant | PanditJi AI feature is scaffolded but depends on external AI API key. |
| Reviews | Can only be submitted post-booking; no flow in the UI yet from My Bookings. |
| Admin write | Admin bookings view is read-only — no admin-level status override in UI. |

### Suggested Roadmap
1. **SMS / Email notifications** — Integrate Twilio or SendGrid to notify customers on booking events.
2. **Real-time updates** — Use Socket.io or Server-Sent Events so the My Bookings page updates without a refresh.
3. **UPI payment gateway** — Integrate Razorpay for real payment processing.
4. **Review from My Bookings** — Add a "Leave Review" button on completed bookings.
5. **Calendar view for pandits** — Replace the table in PanditBookings with a month calendar.
6. **Admin booking actions** — Allow admin to manually confirm/cancel bookings from the UI.
7. **Push notifications** — Service Worker + FCM for mobile-like alerts.
8. **Pandit mobile app** — React Native app for pandits to get push alerts on new requests.

---

*Documentation last updated: October 2026*  
*Project: PanditJi — find-MU-PANDIT*

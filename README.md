<div align="center">

# 🪔 PanditJi — Find Your Pandit

**The transparent marketplace that converts a real-world ceremony need into a bookable religious service.**

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](./LICENSE)
[![PRs Welcome](https://img.shields.io/badge/PRs-welcome-brightgreen.svg)](./CONTRIBUTING.md)
[![Node.js](https://img.shields.io/badge/Node.js-18+-green.svg)](https://nodejs.org)
[![React](https://img.shields.io/badge/React-18-blue.svg)](https://react.dev)
[![MongoDB](https://img.shields.io/badge/MongoDB-Atlas-green.svg)](https://www.mongodb.com/atlas)

[Live Demo](#) · [Report a Bug](https://github.com/Lahu19/panditji/issues) · [Request a Feature](https://github.com/Lahu19/panditji/issues) · [Contribute](#contributing)

</div>

---

## 🕉️ The Story / Inspiration

> *"Bhai, next Sunday ghar me shift ho raha hu. Kuch Puja karwani hai. Marathi bolne wala Pandit chahiye aur samagri bhi wahi leke aaye."*

This is what most people actually say when they need a Puja. They don't know whether it's called Griha Pravesh, Vastu Puja, or Ganesh Puja. They just know they're moving into a new home and something auspicious should happen.

The problem is — every existing solution forces the user to already know what they need, browse a flat directory, call a phone number, negotiate in private, and hope for the best. There's no transparency in pricing, no verified track record, no way to know if the person will show up.

**PanditJi was born out of that frustration.**

The idea is simple but important:

> The platform should convert a human request into a structured, bookable service — even when the person doesn't know the name of the ceremony.

And once you find the right Pandit, everything — price, availability, past events, reviews, verification status, languages, Samagri options — should be laid out completely transparently. No hidden fees. No surprises.

---

## 🚨 The Problem We're Solving

| Problem | How PanditJi addresses it |
|---|---|
| Users don't know the exact Puja name | Natural language → intent → service identification |
| Prices are negotiated privately | Full price breakdown shown upfront |
| No way to verify a Pandit's experience | Verified event history, past videos, credential badges |
| Availability is unknown until you call | Live availability calendar on every profile |
| No structured match between need and provider | Requirement-based matching engine (hard + soft filters) |
| Platform designed only for tech-savvy users | Three entry points: Search, Browse, and "Tell us what you need" |

---

## ✨ Key Features

- **💬 Natural Language Entry** — type "I'm moving next Sunday and want a house Puja" and the platform understands you
- **🛕 Browse by Category** — Home, Wedding, Family, Festival, Havan, Corporate, Custom
- **🔎 Traditional Search** — predictable, no AI, just fast results
- **🧠 PanditJi AI** — spiritual assistant powered by a secure backend proxy (Gemini under the hood, branded as `panditji-ai`)
- **🎥 Video Portfolios** — see real past events performed by the Pandit
- **✅ Transparent Matching** — shows exactly why a Pandit matched your requirement (6/6 criteria met)
- **📅 Live Availability** — real-time calendar, no fake slots
- **💰 Full Price Transparency** — service fee + Samagri + travel + platform fee, all shown
- **🛡️ Verification Badges** — phone, identity, credentials, event history
- **⭐ Structured Reviews** — punctuality, communication, service, professionalism rated separately
- **🌍 NRI Booking** — customer location ≠ event location
- **🔁 Rebook** — one tap to rebook a Pandit you've used before

---

## 🗺️ Data Flow Diagram

```
                         USER
                          │
             ┌────────────┼────────────┐
             ▼            ▼            ▼
          SEARCH      NATURAL       BROWSE
         (instant)   LANGUAGE     (category)
             │        (AI/NLP)        │
             └────────────┬───────────┘
                          ▼
               ┌─────────────────────┐
               │  INTENT UNDERSTAND  │
               │  Category detect    │
               │  Service identify   │
               └─────────────────────┘
                          ▼
               ┌─────────────────────┐
               │ REQUIREMENT         │
               │ COLLECTION          │
               │ (ask only missing)  │
               └─────────────────────┘
                          ▼
               ┌─────────────────────────┐
               │  Structured Request     │
               ├─────────────────────────┤
               │  Service · Date · Time  │
               │  Location · Language    │
               │  Samagri · Budget       │
               │  Provider count         │
               └─────────────────────────┘
                          ▼
               ┌─────────────────────┐
               │  MATCHING ENGINE    │
               ├─────────────────────┤
               │  Hard filters:      │
               │  Service supported? │
               │  Available?         │
               │  In service area?   │
               ├─────────────────────┤
               │  Soft preferences:  │
               │  Language / price   │
               │  Samagri / reviews  │
               └─────────────────────┘
                          ▼
               ┌─────────────────────┐
               │  PROVIDER RESULTS   │
               │  + why they matched │
               └─────────────────────┘
                          ▼
               USER SELECTS → BOOK
                          ▼
                       PAYMENT
                          ▼
                    EVENT / PUJA
                          ▼
                 COMPLETION + REVIEW
                          ▼
                   PLATFORM HISTORY
```

---

## 🔄 PanditJi AI — Secure Proxy Architecture

The AI assistant is exposed as a branded endpoint — the browser never knows the underlying model.

```
Browser
  │
  │  POST /api/panditji-ai/chat
  │  { prompt: "Which puja for Diwali?" }
  ▼
Express Server  ──────────────────►  Gemini API
  │              (server-side,           │
  │               key hidden)            │
  │  ◄──────────────────────────────────
  │  { answer: "...", model: "panditji-ai" }
  ▼
Browser sees only "panditji-ai"
```

---

## 🗃️ Database Architecture

The platform is modelled as a **generic religious-services marketplace**, not just a Pandit directory. The backbone:

```
ServiceRequest ──► Match ──► Booking ──► Payment ──► Review
```

### Domain Breakdown

| Domain | Collections |
|---|---|
| **Identity** | users, organizations |
| **Catalog** | categories, services, service_requirements |
| **Providers** | providers, provider_services, provider_availability, provider_media |
| **Discovery** | service_requests, matches |
| **Booking** | bookings, booking_items |
| **Finance** | payments, invoices |
| **Trust** | reviews, conversations, notifications |
| **Platform** | audit_logs |

### Category → Service → Requirement chain

```
Category (e.g. Home & Property)
    │
    ▼
Service (e.g. Griha Pravesh)
    │
    ▼
Requirements (date, time, location, language, samagri, budget)
    │
    ▼
Provider matching
```

---

## 🏗️ Tech Stack

| Layer | Technology |
|---|---|
| **Frontend** | React 18, Vite, Framer Motion |
| **Styling** | Pure CSS variables, custom design system |
| **Backend** | Node.js, Express.js |
| **Database** | MongoDB Atlas (Mongoose ODM) |
| **Auth** | JWT (jsonwebtoken + bcryptjs) |
| **AI Proxy** | Gemini Flash via secure server-side proxy |
| **Deployment** | Vercel (frontend) + Railway/Render (backend) |

---

## 📂 Project Structure

```
panditji/
├── src/                        # React frontend
│   ├── api/                    # API helpers (one file per domain)
│   │   └── ai.js               # PanditJi AI helper
│   ├── components/             # Shared UI components
│   ├── context/                # React context (Auth)
│   ├── pages/                  # Page components
│   │   ├── Home.jsx            # Landing + entry points
│   │   ├── TellUs.jsx          # Natural language chat flow
│   │   ├── Browse.jsx          # Category browser
│   │   ├── Search.jsx          # Traditional search
│   │   ├── PanditProfile.jsx   # Full provider profile
│   │   ├── ServiceDetail.jsx   # Service + requirement flow
│   │   └── BookingConfirm.jsx  # Booking confirmation
│   └── data/                   # Static seed/demo data
│
├── server/                     # Express backend
│   ├── models/                 # Mongoose models
│   ├── routes/                 # Route handlers
│   │   └── ai.js               # /api/panditji-ai proxy
│   ├── middleware/             # Auth middleware
│   ├── db.js                   # MongoDB connection
│   ├── server.js               # App entry point
│   └── seed.js                 # Database seeder
│
├── public/                     # Static assets
└── .kiro/                      # Project planning docs
```

---

## 🚀 Getting Started

### Prerequisites

- Node.js 18+
- A [MongoDB Atlas](https://www.mongodb.com/atlas) cluster (free tier works)
- A [Google AI Studio](https://aistudio.google.com) API key for PanditJi AI

### 1. Clone the repo

```bash
git clone https://github.com/Lahu19/panditji.git
cd panditji
```

### 2. Install dependencies

```bash
# Frontend
npm install

# Backend
cd server && npm install
```

### 3. Configure environment

```bash
cp server/.env.example server/.env
```

Edit `server/.env`:

```env
MONGODB_URI=mongodb+srv://<user>:<password>@cluster0.xxx.mongodb.net/panditji
JWT_SECRET=your_strong_secret_here
PORT=5001
NODE_ENV=development
CORS_ORIGIN=http://localhost:5173
GEMINI_API_KEY=your_gemini_api_key_here
```

> ⚠️ Never commit `.env`. It's in `.gitignore`.

### 4. MongoDB Atlas — allow your IP

Go to **Atlas → Network Access → Add IP Address → Add Current IP**.

For dev convenience you can use `0.0.0.0/0` (allow all IPs).

### 5. Seed the database (optional)

```bash
cd server && npm run seed
```

### 6. Run locally

```bash
# Terminal 1 — backend
cd server && npm run dev

# Terminal 2 — frontend
npm run dev
```

Frontend: `http://localhost:5173`  
Backend: `http://localhost:5001`

---

## 🌐 API Reference

### PanditJi AI

| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/api/panditji-ai/info` | Branding info (no key leaked) |
| `POST` | `/api/panditji-ai/chat` | Chat with PanditJi AI |

**Chat request body:**
```json
{
  "prompt": "Which puja should I do for Diwali?",
  "history": []
}
```

**Response:**
```json
{
  "answer": "For Diwali, Lakshmi Puja is the most...",
  "model": "panditji-ai",
  "finishReason": "STOP"
}
```

### Core Domains

| Prefix | Description |
|---|---|
| `/api/auth` | Register, login, token |
| `/api/providers` | Provider profiles |
| `/api/services` | Service catalog |
| `/api/categories` | Service categories |
| `/api/bookings` | Booking management |
| `/api/service-requests` | Natural language requests |
| `/api/matches` | Provider matching results |
| `/api/reviews` | Customer reviews |
| `/api/payments` | Payment records |
| `/api/notifications` | Notifications |
| `/api/conversations` | In-platform messaging |
| `/api/health` | Server health check |

---

## 🤝 Contributing

We're building something meaningful and we'd love your help. PanditJi is open to contributions of all kinds — code, design, documentation, translations, and ideas.

### Ways to contribute

- 🐛 **Bug reports** — open an [issue](https://github.com/Lahu19/panditji/issues)
- 💡 **Feature ideas** — open a [discussion](https://github.com/Lahu19/panditji/discussions)
- 🌐 **Translations** — Hindi, Marathi, Gujarati, Tamil, Telugu welcome
- 🎨 **Design** — UI/UX improvements, accessibility
- 🧪 **Tests** — unit tests, integration tests
- 📖 **Docs** — improve this README or add API docs

### How to contribute code

1. **Fork** the repository
2. **Create a branch** — `git checkout -b feature/your-feature-name`
3. **Make your changes** and commit with a clear message
4. **Push** — `git push origin feature/your-feature-name`
5. **Open a Pull Request** against `main`

### Good first issues

Look for issues tagged [`good first issue`](https://github.com/Lahu19/panditji/labels/good%20first%20issue) — these are smaller, well-scoped tasks perfect for getting familiar with the codebase.

### Code style

- Use the existing patterns — this project doesn't use a linter yet, so match the style you see
- Keep components focused and small
- Add JSDoc comments on API helpers
- Never commit secrets or `.env` files

---

## 🗺️ Roadmap

- [ ] Full availability calendar with real-time slot management
- [ ] Stripe / Razorpay payment integration
- [ ] SMS / WhatsApp notifications
- [ ] Provider mobile app (React Native)
- [ ] Multi-language support (Hindi, Marathi, Gujarati)
- [ ] NRI booking flow (customer ≠ event location)
- [ ] Corporate booking with invoice generation
- [ ] Verified credential upload for providers
- [ ] Admin dashboard
- [ ] PWA / offline support

---

## 📄 License

MIT License — see [LICENSE](./LICENSE) for details.

---

<div align="center">

Made with 🪔 for everyone who just wants to do the right Puja without the hassle.

**[⭐ Star this repo](https://github.com/Lahu19/panditji)** if you find it useful — it helps others discover the project.

</div>

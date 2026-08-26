# PawMart

PawMart is a pet marketplace web app — a one-stop platform for shopping pet products and (eventually) booking pet care services. This repository contains two independent projects: a React frontend and a Node.js/Express backend API backed by MongoDB Atlas.

> For AI coding assistants: see [CLAUDE.md](CLAUDE.md) for a machine-oriented summary of the codebase.

## Table of Contents

- [Project Status](#project-status)
- [Repository Structure](#repository-structure)
- [Tech Stack](#tech-stack)
- [Quick Start](#quick-start)
- [Documentation](#documentation)
- [Feature Overview](#feature-overview)
- [Development Notes](#development-notes)

## Project Status

This is an actively developed MVP. What's real vs. mocked, at a glance:

| Area | Status |
|---|---|
| Auth (register/login/session) | ✅ Wired to a real backend + database |
| Product marketplace (browse/search/filter) | ✅ Wired to a real backend + database |
| Cart | ✅ Wired to a real backend + database (requires login) |
| Checkout / orders | ✅ Wired to a real backend + database |
| Appointment booking | 🚧 Frontend UI only, local mock data, no backend |
| Smart care assistant | 🚧 Frontend UI only, local mock data, no backend |
| User / Vendor / Admin dashboards | 🚧 Frontend UI only, local mock data, no backend |

The backend is being built in phases; Phase 1 (auth, products, cart, orders) is complete. Appointments, vendor tooling, and admin approval workflows are planned for a later phase.

## Repository Structure

```
PawMart/
├── frontend/     # React + Vite single-page app        → frontend/README.md
├── backend/      # Express + MongoDB Atlas REST API     → backend/README.md
├── CLAUDE.md     # Codebase guide for AI coding assistants
└── .claude/      # Claude Code project configuration and reference skills
```

`frontend/` and `backend/` are independently managed Node projects (separate `package.json`, separate `node_modules`) — this is not an npm/yarn workspace. Run commands from inside each directory.

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | React 19, Vite, React Router, Tailwind CSS |
| Backend | Node.js, Express, Mongoose |
| Database | MongoDB Atlas |
| Auth | JWT + bcrypt |

See [frontend/README.md](frontend/README.md#tech-stack) and [backend/README.md](backend/README.md#tech-stack) for the full dependency breakdown.

## Quick Start

You need both projects running to use the app fully — the backend needs a MongoDB Atlas connection string first (see [backend/README.md](backend/README.md#setup--installation) if you don't have one yet).

**1. Backend** (in one terminal):

```bash
cd backend
npm install
cp .env.example .env    # fill in MONGODB_URI and JWT_SECRET
npm run seed              # populate the product catalog
npm run dev
```

**2. Frontend** (in another terminal):

```bash
cd frontend
npm install
npm run dev
```

Open **http://localhost:5173**. The frontend talks to the backend at `http://localhost:5000/api` by default — no extra config needed for local development.

## Documentation

| Document | Covers |
|---|---|
| [frontend/README.md](frontend/README.md) | Frontend setup, routes, state management, styling system, scripts |
| [backend/README.md](backend/README.md) | Backend setup, environment variables, full API reference, data models, deployment notes |
| [CLAUDE.md](CLAUDE.md) | High-level architecture notes for AI coding assistants working in this repo |

## Feature Overview

- Browse and search a product marketplace with category filtering
- Register/log in with a persisted session
- Add products to a server-side cart (requires an account)
- Check out with a shipping address and simulated payment method, producing a real order with server-computed totals and stock decrement
- Responsive, accessible UI with a working mobile nav, consistent component styling, and keyboard-navigable controls

## Development Notes

- No automated test suite exists in either project yet.
- There's no root-level build/lint/test command — run `npm run <script>` from inside `frontend/` or `backend/` respectively.
- Secrets (`backend/.env`) are gitignored; only `.env.example` templates are committed. Never commit a real `MONGODB_URI` or `JWT_SECRET`.
- `.claude/skills/` contains reference material (API design conventions, backend best practices) used to keep the backend's conventions consistent — see those files if you're extending the API.

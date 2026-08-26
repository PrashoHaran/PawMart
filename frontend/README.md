# PawMart Frontend

React single-page app for [PawMart](../README.md), a pet marketplace app. Built with React 19, Vite, React Router, and Tailwind CSS.

## Table of Contents

- [Overview](#overview)
- [Key Features](#key-features)
- [Tech Stack](#tech-stack)
- [Project Structure](#project-structure)
- [Setup & Installation](#setup--installation)
- [Environment Variables](#environment-variables)
- [Running the Project](#running-the-project)
- [Routes](#routes)
- [State Management](#state-management)
- [Styling System](#styling-system)
- [Scripts](#scripts)
- [Backend Integration Notes](#backend-integration-notes)
- [Troubleshooting](#troubleshooting)

## Overview

The frontend is a plain-JavaScript (no TypeScript) React app built with Vite. It's a single-page app with client-side routing (`react-router-dom`) — one `Navbar`/`Footer` layout wraps every page. Authentication, the product catalog, cart, and checkout are wired to the real [backend API](../backend/README.md); a few pages (Smart Assistant, Appointment Booking, and the User/Vendor/Admin dashboards) are still self-contained UI mockups running on local hardcoded data, pending their own backend phase.

## Key Features

- Browse and search the product marketplace with category filtering (debounced search, live against the API)
- User registration/login with a persisted session (JWT stored in `localStorage`, restored on page reload)
- Server-backed shopping cart (add/update/remove items) — cart actions require being logged in
- Checkout flow with a shipping/payment form and an order confirmation screen
- Responsive layout with a working mobile navigation menu
- Accessible interactive elements (`aria-label`/`aria-pressed`/`aria-current` throughout, keyboard-focusable controls)
- A small shared component-class design system (buttons, badges, alerts, cards) layered on Tailwind

## Tech Stack

| Category | Technology |
|---|---|
| Framework | [React](https://react.dev/) 19 |
| Build tool | [Vite](https://vite.dev/) 8 |
| Routing | [react-router-dom](https://reactrouter.com/) 7 (`BrowserRouter`) |
| Styling | [Tailwind CSS](https://tailwindcss.com/) 3 |
| Icons | [lucide-react](https://lucide.dev/) |
| Linting | [oxlint](https://oxc.rs/docs/guide/usage/linter.html) |

No TypeScript — `@types/*` packages are dev-only, for editor autocomplete. Full dependency list: [package.json](package.json).

## Project Structure

```
frontend/
├── index.html
├── src/
│   ├── main.jsx                # Entry point — mounts <App/> wrapped in AuthProvider > CartProvider
│   ├── App.jsx                  # Route definitions and the shared Navbar/Footer layout
│   ├── index.css                 # Tailwind directives + shared component classes (@layer components)
│   ├── components/
│   │   ├── Navbar.jsx            # Top nav — links, cart badge, auth-aware sign in/out, mobile menu
│   │   ├── Footer.jsx
│   │   └── QuantityStepper.jsx    # Reusable +/- quantity control (used in Cart and Product Detail)
│   ├── context/
│   │   ├── AuthContext.jsx        # User/session state, login/register/logout, session restore on load
│   │   └── CartContext.jsx        # Server-backed cart state and cart/checkout API calls
│   ├── lib/
│   │   ├── api.js                 # Fetch wrapper: base URL, auth header, error envelope parsing, 401 handling
│   │   └── format.js               # formatPriceCents() — cents → display string
│   └── pages/                     # One component per route (see Routes table below)
├── public/
├── .env.example
├── tailwind.config.js
├── vite.config.js
└── .oxlintrc.json
```

## Setup & Installation

**Prerequisites:** Node.js (a recent LTS version is recommended) and npm. The [backend](../backend/README.md) should be running (or at least reachable) for auth, marketplace, cart, and checkout to work.

```bash
cd frontend
npm install
```

No `.env` file is required to get started — `VITE_API_URL` falls back to `http://localhost:5000/api` if unset, which matches the backend's default port. Copy `.env.example` to `.env` only if you need to point at a different API URL.

## Environment Variables

| Variable | Required | Default | Description |
|---|---|---|---|
| `VITE_API_URL` | No | `http://localhost:5000/api` | Base URL the frontend calls for all API requests |

Vite only exposes env vars prefixed with `VITE_` to client code (via `import.meta.env`). See [`.env.example`](.env.example).

## Running the Project

```bash
npm run dev       # start the Vite dev server (default: http://localhost:5173) with HMR
```

For the app to be fully functional (login, marketplace, cart, checkout), also start the backend in a separate terminal — see the [backend README](../backend/README.md#running-the-project).

```bash
npm run build      # production build, output to dist/
npm run preview     # serve the production build locally to sanity-check it
```

## Routes

Declared in [`App.jsx`](src/App.jsx):

| Path | Page Component | Notes |
|---|---|---|
| `/` | `Home.jsx` | Marketing landing page |
| `/login` | `Login.jsx` | Combined sign-in/sign-up form, wired to the real auth API |
| `/marketplace` | `Marketplace.jsx` | Product listing — fetched from the API, category filter + debounced search |
| `/product/:id` | `ProductDetail.jsx` | Single product — fetched from the API |
| `/cart` | `Cart.jsx` | Cart contents, shipping/payment form, checkout |
| `/dashboard` | `UserDashboard.jsx` | ⚠️ Local mock data — no backend yet |
| `/vendor-dashboard` | `VendorDashboard.jsx` | ⚠️ Local mock data — no backend yet |
| `/assistant` | `SmartAssistant.jsx` | ⚠️ Local mock data — no backend yet |
| `/book-appointment` | `AppointmentBooking.jsx` | ⚠️ Local mock data — no backend yet |
| `/admin-dashboard` | `AdminDashboard.jsx` | ⚠️ Local mock data — no backend yet |

There are no route guards — every path is reachable regardless of login state. Pages that need auth (adding to cart, checkout) redirect to `/login` at the point of the action, not at the route level.

## State Management

No external state library (no Redux/Zustand/etc.) — just React Context:

- **`AuthContext`** (`src/context/AuthContext.jsx`) — holds `user`, `token`, and a `restoring` flag for the initial session-restore check. On mount, if a token exists in `localStorage`, it's validated against `GET /api/auth/me`; on success the session is restored, on failure it's cleared. Exposes `register()`, `login()`, `logout()`.
- **`CartContext`** (`src/context/CartContext.jsx`) — holds the current cart (`items`, `subtotalCents`, derived `itemCount`) and talks to `/api/cart` and `/api/orders`. Requires a valid `AuthContext` session; cart state resets to empty on logout.

Both are provided once in `main.jsx` (`AuthProvider` wraps `CartProvider` wraps `App`) and consumed via the `useAuth()`/`useCart()` hooks.

Pages that fetch their own data (Marketplace, ProductDetail) do so directly with `useEffect` + the `apiRequest()` helper from `src/lib/api.js`, using `AbortController` to cancel stale requests when filters change quickly.

## Styling System

Tailwind config ([`tailwind.config.js`](tailwind.config.js)) defines the brand palette and typography:

| Token | Value |
|---|---|
| `primary` | Teal `#0D9488` (`light` `#14B8A6`, `dark` `#0F766E`) |
| `secondary` | Amber `#F59E0B` (`light` `#FBBF24`, `dark` `#D97706`) |
| `font-sans` | Inter |
| `font-heading` | Outfit |

Reusable component classes are defined once via `@layer components` in [`index.css`](src/index.css) — prefer these over ad hoc utility strings:

| Class | Use |
|---|---|
| `.btn-primary` / `.btn-secondary` / `.btn-outline` | Buttons |
| `.btn-toggle` / `.btn-toggle-active` | Toggle-style selection buttons (e.g. time slots) |
| `.input-field` | Text inputs/selects/textareas |
| `.badge` + `.badge-success` / `.badge-warning` / `.badge-info` / `.badge-danger` / `.badge-neutral` | Status pills |
| `.alert` + `.alert-warning` / `.alert-info` / `.alert-success` | Inline banners (errors, notices) |
| `.stat-card` | Dashboard metric cards |
| `.step-circle` / `.step-circle-active` | Numbered step indicators |
| `.glass-panel` | Frosted-glass card background |

## Scripts

| Command | Description |
|---|---|
| `npm run dev` | Start the Vite dev server with HMR |
| `npm run build` | Production build to `dist/` |
| `npm run preview` | Serve the production build locally |
| `npm run lint` | Run oxlint (`react` + `oxc` plugin rules, `react/rules-of-hooks` as an error) |

There is no test suite configured in this project.

## Backend Integration Notes

- All API calls go through `apiRequest()` in `src/lib/api.js`, which prefixes `VITE_API_URL`, attaches `Authorization: Bearer <token>` when a token is passed, and normalizes the backend's `{ data }` / `{ error }` response envelope into either a return value or a thrown `ApiClientError`.
- A 401 response from any request triggers a module-level "unauthorized" callback (registered by `AuthContext`) that clears the local session — there's no forced redirect, the UI just re-renders in its logged-out state.
- **Adding to cart requires being logged in.** The backend's cart is entirely server-side per user (no anonymous/guest cart), so clicking "Add to Cart" while logged out sends the user to `/login` instead of silently failing or storing anything locally.
- Money values from the API are integer cents (`priceCents`, `subtotalCents`, etc.) — always pass them through `formatPriceCents()` from `src/lib/format.js` before displaying.

## Troubleshooting

| Problem | Likely Cause / Fix |
|---|---|
| Marketplace/Product pages show a loading state forever or an error banner | Backend isn't running, or `VITE_API_URL` doesn't point at it — check the browser console/network tab |
| CORS error in the browser console | The backend's `FRONTEND_URL` env var doesn't match the origin Vite is actually serving from (default `http://localhost:5173`) |
| Logged in, but "Add to Cart" still redirects to `/login` | The stored token expired (1-day lifetime) or was invalidated server-side — log in again |
| Styles look broken / Tailwind classes not applying | Make sure `npm install` completed and you're running `npm run dev` (not opening `index.html` directly) |
| Changes to `index.css` component classes don't show up | Confirm the class name is actually used in the component — Tailwind's JIT only generates CSS for classes it finds referenced in `content` (see `tailwind.config.js`) |

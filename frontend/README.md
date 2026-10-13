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

The frontend is a plain-JavaScript (no TypeScript) React app built with Vite. It's a single-page app with client-side routing (`react-router-dom`) — one `Navbar`/`Footer` layout wraps every page. Every page is wired to the real [backend API](../backend/README.md); there are no mock-data pages left.

## Key Features

- Marketplace with category filtering and debounced search; product pages with verified-purchase reviews and star ratings
- Registration/login (email/password or Google's "Continue with Google" button) with a persisted session (JWT in `localStorage`, restored on reload); role-aware navbar (Vendor Portal and Admin links only for those roles)
- Server-backed cart and checkout with a simulated card form (formatted inputs, per-field errors, test cards) or cash on delivery
- User dashboard: overview with vaccine alerts, pets and health records (vaccination tracker), appointments with cancellation, order tracking with a progress indicator and cancellation
- Appointment booking that shows each provider's open days and only free time slots
- Smart Pet Care Assistant with breed suggestions, saved-pet prefill and a care plan (calories, weight gauge, breed care, vet watch-outs, product picks, sources)
- Vendor dashboard (products, orders) and a Provider Portal for vets/groomers (services, bookings, stats)
- Admin hub: platform alerts, orders, users, vendor verification, product moderation, appointments and analytics reports with charts
- Cloudinary image uploads with preview (falls back to an image-URL field when uploads aren't configured)
- Responsive layout (mobile menus and view switchers) and accessible controls (`aria-*` attributes, keyboard-focusable elements)
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
│   ├── main.jsx                 # Entry point — mounts <App/> wrapped in AuthProvider > CartProvider
│   ├── App.jsx                  # Route definitions and the shared Navbar/Footer layout
│   ├── index.css                # Tailwind directives + shared component classes (@layer components)
│   ├── components/
│   │   ├── Navbar.jsx           # Top nav — role-aware links, cart badge, auth-aware sign in/out, mobile menu
│   │   ├── Footer.jsx
│   │   ├── QuantityStepper.jsx  # Reusable +/- quantity control
│   │   ├── ReviewSection.jsx    # Product reviews list, star picker and review form
│   │   ├── ImageUploadField.jsx # Cloudinary upload with preview (or URL fallback)
│   │   ├── GoogleSignInButton.jsx # Google's official sign-in button
│   │   ├── PayPalCheckout.jsx   # PayPal Smart Payment Buttons
│   │   ├── ProductForm.jsx      # Add/edit product modal (vendor dashboard and admin catalogue)
│   │   ├── dashboard/           # User dashboard tabs: pets, pet form, health panel, appointments, orders
│   │   ├── orders/              # Order status helpers, progress indicator, vendor/admin order panel
│   │   ├── provider/            # Provider Portal and service form
│   │   └── admin/               # Admin panels: users, applications, products, appointments, reports
│   ├── context/
│   │   ├── AuthContext.jsx      # User/session state, login/register/logout, session restore on load
│   │   └── CartContext.jsx      # Server-backed cart state and cart/checkout API calls
│   ├── lib/
│   │   ├── api.js               # Fetch wrapper: base URL, auth header, error envelope parsing, 401 handling
│   │   ├── format.js            # Prices (cents), calendar dates and ages
│   │   ├── image.js             # Broken-image fallback and Cloudinary resizing (optimizedImage)
│   │   ├── upload.js            # Signed direct uploads to Cloudinary
│   │   ├── googleAuth.js        # Loads Google Identity Services, sign-in config
│   │   └── paypal.js            # Loads the PayPal SDK, payment config
│   └── pages/                   # One component per route (see Routes table below)
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
| `/login` | `Login.jsx` | Combined sign-in/sign-up form, plus Continue with Google when configured |
| `/marketplace` | `Marketplace.jsx` | Product listing with category filter and debounced search |
| `/product/:id` | `ProductDetail.jsx` | Product details, reviews and review form |
| `/cart` | `Cart.jsx` | Cart, shipping details, simulated payment and checkout |
| `/dashboard` | `UserDashboard.jsx` | Overview, My Pets (health records), Appointments, Order History — tab kept in `?tab=` |
| `/vendor-application` | `VendorApplication.jsx` | Apply to become a retail vendor or service provider |
| `/vendor-dashboard` | `VendorDashboard.jsx` | Retail vendors: products and orders. Service providers: Provider Portal |
| `/assistant` | `SmartAssistant.jsx` | Smart Pet Care Assistant (works signed out; saved pets when signed in) |
| `/book-appointment` | `AppointmentBooking.jsx` | Service list with live slot availability |
| `/admin-dashboard` | `AdminDashboard.jsx` | Admin hub |

Access is checked inside the pages rather than with route guards: `/dashboard` redirects to `/login` when signed out, `/vendor-dashboard` sends non-vendors to `/vendor-application`, and `/admin-dashboard` shows an "Admin access required" message to non-admins. Actions that need an account (adding to cart, booking) redirect to `/login` at the point of the action. The API enforces every permission regardless.

## State Management

No external state library (no Redux/Zustand/etc.) — just React Context:

- **`AuthContext`** (`src/context/AuthContext.jsx`) — holds `user`, `token`, and a `restoring` flag for the initial session-restore check. On mount, if a token exists in `localStorage`, it's validated against `GET /api/auth/me`; on success the session is restored, on failure it's cleared. Exposes `register()`, `login()`, `logout()`.
- **`CartContext`** (`src/context/CartContext.jsx`) — holds the current cart (`items`, `subtotalCents`, derived `itemCount`) and talks to `/api/cart` and `/api/orders`. Requires a valid `AuthContext` session; cart state resets to empty on logout.

Both are provided once in `main.jsx` (`AuthProvider` wraps `CartProvider` wraps `App`) and consumed via the `useAuth()`/`useCart()` hooks.

Pages and panels fetch their own data directly with `useEffect` + the `apiRequest()` helper from `src/lib/api.js` (using `AbortController` or an "active" flag to ignore stale responses). Admin list panels share a small `usePagedList` hook for filters and pagination.

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
- Calendar dates (pet birthdays, vaccine dates) are stored as UTC midnight — display them with `formatDate()` (which formats in UTC) so they don't shift a day.
- Image uploads go straight from the browser to Cloudinary using a signature from `POST /api/uploads/signature`; display Cloudinary images through `optimizedImage(url, width)` to load a resized version.

## Troubleshooting

| Problem | Likely Cause / Fix |
|---|---|
| Marketplace/Product pages show a loading state forever or an error banner | Backend isn't running, or `VITE_API_URL` doesn't point at it — check the browser console/network tab |
| CORS error in the browser console | The backend's `FRONTEND_URL` env var doesn't match the origin Vite is actually serving from (default `http://localhost:5173`) |
| Logged in, but "Add to Cart" still redirects to `/login` | The stored token expired (1-day lifetime) or was invalidated server-side — log in again |
| Styles look broken / Tailwind classes not applying | Make sure `npm install` completed and you're running `npm run dev` (not opening `index.html` directly) |
| Changes to `index.css` component classes don't show up | Confirm the class name is actually used in the component — Tailwind's JIT only generates CSS for classes it finds referenced in `content` (see `tailwind.config.js`) |

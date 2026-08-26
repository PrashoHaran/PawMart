# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project overview

PawMart is a pet marketplace web app. This repo currently contains only the frontend — a static-data MVP (Phase 1 & 2) with no backend, no API, and no global state management. All 10 pages are self-contained React components that render hardcoded `DUMMY_*`/mock data arrays defined inline at the top of each page file.

## Commands

All commands run from `frontend/`:

```bash
cd frontend
npm run dev       # start Vite dev server with HMR
npm run build     # production build
npm run preview   # preview the production build
npm run lint      # oxlint
```

There is no test suite configured in this repo.

## Architecture

- **Stack**: React 19 + Vite 8, React Router v7 (`BrowserRouter`), Tailwind CSS 3, `lucide-react` for icons. Plain JSX, no TypeScript (only `@types/*` dev deps for editor support).
- **Routing**: all routes are declared flat in [App.jsx](frontend/src/App.jsx) — `Navbar` and `Footer` wrap every route via a shared layout `<div>`; there's no nested/layout routing.
- **Pages** (`frontend/src/pages/`) map 1:1 to routes: Home, Login, Marketplace, ProductDetail, UserDashboard, VendorDashboard, SmartAssistant, AppointmentBooking, Cart, AdminDashboard.
- **No shared state/data layer**: each page owns its own mock data (e.g. `DUMMY_PRODUCTS` in [Marketplace.jsx](frontend/src/pages/Marketplace.jsx)) and local `useState` only. There is no context, no API client, no `localStorage` persistence, and no auth guarding routes — e.g. the cart badge count in [Navbar.jsx](frontend/src/components/Navbar.jsx) is a hardcoded `2`, not derived from cart state. When wiring pages together (e.g. cart, auth), be aware nothing currently flows data between them.
- **Styling system**: Tailwind config in [tailwind.config.js](frontend/tailwind.config.js) defines the brand palette (`primary` teal `#0D9488`, `secondary` amber `#F59E0B`) and heading/sans font families. Reusable component classes (`.btn-primary`, `.btn-secondary`, `.btn-outline`, `.input-field`, `.glass-panel`) are defined once via `@layer components` in [index.css](frontend/src/index.css) — prefer these over ad hoc utility strings for buttons/inputs.
- **Lint**: oxlint config ([.oxlintrc.json](frontend/.oxlintrc.json)) enables the `react` and `oxc` plugins with `react/rules-of-hooks` as an error.

# PawMart

**Academic Submission: Group 17**  
**Team:** V. Prashoharan, Bashini Rashmika Vindyani, J.P. Inuka Sithanja Jayasinghe, D.S.N. Vitharana, B.R.G.S. Sandaruwan

PawMart is a pet marketplace web application designed as a one-stop platform for purchasing pet products and accessing pet care services. The system combines a customer-facing marketplace with vendor, service-provider and administrator dashboards, appointment booking, pet health records with vaccination reminders, and a rule-based Smart Pet Care Assistant.

This repository contains two independent projects:
- A React + Vite frontend
- A Node.js + Express backend API connected to MongoDB Atlas

---

## Table of Contents

- [Project Status](#project-status)
- [Repository Structure](#repository-structure)
- [Tech Stack](#tech-stack)
- [Current Features](#current-features)
- [Team Contributions](#team-contributions)
- [Quick Start](#quick-start)
- [Database](#database)
- [Development Notes](#development-notes)
- [Remaining Work](#remaining-work)
- [Documentation](#documentation)

---

## Project Status

PawMart is feature-complete against the original proposal and running end-to-end against MongoDB Atlas. Deployment and automated testing remain.

| Area | Status |
|---|---|
| Authentication (register/login/session) | ✅ Implemented |
| Role-based authorization (customer / vendor / service provider / admin) | ✅ Implemented |
| Product marketplace, search and category filtering | ✅ Implemented |
| Product details | ✅ Implemented |
| Reviews and ratings (verified purchasers) | ✅ Implemented |
| Cart and checkout | ✅ Implemented with backend/database |
| Simulated card payment (with declines and refunds) | ✅ Implemented |
| PayPal Checkout (sandbox) | ✅ Implemented |
| Order management and tracking | ✅ Implemented |
| Vendor application workflow | ✅ Implemented |
| Vendor product management | ✅ Implemented |
| Service provider portal (services, availability, bookings) | ✅ Implemented |
| Appointment booking with live availability | ✅ Implemented |
| Pet profiles and health records | ✅ Implemented |
| Vaccination reminders and email notifications | ✅ Implemented |
| Cloudinary image uploads | ✅ Implemented |
| Smart Pet Care Assistant (breed-specific) | ✅ Implemented |
| Admin dashboard (users, products, orders, appointments, reports) | ✅ Implemented |
| Automated testing | 🚧 Remaining |
| Deployment | 🚧 Remaining |

---

## Repository Structure

```text
PawMart/
├── frontend/              # React + Vite single-page application
├── backend/               # Node.js + Express + MongoDB Atlas REST API
├── projectDetails/        # Project-related documentation/materials
├── Group_17.md            # Group/project information
├── PAYPAL_SETUP.md        # PayPal sandbox setup guide
├── PROJECT_REPORT.md      # Full project report
├── PROGRESS_REPORT.md     # Interim (CA 02) progress report
├── README.md              # Project overview and setup
└── .gitignore
```

`frontend/` and `backend/` are independently managed Node.js projects with separate `package.json` and `node_modules` directories. This is not an npm/yarn workspace.

---

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | React 19, Vite, React Router, Tailwind CSS, lucide-react |
| Backend | Node.js, Express, Mongoose, Zod validation |
| Database | MongoDB Atlas |
| Authentication | JWT + bcrypt |
| Image hosting | Cloudinary (signed direct uploads) |
| Email | Nodemailer (SMTP) |
| Background jobs | node-cron (daily vaccination reminders) |
| Payments | PayPal Checkout (sandbox) and a simulated card gateway — no real charges |
| API | REST API |

---

## Current Features

### Customer / Pet Owner

- Register, log in, and stay signed in across page reloads
- Browse, search and filter products; view product details
- Read reviews, and leave a star rating and review after buying a product
- Server-persisted cart and checkout with shipping details
- Pay with **PayPal** (sandbox), a simulated card (with test cards for declines) or cash on delivery
- Track orders (confirmed → processing → shipped → delivered) and cancel before shipping, with refunds for card payments
- Pet profiles (species, breed, birth date, weight, allergies, photo)
- Health records: vaccination history with due/overdue tracking, medical conditions and notes
- Email vaccination reminders before vaccines are due
- Book vet and grooming appointments, seeing only open days and free time slots; cancel upcoming bookings
- Smart Pet Care Assistant: daily calories, meals, breed-specific care tips, health watch-outs and product picks

### Retail Vendor

- Apply to become a vendor (admin approval)
- Manage products with Cloudinary image uploads
- Fulfil orders for their own products step by step
- Sales and order statistics

### Service Provider (vets, groomers)

- Provider Portal: create services with price, duration, open days and time slots
- See bookings, cancel with a reason (emailed to the customer), mark visits completed or no-show
- Upcoming, completed and earnings statistics

### Administrator

- Platform health overview with real alerts (pending applications, low stock, unprocessed orders, configuration warnings)
- Manage users: search, suspend/reactivate (hides their listings), appoint admins
- Vendor verification with full application history
- Moderate products (hide with a reason) and manage PawMart's own catalogue
- Manage all orders (advance, cancel and refund) and all appointments, including PawMart Clinic services
- Analytics reports: revenue over time, top products, order and appointment breakdowns, new sign-ups
- Trigger vaccination reminder emails on demand

---

## Main Frontend UIs

1. Home / Landing Page
2. Login and Registration
3. Marketplace
4. Product Details (with reviews)
5. Cart and Checkout (simulated payment)
6. User Dashboard (overview, pets & health records, appointments, order history)
7. Vendor Application
8. Vendor Dashboard (products, orders) / Provider Portal (services, appointments)
9. Admin Dashboard (health, orders, users, verification, products, appointments, reports)
10. Appointment Booking
11. Smart Pet Care Assistant

---

## Team Contributions

| Member | Main Responsibility |
|---|---|
| V. Prashoharan | Authentication, Authorization, Admin Dashboard |
| Bashini Rashmika Vindyani | Product Management, Vendor Dashboard |
| J.P. Inuka Sithanja Jayasinghe | Cart, Checkout, Simulated Payment |
| D.S.N. Vitharana | Order Management, Appointment Booking |
| B.R.G.S. Sandaruwan | Reviews, Smart Pet Care Assistant, Pet Health Records |

Features that span modules (for example appointments linked to pet profiles, or order emails) were completed collaboratively.

---

## Quick Start

Both the frontend and backend must be running to use PawMart fully.

### 1. Backend

Open a terminal:

```bash
cd backend
npm install
```

Create the environment file:

```bash
cp .env.example .env
```

On Windows PowerShell, if required:

```powershell
Copy-Item .env.example .env
```

Configure the required environment variables in `backend/.env`:

```env
PORT=5000
NODE_ENV=development
MONGODB_URI=your_mongodb_atlas_connection_string
JWT_SECRET=your_secret_key
FRONTEND_URL=http://localhost:5173
```

Everything else is optional and has a safe fallback:

| Setting | Without it |
|---|---|
| `SMTP_*`, `EMAIL_FROM` | Emails are printed to the backend console instead of sent |
| `PAYPAL_*` | PayPal isn't offered at checkout (card and cash still work) |
| `CLOUDINARY_*` | Image fields fall back to pasting an image URL |
| `REMINDER_*` | Vaccination reminders run daily at 08:00 Sri Lanka time |
| `APP_UTC_OFFSET` | Appointment times use Sri Lanka time (`+05:30`) |

See [`backend/README.md`](backend/README.md#environment-variables) for every setting.

Seed the starter data (run once on a new database):

```bash
npm run seed            # product catalogue (replaces existing products)
npm run seed:services   # PawMart Clinic vet and grooming services
```

Start the backend:

```bash
npm run dev
```

The backend runs on `http://localhost:5000`, with the API at `http://localhost:5000/api`.

To get an admin account, register normally on the website, then run:

```bash
npm run make-admin -- you@example.com
```

### 2. Frontend

Open a second terminal:

```bash
cd frontend
npm install
npm run dev
```

The frontend normally runs on `http://localhost:5173`. Open the displayed Vite URL in your browser.

> If port 5173 is already in use, Vite may automatically start on another port such as 5174. Make sure the backend's `FRONTEND_URL` matches the port being used, or CORS will block requests.

### Trying PayPal (sandbox)

> 📘 Full step-by-step setup and troubleshooting guide: **[PAYPAL_SETUP.md](PAYPAL_SETUP.md)**. Quick version:

1. Sign in at [developer.paypal.com](https://developer.paypal.com) (any PayPal account works). Under **Testing Tools → Sandbox Accounts**, make sure there is a **Business** account with country **United States** (create one if needed — sandbox sellers registered in Sri Lanka can't receive payments). Then **Apps & Credentials** → **Sandbox** → **Create App**, linked to that US business account.
2. Copy the app's **Client ID** and **Secret** into `backend/.env` as `PAYPAL_CLIENT_ID` and `PAYPAL_CLIENT_SECRET` (keep `PAYPAL_ENV=sandbox`) and restart the backend.
3. Under **Testing Tools → Sandbox Accounts**, open the **Personal** account (email ending `@personal.example.com`) to see its email and password — log in to the PayPal popup with this buyer account, not the business one.
4. At checkout choose **PayPal**, click the PayPal button and log in with that sandbox buyer account — or choose **Debit or Credit Card** and use a card from PayPal's [card generator](https://developer.paypal.com/tools/sandbox/card-testing/). No real money is moved; the payment shows up in the sandbox business account.

### Trying the simulated payment

Checkout also accepts these simulated test cards (any future expiry, any 3-digit CVC):

| Card number | Result |
|---|---|
| `4242 4242 4242 4242` | Approved |
| `4000 0000 0000 0002` | Declined |
| `4000 0000 0000 9995` | Insufficient funds |

---

## Database

PawMart uses MongoDB Atlas. The application uses these collections:

| Collection | Purpose |
|---|---|
| Users | Accounts, roles, vendor/provider business details, suspension status |
| Products | Catalogue, stock, ratings, moderation status |
| Reviews | One review per customer per purchased product |
| Carts | One server-side cart per user |
| Orders | Orders with per-item fulfilment status and history |
| Payments | Every payment attempt — PayPal, simulated card (brand/last 4 only, never full numbers) or cash |
| VendorApplications | Vendor and service-provider applications |
| Services | Bookable vet/grooming services and their schedules |
| Appointments | Bookings, linked to services and optionally a pet |
| Pets | Pet profiles |
| PetHealthRecords | One record per pet: vaccinations, conditions, notes |

---

## Development Workflow

The project uses feature-based development.

Recommended workflow:

```text
main
  │
  ├── feature/authentication
  ├── feature/admin-dashboard
  ├── feature/product-management
  ├── feature/vendor-dashboard
  ├── feature/cart-checkout
  ├── feature/order-management
  ├── feature/appointment-booking
  └── feature/pet-health
```

Development changes should be made on feature branches and merged into `main` through pull requests.

Do not commit directly to `main` for feature development.

---

## Remaining Work

### Testing

- Backend API tests (authentication, checkout and payments, order fulfilment, appointments)
- Frontend/component testing where appropriate
- Integration testing

### Deployment

Planned deployment targets:

- Frontend: Vercel
- Backend: Render
- Database: MongoDB Atlas

Deployment notes (CORS origin, Atlas network access, SMTP, and the reminder job on free-tier hosts) are in [`backend/README.md`](backend/README.md#deployment-notes).

---

## Development Notes

- `frontend/` and `backend/` must be run separately.
- The backend requires a valid MongoDB Atlas connection.
- `backend/.env` contains local secrets and must never be committed.
- Only `.env.example` files should be committed to GitHub.
- Do not expose MongoDB credentials, JWT secrets, SMTP passwords or Cloudinary secrets in screenshots, documentation, commits, or public repositories.
- There is currently no root-level build/lint/test command.
- Run npm scripts from the relevant `frontend/` or `backend/` directory.

---

## Documentation

| Document | Covers |
|---|---|
| `frontend/README.md` | Frontend setup, routes, state management, styling and scripts |
| `backend/README.md` | Backend setup, environment variables, API reference and data models |
| `PAYPAL_SETUP.md` | Step-by-step PayPal sandbox setup and troubleshooting |
| `PROJECT_REPORT.md` | Full project report: architecture, tech stack, modules, data model, security, testing |
| `PROGRESS_REPORT.md` | Interim (CA 02) progress report |
| `projectDetails/` | Project-related documentation and supporting materials |

---

## Academic Project

**Project:** PawMart  
**Group:** Group 17  
**Team Size:** 5 Members

PawMart is being developed as a group Software Engineering project with a focus on implementing a functional pet marketplace, service booking, role-based dashboards, and supporting pet-care features using a modern web application architecture.

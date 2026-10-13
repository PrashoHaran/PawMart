# PawMart Backend

REST API for [PawMart](../README.md), a pet marketplace app. Built with Node.js, Express, and MongoDB (via Mongoose), and connects to a MongoDB Atlas cluster.

This is **Phase 1** of the backend: authentication, the product catalog, a per-user cart, and checkout/orders. Appointments, vendor tools, and admin approval endpoints are not implemented yet — those pages on the frontend still run on local mock data.

## Table of Contents

- [Overview](#overview)
- [Key Features](#key-features)
- [Tech Stack](#tech-stack)
- [Project Structure](#project-structure)
- [Setup & Installation](#setup--installation)
- [Environment Variables](#environment-variables)
- [Running the Project](#running-the-project)
- [API Reference](#api-reference)
- [Data Models](#data-models)
- [Error Handling](#error-handling)
- [Security](#security)
- [Scripts](#scripts)
- [Deployment Notes](#deployment-notes)
- [Troubleshooting](#troubleshooting)

## Overview

The backend exposes a JSON REST API under `/api`, backed by MongoDB Atlas. It follows a layered architecture (`routes → controllers → models`) with shared middleware for auth, validation, and error handling. Every response follows a consistent envelope so the frontend (and any other client) can handle success/error cases uniformly.

## Key Features

- **Authentication & roles** — email/password signup and login, JWT sessions, bcrypt hashing; roles `customer`, `vendor` (retail or service provider) and `admin`; admins can suspend accounts
- **Product catalog** — category/search filtering and pagination; admin moderation (hidden products) and PawMart's own "house" catalogue
- **Reviews & ratings** — one review per verified purchaser; product rating and review count recalculated on every change
- **Cart & checkout** — server-persisted cart; atomic stock checks and decrement; tax/shipping calculation
- **Simulated payments** — a card gateway that validates card details and simulates declines with test cards; every attempt is recorded in `Payment` (brand and last 4 digits only)
- **Order management** — per-item fulfilment (confirmed → processing → shipped → delivered) so each vendor fulfils their own items; customer cancellation with restock and refund; status-change emails
- **Pets & health records** — pet profiles and one health record per pet with vaccinations (due/overdue status), conditions and notes
- **Appointments** — provider-defined services with open days and time slots, live availability, no double-booking per provider, outcomes (completed / no-show / cancelled)
- **Smart Pet Care Assistant** — rule-based plans: calories from Merck Veterinary Manual life-stage factors, breed profiles for 16 dog and 7 cat breeds, breed-matched product picks
- **Notifications** — Nodemailer emails (order confirmation and status, booking confirmation and cancellation) and a daily `node-cron` vaccination reminder job
- **Image uploads** — signed direct-to-Cloudinary uploads
- **Admin tools** — users, applications, products, orders, appointments, platform alerts and analytics reports
- **Validation** — every request body/query is validated with [Zod](https://zod.dev) before it reaches a controller
- **Security baseline** — Helmet security headers, CORS restricted to the frontend origin, rate limiting (tighter on auth routes)
- **Consistent error handling** — a single error-handling middleware maps Mongo/validation/custom errors to the right HTTP status and a uniform JSON shape

## Tech Stack

| Category | Technology |
|---|---|
| Runtime | Node.js (ES Modules) |
| Framework | [Express](https://expressjs.com/) 4 |
| Database | MongoDB Atlas |
| ODM | [Mongoose](https://mongoosejs.com/) 8 |
| Auth | [jsonwebtoken](https://github.com/auth0/node-jsonwebtoken), [bcryptjs](https://github.com/dcodeIO/bcrypt.js) |
| Validation | [Zod](https://zod.dev) |
| Security | [Helmet](https://helmetjs.github.io/), [cors](https://github.com/expressjs/cors), [express-rate-limit](https://github.com/express-rate-limit/express-rate-limit) |
| Email | [Nodemailer](https://nodemailer.com/) |
| Scheduled jobs | [node-cron](https://github.com/node-cron/node-cron) |
| Image hosting | [Cloudinary](https://cloudinary.com/) (signed uploads; no SDK needed) |
| Logging | [morgan](https://github.com/expressjs/morgan) |
| Config | [dotenv](https://github.com/motdotla/dotenv) |
| Dev tooling | [nodemon](https://nodemon.io/) |

Full dependency list and versions: [package.json](package.json).

## Project Structure

```
backend/
├── server.js                  # Entry point: connects DB, verifies mail, schedules jobs, starts HTTP server, graceful shutdown
├── src/
│   ├── app.js                 # Express app assembly (middleware, routes, error handlers) — no listen()
│   ├── config/
│   │   ├── env.js             # Loads and validates environment variables (required + optional features)
│   │   └── db.js              # Mongoose connection with retry logic and connection event logging
│   ├── models/                # User, Product, Review, Cart, Order, Payment, VendorApplication,
│   │                          # Service, Appointment, Pet, PetHealthRecord
│   ├── controllers/           # Route handler logic (one file per resource; admin split into
│   │                          # admin.controller.js and adminManage.controller.js)
│   ├── routes/                # Express routers (one file per resource) + routes/index.js mounting them
│   ├── middleware/
│   │   ├── auth.js            # requireAuth — verifies JWT, rejects suspended users, attaches req.user
│   │   ├── role.js            # requireRole(...roles), requireServiceProvider
│   │   ├── validate.js        # validateBody / validateQuery (Zod) / validateObjectId
│   │   ├── errorHandler.js    # Centralized error handler + 404 handler
│   │   └── rateLimiter.js     # apiLimiter (general) and authLimiter (stricter, login/register)
│   ├── validators/            # Zod schemas, one per resource
│   ├── services/
│   │   ├── mailer.js           # Nodemailer transport (SMTP, or console logging when unconfigured)
│   │   ├── emailTemplates.js   # HTML + text emails (orders, appointments, vaccination reminders)
│   │   ├── paymentGateway.js   # Simulated card processor (Luhn/expiry/CVC checks, test decline cards)
│   │   ├── paypal.js           # PayPal REST client (OAuth, create/capture orders, refunds)
│   │   ├── orderFulfilment.js  # Order status rules, cancellation, restock and refunds
│   │   └── appointmentStatus.js # Shared provider/admin booking outcome rules
│   ├── jobs/
│   │   ├── vaccinationReminders.js # Daily node-cron job (also callable on demand by admins)
│   │   └── paypalCleanup.js    # Releases abandoned PayPal checkouts every 10 minutes
│   ├── data/
│   │   └── breedProfiles.js    # Smart Assistant breed knowledge, with sources
│   ├── utils/
│   │   ├── ApiError.js         # Typed error class with status/code helpers
│   │   ├── ApiResponse.js      # sendData() — writes the { data, meta } success envelope
│   │   ├── asyncHandler.js     # Wraps async route handlers so rejected promises reach the error handler
│   │   ├── petAssistantRules.js # Calorie maths, breed matching, product picks
│   │   ├── vaccineStatus.js    # Due / overdue / superseded vaccination logic
│   │   ├── appointmentTime.js  # Time-slot parsing in APP_UTC_OFFSET, schedules
│   │   ├── visibility.js       # Public filters (hidden products, suspended sellers)
│   │   ├── cloudinary.js       # Upload signatures
│   │   └── businessType.js     # Backfills vendor/provider type for older accounts
│   └── scripts/
│       ├── seed.js             # Populates the product catalog with starter data
│       ├── seedServices.js     # Creates the PawMart Clinic services
│       └── promoteAdmin.js     # Makes an existing user an admin
├── .env.example                # Template for environment variables
└── package.json
```

## Setup & Installation

**Prerequisites:** Node.js (a recent LTS version is recommended — the project uses ES Modules and modern dependency versions), npm, and a MongoDB Atlas account (free tier is enough).

```bash
cd backend
npm install
cp .env.example .env
```

Then fill in `.env` — see [Environment Variables](#environment-variables) below.

### Getting a MongoDB Atlas connection string

If you don't already have an Atlas cluster:

1. Create a free account at [mongodb.com/cloud/atlas](https://mongodb.com/cloud/atlas).
2. Create a free **M0** cluster.
3. **Database Access** → add a database user (username/password) — this is separate from your Atlas login.
4. **Network Access** → add your IP address (or `0.0.0.0/0` for local development).
5. On the cluster, click **Connect** → **Drivers** → **Node.js**, and copy the connection string.
6. Replace `<password>` with your database user's password, and add a database name after the host, e.g. `.../pawmart?retryWrites=true&w=majority`.
7. Paste the full string into `.env` as `MONGODB_URI`.

## Environment Variables

Defined in [`.env.example`](.env.example). Copy it to `.env` (gitignored) and fill in real values — the server validates that `MONGODB_URI` and `JWT_SECRET` are present at startup and throws immediately if either is missing.

| Variable | Required | Default | Description |
|---|---|---|---|
| `PORT` | No | `5000` | Port the HTTP server listens on |
| `NODE_ENV` | No | `development` | `development` enables verbose (`dev`-format) request logging; anything else uses `combined` format |
| `MONGODB_URI` | **Yes** | — | Full MongoDB Atlas connection string, including database name |
| `JWT_SECRET` | **Yes** | — | Secret used to sign/verify JWTs — use a long random string |
| `FRONTEND_URL` | No | `http://localhost:5173` | Origin allowed by CORS (the Vite dev server by default); also used for links in emails |
| `APP_UTC_OFFSET` | No | `+05:30` | Timezone offset appointment time slots are interpreted in, independent of the server's own timezone |
| `PAYPAL_CLIENT_ID` / `PAYPAL_CLIENT_SECRET` | No | — | Enables PayPal Checkout. If unset, PayPal isn't offered |
| `PAYPAL_ENV` | No | `sandbox` | `sandbox` (test money) or `live` |
| `PAYPAL_SHIPPING_COUNTRY` | No | `LK` | Country code sent to PayPal with the checkout shipping address |
| `CLOUDINARY_CLOUD_NAME` / `CLOUDINARY_API_KEY` / `CLOUDINARY_API_SECRET` | No | — | Enables image uploads (product images, pet photos). If unset, forms fall back to an image-URL field |
| `SMTP_HOST` | No | — | SMTP server. **If unset, emails are printed to the console instead of sent** |
| `SMTP_PORT` | No | `587` | SMTP port |
| `SMTP_SECURE` | No | `false` | `true` for implicit TLS (port 465); `false` uses STARTTLS on 587 |
| `SMTP_USER` / `SMTP_PASS` | No | — | SMTP credentials (for Gmail, an [App Password](https://support.google.com/accounts/answer/185833)) |
| `EMAIL_FROM` | No | `PawMart <no-reply@pawmart.local>` | Sender shown on outgoing emails |
| `REMINDERS_ENABLED` | No | `true` | Set `false` to disable the daily vaccination reminder job |
| `REMINDER_CRON` | No | `0 8 * * *` | Cron expression for the reminder job |
| `REMINDER_TZ` | No | `Asia/Colombo` | Timezone the cron expression is evaluated in |
| `REMINDER_DAYS_BEFORE` | No | `7` | Remind about vaccinations due within this many days (overdue ones are always included) |

### Image uploads (Cloudinary)

Uploads go **directly from the browser to Cloudinary** using signed uploads, so files never pass through this server and the API secret never reaches the client:

1. The frontend calls `POST /api/uploads/signature` with `{ "purpose": "product" | "pet" }`. Product images are vendor-only; pet photos are available to any signed-in user.
2. The server returns a short-lived signature restricted to JPG/PNG/WebP and a fixed folder (`pawmart/products` or `pawmart/pets/<userId>`).
3. The browser uploads the file to Cloudinary and saves the returned `secure_url` on the product or pet.

`GET /api/uploads/config` tells the frontend whether uploads are enabled. Cloudinary images are displayed with delivery transformations (`c_limit,w_<n>,f_auto,q_auto`) so each view loads a resized, compressed version. The 5 MB size limit is checked in the browser; to enforce it on Cloudinary's side as well, create a signed upload preset with a max file size.

### PayPal Checkout (sandbox)

PayPal is offered next to the simulated card and cash on delivery when `PAYPAL_CLIENT_ID` and `PAYPAL_CLIENT_SECRET` are set. With `PAYPAL_ENV=sandbox` it uses PayPal's test environment: real PayPal pages, **no real money**.

1. `POST /api/orders/paypal` `{ shippingAddress }` reserves stock, creates a `pending` order and a PayPal order for the **server-calculated** total, and returns `paypalOrderId`.
2. The browser shows PayPal's buttons; the buyer approves in the PayPal popup (sandbox buyer account or test card).
3. `POST /api/orders/paypal/:paypalOrderId/capture` captures the payment, checks the captured amount matches the order, confirms the order, clears the cart and emails the customer. A declined funding source returns `402` and leaves the order open so the buyer can pick another method.
4. `POST /api/orders/paypal/:paypalOrderId/cancel` (buyer closed the popup) releases the stock.

Unpaid PayPal orders are hidden from vendors and excluded from revenue. A job every 10 minutes releases checkouts abandoned for 30 minutes — or confirms them if PayPal shows they were paid. Cancelling a paid PayPal order issues a real sandbox **refund** through PayPal. `GET /api/payments/config` tells the frontend whether PayPal is available (the client ID is public by design; the secret never leaves the server).

PayPal shows the store as **PawMart** and uses the shipping address entered at checkout.

**Getting sandbox credentials:** sign in at [developer.paypal.com](https://developer.paypal.com) → **Apps & Credentials** → **Sandbox** → create an app → copy the **Client ID** and **Secret** into `.env`. Under **Testing Tools → Sandbox Accounts** PayPal creates a *personal* (buyer) account — use its email and password in the PayPal popup — and a *business* account that receives the test payments.

> **Use a United States sandbox business account.** If the app is linked to a business account registered in Sri Lanka, PayPal refuses payments to it (`PAYEE_ACCOUNT_RESTRICTED` / "Things don't seem to be going well") and card payments fail with `PAYEE_NOT_ENABLED_FOR_CARD_PROCESSING` — PayPal accounts in Sri Lanka can't receive money. Create a US business sandbox account and a new app linked to it. Log in to the popup with the **personal** account, never the business one.

### Email notifications

Emails are sent with Nodemailer and never block or fail the action that triggers them.

- **Order confirmation** — sent after a successful checkout.
- **Vaccination reminders** — a `node-cron` job (daily, 08:00 Asia/Colombo by default) emails each owner about pets whose latest dose of a vaccine is due within `REMINDER_DAYS_BEFORE` days or overdue — one email per pet. Each vaccination remembers the due date it was reminded about (`reminderSentFor`), so a reminder is sent once per due date; editing the due date re-arms it. Failed sends are retried on the next run.
- Admins can trigger the reminder job immediately with `POST /api/admin/reminders/vaccinations/run` (or the **Send Vaccine Reminders Now** button on the Admin Hub) — useful for demos, and on free hosting tiers where a sleeping server can miss the scheduled run.

For local testing without a real mailbox, leave `SMTP_HOST` empty (emails go to the console), or run [Mailpit](https://mailpit.axllent.org/) (`docker run -p 1025:1025 -p 8025:8025 axllent/mailpit`) with `SMTP_HOST=127.0.0.1`, `SMTP_PORT=1025` and open http://localhost:8025.

## Running the Project

```bash
npm run dev             # start with nodemon (auto-restarts on file changes)
npm run seed            # populate the product catalog (run once, or after wiping the DB)
npm run seed:services   # create the PawMart Clinic vet/grooming services
npm run make-admin -- you@example.com   # make an existing (registered) user an admin
npm run start           # start without nodemon (e.g. in production)
```

On successful startup you should see:

```
[mongo] connected
[mail] SMTP_HOST not set — emails will be logged to the console, not sent
[reminders] scheduled "0 8 * * *" (Asia/Colombo)
[server] listening on port 5000
```

A health check is available at `GET /health` (returns `{ "data": { "status": "ok" } }`) — useful for verifying the server is up without touching the database-backed routes.

## API Reference

Base path: `/api`. All request/response bodies are JSON.

**Response envelope** — every endpoint responds with one of these two shapes:

```jsonc
// Success
{ "data": { /* ... */ }, "meta": { /* optional, e.g. pagination */ } }

// Error
{ "error": { "code": "VALIDATION_ERROR", "message": "Invalid input", "details": [ /* optional */ ] } }
```

**Auth** — protected routes expect `Authorization: Bearer <token>`. Money fields (`priceCents`, `subtotalCents`, `totalCents`, etc.) are always **integer cents**, never floats.

### Auth

| Method | Endpoint | Auth | Body | Description |
|---|---|---|---|---|
| POST | `/api/auth/register` | No | `{ name, email, password }` | Create an account, returns the user + a JWT |
| POST | `/api/auth/login` | No | `{ email, password }` | Log in, returns the user + a JWT |
| GET | `/api/auth/me` | Yes | — | Returns the currently authenticated user |

<details>
<summary>Example: register</summary>

```bash
curl -X POST http://localhost:5000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"name":"Jane Doe","email":"jane@example.com","password":"secret123"}'
```

```json
{
  "data": {
    "user": { "_id": "...", "name": "Jane Doe", "email": "jane@example.com", "role": "customer", "tokenVersion": 0, "createdAt": "...", "updatedAt": "..." },
    "token": "eyJhbGciOi..."
  }
}
```
</details>

### Products

| Method | Endpoint | Auth | Query/Body | Description |
|---|---|---|---|---|
| GET | `/api/products` | No | `?category=&search=&page=&limit=` | List products, paginated |
| GET | `/api/products/:id` | No | — | Get a single product by ID |

`category` and `search` are optional filters (`search` uses MongoDB text search on the product name). `page` defaults to `1`, `limit` defaults to `20` (max `100`).

<details>
<summary>Example: list products</summary>

```bash
curl "http://localhost:5000/api/products?category=Food&limit=10"
```

```json
{
  "data": [ { "_id": "...", "name": "...", "priceCents": 4599, "category": "Food", "stock": 50, "...": "..." } ],
  "meta": { "page": 1, "per_page": 10, "total": 2 }
}
```
</details>

### Cart

All cart routes require authentication and operate on the logged-in user's own cart.

| Method | Endpoint | Body | Description |
|---|---|---|---|
| GET | `/api/cart` | — | Get the current cart (items + subtotal) |
| POST | `/api/cart/items` | `{ productId, quantity }` | Add an item (merges quantity if already present) |
| PATCH | `/api/cart/items/:productId` | `{ quantity }` | Set an item's quantity to an absolute value |
| DELETE | `/api/cart/items/:productId` | — | Remove a single item |
| DELETE | `/api/cart` | — | Empty the cart |

Every cart response has the same shape:

```json
{
  "data": {
    "items": [
      { "product": { "_id": "...", "name": "...", "image": "...", "priceCents": 4599, "stock": 50 }, "quantity": 2, "lineTotalCents": 9198 }
    ],
    "subtotalCents": 9198
  }
}
```

### Orders

All order routes require authentication.

| Method | Endpoint | Body | Description |
|---|---|---|---|
| POST | `/api/orders` | `{ shippingAddress, paymentMethod, card? }` | Check out the current cart — charges the card (simulated), creates the order and payment, decrements stock, clears the cart |
| GET | `/api/orders` | — | List the current user's orders, each with its payment summary |
| GET | `/api/orders/:id` | — | Get a single order (must belong to the current user) |
| POST | `/api/orders/:id/cancel` | — | Cancel before anything has shipped — restocks items and refunds card payments |

`paymentMethod` is `credit_card` or `cash_on_delivery`. Card payments need `card: { number, expiry: "MM/YY", cvc }`. Malformed card details return `400` with per-field `details`; a declined card returns `402 PAYMENT_DECLINED`, restocks everything, keeps the cart and records a failed `Payment` so the customer can retry. Test cards: `4242 4242 4242 4242` (approved), `4000 0000 0000 0002` (declined), `4000 0000 0000 9995` (insufficient funds), `4000 0000 0000 0069` (expired), `4000 0000 0000 0127` (incorrect CVC).

Checkout re-validates stock for every cart item and atomically decrements it (`stock >= quantity` guard on the update). If any item is short, already-decremented items from the same request are rolled back and the request fails with `409 CONFLICT` — no partial orders are created. Products that have been hidden, or whose seller is suspended, also block checkout with `409` until they are removed from the cart.

**Fulfilment:** each order item has its own status (`confirmed → processing → shipped → delivered`, or `cancelled`), so an order with products from several vendors can be fulfilled independently; the order's status is its least advanced item. Vendors move their own items one step at a time (`PATCH /api/vendor/orders/:id/status`); admins can move any order forward or cancel it (`PATCH /api/admin/orders/:id/status`). Cash-on-delivery payments are marked collected on delivery. Customers are emailed when an order ships, is delivered or is cancelled.

### Full Endpoint Summary

Auth: ✗ public · ✓ any signed-in user · **V** vendor · **SP** service provider · **A** admin.

| Method | Endpoint | Auth | Description |
|---|---|:---:|---|
| POST | `/api/auth/register` | ✗ | Create an account |
| POST | `/api/auth/login` | ✗ | Log in (suspended accounts get `403`) |
| GET | `/api/auth/me` | ✓ | Current user |
| GET | `/api/products` | ✗ | List visible products (`?category=&search=&page=&limit=`) |
| GET | `/api/products/:id` | ✗ | Product details |
| GET | `/api/products/:id/reviews` | ✗ | Reviews, newest first (`?page=&limit=`) |
| GET | `/api/products/:id/reviews/eligibility` | ✓ | Whether the current user can review, and why not |
| POST | `/api/products/:id/reviews` | ✓ customer | `{ rating 1–5, comment? }` — buyers only, once per product |
| DELETE | `/api/reviews/:reviewId` | ✓ | Author or admin |
| GET | `/api/cart` | ✓ | Current cart |
| POST | `/api/cart/items` | ✓ | Add item `{ productId, quantity }` |
| PATCH | `/api/cart/items/:productId` | ✓ | Set quantity `{ quantity }` |
| DELETE | `/api/cart/items/:productId` | ✓ | Remove item |
| DELETE | `/api/cart` | ✓ | Empty cart |
| POST | `/api/orders` | ✓ | Checkout (see [Orders](#orders)) |
| GET | `/api/orders` | ✓ | My orders |
| GET | `/api/orders/:id` | ✓ | One of my orders |
| POST | `/api/orders/:id/cancel` | ✓ | Cancel before shipping |
| POST | `/api/orders/paypal` | ✓ | Start a PayPal checkout `{ shippingAddress }` → `{ orderId, paypalOrderId }` |
| POST | `/api/orders/paypal/:paypalOrderId/capture` | ✓ | Capture after the buyer approves |
| POST | `/api/orders/paypal/:paypalOrderId/cancel` | ✓ | Release a PayPal checkout the buyer cancelled |
| GET | `/api/payments/config` | ✗ | Payment options (PayPal enabled, public client ID, currency) |
| GET | `/api/pets` | ✓ | My pets, each with a vaccination summary |
| POST | `/api/pets` | ✓ | Create a pet |
| GET | `/api/pets/:id` | ✓ | Pet + health record (vaccinations annotated with status) |
| PATCH | `/api/pets/:id` | ✓ | Update a pet |
| DELETE | `/api/pets/:id` | ✓ | Delete a pet and its health record |
| PATCH | `/api/pets/:id/health` | ✓ | Update `{ conditions[], medicalNotes }` |
| POST | `/api/pets/:id/vaccinations` | ✓ | Add `{ name, dateGiven, nextDueDate?, vetName?, notes? }` |
| PUT | `/api/pets/:id/vaccinations/:vaccinationId` | ✓ | Replace a vaccination |
| DELETE | `/api/pets/:id/vaccinations/:vaccinationId` | ✓ | Delete a vaccination |
| GET | `/api/services` | ✗ | Bookable services with provider name, open days and slots |
| GET | `/api/services/:id/availability` | ✗ | Open/booked/past slots for `?date=YYYY-MM-DD` |
| GET | `/api/appointments` | ✓ | My appointments |
| POST | `/api/appointments` | ✓ | Book `{ serviceId, date, timeSlotLabel, petId?, petDescription, notes? }` |
| PATCH | `/api/appointments/:id/cancel` | ✓ | Cancel an upcoming booking |
| GET | `/api/pet-assistant/breeds` | ✗ | Breeds with specific advice (`?species=dog\|cat`) |
| POST | `/api/pet-assistant/recommend` | ✗ | Care plan `{ petType, breed?, ageYears, weightKg, activityLevel, neutered?, allergies? }` |
| GET | `/api/uploads/config` | ✓ | Whether Cloudinary uploads are enabled |
| POST | `/api/uploads/signature` | ✓ | Upload signature `{ purpose: "product" \| "pet" }` (product: vendors/admins) |
| POST | `/api/vendor-applications` | ✓ | Apply `{ businessName, businessType: retail_vendor \| service_provider }` |
| GET | `/api/vendor-applications/me` | ✓ | My latest application |
| GET | `/api/vendor-applications` | A | Pending applications |
| POST | `/api/vendor-applications/:id/approve` | A | Approve (user becomes a vendor of that type) |
| POST | `/api/vendor-applications/:id/reject` | A | Reject |
| GET | `/api/vendor/stats` | V | Sales, order count, active products |
| GET/POST | `/api/vendor/products` | V | List / create my products |
| PATCH/DELETE | `/api/vendor/products/:id` | V | Update / delete my product |
| GET | `/api/vendor/orders` | V | Orders containing my products (`?status=&page=&limit=`) |
| PATCH | `/api/vendor/orders/:id/status` | V | Move my items to the next status |
| GET | `/api/provider/stats` | SP | Upcoming, completed, earnings, active services |
| GET/POST | `/api/provider/services` | SP | List / create my services |
| PATCH/DELETE | `/api/provider/services/:id` | SP | Update / remove (hidden if it has history) |
| GET | `/api/provider/appointments` | SP | Bookings (`?scope=upcoming\|past\|all`) |
| PATCH | `/api/provider/appointments/:id/status` | SP | `completed` / `no_show` after start; `cancelled` (with `reason`) before |
| GET | `/api/admin/stats` | A | Platform totals and alerts |
| GET | `/api/admin/reports` | A | Analytics for `?days=7\|30\|90\|365` |
| POST | `/api/admin/reminders/vaccinations/run` | A | Send due vaccination reminders now |
| GET | `/api/admin/users` | A | Users (`?search=&role=&status=&page=&limit=`) |
| PATCH | `/api/admin/users/:id/status` | A | Suspend `{ status: "suspended", reason }` or reactivate |
| PATCH | `/api/admin/users/:id/role` | A | Appoint/remove admin `{ role: "admin" \| "customer" }` |
| GET | `/api/admin/vendor-applications` | A | All applications (`?status=`) |
| GET/POST | `/api/admin/products` | A | All products (`?search=&owner=&visibility=`) / create a house product |
| PATCH/DELETE | `/api/admin/products/:id` | A | Update / delete a house product |
| PATCH | `/api/admin/products/:id/visibility` | A | Hide `{ hidden: true, reason }` or unhide |
| GET | `/api/admin/orders` | A | All orders (`?status=&page=&limit=`) |
| PATCH | `/api/admin/orders/:id/status` | A | Advance or cancel any order |
| GET | `/api/admin/appointments` | A | All bookings (`?scope=&owner=clinic`) |
| PATCH | `/api/admin/appointments/:id/status` | A | Booking outcome / cancellation |
| GET | `/health` | ✗ | Health check |

## Data Models

| Model | Key Fields |
|---|---|
| **User** | `name`, `email` (unique), `passwordHash`, `role` (`customer` \| `vendor` \| `admin`), `businessName`, `businessType` (`retail_vendor` \| `service_provider`), `status` (`active` \| `suspended`), `suspendReason`, `tokenVersion` |
| **Product** | `name`, `priceCents`, `rating`, `reviewCount`, `category`, `image`, `description`, `features[]`, `vendorName`, `vendorId` (null = PawMart house product), `stock`, `hidden`, `hiddenReason` |
| **Review** | `productId`, `userId` (unique together), `userName`, `rating` (1–5), `comment` |
| **Cart** | `userId` (unique — one cart per user), `items: [{ product, quantity }]` |
| **Order** | `userId`, `items: [{ product, vendorId, name, priceCents, quantity, status }]`, `subtotalCents`, `taxCents`, `shippingCents`, `totalCents`, `status`, `statusHistory[]`, `shippingAddress`, `paymentMethod`, `paymentId` |
| **Payment** | `userId`, `orderId` (null for failed attempts), `method` (`credit_card` \| `cash_on_delivery` \| `paypal`), `amountCents`, `status` (`pending` \| `succeeded` \| `failed` \| `refunded` \| `cancelled`), `card: { brand, last4, expMonth, expYear }`, `transactionRef` (simulated ref or PayPal capture ID), `providerOrderId` (PayPal order ID), `payerEmail`, `refundRef`, `failureCode` |
| **VendorApplication** | `userId`, `businessName`, `businessType`, `status`, `reviewedBy`, `reviewedAt` |
| **Service** | `name`, `type` (`vet` \| `grooming`), `durationMinutes`, `priceCents`, `providerId` (null = PawMart Clinic), `timeSlots[]`, `availableDays[]`, `active` |
| **Appointment** | `userId`, `service`, `petId`, `petDescription`, `scheduledAt`, `timeSlotLabel`, `notes`, `status` (`booked` \| `completed` \| `no_show` \| `cancelled`), `cancelledBy`, `cancelReason` |
| **Pet** | `ownerId`, `name`, `species`, `breed`, `sex`, `birthDate`, `weightKg`, `allergies[]`, `photoUrl` |
| **PetHealthRecord** | `petId` (unique — one per pet), `ownerId`, `vaccinations: [{ name, dateGiven, nextDueDate, vetName, notes, reminderSentFor }]`, `conditions[]`, `medicalNotes` |

Full field definitions with types, defaults, and indexes are in `src/models/`. Notes:

- Passwords are never returned in API responses (`User.toJSON` strips `passwordHash`).
- `Order.items` stores a **snapshot** of the product name/price (and vendor) at checkout time — it doesn't change if the product is later edited or deleted.
- Full card numbers and CVCs are never stored.
- Tax is calculated as 8% of the subtotal; shipping is a flat $5.99 (`599` cents) unless the subtotal exceeds $50 (`5000` cents), in which case it's free.
- Calendar dates (birthdays, vaccine dates) are stored as UTC midnight; appointment times are interpreted in `APP_UTC_OFFSET`.

## Error Handling

All errors — thrown `ApiError`s, Mongoose validation errors, invalid ObjectId `CastError`s, and MongoDB duplicate-key (`11000`) errors — are caught by a single middleware (`src/middleware/errorHandler.js`) and normalized into the `{ error: { code, message, details? } }` shape with the right HTTP status:

| Status | Code | Typical Cause |
|---|---|---|
| 400 | `VALIDATION_ERROR` | Zod validation failure, invalid ObjectId, Mongoose validation error |
| 401 | `UNAUTHORIZED` | Missing/invalid/expired token, or the account was suspended |
| 402 | `PAYMENT_DECLINED` | Simulated card declined at checkout |
| 403 | `FORBIDDEN` | Wrong role, not the owner, suspended account at login, or a rule such as "only buyers can review" |
| 404 | `NOT_FOUND` | Resource not found, or an unmatched route |
| 409 | `CONFLICT` | Duplicate email, insufficient stock, unavailable cart item, slot already booked, invalid status change |
| 429 | `RATE_LIMITED` | Too many requests |
| 500 | `INTERNAL_ERROR` | Unhandled server error |
| 502 | `PAYPAL_ERROR` / `PAYPAL_UNAVAILABLE` / `PAYPAL_REFUND_FAILED` | PayPal rejected a request or couldn't be reached (check the PayPal credentials) |
| 503 | `UPLOADS_DISABLED` / `PAYPAL_DISABLED` | Feature requested but not configured on this server |

## Security

- Passwords hashed with bcrypt (`bcryptjs`, 10 salt rounds)
- JWTs signed with `JWT_SECRET`, 1-day expiry; each carries a `tokenVersion` claim checked against the user record, so bumping a user's `tokenVersion` invalidates all their existing tokens
- `helmet()` sets standard security headers
- CORS locked to a single configured origin (`FRONTEND_URL`)
- Rate limiting: 300 requests / 15 min on `/api/*` generally, 20 requests / 15 min on auth routes specifically
- All mutating routes validate their input with Zod before touching the database
- Route params expected to be Mongo ObjectIds are validated before use, avoiding raw driver errors leaking as 500s

## Scripts

| Command | Description |
|---|---|
| `npm run dev` | Start the server with `nodemon` (auto-restart on changes) |
| `npm run start` | Start the server directly with `node` |
| `npm run seed` | Wipe and repopulate the `Product` collection with starter catalog data |
| `npm run seed:services` | Wipe and recreate the services collection with the PawMart Clinic services |
| `npm run make-admin -- <email>` | Give an existing user the admin role (they must log in again) |

## Deployment Notes

There is no deployment configuration (Dockerfile, CI/CD, hosting-specific config) in this repo yet — the project has been run locally against MongoDB Atlas only. The planned targets are Render (backend) and Vercel (frontend). If deploying:

- Set `MONGODB_URI`, `JWT_SECRET`, and `FRONTEND_URL` (pointing at the deployed frontend origin) as real environment variables on the host — never commit `.env`.
- Use `npm run start` (not `dev`) in production.
- Atlas's **Network Access** list must allow the deployment host's outbound IP (or `0.0.0.0/0`, with the tradeoffs that implies).
- `NODE_ENV=production` switches request logging to the more compact `combined` format.
- Set the `SMTP_*` and `EMAIL_FROM` variables to send real emails. Free-tier hosts (e.g. Render) sleep when idle, so the 08:00 reminder job may not fire — use the admin "run now" endpoint, or an external scheduler that calls it.

## Troubleshooting

| Problem | Likely Cause / Fix |
|---|---|
| Server exits immediately with `Missing required environment variable` | `.env` wasn't created, or is missing `MONGODB_URI`/`JWT_SECRET` — see [Environment Variables](#environment-variables) |
| `querySrv ENOTFOUND ...mongodb.net` on startup | Usually a transient DNS hiccup right after creating a new Atlas cluster; the connection logic retries automatically (up to 5 attempts) — if it persists, double-check the cluster hostname in `MONGODB_URI` |
| `MongoServerError: bad auth` | Wrong database user/password in `MONGODB_URI` — note this is the **database user** created under Atlas's Database Access, not your Atlas account login |
| Connection hangs / times out | Your current IP isn't in Atlas's Network Access list |
| `401 Unauthorized` on a route you just logged in for | Token wasn't sent (`Authorization: Bearer <token>` header), has expired (1-day lifetime), or the user's `tokenVersion` changed since the token was issued |
| CORS error in the browser console | `FRONTEND_URL` in `.env` doesn't match the origin the frontend is actually running on |
| `409 CONFLICT` on checkout | A cart item's quantity exceeds current stock, or an item was hidden/its seller suspended — the message names the item |
| `402 PAYMENT_DECLINED` on checkout | A simulated decline test card was used — try `4242 4242 4242 4242` (for PayPal, the sandbox funding source was declined; choose another in the popup) |
| No PayPal option at checkout | `PAYPAL_CLIENT_ID`/`PAYPAL_CLIENT_SECRET` aren't set — the startup log says `[paypal] not configured` |
| PayPal popup shows "Things don't seem to be going well" | The app's sandbox business (seller) account can't receive payments (e.g. registered in Sri Lanka), or you logged in with the business account — use a US business account for the app and the personal account in the popup |
| PayPal popup says the client ID is invalid | The Client ID/Secret are from a **live** app while `PAYPAL_ENV=sandbox` (or vice versa) |
| No emails arrive | `SMTP_HOST` isn't set (emails are printed in the server console), or the SMTP credentials are wrong — the startup log says which |
| Upload button missing, only an image-URL field | Cloudinary variables aren't set (`GET /api/uploads/config` returns `enabled: false`) |
| Appointment times look 5½ hours off | `APP_UTC_OFFSET` doesn't match where your customers are (default `+05:30`) |
